
import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { AuthContext, DataContext, GlobalStateContext } from '../../contexts/AppProviders';
import { callGeminiApi } from '../../services/geminiService';
import type { GeminiChatMessage } from '../../types';

// --- TYPES ---
type PersonaId = 'oracle' | 'guardian' | 'jester' | 'commander';

interface Persona {
    id: PersonaId;
    name: string;
    title: string;
    icon: string;
    desc: string;
    color: string; // Tailwind color class prefix (e.g., 'purple', 'blue')
    systemPrompt: string;
}

const PERSONAS: Persona[] = [
    {
        id: 'oracle', name: 'Nhà Tiên Tri', title: 'The Oracle', icon: '🔮',
        desc: 'Giải thích cân bằng, thông thái và dễ hiểu.',
        color: 'purple',
        systemPrompt: "Bạn là Nhà Tiên Tri (The Oracle), một trợ lý AI thông thái. Hãy giải thích các khái niệm học thuật một cách rõ ràng, cân bằng, đưa ra ví dụ cụ thể. Giọng văn nhẹ nhàng, huyền bí nhưng chính xác."
    },
    {
        id: 'guardian', name: 'Người Hộ Vệ', title: 'The Guardian', icon: '🛡️',
        desc: 'Không bao giờ đưa đáp án ngay. Chỉ gợi mở (Socratic).',
        color: 'emerald',
        systemPrompt: "Bạn là Người Hộ Vệ Tri Thức. TUYỆT ĐỐI KHÔNG đưa ra câu trả lời trực tiếp. Thay vào đó, hãy sử dụng phương pháp Socratic: đặt câu hỏi ngược lại để hướng dẫn học sinh tự tìm ra câu trả lời. Hãy kiên nhẫn và khuyến khích tư duy."
    },
    {
        id: 'jester', name: 'Chú Hề', title: 'The Jester', icon: '🤡',
        desc: 'Vui vẻ, hài hước, giải thích như cho trẻ 5 tuổi (ELI5).',
        color: 'orange',
        systemPrompt: "Bạn là Chú Hề Hoàng Gia. Nhiệm vụ của bạn là giải thích mọi thứ cực kỳ đơn giản (như giải thích cho trẻ 5 tuổi - ELI5) và HÀI HƯỚC. Hãy dùng các phép ẩn dụ buồn cười, icon, và giọng điệu phấn khích. Biến việc học thành trò chơi."
    },
    {
        id: 'commander', name: 'Chỉ Huy', title: 'The Commander', icon: '⚔️',
        desc: 'Ngắn gọn, súc tích, tập trung vào trọng tâm (Ôn thi).',
        color: 'red',
        systemPrompt: "Bạn là Tổng Chỉ Huy Chiến Trường. Học sinh đang trong tình trạng khẩn cấp (sắp thi). Hãy trả lời cực kỳ ngắn gọn, súc tích, gạch đầu dòng rõ ràng. Bỏ qua các lời chào hỏi rườm rà. Tập trung vào Keywords và công thức."
    }
];

// --- ORB COMPONENT ---
const MagicOrb: React.FC<{ state: 'idle' | 'thinking' | 'speaking', color: string }> = ({ state, color }) => {
    // Map tailwind color name to hex/rgba for shadow styles roughly
    const getColorShadow = (c: string) => {
        switch(c) {
            case 'purple': return 'rgba(168, 85, 247, 0.6)';
            case 'emerald': return 'rgba(16, 185, 129, 0.6)';
            case 'orange': return 'rgba(249, 115, 22, 0.6)';
            case 'red': return 'rgba(239, 68, 68, 0.6)';
            default: return 'rgba(59, 130, 246, 0.6)';
        }
    };
    
    const shadowColor = getColorShadow(color);

    return (
        <div className="relative flex items-center justify-center w-32 h-32 transition-all duration-1000">
            {/* Core */}
            <div className={`absolute w-24 h-24 rounded-full bg-gradient-to-br from-white to-${color}-500 z-10 transition-all duration-500 
                ${state === 'thinking' ? 'animate-spin-slow scale-90' : 'animate-float scale-100'}
                ${state === 'speaking' ? 'scale-110 brightness-125' : ''}
            `}></div>
            
            {/* Inner Glow */}
            <div className={`absolute w-28 h-28 rounded-full blur-md opacity-70 z-0 transition-all duration-500 bg-${color}-400 
                ${state === 'thinking' ? 'animate-ping opacity-40' : 'animate-pulse'}
            `}></div>

            {/* Outer Aura */}
            <div className="absolute w-40 h-40 rounded-full opacity-20 blur-xl z-[-1]" 
                 style={{ backgroundColor: shadowColor, transform: state === 'speaking' ? 'scale(1.5)' : 'scale(1)' }}>
            </div>
            
            {/* Rings (Science/Magic feel) */}
            <div className={`absolute w-48 h-48 border border-${color}-300/30 rounded-full z-[-2] ${state === 'thinking' ? 'animate-spin' : ''} border-dashed`}></div>
        </div>
    );
};

const GeminiStudentPage: React.FC = () => {
    const { user } = useContext(AuthContext)!;
    const { db } = useContext(DataContext)!;
    const { setPage: setGlobalPage } = useContext(GlobalStateContext)!;

    const [activePersona, setActivePersona] = useState<Persona>(PERSONAS[0]);
    const [chatHistory, setChatHistory] = useState<GeminiChatMessage[]>([]);
    const [prompt, setPrompt] = useState('');
    const [orbState, setOrbState] = useState<'idle' | 'thinking' | 'speaking'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [resonance, setResonance] = useState(0); // Gamification meter
    
    // Feature States
    const [useThinking, setUseThinking] = useState(false);
    const [attachedFile, setAttachedFile] = useState<{ name: string, type: string, base64: string } | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handlePersonaChange = (p: Persona) => {
        setActivePersona(p);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            setAttachedFile({
                name: file.name,
                type: file.type,
                base64: base64String
            });
        };
        reader.readAsDataURL(file);
    };

    const handleSend = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!prompt.trim() && !attachedFile) || orbState === 'thinking') return;

        const apiKey = user ? db.USERS[user.id]?.apiKey : null;
        if (!apiKey) {
            setError("Thiếu Chìa khóa Tri thức (API Key).");
            return;
        }

        const userMsg: GeminiChatMessage = { 
            role: 'user', 
            parts: [
                { text: prompt },
                ...(attachedFile ? [{ inlineData: { mimeType: attachedFile.type, data: attachedFile.base64 } }] : [])
            ] 
        };
        
        setChatHistory(prev => [...prev, userMsg]);
        setPrompt('');
        setOrbState('thinking');
        setError(null);
        
        // Keep temp ref to file to send, then clear UI state
        const fileToSend = attachedFile ? { mimeType: attachedFile.type, data: attachedFile.base64 } : null;
        setAttachedFile(null);

        try {
            const responseText = await callGeminiApi(apiKey, prompt, activePersona.systemPrompt, {
                useThinking: useThinking,
                fileData: fileToSend
            });
            
            const modelMsg: GeminiChatMessage = { role: 'model', parts: [{ text: responseText }] };
            setChatHistory(prev => [...prev, modelMsg]);
            setOrbState('speaking');
            setResonance(prev => Math.min(prev + 10, 100)); // Increase resonance
            
            setTimeout(() => setOrbState('idle'), 2000);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Lỗi kết nối vũ trụ.");
            setOrbState('idle');
        }
    }, [prompt, orbState, user, db.USERS, activePersona, useThinking, attachedFile]);

    const openApiKeyModal = () => {
        setGlobalPage('api_key', { isApiKeyModalOpen: true });
        setError(null);
    };

    const crystallizeInsight = (text: string) => {
        alert(`💎 Đã kết tinh tri thức!\n+50 XP vào Kho báu.`);
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6 relative overflow-hidden">
            
            {/* BACKGROUND ATMOSPHERE */}
            <div className={`absolute inset-0 bg-${activePersona.color}-900/10 z-0 transition-colors duration-1000`}></div>
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl"></div>

            {/* LEFT PANEL */}
            <div className="lg:w-1/3 flex flex-col items-center z-10 space-y-8 py-4">
                
                <div className="relative mt-4">
                    <MagicOrb state={orbState} color={activePersona.color} />
                </div>

                <div className="text-center space-y-2 px-6">
                    <h2 className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-${activePersona.color}-300 uppercase tracking-widest`}>
                        {activePersona.title}
                    </h2>
                    <p className="text-sm text-gray-300 italic">"{activePersona.desc}"</p>
                </div>

                <div className="w-full px-6">
                    <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Triệu hồi Linh hồn:</p>
                    <div className="grid grid-cols-2 gap-3">
                        {PERSONAS.map(p => (
                            <button 
                                key={p.id}
                                onClick={() => handlePersonaChange(p)}
                                className={`flex items-center gap-2 p-3 rounded-xl border transition-all duration-300
                                    ${activePersona.id === p.id 
                                        ? `bg-${p.color}-600/20 border-${p.color}-400 shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-105` 
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 grayscale hover:grayscale-0'}
                                `}
                            >
                                <span className="text-2xl">{p.icon}</span>
                                <div className="text-left">
                                    <p className={`text-xs font-bold ${activePersona.id === p.id ? 'text-white' : 'text-gray-400'}`}>{p.name}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ADVANCED AI CONTROLS */}
                <div className="w-full px-6 space-y-3">
                    <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                        <span className="text-sm text-blue-200 font-bold flex items-center gap-2">
                            🧠 Thinking Mode
                        </span>
                        <button 
                            onClick={() => setUseThinking(!useThinking)}
                            className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${useThinking ? 'bg-blue-500' : 'bg-gray-700'}`}
                        >
                            <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all duration-300 ${useThinking ? 'left-6' : 'left-1'}`}></div>
                        </button>
                    </div>
                    {useThinking && <p className="text-[10px] text-blue-300/60 text-center">Sử dụng Gemini 3 Pro Preview với Thinking Budget tối đa.</p>}
                </div>

                <div className="w-full px-6 mt-auto mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Năng lượng Cộng hưởng</span>
                        <span>{resonance}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                        <div 
                            className={`h-full bg-gradient-to-r from-${activePersona.color}-400 to-white transition-all duration-1000`}
                            style={{ width: `${resonance}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: CHAT INTERFACE */}
            <div className="flex-1 flex flex-col z-10 bg-black/30 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden relative mx-4 lg:mr-4 mb-4">
                
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {chatHistory.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                            <div className="text-6xl mb-4 animate-bounce">{activePersona.icon}</div>
                            <p>Ta đang lắng nghe... Hãy hỏi bất cứ điều gì.</p>
                            <p className="text-xs mt-2 text-gray-600">Hỗ trợ Phân tích Ảnh & Video</p>
                        </div>
                    )}
                    
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start group'}`}>
                            <div className={`relative max-w-[85%] p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 hover:scale-[1.01]
                                ${msg.role === 'user' 
                                    ? 'bg-blue-600/80 border-blue-400/50 text-white rounded-tr-none shadow-[0_5px_15px_rgba(37,99,235,0.3)]' 
                                    : `bg-gray-800/80 border-${activePersona.color}-500/30 text-gray-100 rounded-tl-none shadow-[0_5px_15px_rgba(0,0,0,0.3)]`
                                }`
                            }>
                                {/* Display Attached Media */}
                                {msg.parts.find(p => p.inlineData) && (
                                    <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                                        {msg.parts.find(p => p.inlineData)?.inlineData?.mimeType.startsWith('video') ? (
                                             <div className="bg-black p-2 text-center text-xs">📹 [Video Attached]</div>
                                        ) : (
                                            <img 
                                                src={`data:${msg.parts.find(p => p.inlineData)?.inlineData?.mimeType};base64,${msg.parts.find(p => p.inlineData)?.inlineData?.data}`} 
                                                alt="User upload" 
                                                className="max-w-full h-auto max-h-60 object-contain"
                                            />
                                        )}
                                    </div>
                                )}

                                <div className="prose prose-invert max-w-none prose-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.parts.find(p=>p.text)?.text?.replace(/\n/g, '<br />') || '' }} />
                                
                                {msg.role === 'model' && (
                                    <button 
                                        onClick={() => crystallizeInsight(msg.parts[0].text || '')}
                                        className="absolute -bottom-3 -right-3 bg-gray-900 border border-yellow-500 text-yellow-400 text-[10px] font-bold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-yellow-900 flex items-center gap-1"
                                        title="Lưu vào Sổ tay & Nhận XP"
                                    >
                                        <span>💎</span> KẾT TINH
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {error && (
                    <div className="mx-6 mb-2 p-3 bg-red-900/80 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center justify-between backdrop-blur-md animate-pulse">
                        <span className="flex items-center gap-2">⚠️ {error}</span>
                        {error.includes("API Key") && (
                            <button onClick={openApiKeyModal} className="btn btn-xs bg-red-700 hover:bg-red-600 text-white border-none">
                                🔑 Cấu hình
                            </button>
                        )}
                    </div>
                )}

                {/* ATTACHMENT PREVIEW */}
                {attachedFile && (
                    <div className="px-4 py-2 bg-black/40 flex items-center gap-2">
                        <span className="text-xs text-blue-300 truncate max-w-[200px]">📎 {attachedFile.name}</span>
                        <button onClick={() => setAttachedFile(null)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                    </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 bg-black/20 border-t border-white/5 flex gap-3 items-center">
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
                        title="Upload Image/Video"
                    >
                        📷
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*,video/*" 
                        onChange={handleFileSelect}
                    />

                    <div className="flex-1 relative group">
                        <input 
                            type="text" 
                            className={`w-full bg-gray-900/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-${activePersona.color}-500 transition-all placeholder-gray-500`}
                            placeholder={`Hỏi ${activePersona.name}...`}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={orbState === 'thinking'}
                        />
                        <div className={`absolute inset-0 rounded-xl bg-${activePersona.color}-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}></div>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={orbState === 'thinking' || (!prompt.trim() && !attachedFile)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg
                            ${orbState === 'thinking' || (!prompt.trim() && !attachedFile)
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                                : `bg-gradient-to-br from-${activePersona.color}-500 to-${activePersona.color}-700 text-white hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]`
                            }
                        `}
                    >
                        {orbState === 'thinking' ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <span className="text-xl">➤</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GeminiStudentPage;
