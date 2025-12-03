
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { VideoNote } from '../../types';

interface VideoNotesSidebarProps {
    notes: VideoNote[];
    currentTime: number;
    onSeek: (seconds: number) => void;
    onAddNote: (text: string) => void;
    onDeleteNote: (noteId: string) => void;
    onInputFocus: () => void;
}

const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const VideoNotesSidebar: React.FC<VideoNotesSidebarProps> = ({ 
    notes, currentTime, onSeek, onAddNote, onDeleteNote, onInputFocus 
}) => {
    const [noteText, setNoteText] = useState('');
    const notesContainerRef = useRef<HTMLDivElement>(null);

    // Logic to determine active note
    const activeNoteId = useMemo(() => {
        if (!notes || notes.length === 0) return null;
        let mostRecentNoteId = null;
        // Find the last note whose timestamp is before or at the current video time
        for (const note of notes) {
            if (note.timestamp <= currentTime) {
                mostRecentNoteId = note.id;
            } else {
                break; // Notes are sorted, so we can stop
            }
        }
        return mostRecentNoteId;
    }, [notes, currentTime]);

    // Scroll to active note
    useEffect(() => {
        if (activeNoteId && notesContainerRef.current) {
            const activeEl = notesContainerRef.current.querySelector(`[data-note-id="${activeNoteId}"]`);
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [activeNoteId]);

    const handleExportNotes = () => {
        if (notes.length === 0) {
            alert("Chưa có ghi chú nào để xuất.");
            return;
        }
        const title = document.querySelector('h1')?.textContent || 'video_notes';
        const content = notes.map(n => `[${formatTime(n.timestamp)}] ${n.text}`).join('\n');
        const element = document.createElement("a");
        const file = new Blob([content], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `${title.replace(/ /g, '_')}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteText.trim()) return;
        onAddNote(noteText);
        setNoteText('');
    };

    return (
        <div className="card p-4 flex flex-col h-[calc(100vh-200px)] max-h-[700px] sticky top-8">
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-200">📝 Ghi chú Video</h2>
                <button onClick={handleExportNotes} className="text-xs text-blue-400 hover:text-blue-300 underline" disabled={notes.length === 0}>Xuất .txt</button>
            </div>
            
            <div ref={notesContainerRef} className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-1">
                {notes.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 border border-dashed border-gray-600 rounded-lg h-full flex flex-col justify-center items-center">
                        <p>Chưa có ghi chú nào.</p>
                        <p className="text-xs mt-1">Hãy bấm vào ô bên dưới để bắt đầu ghi!</p>
                    </div>
                ) : (
                    notes.map(note => (
                        <div 
                            key={note.id} 
                            data-note-id={note.id}
                            className={`p-3 rounded-lg border transition-all duration-300 group relative ${
                                activeNoteId === note.id 
                                ? 'bg-blue-900/40 border-blue-400 shadow-lg scale-[1.02]' 
                                : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/80'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <button 
                                    onClick={() => onSeek(note.timestamp)}
                                    className={`font-mono font-bold text-sm hover:underline px-2 py-0.5 rounded transition-colors ${
                                        activeNoteId === note.id ? 'bg-blue-500 text-white' : 'bg-gray-700 text-blue-400'
                                    }`}
                                >
                                    {formatTime(note.timestamp)}
                                </button>
                                <button onClick={() => onDeleteNote(note.id)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-lg leading-none p-1 -mt-1 -mr-1">&times;</button>
                            </div>
                            <p className="text-gray-300 text-sm mt-2 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="mt-auto pt-4 border-t border-gray-700 flex-shrink-0">
                <div className="mb-2 flex justify-between items-center">
                    <span className="text-xs text-gray-400">Thời gian hiện tại:</span>
                    <span className="text-sm font-mono font-bold text-green-400 bg-gray-900 px-2 py-0.5 rounded">{formatTime(currentTime)}</span>
                </div>
                <textarea 
                    className="form-textarea mb-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-900" 
                    rows={3} 
                    placeholder="Nhập ghi chú (Video sẽ tự dừng)..." 
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onFocus={onInputFocus}
                />
                <button type="submit" className="btn btn-primary w-full text-sm font-semibold" disabled={!noteText.trim()}>
                    + Lưu Ghi chú
                </button>
            </form>
        </div>
    );
};

export default VideoNotesSidebar;
