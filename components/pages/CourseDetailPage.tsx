
import React, { useContext, useMemo, useState } from 'react';
import { AuthContext, DataContext, GlobalStateContext, PageContext } from '../../contexts/AppProviders';
import FlashcardModal from '../modals/FlashcardModal';
import type { ModuleItem as ModuleItemType, FlashcardDeck } from '../../types';

interface CourseDetailPageProps {
    courseId: string;
}

const CourseDetailPage: React.FC<CourseDetailPageProps> = ({ courseId }) => {
    const { db } = useContext(DataContext)!;
    const { user } = useContext(AuthContext)!;
    const { navigate } = useContext(PageContext)!;
    const { serviceStatus } = useContext(GlobalStateContext)!;

    const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
    const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);

    const isContentServiceOk = serviceStatus.content_delivery === 'OPERATIONAL';
    const isAssessmentTakingOk = serviceStatus.assessment_taking === 'OPERATIONAL';

    const course = useMemo(() => db.COURSES.find(c => c.id === courseId), [db.COURSES, courseId]);
    const structure = useMemo(() => db.COURSE_STRUCTURE[courseId], [db.COURSE_STRUCTURE, courseId]);

    // --- Logic tính toán Trạng thái Hoàn thành & Khóa (Level Locking) ---
    const { itemStatus } = useMemo(() => {
        const statusMap: Record<string, 'LOCKED' | 'AVAILABLE' | 'DONE'> = {};
        
        if (!structure || !user) return { itemStatus: statusMap };

        let previousItemDone = true; // Item đầu tiên luôn mở

        structure.modules.forEach(module => {
            module.items.forEach(item => {
                let isDone = false;
                
                // Check completion based on type
                if (item.type === 'lesson') {
                    // Lesson done if inside LESSON_PROGRESS
                    isDone = db.LESSON_PROGRESS?.[user.id]?.includes(item.id) || false;
                } else if (item.type === 'assignment') {
                    const asg = db.ASSIGNMENTS[item.id];
                    if (asg) {
                         if (asg.type === 'file') {
                            const sub = db.FILE_SUBMISSIONS[asg.id]?.find(s => s.studentId === user.id);
                            isDone = sub?.status === 'Đã nộp';
                        } else if (asg.type === 'quiz' && asg.quizId) {
                            const sub = db.QUIZ_SUBMISSIONS[asg.quizId]?.[user.id];
                            isDone = !!sub; // Đã làm quiz là tính xong
                        }
                    }
                }

                if (isDone) {
                    statusMap[item.id] = 'DONE';
                    previousItemDone = true;
                } else if (previousItemDone) {
                    statusMap[item.id] = 'AVAILABLE';
                    previousItemDone = false; // Item này chưa xong, chặn item sau
                } else {
                    statusMap[item.id] = 'LOCKED';
                    previousItemDone = false;
                }
            });
        });
        return { itemStatus: statusMap };
    }, [structure, user, db.LESSON_PROGRESS, db.FILE_SUBMISSIONS, db.QUIZ_SUBMISSIONS, db.ASSIGNMENTS]);


    const handleOpenFlashcard = (moduleId: string) => {
        const deckId = Object.keys(db.FLASHCARD_DECKS).find(key => db.FLASHCARD_DECKS[key].moduleId === moduleId);
        if (deckId) {
            setSelectedDeck(db.FLASHCARD_DECKS[deckId]);
            setIsFlashcardOpen(true);
        } else {
            alert("Chưa có bộ thẻ nhớ cho chương này.");
        }
    };

    const renderTimelineItem = (item: ModuleItemType, isLast: boolean) => {
        const status = itemStatus[item.id] || 'LOCKED';
        const isLocked = status === 'LOCKED';
        const isDone = status === 'DONE';

        let title = "Unknown Item";
        let icon = "❓";
        let subText = "";

        if (item.type === 'lesson') {
            const lesson = db.LESSONS[item.id];
            title = lesson?.title || item.id;
            icon = lesson?.type === 'video' ? '🎥' : '📄';
            subText = "Bài học";
        } else if (item.type === 'assignment') {
            const asg = db.ASSIGNMENTS[item.id];
            title = asg?.title || item.id;
            icon = asg?.type === 'quiz' ? '⚡' : '📝';
            subText = "Bài tập";
        }

        return (
            <div key={item.id} className={`relative flex items-start mb-8 ${isLast ? '' : ''}`}>
                {/* Line connecting nodes */}
                {!isLast && (
                    <div className={`absolute left-6 top-10 w-0.5 h-full -ml-px ${isDone ? 'bg-blue-500 shadow-[0_0_10px_#3B82F6]' : 'bg-gray-700'}`} aria-hidden="true"></div>
                )}

                {/* Status Node */}
                <div className={`relative flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-full border-4 z-10 transition-all duration-300
                    ${isDone ? 'bg-blue-900 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 
                      isLocked ? 'bg-gray-800 border-gray-700 text-gray-500 grayscale' : 
                      'bg-gray-800 border-yellow-500 text-yellow-400 animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.5)]'}`}>
                    {isLocked ? '🔒' : (isDone ? '✅' : icon)}
                </div>

                {/* Content Card */}
                <div className={`ml-6 flex-1 card p-4 transition-all duration-300 ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 hover:translate-x-1'}`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className={`text-lg font-semibold ${isLocked ? 'text-gray-500' : 'text-white'}`}>{title}</h4>
                            <p className="text-sm text-gray-400">{subText}</p>
                        </div>
                        {!isLocked && (
                            <button 
                                onClick={() => {
                                    if (item.type === 'lesson') navigate('lesson', { lessonId: item.id });
                                    else if (item.type === 'assignment') navigate(user?.role === 'TEACHER' ? 'gradebook' : 'assignment_viewer', { assignmentId: item.id });
                                }}
                                className={`btn ${isDone ? 'btn-secondary text-xs' : 'btn-primary shadow-lg'}`}
                            >
                                {isDone ? 'Xem lại' : 'Bắt đầu'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (!course || !structure) return <div className="p-6 text-center">Không tìm thấy khóa học.</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button 
                        onClick={() => navigate('dashboard')} 
                        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-300 hover:bg-blue-500/20 hover:text-white hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 backdrop-blur-md w-fit mb-4"
                    >
                        <span>&larr;</span> <span className="font-medium">Quay lại</span>
                    </button>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">{course.name}</h1>
                    <p className="text-gray-400 mt-1">Giáo viên: <span className="text-blue-300">{course.teacher}</span></p>
                </div>
            </div>

            {/* Learning Path */}
            <div className="space-y-12">
                {structure.modules.map((module) => (
                    <div key={module.id} className="relative">
                        <div className="flex items-center justify-between mb-6 bg-black/30 backdrop-blur-xl p-5 rounded-2xl border border-white/10 sticky top-4 z-20 shadow-xl">
                            <h2 className="text-xl font-bold text-white">{module.name}</h2>
                            
                            {/* Flashcard Button for Module */}
                            {db.FLASHCARD_DECKS && (Object.values(db.FLASHCARD_DECKS) as FlashcardDeck[]).some(d => d.moduleId === module.id) && (
                                <button 
                                    onClick={() => handleOpenFlashcard(module.id)}
                                    className="btn btn-secondary text-sm border-purple-500 text-purple-300 hover:bg-purple-500/20 hover:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                >
                                    🧠 Ôn tập Flashcards
                                </button>
                            )}
                        </div>

                        <div className="pl-4 md:pl-8 border-l border-gray-800 ml-6 md:ml-10">
                            {module.items.map((item, index) => renderTimelineItem(item, index === module.items.length - 1))}
                        </div>
                    </div>
                ))}
            </div>

            <FlashcardModal 
                isOpen={isFlashcardOpen} 
                onClose={() => setIsFlashcardOpen(false)} 
                deck={selectedDeck} 
            />
        </div>
    );
};

export default CourseDetailPage;
