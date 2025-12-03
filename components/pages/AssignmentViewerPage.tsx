
import React, { useState, useContext, useMemo, useCallback } from 'react';
import { AuthContext, DataContext, GlobalStateContext, PageContext } from '../../contexts/AppProviders';
import Modal from '../common/Modal';
import type { Quiz, QuizSubmission } from '../../types';

interface FileViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileName?: string | null;
}
const FileViewerModal: React.FC<FileViewerModalProps> = ({ isOpen, onClose, fileName }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={`Xem file (Demo): ${fileName}`} size="xl">
        <div className="bg-gray-900 p-6 rounded-lg max-h-[60vh] overflow-y-auto">
            <p className="text-gray-300 font-mono whitespace-pre-wrap">
                --- Bắt đầu nội dung file .docx (Giả lập) ---
                <br /><br />
                <span className="font-bold text-lg text-gradient">Tiêu đề: {fileName}</span>
                <br /><br />
                Đây là nội dung giả lập cho file .docx mà sinh viên đã nộp.
                <br />
                Trong một ứng dụng thực tế, đây sẽ là một trình xem file (viewer) tích hợp hoặc một link tải xuống.
                <br /><br />
                --- Kết thúc nội dung file ---
            </p>
        </div>
    </Modal>
);

interface QuizTakerProps {
    quiz: Quiz;
    submission: QuizSubmission | null;
    onSubmit: (answers: Record<string, number>) => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ quiz, submission, onSubmit }) => {
    const [answers, setAnswers] = useState<Record<string, number>>(() => submission?.answers || {});
    const [showResult, setShowResult] = useState(!!submission);
    const [result, setResult] = useState<QuizSubmission | null>(() => submission);

    const handleSelectAnswer = useCallback((questionId: string, optionIndex: number) => {
        if (!submission && !showResult) {
            setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
        }
    }, [submission, showResult]);

    const handleSubmit = useCallback(() => {
        if (!quiz?.questions || submission || showResult) return;
        onSubmit(answers);
        // Simulate result calculation after submission
        let score = 0;
        quiz.questions.forEach(q => {
            if (answers[q.id] === q.correctAnswer) score++;
        });
        const resultData: QuizSubmission = {
            score, total: quiz.questions.length,
            percentage: quiz.questions.length > 0 ? (score / quiz.questions.length) * 100 : 0,
            timestamp: new Date().toISOString(), answers
        };
        setResult(resultData);
        setShowResult(true);
    }, [quiz, answers, onSubmit, submission, showResult]);

    const allAnswered = useMemo(() => quiz.questions.every(q => answers[q.id] !== undefined), [quiz, answers]);

    if (showResult && result) {
        return (
            <div className="card p-6">
                <h2 className="text-2xl font-bold text-gradient mb-4 text-center">Kết quả Quiz</h2>
                <div className="text-center mb-6">
                    <p className="text-5xl font-bold text-gray-200">{result.score} / {result.total}</p>
                    <p className="text-xl font-semibold text-blue-400 mt-1">({result.percentage.toFixed(1)}%)</p>
                    <p className="text-sm text-gray-500 mt-2">Nộp vào: {new Date(result.timestamp).toLocaleString()}</p>
                </div>
                <hr className="border-gray-700 my-6" />
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Xem lại bài làm:</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {quiz.questions.map((q, qIndex) => {
                        const userAnswerIndex = result.answers[q.id];
                        const isCorrect = userAnswerIndex === q.correctAnswer;
                        return (
                            <div key={q.id} className="p-4 bg-gray-800 rounded-lg border-l-4 border-gray-600">
                                <p className="font-semibold text-gray-300 mb-3">{qIndex + 1}. {q.text}</p>
                                <div className="space-y-2">
                                    {q.options.map((opt, oIndex) => {
                                        let optionStyle = "text-gray-400", indicator = "◻️";
                                        if (oIndex === q.correctAnswer) {
                                            optionStyle = "text-green-400 font-semibold"; indicator = "✅";
                                        }
                                        if (oIndex === userAnswerIndex) {
                                            if (!isCorrect) { indicator = "❌"; optionStyle = "text-red-400 line-through"; }
                                        } else if (oIndex !== q.correctAnswer) {
                                            optionStyle = "text-gray-500"; indicator = " ・";
                                        }
                                        return (
                                            <div key={oIndex} className={`flex items-start space-x-2 ${optionStyle}`}>
                                                <span className="w-4">{indicator}</span> <span>{opt}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    
    return (
        <div className="card p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-200">Làm bài trắc nghiệm</h2>
            <div className="space-y-8">
                {quiz.questions.map((q, qIndex) => (
                    <div key={q.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <p className="font-semibold text-gray-300 mb-4">{qIndex + 1}. {q.text}</p>
                        <div className="space-y-3">
                            {q.options.map((opt, oIndex) => (
                                <label key={oIndex} className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition-colors duration-150 ${answers[q.id] === oIndex ? 'bg-blue-900/50 border-blue-500' : 'border-gray-700 hover:bg-gray-700'}`}>
                                    <input type="radio" name={q.id} className="form-radio" checked={answers[q.id] === oIndex} onChange={() => handleSelectAnswer(q.id, oIndex)} />
                                    <span className={`text-gray-300 ${answers[q.id] === oIndex ? 'font-semibold' : ''}`}>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <button type="button" onClick={handleSubmit} className="btn btn-primary w-full sm:w-auto" disabled={!allAnswered}>Nộp bài</button>
            {!allAnswered && <p className="text-sm text-yellow-500 mt-2">Vui lòng trả lời tất cả câu hỏi trước khi nộp.</p>}
        </div>
    );
};


interface AssignmentViewerPageProps {
    assignmentId: string;
}

const AssignmentViewerPage: React.FC<AssignmentViewerPageProps> = ({ assignmentId }) => {
    const { db, submitFileAssignment, submitQuiz } = useContext(DataContext)!;
    const { user } = useContext(AuthContext)!;
    const { navigate } = useContext(PageContext)!;
    const { serviceStatus } = useContext(GlobalStateContext)!;

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const isAssessmentServiceOk = serviceStatus.assessment_taking === 'OPERATIONAL';
    const isStorageServiceOk = serviceStatus.storage_service === 'OPERATIONAL';
    
    const { assignment, course, fileSubmission, quiz, quizSubmission } = useMemo(() => {
        const asg = db.ASSIGNMENTS[assignmentId];
        if (!asg || !user) return { assignment: null, course: null, fileSubmission: null, quiz: null, quizSubmission: null };
        const crs = db.COURSES.find(c => c.id === asg.courseId) || null;
        if (asg.type === 'file') {
            const sub = db.FILE_SUBMISSIONS[asg.id]?.find(s => s.studentId === user.id) || null;
            return { assignment: asg, course: crs, fileSubmission: sub, quiz: null, quizSubmission: null };
        } else if (asg.type === 'quiz' && asg.quizId) {
            const qz = db.QUIZZES[asg.quizId] || null;
            const sub = db.QUIZ_SUBMISSIONS[asg.quizId]?.[user.id] || null;
            return { assignment: asg, course: crs, fileSubmission: null, quiz: qz, quizSubmission: sub };
        }
        return { assignment: asg, course: crs, fileSubmission: null, quiz: null, quizSubmission: null };
    }, [assignmentId, user, db]);


    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.name.endsWith('.docx')) {
                setSelectedFile(file);
            } else {
                alert("Chỉ chấp nhận file .docx (demo).");
                e.target.value = "";
                setSelectedFile(null);
            }
        }
    }, []);

    const handleFileSubmit = useCallback(() => {
        if (!selectedFile || !assignment || !user) return;
        if (!isAssessmentServiceOk || !isStorageServiceOk) {
            alert("Dịch vụ đang bảo trì, không thể nộp bài.");
            return;
        }
        submitFileAssignment(assignment.id, user.id, selectedFile.name);
        alert("Nộp bài tập file thành công!");
        navigate('assignment_hub');
    }, [selectedFile, assignment, user, submitFileAssignment, navigate, isAssessmentServiceOk, isStorageServiceOk]);

    const handleQuizSubmit = useCallback((answers: Record<string, number>) => {
        if (!quiz || !assignment || !user) return;
        if (!isAssessmentServiceOk) {
            alert("Dịch vụ đang bảo trì, không thể nộp bài.");
            return;
        }
        submitQuiz(quiz.id, user.id, answers);
    }, [quiz, assignment, user, submitQuiz, isAssessmentServiceOk]);
    
    if (!assignment) {
        return <div className="text-red-500 card p-6">Lỗi: Không tìm thấy bài tập ID: {assignmentId}.</div>;
    }
    
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <button onClick={() => navigate('assignment_hub')} className="text-sm text-blue-400 hover:underline">&larr; Quay lại</button>
            <div className="card p-6">
                <p className="text-sm text-blue-400">{course?.name} ({assignment.courseId})</p>
                <h1 className="text-3xl font-bold text-gradient mt-1">{assignment.title}</h1>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-2 inline-block ${assignment.type === 'quiz' ? 'bg-indigo-700 text-indigo-300' : 'bg-green-700 text-green-300'}`}>
                    {assignment.type === 'quiz' ? 'Trắc nghiệm' : 'Nộp File'}
                </span>
            </div>

            {!isAssessmentServiceOk ? (
                <div className="card p-8 text-center border border-yellow-700">
                    <h2 className="text-2xl font-bold text-yellow-400 mb-4">Dịch vụ đang Bảo trì</h2>
                    <p className="text-gray-400">Không thể xem hoặc nộp bài lúc này.</p>
                </div>
            ) : (
                <>
                    {assignment.type === 'file' && fileSubmission && (
                        <div className="card p-6 space-y-4">
                            <h2 className="text-xl font-semibold text-gray-200">Nộp bài tập</h2>
                            {fileSubmission.status === 'Đã nộp' ? (
                                <div>
                                    <p className="text-green-400 font-semibold">✅ Bạn đã nộp bài: <span className="font-mono bg-gray-700 px-1 rounded">{fileSubmission.fileName}</span></p>
                                    {fileSubmission.grade != null ? (
                                        <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                                            <p className="text-lg font-semibold text-gray-200">Điểm số: <span className="text-blue-400">{fileSubmission.grade} / 10</span></p>
                                            {fileSubmission.feedback && <p className="text-gray-300 mt-1"><span className="font-medium text-gray-400">Nhận xét:</span> {fileSubmission.feedback}</p>}
                                        </div>
                                    ) : <p className="text-yellow-400 mt-2">🕒 Chờ chấm điểm.</p>}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-300 mb-2">Chọn file .docx để nộp:</label>
                                    {!isStorageServiceOk ? (
                                        <div className="p-4 rounded-lg border border-yellow-700 bg-gray-800 text-center">
                                            <p className="text-yellow-400 font-semibold">Dịch vụ Nộp File đang bảo trì.</p>
                                        </div>
                                    ) : <input id="fileUpload" type="file" accept=".docx" onChange={handleFileChange} className="form-input" />}
                                    <button onClick={handleFileSubmit} className="btn btn-primary" disabled={!selectedFile || !isStorageServiceOk}>Nộp bài</button>
                                </div>
                            )}
                        </div>
                    )}
                    {assignment.type === 'quiz' && quiz && (
                        <QuizTaker quiz={quiz} submission={quizSubmission} onSubmit={handleQuizSubmit} />
                    )}
                </>
            )}
        </div>
    );
};
export default AssignmentViewerPage;
