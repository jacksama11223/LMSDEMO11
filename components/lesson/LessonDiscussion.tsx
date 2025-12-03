
import React, { useState } from 'react';
import type { DiscussionPost, User } from '../../types';

interface LessonDiscussionProps {
    posts: DiscussionPost[];
    user: User | null;
    isServiceOk: boolean;
    onPost: (text: string) => void;
}

const LessonDiscussion: React.FC<LessonDiscussionProps> = ({ posts, user, isServiceOk, onPost }) => {
    const [newPost, setNewPost] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim() || !isServiceOk) return;
        onPost(newPost);
        setNewPost('');
    };

    return (
        <div className="card p-6">
            <h2 className="text-2xl font-semibold text-gray-200 mb-4">Thảo luận Bài học</h2>
            {!isServiceOk ? (
                <div className="text-center p-3 bg-gray-700 rounded-lg border border-yellow-700">
                    <p className="text-yellow-400 text-sm font-semibold">Dịch vụ diễn đàn đang bảo trì.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {user && (
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                            <input 
                                type="text" 
                                className="form-input flex-1" 
                                placeholder="Đặt câu hỏi hoặc chia sẻ suy nghĩ..." 
                                value={newPost} 
                                onChange={(e) => setNewPost(e.target.value)} 
                            />
                            <button type="submit" className="btn btn-primary self-start sm:self-center" disabled={!newPost.trim()}>Gửi</button>
                        </form>
                    )}
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {posts.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Chưa có thảo luận nào cho bài học này.</p>
                        ) : (
                            [...posts].reverse().map(post => (
                                <div key={post.id} className="p-3 bg-gray-800 rounded-lg shadow">
                                    <p className="font-semibold text-blue-300 text-sm">{post.user}</p>
                                    <p className="text-gray-300 mt-1">{post.text}</p>
                                    <p className="text-xs text-gray-500 text-right mt-1">
                                        {new Date(post.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonDiscussion;
