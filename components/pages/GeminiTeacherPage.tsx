import React, { useState, useContext, useCallback } from 'react';
// FIX: Removed `GlobalStateContextType` which is not exported from AppProviders and was unused.
import { AuthContext, DataContext, GlobalStateContext, PageContext } from '../../contexts/AppProviders';
import { callGeminiApi } from '../../services/geminiService';
import LoadingSpinner from '../common/LoadingSpinner';
import type { GeminiChatMessage } from '../../types';

interface GeminiChatUIProps {
    title: string;
    subtitle: string;
    onSend: (prompt: string, apiKey: string, systemPrompt: string | null) => Promise<void>;
    chatHistory: GeminiChatMessage[];
    systemPrompt: string | null;
}
const GeminiChatUI: React.FC<GeminiChatUIProps> = ({ title, subtitle, onSend, chatHistory, systemPrompt }) => {
    const { user } = useContext(AuthContext)!;
    const { db } = useContext(DataContext)!;
    const { setPage: setGlobalPage } = useContext(GlobalStateContext)!;
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSend = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;
        const apiKey = user ? db.USERS[user.id]?.apiKey : null;
        if (!apiKey) {
            setError("API Key chưa được cấu hình.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await onSend(prompt, apiKey, systemPrompt);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Lỗi không xác định.");
        } finally {
            setIsLoading(false);
            setPrompt('');
        }
    }, [prompt, isLoading, user, db.USERS, onSend, systemPrompt]);

    const openApiKeyModal = useCallback(() => {
        setGlobalPage('api_key', { isApiKeyModalOpen: true });
        setError(null);
    }, [setGlobalPage]);

    return (
        <div className="card h-[calc(100vh-150px)] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700"><h1 className="text-2xl font-bold text-gradient">{title}</h1><p className="text-sm text-gray-400">{subtitle}</p></div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-3xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            <div className="prose prose-invert max-w-none prose-sm" dangerouslySetInnerHTML={{ __html: msg.parts[0].text.replace(/\n/g, '<br />') }} />
                        </div>
                    </div>
                ))}
                {isLoading && <div className="flex justify-start"><div className="p-3 rounded-lg bg-gray-700"><LoadingSpinner size={5} /></div></div>}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-4 border-t border-gray-700 flex space-x-3">
                <input type="text" className="form-input flex-1" placeholder="Hỏi Gemini..." value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={isLoading} />
                <button type="submit" className="btn btn-primary" disabled={isLoading || !prompt.trim()}>
                    {isLoading ? <LoadingSpinner size={5} /> : 'Gửi'}
                </button>
            </form>
            {error && <div className="p-2 text-center bg-red-900 text-red-300 text-sm flex justify-center items-center gap-4"><span>{error}</span>{error.includes("chưa được cấu hình") && <button onClick={openApiKeyModal} className="btn btn-secondary text-xs py-1 px-2 border-red-300 text-red-300">Cấu hình Key</button>}</div>}
        </div>
    );
};

const GeminiTeacherPage: React.FC = () => {
    const [chatHistory, setChatHistory] = useState<GeminiChatMessage[]>([]);
    const { serviceStatus } = useContext(GlobalStateContext)!;

    const isAiAssistantOk = serviceStatus.ai_assistant_service === 'OPERATIONAL';

    const systemPrompt = "Bạn là một trợ lý AI chuyên nghiệp dành cho giáo viên. Hãy giúp họ soạn giáo án, tạo ý tưởng bài tập, giải thích khái niệm phức tạp, và đưa ra các ví dụ sư phạm.";

    const handleSend = useCallback(async (prompt: string, apiKey: string, systemPrompt: string | null) => {
        const userMsg: GeminiChatMessage = { role: 'user', parts: [{ text: prompt }] };
        setChatHistory(prev => [...prev, userMsg]);
        const responseText = await callGeminiApi(apiKey, prompt, systemPrompt);
        const modelMsg: GeminiChatMessage = { role: 'model', parts: [{ text: responseText }] };
        setChatHistory(prev => [...prev, modelMsg]);
    }, []);

    if (!isAiAssistantOk) {
        return <div className="card p-8 text-center border border-yellow-700"><h2 className="text-xl font-bold text-yellow-400">Dịch vụ AI Assistant đang Bảo trì.</h2></div>;
    }

    return (
        <GeminiChatUI
            title="Gemini Soạn bài"
            subtitle="Trợ lý AI giúp bạn soạn giáo án và tạo ý tưởng giảng dạy"
            onSend={handleSend}
            chatHistory={chatHistory}
            systemPrompt={systemPrompt}
        />
    );
};
export default GeminiTeacherPage;