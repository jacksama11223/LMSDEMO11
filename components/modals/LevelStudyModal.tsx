
import React, { useState, useEffect, useContext, useCallback } from 'react';
import Modal from '../common/Modal';
import { AuthContext, DataContext } from '../../contexts/AppProviders';
import { generateNodeFlashcards, generateNodeExam, generateAdvancedPath } from '../../services/geminiService';
import type { LearningNode, Flashcard, ExamQuestion } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

interface LevelStudyModalProps {
    isOpen: boolean;
    onClose: () => void;
    pathId: string;
    node: LearningNode;
    isLastNode: boolean;
}

type StudyPhase = 'START' | 'GEN_FLASHCARDS' | 'STUDY_FLASHCARDS' | 'GEN_EXAM' | 'TAKE_EXAM' | 'RESULT' | 'EXTENDING_PATH';

const LevelStudyModal: React.FC<LevelStudyModalProps> = ({ isOpen, onClose, pathId, node, isLastNode }) => {
    const { user } = useContext(AuthContext)!;
    const { db, updateNodeProgress, unlockNextNode, extendLearningPath } = useContext(DataContext)!;
    
    const [phase, setPhase] = useState<StudyPhase>('START');
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [flashcardQueue, setFlashcardQueue] = useState<Flashcard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [masteredCount, setMasteredCount] = useState(node.flashcardsMastered || 0);
    const [isFlipped, setIsFlipped] = useState(false);

    const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
    const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
    const [examScore, setExamScore] = useState(0);
    
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setPhase('START');
            setMasteredCount(node.flashcardsMastered || 0);
            setExamScore(node.examScore || 0);
            setError(null);
        }
    }, [isOpen, node]);

    // --- PHASE 1: FLASHCARDS ---
    const startFlashcards = async () => {
        if (masteredCount >= 20) {
            setPhase('GEN_EXAM');
            return;
        }

        setPhase('GEN_FLASHCARDS');
        const apiKey = user ? db.USERS[user.id]?.apiKey : null;
        if (!apiKey) { setError("Vui lòng cấu hình API Key."); setPhase('START'); return; }

        try {
            const cards = await generateNodeFlashcards(apiKey, node.title, node.description);
            setFlashcards(cards);
            setFlashcardQueue(cards); // Initialize queue
            setPhase('STUDY_FLASHCARDS');
            setCurrentCardIndex(0);
            setIsFlipped(false);
        } catch (e) {
            setError("Lỗi tạo Flashcards. Vui lòng thử lại.");
            setPhase('START');
        }
    };

    const handleFlashcardResult = (difficulty: 'easy' | 'medium' | 'hard') => {
        const currentCard = flashcardQueue[currentCardIndex];
        let nextQueue = [...flashcardQueue];
        let newMasteredCount = masteredCount;

        if (difficulty === 'easy') {
            // Remove from queue, increment mastery
            nextQueue.splice(currentCardIndex, 1);
            newMasteredCount++;
            setMasteredCount(newMasteredCount);
            // Update Global State immediately
            updateNodeProgress(pathId, node.id, { flashcardsMastered: newMasteredCount });
        } else {
            // Move to end of queue
            nextQueue.push(nextQueue.splice(currentCardIndex, 1)[0]);
        }

        setFlashcardQueue(nextQueue);
        setIsFlipped(false);
        
        // Logic to proceed
        if (newMasteredCount >= 20) {
            alert("Chúc mừng! Bạn đã thuộc 20 thẻ. Mở khóa bài kiểm tra!");
            setPhase('GEN_EXAM');
            updateNodeProgress(pathId, node.id, { isExamUnlocked: true });
        } else if (nextQueue.length === 0) {
             // Should not happen if we keep pushing hard cards back, but safety check
             alert("Hết thẻ! Tạo thêm thẻ mới.");
             startFlashcards(); 
        } else {
            // If we removed a card, the current index might point to a new card naturally.
            // If we moved to back, we need to ensure index doesn't overflow if queue shrank? 
            // Actually, if we move to back, length stays same. If remove, length -1.
            // Safest is to reset index to 0 if we modified the list structure significantly or just keep it 0 since we are consuming a queue.
            setCurrentCardIndex(0);
        }
    };

    // --- PHASE 2: EXAM ---
    const startExam = async () => {
        setPhase('GEN_EXAM');
        const apiKey = user ? db.USERS[user.id]?.apiKey : null;
        if (!apiKey) { setError("Thiếu API Key."); return; }

        try {
            const questions = await generateNodeExam(apiKey, node.title);
            setExamQuestions(questions);
            setExamAnswers({});
            setPhase('TAKE_EXAM');
        } catch (e) {
            setError("Lỗi tạo bài kiểm tra.");
            setPhase('START');
        }
    };

    const submitExam = () => {
        let score = 0;
        examQuestions.forEach(q => {
            const userAns = (examAnswers[q.id] || "").trim().toLowerCase();
            const correct = q.correctAnswer.trim().toLowerCase();
            // Simple string matching. For MCQ, userAns is index string "0", correct is "0".
            if (userAns === correct) score++;
        });
        
        const percentage = (score / examQuestions.length) * 100;
        setExamScore(percentage);
        setPhase('RESULT');
        
        // Save Score
        updateNodeProgress(pathId, node.id, { examScore: percentage });

        if (percentage >= 40) {
             unlockNextNode(pathId, node.id);
        }
    };

    // --- PHASE 3: EXTENSION ---
    const handleExtension = async () => {
        setPhase('EXTENDING_PATH');
        const apiKey = user ? db.USERS[user.id]?.apiKey : null;
        if (!apiKey) return;

        try {
            const path = db.LEARNING_PATHS[pathId];
            const newNodes = await generateAdvancedPath(apiKey, path.title, node.title);
            extendLearningPath(pathId, newNodes);
            alert("Đã tạo lộ trình nâng cao thành công! Hãy tiếp tục học.");
            onClose();
        } catch (e) {
            setError("Lỗi tạo lộ trình nâng cao.");
            setPhase('RESULT');
        }
    };

    // --- RENDERERS ---

    const renderStart = () => (
        <div className="text-center space-y-6 py-8">
            <div className="text-6xl mb-4">🎓</div>
            <h2 className="text-2xl font-bold text-gray-200">Level: {node.title}</h2>
            <p className="text-gray-400 px-8">{node.description}</p>
            
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="card p-4 bg-gray-800 border-gray-700">
                    <p className="text-gray-400 text-sm">Flashcards</p>
                    <p className={`text-2xl font-bold ${masteredCount >= 20 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {masteredCount} / 20
                    </p>
                </div>
                <div className="card p-4 bg-gray-800 border-gray-700">
                    <p className="text-gray-400 text-sm">Bài kiểm tra</p>
                    <p className={`text-2xl font-bold ${(node.examScore || 0) >= 40 ? 'text-green-400' : 'text-gray-500'}`}>
                        {node.examScore ? `${node.examScore.toFixed(0)}%` : 'Chưa đạt'}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <button 
                    onClick={startFlashcards} 
                    className="btn btn-primary w-full max-w-xs mx-auto"
                    disabled={masteredCount >= 20}
                >
                    {masteredCount >= 20 ? '✅ Đã hoàn thành Flashcards' : '🧠 Học Flashcards (AI)'}
                </button>
                
                <button 
                    onClick={startExam} 
                    className={`btn w-full max-w-xs mx-auto ${masteredCount >= 20 ? 'btn-primary bg-purple-600 hover:bg-purple-500' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
                    disabled={masteredCount < 20}
                >
                    📝 Làm bài kiểm tra qua màn
                </button>
            </div>
            {masteredCount < 20 && <p className="text-xs text-yellow-500 mt-2">Thuộc 20 từ vựng để mở khóa bài kiểm tra.</p>}
        </div>
    );

    const renderFlashcardStudy = () => {
        const card = flashcardQueue[currentCardIndex];
        if (!card) return <div>Loading...</div>;

        return (
            <div className="flex flex-col items-center space-y-6 py-4">
                <h3 className="text-lg font-semibold text-gray-300">Học từ vựng ({masteredCount}/20 Mastered)</h3>
                <div 
                    className="relative w-full max-w-md h-64 cursor-pointer perspective-1000"
                    onClick={() => setIsFlipped(!isFlipped)}
                    style={{ perspective: '1000px' }}
                >
                    <div 
                        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                    >
                        {/* Front */}
                        <div className="absolute w-full h-full backface-hidden bg-gray-800 border border-gray-600 rounded-xl flex items-center justify-center p-8 text-center shadow-xl" style={{ backfaceVisibility: 'hidden' }}>
                            <h3 className="text-2xl font-bold text-gray-200">{card.front}</h3>
                            <p className="absolute bottom-4 text-gray-500 text-xs">Chạm để lật</p>
                        </div>
                        {/* Back */}
                        <div 
                            className="absolute w-full h-full backface-hidden bg-blue-900 border border-blue-700 rounded-xl flex items-center justify-center p-8 text-center shadow-xl"
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                            <p className="text-xl text-white">{card.back}</p>
                        </div>
                    </div>
                </div>
                
                {isFlipped && (
                    <div className="grid grid-cols-3 gap-2 w-full max-w-md">
                        <button onClick={() => handleFlashcardResult('hard')} className="btn bg-red-900/50 text-red-300 border border-red-800 hover:bg-red-900">Khó (Lặp lại)</button>
                        <button onClick={() => handleFlashcardResult('medium')} className="btn bg-yellow-900/50 text-yellow-300 border border-yellow-800 hover:bg-yellow-900">Bình thường</button>
                        <button onClick={() => handleFlashcardResult('easy')} className="btn bg-green-900/50 text-green-300 border border-green-800 hover:bg-green-900">Dễ (Master)</button>
                    </div>
                )}
            </div>
        );
    };

    const renderExam = () => (
        <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <h3 className="text-xl font-bold text-center text-gradient">Bài kiểm tra qua màn</h3>
            {examQuestions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="font-semibold text-gray-200 mb-3">{idx + 1}. {q.question}</p>
                    {q.type === 'mcq' && q.options && (
                        <div className="space-y-2">
                            {q.options.map((opt, oIdx) => (
                                <label key={oIdx} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-700">
                                    <input 
                                        type="radio" 
                                        name={q.id} 
                                        className="form-radio"
                                        checked={examAnswers[q.id] === String(oIdx)}
                                        onChange={() => setExamAnswers({...examAnswers, [q.id]: String(oIdx)})}
                                    />
                                    <span className="text-gray-300">{opt}</span>
                                </label>
                            ))}
                        </div>
                    )}
                    {(q.type === 'fill_gap' || q.type === 'short_answer') && (
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Nhập câu trả lời..."
                            value={examAnswers[q.id] || ''}
                            onChange={(e) => setExamAnswers({...examAnswers, [q.id]: e.target.value})}
                        />
                    )}
                </div>
            ))}
            <button onClick={submitExam} className="btn btn-primary w-full">Nộp bài</button>
        </div>
    );

    const renderResult = () => {
        const isPass = examScore >= 40;
        return (
            <div className="text-center py-8 space-y-6">
                <div className="text-6xl">{isPass ? '🎉' : '😢'}</div>
                <h2 className={`text-3xl font-bold ${isPass ? 'text-green-400' : 'text-red-500'}`}>
                    {isPass ? 'VƯỢT QUA!' : 'CHƯA ĐẠT'}
                </h2>
                <p className="text-gray-300 text-xl">Điểm số: {examScore.toFixed(0)}%</p>
                <p className="text-gray-400">Cần 40% để qua màn.</p>
                
                {isPass ? (
                    <div className="space-y-3">
                        <p className="text-green-300">Level tiếp theo đã được mở khóa!</p>
                        {isLastNode ? (
                            <div className="mt-6 p-4 border border-purple-500 bg-purple-900/20 rounded-lg">
                                <p className="font-bold text-purple-300 mb-2">Bạn đã hoàn thành tất cả level hiện tại!</p>
                                <button onClick={handleExtension} className="btn btn-primary bg-purple-600 hover:bg-purple-500 w-full">
                                    ✨ Nhờ AI tạo Lộ trình Nâng cao
                                </button>
                            </div>
                        ) : (
                            <button onClick={onClose} className="btn btn-primary w-full">Tiếp tục hành trình</button>
                        )}
                    </div>
                ) : (
                    <button onClick={() => setPhase('START')} className="btn btn-secondary w-full">Thử lại</button>
                )}
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Học tập: ${node.title}`} size="lg">
            {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded mb-4 text-center">{error}</div>}
            
            {phase === 'START' && renderStart()}
            
            {(phase === 'GEN_FLASHCARDS' || phase === 'GEN_EXAM' || phase === 'EXTENDING_PATH') && (
                <div className="text-center py-12">
                    <div className="flex justify-center mb-4"><LoadingSpinner size={8} /></div>
                    <p className="text-gray-300 animate-pulse">
                        {phase === 'EXTENDING_PATH' ? 'AI đang nghiên cứu lộ trình nâng cao...' : 'AI đang soạn nội dung cho bạn...'}
                    </p>
                </div>
            )}

            {phase === 'STUDY_FLASHCARDS' && renderFlashcardStudy()}
            {phase === 'TAKE_EXAM' && renderExam()}
            {phase === 'RESULT' && renderResult()}

        </Modal>
    );
};

export default LevelStudyModal;
