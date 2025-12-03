
import React, { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { AuthContext, DataContext, GlobalStateContext } from '../../contexts/AppProviders';
import { enhanceNoteWithGemini } from '../../services/geminiService';
import LoadingSpinner from '../common/LoadingSpinner';
import type { PersonalNote } from '../../types';

const NotebookPage: React.FC = () => {
    const { user } = useContext(AuthContext)!;
    const { db, createPersonalNote, updatePersonalNote, deletePersonalNote } = useContext(DataContext)!;
    const { setPage: setGlobalPage } = useContext(GlobalStateContext)!;

    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'assignment' | 'path'>('all');
    
    // Editor State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [linkedAssignmentId, setLinkedAssignmentId] = useState('');
    const [linkedPathId, setLinkedPathId] = useState('');
    const [isPinned, setIsPinned] = useState(false);

    // AI State
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [aiResult, setAiResult] = useState<string | null>(null);

    // Derived Data
    const myNotes = useMemo(() => {
        if (!user) return [];
        const notes = Object.values(db.PERSONAL_NOTES || {})
            .filter(n => n.userId === user.id)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        
        return notes.filter(n => {
            const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filter === 'all' 
                ? true 
                : filter === 'assignment' ? !!n.linkedAssignmentId 
                : !!n.linkedPathId;
            return matchesSearch && matchesFilter;
        });
    }, [db.PERSONAL_NOTES, user, searchQuery, filter]);

    const assignments = useMemo(() => Object.values(db.ASSIGNMENTS), [db.ASSIGNMENTS]);
    const paths = useMemo(() => Object.values(db.LEARNING_PATHS || {}), [db.LEARNING_PATHS]);

    // Effect: Load selected note into editor
    useEffect(() => {
        if (selectedNoteId && db.PERSONAL_NOTES[selectedNoteId]) {
            const note = db.PERSONAL_NOTES[selectedNoteId];
            setTitle(note.title);
            setContent(note.content);
            setLinkedAssignmentId(note.linkedAssignmentId || '');
            setLinkedPathId(note.linkedPathId || '');
            setIsPinned(note.isPinned || false);
            setAiResult(null);
        } else {
            // Reset if no note selected (Create Mode)
            if (selectedNoteId === 'new') {
                setTitle('');
                setContent('');
                setLinkedAssignmentId('');
                setLinkedPathId('');
                setIsPinned(false);
                setAiResult(null);
            }
        }
    }, [selectedNoteId, db.PERSONAL_NOTES]);

    const handleCreateNew = () => {
        setSelectedNoteId('new');
    };

    const handleSave = () => {
        if (!user || !title.trim()) {
            alert("Vui lòng nhập tiêu đề.");
            return;
        }

        const links = {
            assignmentId: linkedAssignmentId || undefined,
            pathId: linkedPathId || undefined
        };

        if (selectedNoteId === 'new') {
            createPersonalNote(user.id, title, content, links);
            alert("Đã tạo ghi chú mới!");
            setSelectedNoteId(null); // Return to list or select the new one (simplified: return to list)
        } else if (selectedNoteId) {
            updatePersonalNote(selectedNoteId, { title, content, linkedAssignmentId: links.assignmentId, linkedPathId: links.pathId, isPinned });
            // alert("Đã lưu thay đổi.");
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Bạn chắc chắn muốn xóa ghi chú này?")) {
            deletePersonalNote(id);
            if (selectedNoteId === id) setSelectedNoteId(null);
        }
    };

    const handleAiAction = async (action: 'summarize' | 'expand' | 'fix' | 'quiz') => {
        if (!content.trim()) return;
        const apiKey = user ? db.USERS[user.id]?.apiKey : null;
        if (!apiKey) {
            setGlobalPage('api_key', { isApiKeyModalOpen: true });
            return;
        }

        setIsAiProcessing(true);
        setAiResult(null);
        try {
            const result = await enhanceNoteWithGemini(apiKey, content, action);
            setAiResult(result);
        } catch (e) {
            alert("Lỗi kết nối AI.");
        } finally {
            setIsAiProcessing(false);
        }
    };

    const insertAiResult = () => {
        if (aiResult) {
            setContent(prev => prev + "\n\n--- AI Assistant ---\n" + aiResult);
            setAiResult(null);
        }
    };

    if (!user) return null;

    return (
        <div className="h-[calc(100vh-100px)] flex gap-6 pb-4">
            {/* LEFT PANEL: LIST */}
            <div className="w-1/3 min-w-[280px] flex flex-col gap-4">
                <div className="p-4 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 flex items-center gap-2 mb-4">
                        <span>📓</span> Sổ Tay Không Gian
                    </h2>
                    
                    <button 
                        onClick={handleCreateNew}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg border border-white/10 hover:scale-[1.02] transition-all mb-4"
                    >
                        + Ghi Chú Mới
                    </button>

                    <div className="space-y-2">
                        <input 
                            type="text" 
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            placeholder="Tìm kiếm..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setFilter('all')} className={`flex-1 text-[10px] font-bold py-1 rounded ${filter==='all' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`}>TẤT CẢ</button>
                            <button onClick={() => setFilter('assignment')} className={`flex-1 text-[10px] font-bold py-1 rounded ${filter==='assignment' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`}>BÀI TẬP</button>
                            <button onClick={() => setFilter('path')} className={`flex-1 text-[10px] font-bold py-1 rounded ${filter==='path' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`}>LỘ TRÌNH</button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    {myNotes.map(note => (
                        <div 
                            key={note.id}
                            onClick={() => setSelectedNoteId(note.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all group relative overflow-hidden ${
                                selectedNoteId === note.id 
                                ? 'bg-blue-900/30 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                                : 'bg-black/20 border-white/5 hover:bg-white/5'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={`font-bold truncate pr-4 ${selectedNoteId === note.id ? 'text-white' : 'text-gray-300'}`}>
                                    {note.isPinned && <span className="text-yellow-400 mr-1">📌</span>}
                                    {note.title}
                                </h3>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">{note.content}</p>
                            <div className="mt-2 flex gap-2">
                                {note.linkedAssignmentId && <span className="text-[9px] bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">Link: BT</span>}
                                {note.linkedPathId && <span className="text-[9px] bg-green-900/30 text-green-300 px-1.5 py-0.5 rounded border border-green-500/20">Link: Lộ trình</span>}
                            </div>
                        </div>
                    ))}
                    {myNotes.length === 0 && <p className="text-center text-gray-500 text-sm mt-4">Chưa có ghi chú nào.</p>}
                </div>
            </div>

            {/* RIGHT PANEL: EDITOR */}
            <div className="flex-1 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
                {!selectedNoteId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <div className="text-6xl mb-4 opacity-50">📝</div>
                        <p>Chọn một ghi chú hoặc tạo mới để bắt đầu.</p>
                    </div>
                ) : (
                    <>
                        {/* EDITOR HEADER */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-start bg-white/5">
                            <div className="flex-1 mr-4 space-y-2">
                                <input 
                                    type="text" 
                                    className="w-full bg-transparent text-xl font-bold text-white placeholder-gray-500 focus:outline-none"
                                    placeholder="Tiêu đề ghi chú..."
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                                <div className="flex gap-4">
                                    <select 
                                        className="bg-black/30 text-xs text-gray-400 border border-white/10 rounded px-2 py-1 focus:border-blue-500 focus:text-blue-300 outline-none"
                                        value={linkedAssignmentId}
                                        onChange={e => setLinkedAssignmentId(e.target.value)}
                                    >
                                        <option value="">-- Liên kết Bài tập --</option>
                                        {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                    </select>
                                    <select 
                                        className="bg-black/30 text-xs text-gray-400 border border-white/10 rounded px-2 py-1 focus:border-green-500 focus:text-green-300 outline-none"
                                        value={linkedPathId}
                                        onChange={e => setLinkedPathId(e.target.value)}
                                    >
                                        <option value="">-- Liên kết Lộ trình --</option>
                                        {paths.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setIsPinned(!isPinned)}
                                    className={`p-2 rounded-lg transition-colors ${isPinned ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-500 hover:text-yellow-200'}`}
                                    title="Ghim ghi chú"
                                >
                                    📌
                                </button>
                                <button onClick={handleSave} className="btn btn-sm btn-primary px-4">
                                    Lưu
                                </button>
                            </div>
                        </div>

                        {/* EDITOR BODY */}
                        <div className="flex-1 p-4 relative">
                            <textarea 
                                className="w-full h-full bg-transparent text-gray-200 resize-none outline-none font-mono text-sm leading-relaxed custom-scrollbar"
                                placeholder="Viết nội dung tại đây..."
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                            
                            {/* AI TOOLBAR FLOATING */}
                            <div className="absolute bottom-4 right-4 flex gap-2">
                                <button onClick={() => handleAiAction('fix')} disabled={isAiProcessing} className="btn btn-xs bg-indigo-600/80 hover:bg-indigo-500 text-white backdrop-blur shadow-lg border border-indigo-400/30">✨ Sửa lỗi</button>
                                <button onClick={() => handleAiAction('expand')} disabled={isAiProcessing} className="btn btn-xs bg-indigo-600/80 hover:bg-indigo-500 text-white backdrop-blur shadow-lg border border-indigo-400/30">🔍 Mở rộng</button>
                                <button onClick={() => handleAiAction('summarize')} disabled={isAiProcessing} className="btn btn-xs bg-indigo-600/80 hover:bg-indigo-500 text-white backdrop-blur shadow-lg border border-indigo-400/30">📝 Tóm tắt</button>
                            </div>

                            {isAiProcessing && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-20">
                                    <LoadingSpinner size={8} />
                                    <p className="text-blue-300 mt-2 animate-pulse font-bold">AI đang suy nghĩ...</p>
                                </div>
                            )}
                        </div>

                        {/* AI RESULT DRAWER */}
                        {aiResult && (
                            <div className="p-4 bg-indigo-900/20 border-t border-indigo-500/30 animate-slide-up relative">
                                <button onClick={() => setAiResult(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white text-xs">✕</button>
                                <h4 className="text-xs font-bold text-indigo-300 uppercase mb-2">AI Suggestion</h4>
                                <div className="text-sm text-gray-200 bg-black/40 p-3 rounded-lg max-h-40 overflow-y-auto mb-2 whitespace-pre-wrap font-mono border border-white/5">
                                    {aiResult}
                                </div>
                                <button onClick={insertAiResult} className="btn btn-sm btn-secondary w-full text-xs border-indigo-500/50 text-indigo-200 hover:bg-indigo-500/20">
                                    📥 Chèn vào nội dung
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default NotebookPage;
