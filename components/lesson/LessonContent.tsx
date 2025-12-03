
import React, { useState, useEffect } from 'react';

interface LessonContentProps {
    content: string;
    type: 'video' | 'text';
    isTeacher: boolean;
    isServiceOk: boolean;
    onSave: (newContent: string) => void;
}

const LessonContent: React.FC<LessonContentProps> = ({ content, type, isTeacher, isServiceOk, onSave }) => {
    const [localContent, setLocalContent] = useState(content);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setLocalContent(content);
    }, [content]);

    if (!isServiceOk && type === 'text') {
        return (
            <div className="text-center p-12 m-6">
                <div className="p-4 bg-gray-800 border border-yellow-700 rounded-lg">
                    <h2 className="text-xl font-bold text-yellow-400 mb-2">Dịch vụ Nội dung đang Bảo trì</h2>
                    <p className="text-gray-400 text-sm">Không thể tải nội dung bài học lúc này.</p>
                </div>
            </div>
        );
    }

    if (type === 'video') return null; // Video is handled by the parent player

    return (
        <div className="p-6 md:p-8">
            {isTeacher && !isEditing && (
                <div className="mb-4">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn btn-secondary"
                        disabled={!isServiceOk}
                    >
                        Chỉnh sửa Nội dung
                    </button>
                </div>
            )}
            {isEditing ? (
                <div className="space-y-4">
                    <textarea 
                        className="form-textarea h-96 font-mono text-sm" 
                        value={localContent} 
                        onChange={(e) => setLocalContent(e.target.value)} 
                    />
                    <div className="flex space-x-3">
                        <button 
                            onClick={() => { onSave(localContent); setIsEditing(false); }} 
                            className="btn btn-primary"
                        >
                            Lưu
                        </button>
                        <button 
                            onClick={() => { setIsEditing(false); setLocalContent(content); }} 
                            className="btn btn-secondary"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            ) : (
                <div 
                    className="prose prose-invert max-w-none prose-lg" 
                    dangerouslySetInnerHTML={{ __html: localContent.replace(/\n/g, '<br />') }} 
                />
            )}
        </div>
    );
};

export default LessonContent;
