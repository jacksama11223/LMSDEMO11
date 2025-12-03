
import React, { useContext, useMemo } from 'react';
import { AuthContext, DataContext, PageContext } from '../../contexts/AppProviders';
import { Task } from '../../types';

const TaskArchivePage: React.FC = () => {
    const { user } = useContext(AuthContext)!;
    const { db, deleteTask } = useContext(DataContext)!;
    const { navigate } = useContext(PageContext)!;

    const archivedTasks = useMemo(() => {
        if (!user) return [];
        return Object.values(db.TASKS)
            .filter(t => t.userId === user.id && t.isArchived)
            .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());
    }, [db.TASKS, user]);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <button 
                onClick={() => navigate('dashboard')} 
                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-300 hover:bg-blue-500/20 hover:text-white hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 backdrop-blur-md w-fit"
            >
                <span>&larr;</span> <span className="font-medium">Quay lại Dashboard</span>
            </button>

            <div className="card p-8 bg-gray-900/50 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-3xl">🗄️</div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Lưu trữ Task</h1>
                        <p className="text-gray-400 text-sm">Các nhiệm vụ đã hoàn thành và được lưu trữ.</p>
                    </div>
                </div>

                {archivedTasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>Chưa có nhiệm vụ nào được lưu trữ.</p>
                        <p className="text-xs mt-2">Hoàn thành task trong Pomodoro và nhấn "Lưu trữ" để xem tại đây.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {archivedTasks.map(task => (
                            <div key={task.id} className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                                <div>
                                    <p className="text-gray-300 font-medium line-through decoration-gray-500 decoration-2">{task.text}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Hoàn thành: {task.completedAt ? new Date(task.completedAt).toLocaleString() : 'Unknown'}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => { if(window.confirm('Xóa vĩnh viễn task này?')) deleteTask(task.id); }}
                                    className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Xóa vĩnh viễn"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskArchivePage;
