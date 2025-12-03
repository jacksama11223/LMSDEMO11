
import React, { useState, useContext, useCallback } from 'react';
import { AuthContext, DataContext, GlobalStateContext, PageContext } from '../../contexts/AppProviders';
import { generateLearningPathWithGemini, generatePlacementTest } from '../../services/geminiService';
import LoadingSpinner from '../common/LoadingSpinner';
import DuolingoTree from '../common/DuolingoTree';
import type { LearningNode, PlacementTestQuestion } from '../../types';

type Step = 'TOPIC' | 'SURVEY' | 'LEVEL_CHOICE' | 'TEST' | 'GENERATING' | 'PREVIEW';

const LearningPathCreatorPage: React.FC = () => {
    const { user } = useContext(AuthContext)!;
    const { db, createLearningPath } = useContext(DataContext)!;
    const { navigate } = useContext(PageContext)!;
    const { serviceStatus, setPage: setGlobalPage } = useContext(GlobalStateContext)!;

    // -- State --
    const [step, setStep] = useState<Step>('TOPIC');
    
    // Step 1: Topic
    const [mode, setMode] = useState<'topic' | 'content'>('topic');
    const [inputText, setInputText] = useState('');
    const [title, setTitle] = useState('');

    // Step 2: Survey
    const [goal, setGoal] = useState('');
    const [timeCommitment, setTimeCommitment] = useState('');

    // Step 3: Level & Test
    const [level, setLevel] = useState('Beginner');
    const [testQuestions, setTestQuestions] = useState<PlacementTestQuestion[]>([]);
    const [testAnswers, setTestAnswers] = useState<Record<string, number>>({});

    // Step 4: Gen
    const [generatedNodes, setGeneratedNodes] = useState<LearningNode[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAiOk = serviceStatus.ai_assistant_service === 'OPERATIONAL';

    // -- Handlers --

    const openApiKeyModal = () => setGlobalPage('api_key', { isApiKeyModalOpen: true });

    const handleStartTest = async () => {
        const apiKey = user ? db.USERS[user.id]?.apiKey : null;
        if (!apiKey) { setError("API Key Required"); openApiKeyModal(); return; }

        setIsLoading(true);
        setError(null);
        try {
            const qs = await generatePlacementTest(apiKey, inputText);
            setTestQuestions(qs);
            setStep('TEST');
        } catch (e) {
            setError("Lỗi tạo bài test.");
        } finally {
            setIsLoading(false);
        }
    };

    const submitTest = () => {
        let correct = 0;
        testQuestions.forEach(q => {
            if (testAnswers[q.id] === q.correctAnswer) correct++;
        });
        const score = (correct / testQuestions.length) * 100;
        
        let detectedLevel = 'Beginner';
        if (score > 80) detectedLevel = 'Advanced';
        else if (score > 40) detectedLevel = 'Intermediate';
        
        setLevel(detectedLevel);
        alert(`Bạn đạt ${score.toFixed(0)}%. Hệ thống đề xuất trình độ: ${detectedLevel}`);
        handleGeneratePath(detectedLevel);
    };

    const handleGeneratePath = async (targetLevel: string) => {
        setStep('GENERATING');
        const apiKey = user ? db.USERS[user.id]?.apiKey : null;
        if (!apiKey) { setError("API Key Required"); return; }

        setIsLoading(true);
        try {
            const context = { level: targetLevel, goal, time: timeCommitment };
            const nodes = await generateLearningPathWithGemini(apiKey, inputText, mode === 'content', context);
            setGeneratedNodes(nodes);
            setStep('PREVIEW');
        } catch (e) {
            setError("Lỗi tạo lộ trình.");
            setStep('TOPIC'); // Reset on error
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = useCallback(() => {
        if (!user || generatedNodes.length === 0) return;
        createLearningPath(
            user.id, 
            title, 
            inputText.substring(0, 50), 
            generatedNodes, 
            { level, goal, time: timeCommitment }
        );
        alert("Đã lưu lộ trình thành công!");
        navigate('assignment_hub');
    }, [user, generatedNodes, title, inputText, level, goal, timeCommitment, createLearningPath, navigate]);


    // -- Renders --

    if (!isAiOk) {
        return (
            <div className="card p-8 text-center border border-yellow-700">
                <h2 className="text-xl font-bold text-yellow-400">Dịch vụ AI đang bảo trì</h2>
                <button onClick={() => navigate('assignment_hub')} className="btn btn-secondary mt-4">Quay lại</button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <button onClick={() => navigate('assignment_hub')} className="text-sm text-blue-400 hover:underline">&larr; Quay lại Hub</button>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${
                    step === 'TOPIC' ? '20%' : 
                    step === 'SURVEY' ? '40%' : 
                    step === 'LEVEL_CHOICE' ? '60%' : 
                    step === 'TEST' ? '80%' : '100%'
                }` }}></div>
            </div>

            {/* STEP 1: TOPIC */}
            {step === 'TOPIC' && (
                <div className="card p-8 animate-fade-in-up">
                    <h1 className="text-3xl font-bold text-gradient mb-6">1. Bạn muốn học gì?</h1>
                    <div className="space-y-4">
                        <div className="flex space-x-4 border-b border-gray-700 pb-2">
                            <button onClick={() => setMode('topic')} className={`pb-2 font-semibold transition-colors ${mode === 'topic' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500'}`}>Chủ đề</button>
                            <button onClick={() => setMode('content')} className={`pb-2 font-semibold transition-colors ${mode === 'content' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500'}`}>Nội dung</button>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">Tên Lộ trình</label>
                            <input type="text" className="form-input w-full" placeholder="VD: Tiếng Anh Du lịch" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">{mode === 'topic' ? 'Chủ đề chi tiết' : 'Dán nội dung'}</label>
                            <textarea className="form-textarea w-full" rows={4} placeholder={mode === 'topic' ? "VD: Giao tiếp cơ bản, đặt phòng khách sạn..." : "Paste văn bản..."} value={inputText} onChange={e => setInputText(e.target.value)} />
                        </div>
                        <button onClick={() => { if(title && inputText) setStep('SURVEY'); else alert("Nhập đủ thông tin"); }} className="btn btn-primary w-full mt-4">Tiếp theo &rarr;</button>
                    </div>
                </div>
            )}

            {/* STEP 2: SURVEY */}
            {step === 'SURVEY' && (
                <div className="card p-8 animate-fade-in-up">
                    <h1 className="text-3xl font-bold text-gradient mb-6">2. Mục tiêu của bạn?</h1>
                    
                    <p className="text-gray-300 mb-4">Tại sao bạn học chủ đề này?</p>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {['💼 Công việc', '✈️ Du lịch', '🧠 Luyện não', '🎓 Trường học', '🚀 Sở thích'].map(g => (
                            <button key={g} onClick={() => setGoal(g)} className={`p-4 rounded-xl border-2 text-left transition-all ${goal === g ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 hover:border-gray-500'}`}>
                                {g}
                            </button>
                        ))}
                    </div>

                    <p className="text-gray-300 mb-4">Thời gian cam kết mỗi ngày?</p>
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {['5 phút', '10 phút', '15 phút', '30 phút'].map(t => (
                            <button key={t} onClick={() => setTimeCommitment(t)} className={`p-3 rounded-xl border-2 transition-all ${timeCommitment === t ? 'border-green-500 bg-green-900/30' : 'border-gray-700 hover:border-gray-500'}`}>
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between">
                        <button onClick={() => setStep('TOPIC')} className="text-gray-400">Quay lại</button>
                        <button onClick={() => { if(goal && timeCommitment) setStep('LEVEL_CHOICE'); else alert("Vui lòng chọn mục tiêu"); }} className="btn btn-primary">Tiếp theo &rarr;</button>
                    </div>
                </div>
            )}

            {/* STEP 3: LEVEL CHOICE */}
            {step === 'LEVEL_CHOICE' && (
                <div className="card p-8 animate-fade-in-up text-center space-y-8">
                    <h1 className="text-3xl font-bold text-gradient">3. Trình độ hiện tại?</h1>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button onClick={() => { setLevel('Beginner'); handleGeneratePath('Beginner'); }} className="p-8 rounded-3xl border-2 border-gray-700 hover:border-blue-400 hover:bg-blue-900/10 transition-all group">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🐣</div>
                            <h3 className="text-xl font-bold text-white">Tôi mới bắt đầu</h3>
                            <p className="text-gray-400 mt-2">Học từ con số 0.</p>
                        </button>

                        <button onClick={handleStartTest} className="p-8 rounded-3xl border-2 border-gray-700 hover:border-purple-400 hover:bg-purple-900/10 transition-all group">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🧠</div>
                            <h3 className="text-xl font-bold text-white">Đã biết chút ít?</h3>
                            <p className="text-gray-400 mt-2">Làm bài test để phân loại.</p>
                        </button>
                    </div>
                    
                    {isLoading && <div className="mt-4"><LoadingSpinner size={6} /><p className="text-sm text-gray-400 mt-2">Đang tạo bài test...</p></div>}
                    {error && <p className="text-red-400">{error}</p>}
                </div>
            )}

            {/* STEP 4: TEST */}
            {step === 'TEST' && (
                <div className="card p-8 animate-fade-in-up">
                    <h1 className="text-2xl font-bold text-white mb-6">Kiểm tra trình độ</h1>
                    <div className="space-y-8">
                        {testQuestions.map((q, idx) => (
                            <div key={q.id} className="p-4 bg-gray-800 rounded-lg">
                                <p className="font-semibold mb-3">{idx+1}. {q.question}</p>
                                <div className="space-y-2">
                                    {q.options.map((opt, oIdx) => (
                                        <label key={oIdx} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-700 rounded">
                                            <input 
                                                type="radio" 
                                                name={q.id} 
                                                checked={testAnswers[q.id] === oIdx} 
                                                onChange={() => setTestAnswers({...testAnswers, [q.id]: oIdx})}
                                                className="form-radio"
                                            />
                                            <span>{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button onClick={submitTest} className="btn btn-primary w-full">Nộp bài & Tạo Lộ trình</button>
                    </div>
                </div>
            )}

            {/* GENERATING */}
            {step === 'GENERATING' && (
                <div className="flex flex-col items-center justify-center h-96">
                    <LoadingSpinner size={12} />
                    <h2 className="text-2xl font-bold text-white mt-8 animate-pulse">AI đang thiết kế lộ trình cho bạn...</h2>
                    <p className="text-gray-400 mt-2">Dựa trên: {level} • {goal}</p>
                </div>
            )}

            {/* PREVIEW */}
            {step === 'PREVIEW' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="card p-6 bg-green-900/20 border-green-800 text-center">
                        <h3 className="text-xl font-bold text-green-400 mb-2">Lộ trình đã sẵn sàng!</h3>
                        <button onClick={handleSave} className="btn btn-primary w-full bg-green-600 hover:bg-green-500">
                            💾 Lưu Lộ trình & Bắt đầu học
                        </button>
                    </div>
                    <div className="card p-6 bg-gray-900/50">
                         <DuolingoTree nodes={generatedNodes} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearningPathCreatorPage;
