
import React, { useState, useContext, useMemo, useCallback } from 'react';
import { AuthContext, DataContext, GlobalStateContext, PageContext } from '../../contexts/AppProviders';
import type { Assignment, LearningPath } from '../../types';

// --- HELPER: RANK LOGIC ---
const getQuestRank = (asg: Assignment) => {
    if (asg.type === 'quiz') {
        // Giả lập: Quiz luôn khó hơn -> Rank A hoặc S
        return Math.random() > 0.5 ? 'S' : 'A';
    }
    return 'B'; // File assignment -> Rank B
};

const getRankColor = (rank: string) => {
    switch (rank) {
        case 'S': return 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] bg-yellow-900/20';
        case 'A': return 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] bg-purple-900/20';
        case 'B': return 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)] bg-blue-900/20';
        default: return 'border-gray-600 bg-gray-800/50';
    }
};

const getRankBadge = (rank: string) => {
    switch (rank) {
        case 'S': return { label: 'LEGENDARY', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400' };
        case 'A': return { label: 'EPIC', color: 'text-purple-400 bg-purple-400/10 border-purple-400' };
        case 'B': return { label: 'RARE', color: 'text-blue-400 bg-blue-400/10 border-blue-400' };
        default: return { label: 'COMMON', color: 'text-gray-400 bg-gray-400/10 border-gray-400' };
    }
};

// --- COMPONENT: WEEKLY CHEST ---
const WeeklyChest: React.FC<{ activeDays: number }> = ({ activeDays }) => {
    return (
        <div className="card p-4 bg-gradient-to-r from-gray-900 to-slate-900 border border-gray-700 relative overflow-hidden">
            <div className="flex justify-between items-center mb-2 relative z-10">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Tiến độ Tuần</h3>
                <span className="text-xs text-yellow-400 font-mono">{activeDays}/7 Ngày</span>
            </div>
            <div className="flex justify-between items-center relative z-10">
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                    <div key={day} className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                            day <= activeDays 
                            ? 'bg-green-500 border-green-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
                            : 'bg-gray-800 border-gray-600 text-gray-600'
                        }`}>
                            {day <= activeDays ? '✓' : day}
                        </div>
                    </div>
                ))}
                <div className="ml-2 animate-bounce-subtle cursor-pointer group">
                    <div className={`text-4xl filter drop-shadow-lg transition-transform group-hover:scale-110 ${activeDays >= 7 ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                        🎁
                    </div>
                </div>
            </div>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -z-0"></div>
        </div>
    );
};

// --- COMPONENT: AI COMMANDER ---
const AiCommander: React.FC<{ recommendedTask: any, onClick: () => void }> = ({ recommendedTask, onClick }) => {
    if (!recommendedTask) return (
        <div className="card p-6 flex items-center gap-4 border-blue-500/30 bg-blue-900/10">
            <div className="text-4xl">😴</div>
            <div>
                <h3 className="font-bold text-blue-200">Không có nhiệm vụ!</h3>
                <p className="text-sm text-gray-400">Bạn đã hoàn thành xuất sắc mọi thứ.</p>
            </div>
        </div>
    );

    return (
        <div className="card p-0 border-indigo-500/50 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 z-0"></div>
            <div className="p-6 relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 p-[2px] animate-spin-slow">
                        <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                            <span className="text-4xl animate-pulse">🤖</span>
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-900">COMMANDER</div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-indigo-300 text-xs font-bold tracking-[0.2em] uppercase mb-1">Nhiệm vụ Ưu tiên</h3>
                    <p className="text-xl font-bold text-white mb-2">"{recommendedTask.title}"</p>
                    <p className="text-sm text-gray-300">Phát hiện nhiệm vụ Rank <span className="text-yellow-400 font-bold">{getQuestRank(recommendedTask)}</span> chưa hoàn thành. Hãy xử lý ngay để nhận thưởng!</p>
                </div>

                <button onClick={onClick} className="btn btn-primary bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] whitespace-nowrap animate-pulse">
                    ⚔️ Chấp nhận
                </button>
            </div>
        </div>
    );
};

const AssignmentHubPage: React.FC = () => {
    const { user } = useContext(AuthContext)!;
    const { db } = useContext(DataContext)!;
    const { navigate } = useContext(PageContext)!;
    const { serviceStatus } = useContext(GlobalStateContext)!;
    const [tab, setTab] = useState<'quests' | 'paths' | 'manage' | 'create'>('quests'); 

    const isStudentServiceOk = serviceStatus.assessment_taking === 'OPERATIONAL';
    const isTeacherGradingOk = serviceStatus.grading_service === 'OPERATIONAL';
    const isTeacherCourseOk = serviceStatus.course_management === 'OPERATIONAL';

    React.useEffect(() => {
        if (user?.role === 'TEACHER' && tab === 'quests') setTab('manage');
        if (user?.role === 'STUDENT' && (tab === 'manage' || tab === 'create')) setTab('quests');
    }, [user?.role]);

    const { allAssignments, studentTodo, studentDone, learningPaths } = useMemo(() => {
        const assignments = Object.values(db.ASSIGNMENTS) as Assignment[];
        const paths = Object.values(db.LEARNING_PATHS || {});

        let todo: any[] = [];
        let done: any[] = [];
        if (user?.role === 'STUDENT') {
            assignments.forEach(asg => {
                let sub: any;
                let isDone = false;
                if (asg.type === 'file') {
                    sub = db.FILE_SUBMISSIONS[asg.id]?.find(s => s.studentId === user.id);
                    isDone = sub && sub.status === 'Đã nộp';
                } else if (asg.type === 'quiz' && asg.quizId) {
                    sub = db.QUIZ_SUBMISSIONS[asg.quizId]?.[user.id];
                    isDone = !!sub;
                }
                const item = { ...asg, sub, rank: getQuestRank(asg) }; // Attach Rank
                if (isDone) done.push(item);
                else todo.push(item);
            });
        }
        
        // Sort todo by Rank (S -> A -> B)
        todo.sort((a, b) => a.rank.localeCompare(b.rank));

        return { allAssignments: assignments, studentTodo: todo, studentDone: done, learningPaths: paths };
    }, [db.ASSIGNMENTS, db.FILE_SUBMISSIONS, db.QUIZ_SUBMISSIONS, db.LEARNING_PATHS, user]);

    const handleOpenPath = (pathId: string) => {
        navigate('learning_path_detail', { pathId });
    };

    // Render a single "Quest Card"
    const renderQuestCard = useCallback((asg: any, isDone: boolean) => {
        const rankColor = getRankColor(asg.rank);
        const badge = getRankBadge(asg.rank);
        const xpReward = asg.rank === 'S' ? 500 : asg.rank === 'A' ? 300 : 100;

        return (
            <div key={asg.id} className={`card p-0 flex flex-col border-2 transition-all duration-300 group hover:-translate-y-2 hover:shadow-2xl ${rankColor} ${isDone ? 'opacity-60 grayscale' : ''}`}>
                {/* Card Header */}
                <div className="p-4 border-b border-white/5 flex justify-between items-start">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${badge.color}`}>
                        RANK {asg.rank}
                    </span>
                    <span className="text-xs font-bold text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
                        {db.COURSES.find(c => c.id === asg.courseId)?.name || asg.courseId}
                    </span>
                </div>
                
                {/* Card Body */}
                <div className="p-6 flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors line-clamp-2">{asg.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>{asg.type === 'quiz' ? '⚡ Trắc nghiệm' : '📄 Nộp File'}</span>
                        <span>•</span>
                        <span className="text-yellow-400 font-bold">+{xpReward} XP</span>
                    </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 bg-black/20 flex justify-between items-center">
                    <span className="text-xs text-gray-500">{isDone ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</span>
                    <button
                        onClick={() => navigate(user?.role === 'TEACHER' ? 'gradebook' : 'assignment_viewer', { assignmentId: asg.id })}
                        className={`btn btn-sm text-xs px-4 py-2 rounded-lg shadow-lg ${isDone ? 'btn-secondary' : 'btn-primary'}`}
                        disabled={user?.role === 'STUDENT' ? !isStudentServiceOk : !isTeacherGradingOk}
                    >
                        {user?.role === 'TEACHER' ? 'Chấm điểm' : (isDone ? 'Xem lại' : '⚔️ Chiến ngay')}
                    </button>
                </div>
            </div>
        );
    }, [db.COURSES, user?.role, navigate, isStudentServiceOk, isTeacherGradingOk]);

    const NavButton = ({ id, label, icon, count }: { id: string, label: string, icon: string, count?: number }) => (
        <button 
            onClick={() => setTab(id as any)} 
            className={`relative px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                tab === id 
                ? 'text-white shadow-[0_0_20px_rgba(56,189,248,0.5)] bg-gradient-to-r from-blue-600 to-purple-600 scale-105 ring-2 ring-white/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
        >
            <span>{icon}</span> {label} 
            {count !== undefined && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${tab === id ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-500'}`}>{count}</span>}
        </button>
    );

    return (
        <div className="space-y-8 pb-20">
            {/* HEADER TITLE */}
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-purple-300 filter drop-shadow-lg uppercase tracking-tight">
                {user?.role === 'TEACHER' ? 'Trung Tâm Quản Lý' : 'Hội Quán Nhiệm Vụ'}
            </h1>

            {/* DASHBOARD WIDGETS (STUDENT) */}
            {user?.role === 'STUDENT' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
                    <div className="lg:col-span-2">
                        <AiCommander 
                            recommendedTask={studentTodo[0]} // Top ranked todo
                            onClick={() => studentTodo[0] && navigate('assignment_viewer', { assignmentId: studentTodo[0].id })} 
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <WeeklyChest activeDays={4} /> {/* Mock data for active days */}
                    </div>
                </div>
            )}

            {/* TABS */}
            <div className="flex flex-wrap gap-3 p-2 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 w-fit shadow-2xl sticky top-24 z-30 mx-auto">
                {user?.role === 'TEACHER' ? (
                    <>
                        <NavButton id="manage" label="Quản lý Bài tập" icon="📋" count={allAssignments.length} />
                        <NavButton id="create" label="Tạo mới" icon="✨" />
                    </>
                ) : (
                    <NavButton id="quests" label="Bảng Nhiệm vụ" icon="📜" count={studentTodo.length} />
                )}
                <NavButton id="paths" label="Bản đồ Lộ trình" icon="🗺️" count={learningPaths.length} />
            </div>

            {/* CONTENT AREA */}
            <div className="animate-fade-in-up">
                
                {/* TAB: QUESTS (STUDENT) */}
                {user?.role === 'STUDENT' && tab === 'quests' && (
                    <div className="space-y-12">
                        {studentTodo.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <span className="text-yellow-400">⚠️</span> Nhiệm vụ Cần làm
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {studentTodo.map(asg => renderQuestCard(asg, false))}
                                </div>
                            </div>
                        )}
                        
                        {studentDone.length > 0 && (
                            <div className="opacity-80">
                                <h2 className="text-2xl font-bold text-gray-400 mb-6 flex items-center gap-2">
                                    <span>✅</span> Lịch sử Hoàn thành
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {studentDone.map(asg => renderQuestCard(asg, true))}
                                </div>
                            </div>
                        )}

                        {studentTodo.length === 0 && studentDone.length === 0 && (
                            <div className="text-center p-12 border-2 border-dashed border-gray-700 rounded-3xl">
                                <div className="text-6xl mb-4">zzz</div>
                                <p className="text-gray-500">Chưa có nhiệm vụ nào được giao.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: MANAGE (TEACHER) */}
                {user?.role === 'TEACHER' && tab === 'manage' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allAssignments.length > 0 ? allAssignments.map(asg => renderQuestCard({...asg, rank: 'B'}, false)) : <p className="text-gray-400 italic col-span-full text-center">Chưa có bài tập nào.</p>}
                    </div>
                )}

                {/* TAB: CREATE (TEACHER) */}
                {user?.role === 'TEACHER' && tab === 'create' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <button onClick={() => navigate('assignment_creator', { type: 'file' })} className="card p-8 text-center hover:bg-white/5 hover:scale-105 transition-all group border-blue-500/30">
                            <div className="text-6xl mb-4 group-hover:rotate-12 transition-transform">📄</div>
                            <h2 className="text-2xl font-bold text-white">Nộp File</h2>
                            <p className="text-gray-400 mt-2">Sinh viên nộp tài liệu văn bản.</p>
                        </button>
                        <button onClick={() => navigate('assignment_creator', { type: 'quiz' })} className="card p-8 text-center hover:bg-white/5 hover:scale-105 transition-all group border-purple-500/30">
                            <div className="text-6xl mb-4 group-hover:rotate-12 transition-transform">⚡</div>
                            <h2 className="text-2xl font-bold text-white">Quiz AI</h2>
                            <p className="text-gray-400 mt-2">Trắc nghiệm chấm điểm tự động.</p>
                        </button>
                        <button onClick={() => navigate('learning_path_creator')} className="card p-8 text-center hover:bg-white/5 hover:scale-105 transition-all group border-green-500/30 bg-green-900/10">
                            <div className="text-6xl mb-4 group-hover:rotate-12 transition-transform">🌳</div>
                            <h2 className="text-2xl font-bold text-green-400">Lộ trình Cây</h2>
                            <p className="text-gray-400 mt-2">Tạo bản đồ học tập gamification.</p>
                        </button>
                    </div>
                )}

                {/* TAB: PATHS (BOTH) */}
                {tab === 'paths' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Bản đồ Lộ trình</h2>
                                <p className="text-gray-400 text-sm">Các hành trình học tập dài hạn được thiết kế riêng.</p>
                            </div>
                            {user?.role === 'STUDENT' && (
                                <button onClick={() => navigate('learning_path_creator')} className="btn btn-primary bg-emerald-600 hover:bg-emerald-500 border-none shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse">
                                    ✨ Khởi tạo Lộ trình Mới
                                </button>
                            )}
                        </div>
                        
                        {learningPaths.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {learningPaths.map(path => {
                                    const completedNodes = path.nodes.filter(n => n.isCompleted).length;
                                    const totalNodes = path.nodes.length;
                                    const progress = (completedNodes / totalNodes) * 100;

                                    return (
                                        <div key={path.id} className="card p-0 flex flex-col justify-between group overflow-hidden border-emerald-500/30 bg-emerald-900/10 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:-translate-y-2 transition-all">
                                            <div className="h-32 bg-gradient-to-br from-emerald-800 to-teal-900 relative p-6 flex flex-col justify-end">
                                                <div className="absolute top-4 right-4 text-4xl opacity-20 group-hover:opacity-40 transition-opacity rotate-12">🗺️</div>
                                                <h2 className="text-xl font-black text-white uppercase tracking-wide drop-shadow-md">{path.title}</h2>
                                                <span className="text-xs font-bold text-emerald-200 bg-black/20 px-2 py-1 rounded w-fit mt-1">{path.topic}</span>
                                            </div>
                                            
                                            <div className="p-6 flex-1 space-y-4">
                                                <div className="flex justify-between text-sm text-gray-300">
                                                    <span>Tiến độ thám hiểm</span>
                                                    <span className="font-bold text-emerald-400">{Math.round(progress)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700">
                                                    <div className="bg-gradient-to-r from-emerald-400 to-green-500 h-full rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                                </div>
                                                <p className="text-xs text-gray-500">Created by: {path.creatorId}</p>
                                            </div>
                                            
                                            <div className="p-4 bg-black/20 border-t border-white/5">
                                                <button onClick={() => handleOpenPath(path.id)} className="btn w-full bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold shadow-lg border-none">
                                                    {progress === 0 ? '🚀 Khởi hành' : '▶️ Tiếp tục'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-gray-500 text-lg">Chưa có lộ trình nào được thiết lập.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
export default AssignmentHubPage;
