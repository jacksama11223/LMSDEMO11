
import React, { useState, useContext, useMemo, useCallback, useRef, useEffect } from 'react';
import { AuthContext, DataContext, GlobalStateContext } from '../../contexts/AppProviders';
import { useFeatureFlag } from '../../hooks/useAppHooks';
import type { User } from '../../types';

// --- MOCK HELPERS FOR GAMIFICATION ---
const getUserLevel = (userId: string) => {
    // Mock level based on ID length or random for demo
    return Math.floor(Math.random() * 20) + 1;
};

const getUserStatus = (userId: string) => {
    const statuses = [
        { text: 'Đang học React', color: 'text-blue-400' },
        { text: 'Đang làm Quiz', color: 'text-yellow-400' },
        { text: 'Trực tuyến', color: 'text-green-400' },
        { text: 'Ngoại tuyến', color: 'text-gray-500' },
        { text: 'Đang leo Rank', color: 'text-purple-400' },
    ];
    // Deterministic random based on ID char code
    const index = userId.charCodeAt(userId.length - 1) % statuses.length;
    return statuses[index];
};

const getRoleStyle = (role: string) => {
    switch (role) {
        case 'ADMIN': return 'border-red-500/50 bg-red-900/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
        case 'TEACHER': return 'border-yellow-500/50 bg-yellow-900/10 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
        default: return 'border-blue-500/30 bg-blue-900/10 hover:border-blue-400/60';
    }
};

const ChatPage: React.FC = () => {
    const { user } = useContext(AuthContext)!;
    const { db, sendChatMessage, joinGroup } = useContext(DataContext)!;
    const { serviceStatus, setPage: setGlobalPage } = useContext(GlobalStateContext)!;
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [message, setMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [kudosCount, setKudosCount] = useState<Record<string, number>>({}); // Local mock state for demo

    const isChatEnabled = useFeatureFlag('v2_chat');
    const isChatServiceOk = serviceStatus.chat_service === 'OPERATIONAL';

    // Determine current user's squadron
    const mySquadron = useMemo(() => db.STUDY_GROUPS.find(g => g.members.includes(user?.id || '')), [db.STUDY_GROUPS, user?.id]);

    const users = useMemo(() => (Object.values(db.USERS) as User[]).filter(u => u.id !== user?.id), [db.USERS, user?.id]);

    const { chatKey, chatHistory, isSquadronMate } = useMemo(() => {
        if (!selectedUser || !user) return { chatKey: null, chatHistory: [], isSquadronMate: false };
        const key = [user.id, selectedUser.id].sort().join('_');
        const isMate = mySquadron ? mySquadron.members.includes(selectedUser.id) : false;
        return { chatKey: key, chatHistory: db.CHAT_MESSAGES[key] || [], isSquadronMate: isMate };
    }, [selectedUser, user, db.CHAT_MESSAGES, mySquadron]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSend = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !selectedUser || !chatKey || !isChatServiceOk || !user) return;
        sendChatMessage(user.id, selectedUser.id, message);
        setMessage('');
    }, [message, selectedUser, chatKey, user, sendChatMessage, isChatServiceOk]);

    const giveKudos = () => {
        if (!selectedUser) return;
        const newCount = (kudosCount[selectedUser.id] || 0) + 1;
        setKudosCount({ ...kudosCount, [selectedUser.id]: newCount });
        alert(`✨ Bạn đã gửi Tín Nhiệm (+1 Uy tín) cho ${selectedUser.name}!`);
    };

    const handleRecruit = () => {
        if (!selectedUser || !mySquadron) return;
        if (selectedUser.squadronId) {
            alert("Người này đã thuộc về một Phi đội khác!");
            return;
        }
        // In a real app, this would send an invitation system message.
        // For demo, we auto-join them or simulate an invite message.
        if (window.confirm(`Mời ${selectedUser.name} gia nhập "${mySquadron.name}"?`)) {
             sendChatMessage(user!.id, selectedUser.id, `[SYSTEM] 🚀 ${user?.name} đã mời bạn gia nhập Phi đội "${mySquadron.name}".`);
             // For demo convenience, just force join them so we can see effect
             joinGroup(mySquadron.id, selectedUser.id);
             alert("Lời mời đã được gửi đi (Demo: Đã tự động thêm vào nhóm)!");
        }
    };

    if (!isChatEnabled) {
        return <div className="card p-8 text-center"><h2 className="text-xl font-bold text-yellow-400">Tính năng đang được bảo trì.</h2></div>;
    }
    if (!isChatServiceOk) {
        return <div className="card p-8 text-center border border-yellow-700"><h2 className="text-xl font-bold text-yellow-400">Dịch vụ Chat đang Bảo trì.</h2></div>;
    }

    return (
        <div className="h-[calc(100vh-120px)] flex gap-6 relative">
            
            {/* LEFT PANEL: HOLO-NET CONTACTS */}
            <div className="w-1/3 min-w-[300px] flex flex-col gap-4">
                <div className="p-4 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 flex items-center gap-2">
                        <span className="animate-pulse">📡</span> HOLO-NET
                    </h2>
                    <p className="text-xs text-blue-300/70 mt-1">Mạng lưới kết nối thời gian thực</p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {users.map(u => {
                        const status = getUserStatus(u.id);
                        const level = getUserLevel(u.id);
                        const isSelected = selectedUser?.id === u.id;
                        const roleStyle = getRoleStyle(u.role);
                        const userSquadron = db.STUDY_GROUPS.find(g => g.members.includes(u.id));

                        return (
                            <button 
                                key={u.id} 
                                onClick={() => setSelectedUser(u)} 
                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 relative group overflow-hidden
                                ${isSelected 
                                    ? 'bg-gradient-to-r from-blue-900/80 to-indigo-900/80 border-blue-400 scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                                    : `${roleStyle} hover:scale-[1.01]`
                                }`}
                            >
                                <div className="relative z-10 flex items-center gap-4">
                                    {/* Avatar Hexagon */}
                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-800 to-black border border-white/20 font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                            {u.name.charAt(0)}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-black/80 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-600 text-yellow-400">
                                            LV.{level}
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className={`font-bold ${isSelected ? 'text-white' : 'text-gray-200 group-hover:text-blue-200'}`}>{u.name}</p>
                                            {u.role === 'TEACHER' && <span className="text-[10px] bg-yellow-500/20 text-yellow-200 px-1.5 py-0.5 rounded border border-yellow-500/30">MENTOR</span>}
                                        </div>
                                        {userSquadron && (
                                            <p className="text-[10px] text-green-400 font-mono tracking-wider mt-0.5 flex items-center gap-1">
                                                <span>🛡️</span> {userSquadron.name}
                                            </p>
                                        )}
                                        <p className={`text-xs mt-1 flex items-center gap-1 ${status.color}`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                                            {status.text}
                                        </p>
                                    </div>
                                </div>
                                {/* Hover Scan Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT PANEL: COCKPIT CHAT */}
            <div className={`flex-1 flex flex-col backdrop-blur-2xl border rounded-[2rem] shadow-2xl overflow-hidden relative transition-all duration-500
                ${isSquadronMate 
                    ? 'bg-green-900/20 border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.1)]' 
                    : 'bg-black/40 border-white/10'
                }`}
            >
                {/* SCANNER LINE FOR SECURE CHAT */}
                {isSquadronMate && <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_15px_#4ade80] z-50"></div>}

                {!selectedUser ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
                        <div className="w-32 h-32 border-2 border-dashed border-gray-700 rounded-full flex items-center justify-center animate-spin-slow">
                            <span className="text-4xl animate-pulse">🌌</span>
                        </div>
                        <p className="text-lg font-light">Chọn tín hiệu liên lạc để bắt đầu...</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center z-10">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${isSquadronMate ? 'bg-green-400 text-green-400' : 'bg-blue-400 text-blue-400'}`}></div>
                                <div>
                                    <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                                        {selectedUser.name}
                                        {isSquadronMate && <span className="text-[10px] bg-green-500 text-black px-2 py-0.5 rounded font-black tracking-widest">SECURE LINE</span>}
                                    </h2>
                                    <p className="text-xs text-blue-300 uppercase tracking-widest">{selectedUser.role === 'TEACHER' ? 'Giảng Viên / Mentor' : 'Học Viên / Cadet'}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {mySquadron && !isSquadronMate && selectedUser.role === 'STUDENT' && !selectedUser.squadronId && (
                                    <button
                                        onClick={handleRecruit}
                                        className="btn bg-green-600/20 border border-green-500/50 text-green-300 hover:bg-green-600 hover:text-white text-xs px-3 py-2 rounded-lg flex items-center gap-2 transition-all"
                                        title="Mời vào Phi đội"
                                    >
                                        <span>🤝</span> Chiêu Mộ
                                    </button>
                                )}
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] text-gray-400 uppercase">Uy Tín</p>
                                    <p className="text-sm font-bold text-yellow-400">{(kudosCount[selectedUser.id] || 0) * 150} RP</p>
                                </div>
                                <button 
                                    onClick={giveKudos}
                                    className="btn bg-pink-600/20 border border-pink-500/50 text-pink-300 hover:bg-pink-600 hover:text-white text-xs px-3 py-2 rounded-lg flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(236,72,153,0.5)]"
                                    title="Tặng điểm uy tín vì đã giúp đỡ"
                                >
                                    <span>💖</span> Respect
                                </button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar relative">
                            {/* Grid Background */}
                            <div className={`absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] z-0 pointer-events-none ${isSquadronMate ? 'opacity-20 bg-green-500/5' : ''}`}></div>

                            {chatHistory.map(msg => {
                                const isMe = msg.from === user?.id;
                                return (
                                    <div key={msg.id} className={`relative z-10 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] py-3 px-5 rounded-2xl border backdrop-blur-md shadow-lg transition-all hover:scale-[1.01]
                                            ${isMe 
                                                ? 'bg-blue-600/80 border-blue-400/50 text-white rounded-br-none' 
                                                : 'bg-gray-800/80 border-gray-600/50 text-gray-200 rounded-bl-none'
                                            }`}>
                                            <p className="leading-relaxed">{msg.text}</p>
                                            <p className={`text-[10px] mt-1 text-right opacity-60 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/20 flex gap-3 z-10">
                            <input 
                                type="text" 
                                className="flex-1 bg-gray-900/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-500 shadow-inner" 
                                placeholder={isSquadronMate ? "Đường truyền mã hóa đã mở..." : "Nhập tín hiệu..."}
                                value={message} 
                                onChange={(e) => setMessage(e.target.value)} 
                            />
                            <button type="submit" className="btn btn-primary w-12 h-12 flex items-center justify-center rounded-xl shadow-lg hover:scale-110 transition-transform" disabled={!message.trim()}>
                                ➤
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
export default ChatPage;
