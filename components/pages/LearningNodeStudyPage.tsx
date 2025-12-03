
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext, DataContext, PageContext, GlobalStateContext } from '../../contexts/AppProviders';
import { generateNodeFlashcards, generateNodeExam, generateAdvancedPath } from '../../services/geminiService';
import type { Flashcard, ExamQuestion } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

interface LearningNodeStudyPageProps {
    pathId: string;
    nodeId: string;
    isLastNode: boolean;
}

type StudyPhase = 'START' | 'GEN_FLASHCARDS' | 'STUDY_FLASHCARDS' | 'GEN_EXAM' | 'TAKE_EXAM' | 'RESULT' | 'EXTENDING_PATH';

// --- SKIN ATMOSPHERE COMPONENT ---
const SkinAtmosphere: React.FC<{ skinId: string }> = ({ skinId }) => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {/* BASE ATMOSPHERE based on skin */}
            {skinId === 'skin_fire' && (
                <>
                    <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay"></div>
                    <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-red-900/30 to-transparent"></div>
                </>
            )}
             {skinId === 'skin_forest' && (
                <>
                    <div className="absolute inset-0 bg-green-900/10 mix-blend-overlay"></div>
                    {/* Fireflies - simplified using CSS classes from GlobalStyles if available or standard dots */}
                     <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400 rounded-full blur-[2px] animate-pulse"></div>
                     <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-yellow-300 rounded-full blur-[1px] animate-pulse" style={{ animationDelay: '1s'}}></div>
                </>
            )}
             {skinId === 'skin_neon' && (
                <>
                    <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay"></div>
                    <div className="absolute top-0 w-full h-px bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]"></div>
                    <div className="absolute bottom-0 w-full h-px bg-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.8)]"></div>
                </>
            )}
            {skinId === 'skin_galaxy' && (
                 <>
                    <div className="absolute inset-0 bg-indigo-900/20 mix-blend-overlay"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]"></div>
                 </>
            )}
        </div>
    );
}

const LearningNodeStudyPage: React.FC<LearningNodeStudyPageProps> = ({ pathId, nodeId, isLastNode }) => {
    const { user } = useContext(AuthContext)!;
    const { db, updateNodeProgress, unlockNextNode, extendLearningPath, checkDailyDiamondReward } = useContext(DataContext)!;
    const { navigate } = useContext(PageContext)!;
    const { setPage: setGlobalPage } = useContext(GlobalStateContext)!;
    
    const node = db.LEARNING_PATHS?.[pathId]?.nodes.find(n => n.id === nodeId);

    const [phase, setPhase] = useState<StudyPhase>('START');
    const [error, setError] = useState<string | null>(null);

    // Flashcard State
    const [flashcardQueue, setFlashcardQueue] = useState<Flashcard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [masteredCount, setMasteredCount] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);

    // Exam State (Duolingo Style)
    const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
    const [examResults, setExamResults] = useState<Record<string, boolean>>({}); // Track correct/incorrect per Q
    const [isAnswerChecked, setIsAnswerChecked] = useState(false); // Has user clicked "Check"?
    const [examScore, setExamScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [sessionXp, setSessionXp] = useState(0);

    // Skin State
    const equippedSkinId = db.GAMIFICATION.equippedSkin;
    const activeSkin = db.SHOP_ITEMS.find(i => i.id === equippedSkinId) || db.SHOP_ITEMS[0];

    useEffect(() => {
        if (node) {
            setMasteredCount(node.flashcardsMastered || 0);
            setExamScore(node.examScore || 0);
        }
    }, [node]);

    if (!node) return <div className="text-center p-8 text-white">Lỗi: Node không tồn tại.</div>;

    // --- UTILS ---
    const playSound = (type: 'correct' | 'wrong' | 'finish') => {
        // Placeholder for sound effects
    };

    // --- SRS LOGIC (Duolingo Style) ---
    const calculateNextReview = (currentBox: number, difficulty: 'easy' | 'medium' | 'hard'): { box: number, nextReview: number } => {
        const now = Date.now();
        const ONE_HOUR = 60 * 60 * 1000;
        const ONE_DAY = 24 * ONE_HOUR;

        if (difficulty === 'hard') {
            return { box: 0, nextReview: now }; // Immediate repeat
        } else if (difficulty === 'medium') {
            return { box: currentBox, nextReview: now }; // Repeat in session, keep progress
        } else {
            // Easy
            const newBox = currentBox + 1;
            let interval = 0;
            switch (newBox) {
                case 1: interval = 4 * ONE_HOUR; break;
                case 2: interval = 1 * ONE_DAY; break;
                case 3: interval = 3 * ONE_DAY; break;
                case 4: interval = 7 * ONE_DAY; break;
                case 5: interval = 14 * ONE_DAY; break;
                default: interval = 30 * ONE_DAY; break;
            }
            return { box: newBox, nextReview: now + interval };
        }
    };

    // --- ACTIONS ---

    const generateAndStartFlashcards = async (mode: 'new' | 'review') => {
        setPhase('GEN_FLASHCARDS');
        
        // 1. Check if we already have cards persisted in the node
        let existingCards = node.flashcards || [];
        let queue: Flashcard[] = [];

        // 2. If no cards exist, generate new ones using AI
        if (existingCards.length === 0) {
             const apiKey = user ? db.USERS[user.id]?.apiKey : null;
            if (!apiKey) { 
                setError("Vui lòng cấu hình API Key."); 
                setGlobalPage('api_key', { isApiKeyModalOpen: true });
                setPhase('START'); 
                return; 
            }

            try {
                const rawCards = await generateNodeFlashcards(apiKey, node.title, node.description);
                // Initialize SRS fields
                existingCards = rawCards.map(c => ({ ...c, box: 0, nextReview: 0 }));
                // Save to DB immediately
                updateNodeProgress(pathId, node.id, { flashcards: existingCards });
            } catch (e) {
                setError("Lỗi kết nối AI. Vui lòng thử lại.");
                setPhase('START');
                return;
            }
        }

        // 3. Filter cards for the current session based on Mode and SRS
        const now = Date.now();
        
        if (mode === 'new') {
            queue = existingCards.filter(c => c.nextReview <= now || c.box === 0);
            if (queue.length === 0) {
                // Fallback if all mastered: pick random to review anyway or pick hardest
                queue = existingCards.sort(() => 0.5 - Math.random()).slice(0, 10);
            }
        } else {
             queue = existingCards;
        }

        // 4. Initialize Session
        setFlashcardQueue(queue);
        setPhase('STUDY_FLASHCARDS');
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setSessionXp(0);
    };

    const startFlashcards = async () => {
        if (masteredCount >= 20) {
            // Note: User can still force start if they want, handled in UI logic
            // But if button is "Start", we proceed.
        }
        setIsReviewing(false);
        await generateAndStartFlashcards('new');
    };

    const reviewFlashcards = async () => {
        setIsReviewing(true);
        await generateAndStartFlashcards('review');
    };

    const handleFlashcardResult = (difficulty: 'easy' | 'medium' | 'hard') => {
        const currentCard = flashcardQueue[currentCardIndex];
        const nextQueue = [...flashcardQueue];
        
        const { box: newBox, nextReview } = calculateNextReview(currentCard.box || 0, difficulty);
        
        const updatedCard = { 
            ...currentCard, 
            box: newBox, 
            nextReview: nextReview,
            lastReviewed: Date.now() 
        };

        const fullList = node.flashcards.map(c => c.id === updatedCard.id ? updatedCard : c);
        
        const newMasteredCount = fullList.filter(c => c.box > 0).length;
        
        updateNodeProgress(pathId, node.id, { 
            flashcards: fullList,
            flashcardsMastered: newMasteredCount
        });
        setMasteredCount(newMasteredCount);

        let xpGain = 0;

        if (difficulty === 'easy') {
            // For 'easy', we consider it done for this session
            // REMOVED: nextQueue.splice(currentCardIndex, 1); 
            // FIX: Just move to next index, do NOT remove from queue yet if we want to show progress. 
            // BUT for queue logic, usually we remove 'done' items. 
            // Let's stick to "remove from queue" to empty it.
            nextQueue.splice(currentCardIndex, 1); 
            xpGain = 10;
            playSound('correct');
        } else {
            // Hard/Medium: Move to end of queue to repeat
            const cardToMove = nextQueue.splice(currentCardIndex, 1)[0];
            nextQueue.push(cardToMove);
            playSound('wrong');
        }
        
        setSessionXp(prev => prev + xpGain);
        setFlashcardQueue(nextQueue);
        setIsFlipped(false);
        
        // Logic: Only finish when queue is empty
        if (nextQueue.length === 0) {
             playSound('finish');
             const gotReward = checkDailyDiamondReward();
             if (gotReward) alert("💎 Chúc mừng! Bạn nhận được 5 Kim Cương cho buổi học hôm nay!");

             // If we hit the goal of 20 mastered for the first time, unlock exam
             if (!node.isExamUnlocked && newMasteredCount >= 20) {
                 updateNodeProgress(pathId, node.id, { isExamUnlocked: true });
                 alert("🎉 Bạn đã thuộc đủ 20 từ! Bài kiểm tra đã được mở khóa.");
             }

             alert("Bạn đã hoàn thành phiên học từ vựng!");
             setPhase('START');
        } else {
            // If we removed the item at index 0, the next item is now at index 0.
            // So index stays 0.
            setCurrentCardIndex(0);
        }
    };

    const startExam = async () => {
        setPhase('GEN_EXAM');
        const apiKey = user ? db.USERS[user.id]?.apiKey : null;
        if (!apiKey) { setError("Thiếu API Key."); setPhase('START'); return; }

        try {
            const questions = await generateNodeExam(apiKey, node.title);
            setExamQuestions(questions);
            setExamAnswers({});
            setExamResults({});
            setCurrentQuestionIndex(0);
            setIsAnswerChecked(false);
            setCombo(0);
            setSessionXp(0);
            setPhase('TAKE_EXAM');
        } catch (e) {
            setError("Lỗi tạo bài kiểm tra.");
            setPhase('START');
        }
    };

    const handleCheckAnswer = () => {
        const q = examQuestions[currentQuestionIndex];
        const userAns = (examAnswers[q.id] || "").trim().toLowerCase();
        const correct = q.correctAnswer.trim().toLowerCase();
        const isCorrect = userAns === correct;

        setExamResults(prev => ({ ...prev, [q.id]: isCorrect }));
        setIsAnswerChecked(true);

        if (isCorrect) {
            setCombo(prev => prev + 1);
            setSessionXp(prev => prev + 10 + (combo * 2)); // Bonus combo XP
            playSound('correct');
        } else {
            setCombo(0);
            playSound('wrong');
        }
    };

    const handleContinueExam = () => {
        if (currentQuestionIndex < examQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setIsAnswerChecked(false);
        } else {
            // Finish Exam
            const correctCount = Object.values(examResults).filter(Boolean).length;
            const percentage = (correctCount / examQuestions.length) * 100;
            setExamScore(percentage);
            setPhase('RESULT');
            updateNodeProgress(pathId, node.id, { examScore: percentage });
            if (percentage >= 40) {
                unlockNextNode(pathId, node.id);
            }
            playSound(percentage >= 40 ? 'finish' : 'wrong');
        }
    };

    const handleExtension = async () => {
        setPhase('EXTENDING_PATH');
        const apiKey = user ? db.USERS[user.id]?.apiKey : null;
        if (!apiKey) return;
        try {
            const path = db.LEARNING_PATHS[pathId];
            const newNodes = await generateAdvancedPath(apiKey, path.title, node.title);
            extendLearningPath(pathId, newNodes);
            navigate('learning_path_detail', { pathId });
        } catch (e) {
            setError("Lỗi tạo lộ trình nâng cao.");
            setPhase('RESULT');
        }
    };

    const handleBack = () => {
        // Navigation Logic
        if (phase === 'START' || phase === 'RESULT') {
            // If at Menu or Result -> Go back to Tree (Level Selection)
            navigate('learning_path_detail', { pathId });
        } else {
            // If studying -> Go back to Menu (Start Screen of this Node)
            if (window.confirm("Bạn đang học dở. Bạn có chắc muốn thoát về menu bài học không?")) {
                setPhase('START');
            }
        }
    };

    // --- UI COMPONENTS ---

    const renderHeader = (title: string, subtitle?: string) => (
        <div className="flex justify-between items-center mb-6 px-4 relative z-10">
            <button 
                onClick={handleBack}
                className="group w-auto px-4 h-12 rounded-full flex items-center justify-center bg-white/10 border border-white/20 text-white hover:bg-red-500/20 hover:border-red-400 hover:text-red-200 hover:shadow-[0_0_20px_rgba(248,113,113,0.5)] transition-all duration-300 backdrop-blur-md"
            >
                <span className="font-bold mr-2">&larr;</span>
                <span className="font-medium text-sm">Quay lại {phase === 'START' ? 'Lộ trình' : 'Menu Level'}</span>
            </button>
            <div className="flex flex-col items-center">
                <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 uppercase tracking-wider filter drop-shadow-lg">{title}</h2>
                {subtitle && <span className="text-xs text-blue-200">{subtitle}</span>}
            </div>
            <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <span className="text-lg animate-pulse">💎</span>
                <span className="text-blue-300 font-bold text-sm">{sessionXp} XP</span>
            </div>
        </div>
    );

    const renderProgressBar = (current: number, total: number) => (
        <div className="w-full bg-gray-800/50 h-4 rounded-full mb-6 relative overflow-hidden border border-white/10 backdrop-blur-sm z-10">
            <div 
                className="bg-gradient-to-r from-green-400 to-emerald-600 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                style={{ width: `${((current + 1) / total) * 100}%` }}
            >
                <div className="absolute top-0 left-0 w-full h-full bg-white opacity-30 animate-shimmer"></div>
            </div>
        </div>
    );

    const renderStart = () => (
        <div className="flex flex-col items-center justify-center min-h-[600px] space-y-8 animate-pop-in relative">
            <button 
                onClick={handleBack}
                className="absolute top-0 left-0 group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-blue-200 hover:bg-blue-500/20 hover:text-white hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 backdrop-blur-md"
            >
                <span>&larr;</span> <span>Quay lại Lộ trình</span>
            </button>

            <div className="relative mt-12">
                <div className="text-9xl animate-bounce-subtle filter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">🎓</div>
                {(node.examScore || 0) >= 40 && <div className="absolute -bottom-2 -right-2 text-5xl animate-pulse">👑</div>}
            </div>
            
            <div className="text-center space-y-2 z-10">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-blue-200 tracking-tight drop-shadow-lg">{node.title}</h1>
                <p className="text-xl text-blue-100/80 max-w-lg mx-auto">{node.description}</p>
            </div>
            
            <div className="w-full max-w-md space-y-4 z-10">
                {/* Progress Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 backdrop-blur-lg p-4 rounded-3xl border border-white/10 flex flex-col items-center hover:bg-white/10 transition-colors">
                        <span className="text-3xl mb-1">🧠</span>
                        <span className="text-blue-200 text-xs uppercase font-bold tracking-wider">Từ vựng</span>
                        <span className={`text-2xl font-black mt-1 ${masteredCount >= 20 ? 'text-green-400' : 'text-yellow-400'}`}>{masteredCount}/20</span>
                    </div>
                    <div className="bg-white/5 backdrop-blur-lg p-4 rounded-3xl border border-white/10 flex flex-col items-center hover:bg-white/10 transition-colors">
                        <span className="text-3xl mb-1">📝</span>
                        <span className="text-blue-200 text-xs uppercase font-bold tracking-wider">Kiểm tra</span>
                        <span className={`text-2xl font-black mt-1 ${(node.examScore || 0) >= 40 ? 'text-green-400' : 'text-gray-400'}`}>
                            {node.examScore ? `${node.examScore.toFixed(0)}%` : '--'}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-4 pt-6">
                    {masteredCount < 20 ? (
                        <button onClick={startFlashcards} className="btn btn-primary w-full text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.8)] hover:scale-[1.02] transition-all">
                            🚀 Bắt đầu Học Từ Vựng
                        </button>
                    ) : (
                        <button onClick={reviewFlashcards} className="btn w-full text-lg py-4 rounded-2xl border-2 border-blue-400 text-blue-100 hover:bg-blue-500/20 hover:border-blue-300 transition-all">
                            🔄 Ôn tập lại Từ vựng
                        </button>
                    )}

                    <button 
                        onClick={startExam} 
                        disabled={masteredCount < 20}
                        className={`btn w-full text-lg py-4 rounded-2xl transition-all ${masteredCount >= 20 ? 'btn-success text-white shadow-[0_0_20px_rgba(5,150,105,0.5)] hover:scale-[1.02]' : 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700'}`}
                    >
                        {masteredCount >= 20 ? '⚔️ Làm bài Kiểm tra' : '🔒 Khóa Kiểm tra (Cần thuộc 20 thẻ)'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderFlashcardPhase = () => {
        const card = flashcardQueue[currentCardIndex];
        if (!card) return <div className="text-center mt-20 text-white">Đang tải dữ liệu...</div>;
        
        // Use skin css class
        const skinClass = activeSkin ? activeSkin.cssClass : 'bg-gray-800 border-gray-600';

        return (
            <div className="max-w-lg mx-auto w-full h-full flex flex-col relative">
                <SkinAtmosphere skinId={equippedSkinId} />
                
                {renderHeader(isReviewing ? "Ôn tập (SRS)" : "Học từ mới", `${flashcardQueue.length} thẻ còn lại`)}
                
                <div className="flex-1 flex flex-col items-center justify-center perspective-1000 min-h-[400px] z-10">
                    <div 
                        className="relative w-full h-80 cursor-pointer group perspective-1000"
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                            {/* Front */}
                            <div className={`absolute inset-0 backface-hidden backdrop-blur-xl border rounded-[2rem] flex flex-col items-center justify-center p-8 shadow-[0_0_30px_rgba(0,0,0,0.3)] group-hover:scale-[1.02] transition-transform ${skinClass}`} style={{ backfaceVisibility: 'hidden' }}>
                                <h3 className="text-4xl font-bold mb-4 text-center drop-shadow-md">{card.front}</h3>
                                <p className="opacity-60 text-xs uppercase tracking-[0.2em] font-bold mt-auto animate-pulse">Chạm để lật</p>
                                {card.box !== undefined && <span className="absolute top-4 right-4 text-xs opacity-50 font-mono">Box: {card.box}</span>}
                            </div>
                            {/* Back */}
                            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-600 to-indigo-700 border border-white/20 rounded-[2rem] flex flex-col items-center justify-center p-8 shadow-[0_0_40px_rgba(37,99,235,0.4)] rotate-y-180" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                <p className="text-2xl text-white font-medium text-center leading-relaxed drop-shadow-md">{card.back}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`grid grid-cols-3 gap-4 mt-8 transition-opacity duration-300 z-10 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button onClick={() => handleFlashcardResult('hard')} className="btn bg-red-500/20 text-red-200 border border-red-500/50 hover:bg-red-500 hover:text-white py-4 text-sm rounded-2xl backdrop-blur-md shadow-lg">
                        Khó (Lặp lại)
                    </button>
                     <button onClick={() => handleFlashcardResult('medium')} className="btn bg-yellow-500/20 text-yellow-200 border border-yellow-500/50 hover:bg-yellow-500 hover:text-white py-4 text-sm rounded-2xl backdrop-blur-md shadow-lg">
                        Bình thường
                    </button>
                    <button onClick={() => handleFlashcardResult('easy')} className="btn bg-green-500/20 text-green-200 border border-green-500/50 hover:bg-green-500 hover:text-white py-4 text-sm rounded-2xl backdrop-blur-md shadow-lg">
                        Dễ (Qua)
                    </button>
                </div>
            </div>
        );
    };

    const renderExamPhase = () => {
        const q = examQuestions[currentQuestionIndex];
        if (!q) return <div className="text-center mt-20 text-white">Đang tải bài thi...</div>;

        const isCorrect = examResults[q.id];
        const hasAnswered = !!examAnswers[q.id];
        
        return (
            <div className="max-w-2xl mx-auto w-full flex flex-col min-h-screen pb-24">
                <SkinAtmosphere skinId={equippedSkinId} />
                
                {renderHeader("Kiểm tra kiến thức")}
                {renderProgressBar(currentQuestionIndex, examQuestions.length)}
                
                {combo > 1 && (
                    <div className="absolute top-20 right-4 animate-pop-in flex flex-col items-center rotate-12 z-20">
                        <span className="text-5xl filter drop-shadow-lg">🔥</span>
                        <span className="text-orange-400 font-black text-xl italic bg-black/80 px-3 py-1 rounded-xl border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]">{combo} COMBO!</span>
                    </div>
                )}

                <div className="flex-1 relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-8 leading-snug drop-shadow-md">{q.question}</h2>

                    <div className="space-y-4">
                        {q.type === 'mcq' && q.options?.map((opt, idx) => {
                            const isSelected = examAnswers[q.id] === String(idx);
                            let optionClass = "bg-white/5 border-white/10 hover:bg-white/10"; // Default
                            
                            if (isAnswerChecked) {
                                if (String(idx) === q.correctAnswer) optionClass = "bg-green-500/20 border-green-500 text-green-200 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                                else if (isSelected) optionClass = "bg-red-500/20 border-red-500 text-red-200";
                                else optionClass = "opacity-50 bg-black/20 border-transparent";
                            } else if (isSelected) {
                                optionClass = "bg-blue-500/20 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-[1.01]";
                            }

                            return (
                                <button 
                                    key={idx} 
                                    onClick={() => !isAnswerChecked && setExamAnswers({...examAnswers, [q.id]: String(idx)})}
                                    disabled={isAnswerChecked}
                                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 backdrop-blur-md flex items-center ${optionClass}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg border-2 mr-4 flex items-center justify-center font-bold text-sm ${isSelected ? 'border-blue-400 bg-blue-500 text-white' : 'border-gray-500 text-gray-400'}`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="text-lg font-medium">{opt}</span>
                                </button>
                            );
                        })}

                        {(q.type === 'fill_gap' || q.type === 'short_answer') && (
                            <div className="relative">
                                <input 
                                    type="text" 
                                    disabled={isAnswerChecked}
                                    className={`w-full p-5 bg-white/5 border-2 rounded-2xl text-white text-xl outline-none focus:border-blue-400 focus:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all backdrop-blur-md ${
                                        isAnswerChecked 
                                            ? (isCorrect ? 'border-green-500 text-green-300' : 'border-red-500 text-red-300') 
                                            : 'border-white/20'
                                    }`}
                                    placeholder="Nhập đáp án..."
                                    value={examAnswers[q.id] || ''}
                                    onChange={(e) => setExamAnswers({...examAnswers, [q.id]: e.target.value})}
                                />
                                {isAnswerChecked && !isCorrect && (
                                    <div className="mt-4 p-4 bg-green-900/20 rounded-xl border border-green-500/50 backdrop-blur-md">
                                        <p className="text-green-400 font-bold text-sm uppercase tracking-wider">Đáp án đúng:</p>
                                        <p className="text-white text-lg font-medium">{q.correctAnswer}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions with Smart Feedback */}
                <div className={`fixed bottom-0 left-0 w-full p-4 border-t border-white/10 backdrop-blur-xl z-30 transition-colors duration-300 ${
                    isAnswerChecked 
                        ? (isCorrect ? 'bg-green-900/30' : 'bg-red-900/30') 
                        : 'bg-gray-900/60'
                }`}>
                    <div className="max-w-2xl mx-auto">
                        {isAnswerChecked ? (
                            <div className="flex flex-col animate-pop-in space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-lg flex-shrink-0 ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {isCorrect ? '✓' : '✕'}
                                    </div>
                                    <div>
                                        <p className={`font-black text-2xl ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                            {isCorrect ? 'CHÍNH XÁC!' : 'SAI RỒI'}
                                        </p>
                                        {isCorrect && <p className="text-sm text-green-200 font-medium">+XP Bonus!</p>}
                                    </div>
                                </div>
                                
                                {/* EXPLANATION AREA */}
                                {q.explanation && (
                                    <div className="bg-black/30 p-3 rounded-lg border border-white/10 text-gray-200 text-sm italic">
                                        💡 {q.explanation}
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <button onClick={handleContinueExam} className={`btn px-10 py-3 text-lg rounded-full shadow-lg font-bold tracking-wide ${isCorrect ? 'btn-success' : 'btn-danger'}`}>
                                        TIẾP TỤC
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full flex justify-end">
                                <button 
                                    onClick={handleCheckAnswer} 
                                    disabled={!hasAnswered}
                                    className="btn btn-primary px-10 py-3 text-lg w-full sm:w-auto rounded-full font-bold tracking-wide shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                                >
                                    KIỂM TRA
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderResult = () => {
        const isPass = examScore >= 40;
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] space-y-8 text-center animate-pop-in relative z-10">
                 <div className="text-9xl mb-4 animate-bounce filter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">{isPass ? '🎉' : '💔'}</div>
                 
                 <div className="space-y-2">
                     <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 uppercase tracking-tight">
                        {isPass ? 'Hoàn thành!' : 'Cố lên!'}
                     </h2>
                     <p className={`text-2xl font-medium ${isPass ? 'text-green-400' : 'text-red-400'}`}>
                        {isPass ? 'Bạn đã vượt qua bài kiểm tra.' : 'Bạn cần ôn tập thêm.'}
                     </p>
                 </div>

                 <div className="grid grid-cols-2 gap-6 w-full max-w-md mt-8">
                    <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10">
                        <p className="text-blue-200 text-xs uppercase font-bold tracking-wider">Độ chính xác</p>
                        <p className={`text-4xl font-black mt-2 ${isPass ? 'text-green-400' : 'text-red-400'}`}>{examScore.toFixed(0)}%</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10">
                        <p className="text-blue-200 text-xs uppercase font-bold tracking-wider">XP nhận được</p>
                        <p className="text-4xl font-black text-yellow-400 mt-2">+{sessionXp}</p>
                    </div>
                 </div>

                 <div className="flex flex-col space-y-4 w-full max-w-sm pt-10">
                    {isPass ? (
                         isLastNode ? (
                            <button onClick={handleExtension} className="btn btn-primary bg-gradient-to-r from-purple-600 to-pink-600 border-none hover:scale-105 w-full py-4 text-lg rounded-2xl shadow-[0_0_30px_rgba(192,38,211,0.5)] font-bold">
                                ✨ Mở khóa Level tiếp theo (AI)
                            </button>
                        ) : (
                            <button onClick={() => navigate('learning_path_detail', { pathId })} className="btn btn-primary w-full py-4 text-lg rounded-2xl font-bold shadow-lg">
                                Tiếp tục hành trình
                            </button>
                        )
                    ) : (
                        <button onClick={() => setPhase('START')} className="btn btn-secondary w-full py-4 text-lg rounded-2xl border-2 border-white/20 font-bold hover:bg-white/10">
                            Thử lại ngay
                        </button>
                    )}
                 </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto min-h-screen pb-12 px-4">
            {error && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl z-50 animate-bounce border-2 border-white">
                    ⚠️ {error}
                </div>
            )}

            {(phase === 'GEN_FLASHCARDS' || phase === 'GEN_EXAM' || phase === 'EXTENDING_PATH') ? (
                <div className="flex flex-col items-center justify-center h-[600px]">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                        <LoadingSpinner size={16} />
                    </div>
                    <p className="text-2xl text-blue-200 mt-10 animate-pulse font-bold tracking-wider uppercase">
                        {phase === 'EXTENDING_PATH' ? 'Đang mở rộng bản đồ...' : 'AI đang chuẩn bị bài học...'}
                    </p>
                </div>
            ) : (
                <>
                    {phase === 'START' && renderStart()}
                    {phase === 'STUDY_FLASHCARDS' && renderFlashcardPhase()}
                    {phase === 'TAKE_EXAM' && renderExamPhase()}
                    {phase === 'RESULT' && renderResult()}
                </>
            )}
        </div>
    );
};

export default LearningNodeStudyPage;
