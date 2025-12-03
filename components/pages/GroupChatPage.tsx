
import React, { useState, useContext, useMemo, useCallback, useRef, useEffect } from 'react';
import { AuthContext, DataContext, GlobalStateContext } from '../../contexts/AppProviders';
import { useFeatureFlag } from '../../hooks/useAppHooks';
import Modal from '../common/Modal';
import type { StudyGroup, User } from '../../types';

// --- MOCK DATA HELPERS ---
const getSquadronStats = (groupId: string) => {
    // Deterministic random stats based on ID
    const hash = groupId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
        level: (hash % 10) + 1,
        shield: 50 + (hash % 50),
        thruster: 40 + (hash % 60),
        energy: (hash % 100), // 0-100%
        shipClass: ['Interceptor', 'Frigate', 'Destroyer', 'Cruiser'][hash % 4]
    };
};

const GroupChatPage: React.FC = () => {
    const { user } = useContext(AuthContext)!;
    const { db, joinGroup, sendGroupMessage, createGroup, sendChatMessage } = useContext(DataContext)!;
    const { serviceStatus } = useContext(GlobalStateContext)!;
    
    const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
    const [message, setMessage] = useState('');
    const [isSOS, setIsSOS] = useState(false); // SOS Mode
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const isGroupChatEnabled = useFeatureFlag('v5_groups');
    const isGroupServiceOk = serviceStatus.group_service === 'OPERATIONAL';

    const groups = useMemo(() => db.STUDY_GROUPS, [db.STUDY_GROUPS]);
    const contacts = useMemo(() => (Object.values(db.USERS) as User[]).filter(u => u.id !== user?.id), [db.USERS, user?.id]);

    const { chatHistory, userInGroup } = useMemo(() => {
        if (!selectedGroup || !user) return { chatHistory: [], userInGroup: false };
        const history = db.GROUP_CHAT_MESSAGES[selectedGroup.id] || [];
        const inGroup = selectedGroup.members.includes(user.id);
        return { chatHistory: history, userInGroup: inGroup };
    }, [selectedGroup, user, db.GROUP_CHAT_MESSAGES]);

    // Calculate simulated energy based on chat activity length
    const squadronEnergy = useMemo(() => {
        if (!selectedGroup) return 0;
        const base = getSquadronStats(selectedGroup.id).energy;
        const activeBonus = Math.min(chatHistory.length * 2, 50); // Chatting adds energy
        return Math.min(base + activeBonus, 100);
    }, [selectedGroup, chatHistory]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSend = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !selectedGroup || !userInGroup || !isGroupServiceOk || !user) return;
        
        // Prefix SOS if needed
        const finalMessage = isSOS ? `[SOS] ${message}` : message;
        sendGroupMessage(selectedGroup.id, user, finalMessage);
        setMessage('');
        setIsSOS(false);
    }, [message, selectedGroup, userInGroup, user, sendGroupMessage, isGroupServiceOk, isSOS]);

    const handleJoin = useCallback(() => {
        if (!selectedGroup || userInGroup || !isGroupServiceOk || !user) return;
        joinGroup(selectedGroup.id, user.id);
    }, [selectedGroup, userInGroup, user, joinGroup, isGroupServiceOk]);

    const handleCreateGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim() || !user) return;
        createGroup(newGroupName, user.id);
        setNewGroupName('');
        setIsCreateModalOpen(false);
        alert("Đã tạo phi thuyền mới!");
    };

    const handleShareToContact = (contactId: string) => {
        if (!selectedGroup || !user) return;
        const link = `starlink://squadron/${selectedGroup.id}`;
        const inviteMessage = `🚀 MỜI GIA NHẬP: Tôi mời bạn tham gia phi thuyền "${selectedGroup.name}".\nTruy cập tọa độ: ${link}`;
        
        sendChatMessage(user.id, contactId, inviteMessage);
        alert(`Đã gửi tín hiệu mời đến ${db.USERS[contactId].name}!`);
        setIsShareModalOpen(false);
    };

    if (!isGroupChatEnabled) {
        return <div className="card p-8 text-center"><h2 className="text-xl font-bold text-yellow-400">Khu vực Hạm đội đang bảo trì.</h2></div>;
    }
    if (!isGroupServiceOk) {
        return <div className="card p-8 text-center border border-yellow-700"><h2 className="text-xl font-bold text-yellow-400">Mất tín hiệu Hạm đội.</h2></div>;
    }
    
    return (
        <div className="flex h-[calc(100vh-120px)] gap-6 relative">
            
            {/* LEFT PANEL: HANGAR BAY (List) */}
            <div className="w-1/3 min-w-[280px] flex flex-col gap-4">
                <div className="p-5 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2 relative z-10">
                        <span className="text-2xl">🚀</span> Hangar Bay
                    </h2>
                    <p className="text-xs text-blue-300/70 mt-1 font-mono">Chọn phi thuyền để tham chiến</p>
                </div>

                {/* CREATE BUTTON */}
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg border border-white/10 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] group"
                >
                    <span className="text-xl group-hover:rotate-90 transition-transform">+</span> Triệu hồi Phi thuyền
                </button>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {groups.map(g => {
                        const stats = getSquadronStats(g.id);
                        const isSelected = selectedGroup?.id === g.id;
                        
                        return (
                            <button 
                                key={g.id} 
                                onClick={() => setSelectedGroup(g)} 
                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 relative group overflow-hidden
                                ${isSelected 
                                    ? 'bg-blue-900/40 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-[1.02]' 
                                    : 'bg-gray-800/40 border-white/5 hover:bg-white/5 hover:border-white/20'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <div>
                                        <p className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-300'}`}>{g.name}</p>
                                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Class: {stats.shipClass}</p>
                                    </div>
                                    <span className="bg-black/50 text-xs font-bold px-2 py-1 rounded text-blue-300 border border-blue-500/30">
                                        LV.{stats.level}
                                    </span>
                                </div>
                                
                                {/* Visual Stats */}
                                <div className="flex gap-1 mt-2 relative z-10 opacity-70">
                                    <div className="h-1 flex-1 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{width: `${stats.shield}%`}}></div></div>
                                    <div className="h-1 flex-1 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-orange-500" style={{width: `${stats.thruster}%`}}></div></div>
                                </div>
                                <div className="flex justify-between text-[9px] text-gray-500 mt-1 font-mono relative z-10">
                                    <span>SHIELD</span>
                                    <span>THRUSTER</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT PANEL: COCKPIT (Chat) */}
            <div className="w-2/3 flex flex-col bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                
                {/* Holographic Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none z-0"></div>

                {!selectedGroup ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 relative z-10">
                        <div className="w-40 h-40 border border-blue-500/20 rounded-full flex items-center justify-center animate-spin-slow">
                            <div className="w-32 h-32 border border-blue-500/40 rounded-full border-dashed animate-reverse-spin"></div>
                        </div>
                        <p className="mt-6 font-mono text-blue-300/60 tracking-widest text-sm">SYSTEM STANDBY...</p>
                    </div>
                ) : (
                    <>
                        {/* COCKPIT HEADER */}
                        <div className="p-5 border-b border-white/10 bg-white/5 relative z-10 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-wide drop-shadow-md flex items-center gap-3">
                                    {selectedGroup.name}
                                    {squadronEnergy >= 100 && <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded font-bold animate-pulse">⚡ HYPERDRIVE</span>}
                                </h2>
                                <div className="flex items-center gap-4 mt-2 text-xs font-mono text-blue-300">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> ONLINE: {selectedGroup.members.length}</span>
                                    <span>SECTOR: ALPHA-7</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {userInGroup && (
                                    <button 
                                        onClick={() => setIsShareModalOpen(true)}
                                        className="btn btn-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 hover:bg-blue-500 hover:text-white flex items-center gap-2"
                                        title="Chia sẻ Tọa độ (Gửi Link)"
                                    >
                                        <span>🔗</span> <span className="hidden sm:inline">Chia sẻ</span>
                                    </button>
                                )}

                                {/* ENERGY CORE */}
                                <div className="w-48 text-right">
                                    <div className="flex justify-between text-[10px] font-bold text-blue-200 mb-1">
                                        <span>ENERGY CORE</span>
                                        <span>{Math.round(squadronEnergy)}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-800 rounded-full border border-gray-600 overflow-hidden relative">
                                        <div 
                                            className={`h-full transition-all duration-1000 relative ${squadronEnergy >= 100 ? 'bg-gradient-to-r from-yellow-400 to-red-500 animate-pulse' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
                                            style={{width: `${squadronEnergy}%`}}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MISSION DASHBOARD (If joined) */}
                        {userInGroup && selectedGroup.mission && (
                            <div className="px-6 py-3 bg-blue-900/20 border-b border-blue-500/20 relative z-10 flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-xl shadow-lg">
                                    📜
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs text-blue-200 font-bold uppercase tracking-wider mb-1">
                                        <span>Nhiệm vụ Hạm đội: {selectedGroup.mission.title}</span>
                                        <span>{selectedGroup.mission.current} / {selectedGroup.mission.target}</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" 
                                            style={{ width: `${(selectedGroup.mission.current / selectedGroup.mission.target) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-400 uppercase">Thưởng</p>
                                    <p className="text-yellow-400 font-bold">+{selectedGroup.mission.reward} 💎</p>
                                </div>
                            </div>
                        )}

                        {/* COMMS DISPLAY */}
                        <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar relative z-10">
                            {chatHistory.map(msg => {
                                const isMe = msg.user.id === user?.id;
                                const isSystem = msg.user.id === 'system';
                                const isMsgSOS = msg.text.startsWith('[SOS]');
                                const cleanText = msg.text.replace('[SOS]', '').trim();

                                if (isSystem) {
                                    return (
                                        <div key={msg.id} className="flex justify-center my-2">
                                            <span className="px-3 py-1 bg-blue-900/30 border border-blue-500/30 rounded-full text-[10px] text-blue-300 font-mono tracking-wider uppercase">
                                                {msg.text}
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                        {!isMe && (
                                            <div className="mr-3 flex flex-col items-center">
                                                <div className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-600 flex items-center justify-center text-xs font-bold text-gray-400">
                                                    {msg.user.name.charAt(0)}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className={`max-w-[75%] relative ${isMsgSOS ? 'animate-shake' : ''}`}>
                                            {/* Message Bubble */}
                                            <div className={`py-3 px-4 rounded-xl border backdrop-blur-md text-sm shadow-lg
                                                ${isMsgSOS 
                                                    ? 'bg-red-900/80 border-red-500 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                                                    : isMe 
                                                        ? 'bg-blue-600/80 border-blue-400/50 text-white rounded-tr-none' 
                                                        : 'bg-gray-800/80 border-gray-600/50 text-gray-200 rounded-tl-none'
                                                }`}>
                                                {isMsgSOS && <div className="text-[10px] font-black text-red-300 mb-1 flex items-center gap-1"><span className="animate-ping w-1.5 h-1.5 bg-red-400 rounded-full"></span> SIGNAL DISTRESS</div>}
                                                <p className="leading-relaxed">{cleanText}</p>
                                            </div>
                                            
                                            <p className={`text-[9px] mt-1 opacity-50 font-mono ${isMe ? 'text-right text-blue-200' : 'text-left text-gray-400'}`}>
                                                {msg.user.role !== 'STUDENT' ? `★ ${msg.user.role} • ` : ''}
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* TRANSMISSION CONSOLE (Input) */}
                        {userInGroup ? (
                            <div className="p-4 bg-black/40 border-t border-white/10 relative z-20">
                                <form onSubmit={handleSend} className="flex gap-3 items-end">
                                    {/* SOS Button */}
                                    <button 
                                        type="button"
                                        onClick={() => setIsSOS(!isSOS)}
                                        className={`h-12 px-4 rounded-xl border-2 font-bold transition-all flex items-center gap-2
                                            ${isSOS 
                                                ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse' 
                                                : 'bg-gray-800 border-gray-600 text-gray-400 hover:text-red-400 hover:border-red-500'
                                            }`}
                                        title="Gửi tín hiệu cầu cứu (Highlight tin nhắn)"
                                    >
                                        🚨
                                    </button>

                                    <div className="flex-1 relative">
                                        <input 
                                            type="text" 
                                            className={`w-full bg-gray-900/80 border-2 text-white rounded-xl px-4 py-3 focus:outline-none focus:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all placeholder-gray-500
                                                ${isSOS ? 'border-red-500 focus:ring-red-500 placeholder-red-300/50' : 'border-gray-600 focus:border-blue-500'}
                                            `}
                                            placeholder={isSOS ? "NHẬP NỘI DUNG CẦN GIÚP ĐỠ KHẨN CẤP..." : "Nhập tín hiệu liên lạc..."}
                                            value={message} 
                                            onChange={(e) => setMessage(e.target.value)} 
                                        />
                                    </div>
                                    
                                    <button 
                                        type="submit" 
                                        className={`h-12 w-16 flex items-center justify-center rounded-xl font-bold transition-all shadow-lg
                                            ${isSOS 
                                                ? 'bg-red-600 hover:bg-red-500 text-white' 
                                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                                            }`}
                                        disabled={!message.trim()}
                                    >
                                        SEND
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="p-6 bg-black/40 border-t border-white/10 text-center z-20 backdrop-blur-md">
                                <p className="text-gray-400 mb-4 font-mono text-sm">BẠN CHƯA CÓ QUYỀN TRUY CẬP TÀU NÀY.</p>
                                <button onClick={handleJoin} className="btn btn-primary px-8 py-3 text-lg shadow-[0_0_20px_rgba(37,99,235,0.5)] animate-pulse">
                                    🚀 Yêu cầu Lên Tàu (Join)
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Triệu hồi Phi thuyền Mới">
                <form onSubmit={handleCreateGroup} className="space-y-4">
                    <p className="text-gray-300 text-sm">Nhập tên cho hạm đội mới của bạn. Bạn sẽ tự động trở thành thuyền trưởng.</p>
                    <div>
                        <label htmlFor="groupName" className="block text-sm font-medium text-gray-400 mb-1">Tên Phi thuyền / Nhóm</label>
                        <input 
                            id="groupName" 
                            type="text" 
                            className="form-input w-full" 
                            placeholder="VD: Chiến hạm ReactJS, Biệt đội A..." 
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="btn btn-primary" disabled={!newGroupName.trim()}>
                            🚀 Khởi tạo
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Share Modal */}
            <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Chia sẻ Tọa độ Hạm đội">
                <div className="space-y-4">
                    <p className="text-gray-400 text-sm">Chọn đồng đội từ danh bạ HOLO-NET để gửi tín hiệu mời:</p>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                        {contacts.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">Danh bạ trống.</p>
                        ) : contacts.map(contact => (
                            <button 
                                key={contact.id}
                                onClick={() => handleShareToContact(contact.id)}
                                className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-800 to-black border border-white/20 flex items-center justify-center font-bold text-white">
                                        {contact.name.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-200 text-sm group-hover:text-blue-300 transition-colors">{contact.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{contact.role}</p>
                                    </div>
                                </div>
                                <span className="text-blue-400 text-xs group-hover:text-white group-hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-all font-bold shadow-lg">Gửi 📡</span>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
};
export default GroupChatPage;
