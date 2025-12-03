
import React, { useState, useContext, useCallback } from 'react';
// FIX: Removed `GlobalStateContextType` which is not exported from AppProviders and was unused.
import { AuthContext, DataContext, GlobalStateContext, PageContext } from '../../contexts/AppProviders';
import { callGeminiApi } from '../../services/geminiService';
import LoadingSpinner from '../common/LoadingSpinner';
import type { GeminiChatMessage } from '../../types';

interface GeminiChatUIProps {
    title: string;
    subtitle: string;
    onSend: (prompt: string, apiKey: string, systemPrompt: string | null, useThinking: boolean) => Promise<void>;
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
    const [useThinking, setUseThinking] = useState(false);
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
            await onSend(prompt, apiKey, systemPrompt, useThinking);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Lỗi không xác định.");
        } finally {
            setIsLoading(false);
            setPrompt('');
        }
    }, [prompt, isLoading, user, db.USERS, onSend, systemPrompt, useThinking]);

    const openApiKeyModal = useCallback(() => {
        setGlobalPage('api_key', { isApiKeyModalOpen: true });
        setError(null);
    }, [setGlobalPage]);

    return (
        <div className="card h-[calc(100vh-150px)] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gradient">{title}</h1>
                    <p className="text-sm text-gray-400">{subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-200">Thinking Mode</span>
                    <button 
                        onClick={() => setUseThinking(!useThinking)}
                        className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${useThinking ? 'bg-blue-500' : 'bg-gray-700'}`}
                    >
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all duration-300 ${useThinking ? 'left-6' : 'left-1'}`}></div>
                    </button>
                </div>
            </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-3xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            <div className="prose prose-invert max-w-none prose-sm" dangerouslySetInnerHTML={{ __html: msg.parts[0].text ? msg.parts[0].text.replace(/\n/g, '<br />') : '' }} />
                        </div>
                    </div>
                ))}
                {isLoading && <div className="flex justify-start"><div className="p-3 rounded-lg bg-gray-700"><LoadingSpinner size={5} /></div></div>}
                <div ref={chatEndRef} />
            </div>
            
            <form onSubmit={handleSend} className="p-4 border-t border-gray-700 flex space-x-3">
                <input type="text" className="form-input flex-1" placeholder="Nhập yêu cầu soạn bài..." value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={isLoading} />
                <button type="submit" className="btn btn-primary" disabled={isLoading || !prompt.trim()}>Gửi</button>
            </form>
            
            {error && (
                <div className="p-2 bg-red-900 text-red-200 text-center text-sm flex justify-center gap-2 items-center">
                    {error}
                    {error.includes("API Key") && <button onClick={openApiKeyModal} className="underline font-bold">Cấu hình ngay</button>}
                </div>
            )}
        </div>
    );
};

const GeminiTeacherPage: React.FC = () => {
    const { navigate } = useContext(PageContext)!;
    const [chatHistory, setChatHistory] = useState<GeminiChatMessage[]>([]);

    const handleLessonPlan = useCallback(async (prompt: string, apiKey: string, systemPrompt: string | null, useThinking: boolean) => {
        const userMsg: GeminiChatMessage = { role: 'user', parts: [{ text: prompt }] };
        setChatHistory(prev => [...prev, userMsg]);
        
        const responseText = await callGeminiApi(apiKey, prompt, systemPrompt, { useThinking });
        const modelMsg: GeminiChatMessage = { role: 'model', parts: [{ text: responseText }] };
        setChatHistory(prev => [...prev, modelMsg]);
    }, []);

    const systemPrompt = "Bạn là một trợ lý giáo dục chuyên nghiệp (AI Teaching Assistant). Nhiệm vụ của bạn là giúp giáo viên soạn giáo án, tạo bài kiểm tra, và đưa ra các ý tưởng giảng dạy sáng tạo. Hãy trình bày rõ ràng, có cấu trúc (Markdown), và chuyên môn sư phạm cao.";

    return (
        <div className="space-y-4">
            <button onClick={() => navigate('dashboard')} className="text-sm text-blue-400 hover:underline">&larr; Quay lại Dashboard</button>
            <GeminiChatUI 
                title="Trợ giảng AI (Teacher Assistant)" 
                subtitle="Soạn giáo án, tạo đề thi, và ý tưởng giảng dạy."
                onSend={handleLessonPlan}
                chatHistory={chatHistory}
                systemPrompt={systemPrompt}
            />
        </div>
    );
};

export default GeminiTeacherPage;
