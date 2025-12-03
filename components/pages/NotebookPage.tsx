import React, { useState, useContext, useMemo, useEffect, useCallback, useRef } from 'react';
import { AuthContext, DataContext, GlobalStateContext } from '../../contexts/AppProviders';
import { enhanceNoteWithGemini } from '../../services/geminiService';
import LoadingSpinner from '../common/LoadingSpinner';
import type { PersonalNote } from '../../types';

// --- MARKDOWN HELPER ---
const insertTextAtCursor = (input: HTMLTextAreaElement, prefix: string, suffix: string) => {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + prefix + selection + suffix + after;
    
    // Calculate new cursor position
    const newCursorPos = selection.length === 0 ? start + prefix.length : end + prefix.length + suffix.length;

    return { newText, newCursorPos };
};

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
    
    // View Mode
    const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');

    // AI State
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [aiResult, setAiResult] = useState<string | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        if (selectedNoteId && selectedNoteId !== 'new' && db.PERSONAL_NOTES[selectedNoteId]) {
            const note = db.PERSONAL_NOTES[selectedNoteId];
            setTitle(note.title);
            setContent(note.content);
            setLinkedAssignmentId(note.linkedAssignmentId || '');
            setLinkedPathId(note.linkedPathId || '');
            setIsPinned(note.isPinned || false);
            setAiResult(null);
        } else if (selectedNoteId === 'new') {
            setTitle('');
            setContent('');
            setLinkedAssignmentId('');
            setLinkedPathId('');
            setIsPinned(false);
            setAiResult(null);
        }
    }, [selectedNoteId, db.PERSONAL_NOTES]);

    // --- HANDLERS ---

    const handleCreateNew = () => {
        setSelectedNoteId('new');
        // Default to split view for new notes
        setViewMode('split');
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
            setSelectedNoteId(null); 
        } else if (selectedNoteId) {
            updatePersonalNote(selectedNoteId, { title, content, linkedAssignmentId: links.assignmentId, linkedPathId: links.pathId, isPinned });
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

    // --- TOOLBAR ACTIONS ---
    const applySyntax = (prefix: string, suffix: string) => {
        if (textareaRef.current) {
            const { newText, newCursorPos } = insertTextAtCursor(textareaRef.current, prefix, suffix);
            setContent(newText);
            // We need to set focus and cursor position after render, simplified here
            setTimeout(() => {
                if(textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.selectionStart = newCursorPos;
                    textareaRef.current.selectionEnd = newCursorPos;
                }
            }, 0);
        }
    };

    const handleWikiLinkClick = (noteTitle: string) => {
        const targetNote = myNotes.find(n => n.title.toLowerCase() === noteTitle.toLowerCase());
        if (targetNote) {
            setSelectedNoteId(targetNote.id);
        } else {
            if(window.confirm(`Ghi chú "[[${noteTitle}]]" chưa tồn tại. Bạn có muốn tạo mới không?`)) {
                setSelectedNoteId('new');
                setTitle(noteTitle);
                setContent(`# ${noteTitle}\n\nĐược liên kết từ bài trước.`);
            }
        }
    };

    // --- MARKDOWN RENDERER (Obsidian Lite) ---
    const renderMarkdown = (text: string) => {
        if (!text) return <p className="text-gray-500 italic">Trống...</p>;

        return text.split('\n').map((line, index) => {
            // 1. Headings
            let renderedLine: React.ReactNode = line;
            let className = "text-gray-300 min-h-[1.5em]"; // Default text style

            if (line.startsWith('# ')) {
                className = "text-3xl font-bold text-white mt-4 mb-2 border-b border-gray-700 pb-1";
                renderedLine = line.substring(2);
            } else if (line.startsWith('## ')) {
                className = "text-2xl font-bold text-blue-200 mt-3 mb-2";
                renderedLine = line.substring(3);
            } else if (line.startsWith('### ')) {
                className = "text-xl font-bold text-purple-200 mt-2 mb-1";
                renderedLine = line.substring(4);
            } else if (line.startsWith('- ')) {
                className = "list-disc list-inside text-gray-300 ml-4";
                renderedLine = line.substring(2);
            }

            // Inline Parsing Logic
            const parseInline = (text: string): React.ReactNode[] => {
                const parts: React.ReactNode[] = [];
                let buffer = "";
                let i = 0;

                while (i < text.length) {
                    // Detect [[WikiLink]]
                    if (text.startsWith('[[', i)) {
                        if (buffer) parts.push(buffer); buffer = "";
                        const end = text.indexOf(']]', i);
                        if (end > -1) {
                            const linkContent = text.substring(i + 2, end);
                            // Check if link is valid (exists)
                            const exists = myNotes.some(n => n.title.toLowerCase() === linkContent.toLowerCase());
                            parts.push(
                                <span 
                                    key={i} 
                                    onClick={() => handleWikiLinkClick(linkContent)}
                                    className={`cursor-pointer transition-colors font-semibold ${exists ? 'text-blue-400 hover:underline' : 'text-gray-500 hover:text-gray-400'}`}
                                    title={exists ? "Đi đến ghi chú" : "Ghi chú chưa tồn tại"}
                                >
                                    [[{linkContent}]]
                                </span>
                            );
                            i = end + 2;
                            continue;
                        }
                    }
                    
                    // Detect ==Highlight==
                    if (text.startsWith('==', i)) {
                        if (buffer) parts.push(buffer); buffer = "";
                        const end = text.indexOf('==', i + 2);
                        if (end > -1) {
                            const highlightContent = text.substring(i + 2, end);
                            parts.push(
                                <mark key={i} className="bg-yellow-500/30 text-yellow-100 px-1 rounded mx-0.5">
                                    {highlightContent}
                                </mark>
                            );
                            i = end + 2;
                            continue;
                        }
                    }

                    // Detect **Bold**
                    if (text.startsWith('**', i)) {
                        if (buffer) parts.push(buffer); buffer = "";
                        const end = text.indexOf('**', i + 2);
                        if (end > -1) {
                            const boldContent = text.substring(i + 2, end);
                            parts.push(<strong key={i} className="text-white">{boldContent}</strong>);
                            i = end + 2;
                            continue;
                        }
                    }

                    buffer += text[i];
                    i++;
                }
                if (buffer) parts.push(buffer);
                return parts;
            };

            // If line is just string, parse it
            if (typeof renderedLine === 'string') {
                renderedLine = parseInline(renderedLine);
            }

            return <div key={index} className={className}>{renderedLine}</div>;
        });
    };

    if (!user) return null;

    return (
        <div className="h-[calc(100vh-100px)] flex gap-6 pb-4">
            {/* LEFT PANEL: LIST */}
            <div className="w-1/4 min-w-[250px] flex flex-col gap-4 hidden md:flex">
                <div className="p-4 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 flex items-center gap-2 mb-4">
                        <span>📓</span> Sổ Tay
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
                            <button onClick={() => setFilter('all')} className={`flex-1 text-[10px] font-bold py-1 rounded ${filter==='all' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`}>ALL</button>
                            <button onClick={() => setFilter('assignment')} className={`flex-1 text-[10px] font-bold py-1 rounded ${filter==='assignment' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`}>BÀI TẬP</button>
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
                                    {note.title || 'Không tiêu đề'}
                                </h3>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 font-mono">{note.content.substring(0, 50)}</p>
                        </div>
                    ))}
                    {myNotes.length === 0 && <p className="text-center text-gray-500 text-sm mt-4">Chưa có ghi chú nào.</p>}
                </div>
            </div>

            {/* RIGHT PANEL: OBSIDIAN EDITOR */}
            <div className="flex-1 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
                {!selectedNoteId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <div className="text-6xl mb-4 opacity-50">📝</div>
                        <p>Chọn một ghi chú hoặc tạo mới để bắt đầu.</p>
                        <button onClick={handleCreateNew} className="mt-4 btn btn-secondary">Tạo mới ngay</button>
                    </div>
                ) : (
                    <>
                        {/* HEADER & METADATA */}
                        <div className="p-4 border-b border-white/10 flex flex-col space-y-3 bg-white/5">
                            <div className="flex justify-between items-center">
                                <input 
                                    type="text" 
                                    className="bg-transparent text-xl font-bold text-white placeholder-gray-500 focus:outline-none w-full"
                                    placeholder="Tiêu đề ghi chú..."
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setIsPinned(!isPinned)}
                                        className={`p-2 rounded-lg transition-colors ${isPinned ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-500 hover:text-yellow-200'}`}
                                        title="Ghim ghi chú"
                                    >
                                        📌
                                    </button>
                                    <button onClick={handleSave} className="btn btn-sm btn-primary px-4">Lưu</button>
                                </div>
                            </div>
                            
                            {/* Toolbar & Metadata Row */}
                            <div className="flex justify-between items-center gap-4">
                                <div className="flex gap-2 items-center">
                                    {/* Formatting Toolbar */}
                                    <button onClick={() => applySyntax('# ', '')} className="btn-icon-xs text-lg font-bold" title="Heading 1">H1</button>
                                    <button onClick={() => applySyntax('## ', '')} className="btn-icon-xs text-base font-bold" title="Heading 2">H2</button>
                                    <div className="w-px h-4 bg-gray-700 mx-1"></div>
                                    <button onClick={() => applySyntax('**', '**')} className="btn-icon-xs font-bold" title="Bold">B</button>
                                    <button onClick={() => applySyntax('*', '*')} className="btn-icon-xs italic font-serif" title="Italic">I</button>
                                    <button onClick={() => applySyntax('==', '==')} className="btn-icon-xs bg-yellow-500/20 text-yellow-300 border-yellow-500/50" title="Highlight">HL</button>
                                    <div className="w-px h-4 bg-gray-700 mx-1"></div>
                                    <button onClick={() => applySyntax('[[', ']]')} className="btn-icon-xs text-blue-300" title="Internal Link">[[Link]]</button>
                                </div>

                                <div className="flex gap-2">
                                    <select 
                                        className="bg-black/30 text-xs text-gray-400 border border-white/10 rounded px-2 py-1 outline-none max-w-[120px]"
                                        value={linkedAssignmentId}
                                        onChange={e => setLinkedAssignmentId(e.target.value)}
                                    >
                                        <option value="">Liên kết Bài tập</option>
                                        {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                    </select>
                                    <select 
                                        className="bg-black/30 text-xs text-gray-400 border border-white/10 rounded px-2 py-1 outline-none max-w-[120px]"
                                        value={linkedPathId}
                                        onChange={e => setLinkedPathId(e.target.value)}
                                    >
                                        <option value="">Liên kết Lộ trình</option>
                                        {paths.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* VIEW MODE TOGGLE */}
                        <div className="flex border-b border-white/10 bg-gray-900/50">
                            <button onClick={() => setViewMode('edit')} className={`flex-1 py-1 text-xs font-bold uppercase tracking-wider ${viewMode === 'edit' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Edit Only</button>
                            <button onClick={() => setViewMode('split')} className={`flex-1 py-1 text-xs font-bold uppercase tracking-wider ${viewMode === 'split' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Split View</button>
                            <button onClick={() => setViewMode('preview')} className={`flex-1 py-1 text-xs font-bold uppercase tracking-wider ${viewMode === 'preview' ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Preview Only</button>
                        </div>

                        {/* MAIN CONTENT AREA */}
                        <div className="flex-1 flex overflow-hidden relative">
                            {/* Editor Pane */}
                            <div className={`flex-1 relative ${viewMode === 'preview' ? 'hidden' : ''} ${viewMode === 'split' ? 'border-r border-white/10' : ''}`}>
                                <textarea 
                                    ref={textareaRef}
                                    className="w-full h-full bg-transparent text-gray-200 resize-none outline-none font-mono text-sm leading-relaxed custom-scrollbar p-6"
                                    placeholder="Bắt đầu viết... (Hỗ trợ Markdown: # H1, **bold**, [[link]], ==highlight==)"
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                />
                                {isAiProcessing && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-20">
                                        <LoadingSpinner size={8} />
                                        <p className="text-blue-300 mt-2 animate-pulse font-bold">AI đang suy nghĩ...</p>
                                    </div>
                                )}
                            </div>

                            {/* Preview Pane */}
                            <div className={`flex-1 bg-gray-900/30 overflow-y-auto custom-scrollbar p-6 ${viewMode === 'edit' ? 'hidden' : ''}`}>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    {renderMarkdown(content)}
                                </div>
                            </div>

                            {/* AI TOOLBAR FLOATING (Only visible in edit modes) */}
                            {viewMode !== 'preview' && (
                                <div className="absolute bottom-4 left-4 flex gap-2 z-30">
                                    <button onClick={() => handleAiAction('fix')} disabled={isAiProcessing} className="btn btn-xs bg-indigo-600/80 hover:bg-indigo-500 text-white backdrop-blur shadow-lg border border-indigo-400/30">✨ Sửa lỗi</button>
                                    <button onClick={() => handleAiAction('expand')} disabled={isAiProcessing} className="btn btn-xs bg-indigo-600/80 hover:bg-indigo-500 text-white backdrop-blur shadow-lg border border-indigo-400/30">🔍 Mở rộng</button>
                                    <button onClick={() => handleAiAction('summarize')} disabled={isAiProcessing} className="btn btn-xs bg-indigo-600/80 hover:bg-indigo-500 text-white backdrop-blur shadow-lg border border-indigo-400/30">📝 Tóm tắt</button>
                                </div>
                            )}
                        </div>

                        {/* AI RESULT DRAWER */}
                        {aiResult && (
                            <div className="p-4 bg-indigo-900/20 border-t border-indigo-500/30 animate-slide-up relative flex-shrink-0 max-h-48 overflow-hidden flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-indigo-300 uppercase">AI Suggestion</h4>
                                    <button onClick={() => setAiResult(null)} className="text-gray-400 hover:text-white text-xs">✕</button>
                                </div>
                                <div className="text-sm text-gray-200 bg-black/40 p-3 rounded-lg overflow-y-auto whitespace-pre-wrap font-mono border border-white/5 flex-1 mb-2">
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
            
            <style>{`
                .btn-icon-xs {
                    @apply p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-transparent;
                }
            `}</style>
        </div>
    );
};

export default NotebookPage;