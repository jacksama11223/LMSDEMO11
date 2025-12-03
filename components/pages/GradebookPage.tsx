
import React, { useState, useContext, useMemo, useCallback } from 'react';
import { DataContext, GlobalStateContext, PageContext } from '../../contexts/AppProviders';
import Modal from '../common/Modal';
import type { FileSubmission, User } from '../../types';

interface FileViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileName?: string | null;
}
const FileViewerModal: React.FC<FileViewerModalProps> = ({ isOpen, onClose, fileName }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={`Xem file (Demo): ${fileName}`} size="xl">
        <div className="bg-gray-900 p-6 rounded-lg max-h-[60vh] overflow-y-auto">
            <p className="text-gray-300 font-mono whitespace-pre-wrap">
                --- Bắt đầu nội dung file .docx (Giả lập) ---<br /><br />
                <span className="font-bold text-lg text-gradient">Tiêu đề: {fileName}</span><br /><br />
                Đây là nội dung giả lập cho file .docx mà sinh viên đã nộp.<br />
                --- Kết thúc nội dung file ---
            </p>
        </div>
    </Modal>
);

interface GradebookPageProps {
    assignmentId: string;
}
const GradebookPage: React.FC<GradebookPageProps> = ({ assignmentId }) => {
    const { db, gradeFileSubmission } = useContext(DataContext)!;
    const { navigate } = useContext(PageContext)!;
    const { serviceStatus } = useContext(GlobalStateContext)!;

    const isGradingServiceOk = serviceStatus.grading_service === 'OPERATIONAL';
    const isStorageServiceOk = serviceStatus.storage_service === 'OPERATIONAL';

    const [currentSub, setCurrentSub] = useState<FileSubmission | null>(null);
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
    
    const assignment = useMemo(() => db.ASSIGNMENTS[assignmentId], [db.ASSIGNMENTS, assignmentId]);
    const course = useMemo(() => assignment ? db.COURSES.find(c => c.id === assignment.courseId) : null, [db.COURSES, assignment]);

    const fileSubmissions = useMemo(() => (assignment?.type === 'file' ? db.FILE_SUBMISSIONS[assignment.id] || [] : []), [assignment, db.FILE_SUBMISSIONS]);
    const quizSubmissions = useMemo(() => (assignment?.type === 'quiz' && assignment.quizId ? db.QUIZ_SUBMISSIONS[assignment.quizId] || {} : {}), [assignment, db.QUIZ_SUBMISSIONS]);

    const handleSelectSubmission = useCallback((sub: FileSubmission) => {
        setCurrentSub(sub);
        setGrade(sub.grade != null ? String(sub.grade) : '');
        setFeedback(sub.feedback || '');
    }, []);

    const handleGradeSubmit = useCallback(() => {
        if (!currentSub || !isGradingServiceOk) {
            alert("Dịch vụ chấm điểm đang bảo trì, không thể lưu.");
            return;
        }
        const gradeNum = parseFloat(grade);
        if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 10) {
            alert("Điểm không hợp lệ (phải từ 0 đến 10).");
            return;
        }
        gradeFileSubmission(assignmentId, currentSub.studentId, gradeNum, feedback);
        setCurrentSub(null);
        alert("Đã lưu điểm!");
    }, [currentSub, grade, feedback, assignmentId, gradeFileSubmission, isGradingServiceOk]);
    
    if (!assignment) {
        return <div className="text-red-500 card p-6">Lỗi: Không tìm thấy bài tập ID: {assignmentId}.</div>;
    }

    if (!isGradingServiceOk) {
        return (
            <div className="space-y-6">
                <button onClick={() => navigate('assignment_hub')} className="text-sm text-blue-400 hover:underline">&larr; Quay lại</button>
                <div className="card p-8 text-center border border-yellow-700">
                    <h2 className="text-2xl font-bold text-yellow-400 mb-4">Dịch vụ Chấm điểm đang Bảo trì</h2>
                    <p className="text-gray-400">Không thể xem hoặc chấm điểm lúc này.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <button onClick={() => navigate('assignment_hub')} className="text-sm text-blue-400 hover:underline">&larr; Quay lại</button>

            <div className="card p-6">
                <p className="text-sm text-blue-400">{course?.name}</p>
                <h1 className="text-3xl font-bold text-gradient mt-1">{assignment.title}</h1>
            </div>

            {assignment.type === 'file' && (
                <div className="card p-0 overflow-hidden">
                    <h2 className="text-xl font-semibold p-6 border-b border-gray-700">Chấm bài (Nộp File)</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="border-b border-gray-700 text-sm text-gray-400 uppercase">
                                <tr>
                                    <th className="p-3">Sinh viên</th><th className="p-3">Trạng thái</th>
                                    <th className="p-3">File</th><th className="p-3">Thời gian nộp</th>
                                    <th className="p-3 text-center">Điểm</th><th className="p-3">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {fileSubmissions.map(sub => (
                                    <tr key={sub.id} className="hover:bg-gray-700/50">
                                        <td className="p-3">{sub.studentName} ({sub.studentId})</td>
                                        <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${sub.status === 'Đã nộp' ? 'bg-green-800 text-green-300' : 'bg-yellow-800 text-yellow-300'}`}>{sub.status}</span></td>
                                        <td className="p-3 font-mono text-sm">{sub.fileName || 'N/A'}</td>
                                        <td className="p-3 text-sm">{sub.timestamp ? new Date(sub.timestamp).toLocaleString() : 'N/A'}</td>
                                        <td className="p-3 font-semibold text-center">{sub.grade ?? '-'}</td>
                                        <td className="p-3"><button onClick={() => handleSelectSubmission(sub)} className="btn btn-secondary text-sm" disabled={sub.status === 'Chưa nộp'}>{sub.grade != null ? 'Sửa điểm' : 'Chấm điểm'}</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {assignment.type === 'quiz' && (
                <div className="card p-0 overflow-hidden">
                    <h2 className="text-xl font-semibold p-6 border-b border-gray-700">Thống kê điểm Quiz</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="border-b border-gray-700 text-sm text-gray-400 uppercase">
                                <tr>
                                    <th className="p-3">Sinh viên</th><th className="p-3 text-center">Điểm</th>
                                    <th className="p-3 text-center">Tỷ lệ (%)</th><th className="p-3">Thời gian nộp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {(Object.values(db.USERS) as User[]).filter(u => u.role === 'STUDENT').map(student => {
                                    const sub = quizSubmissions[student.id];
                                    return (
                                        <tr key={student.id} className="hover:bg-gray-700/50">
                                            <td className="p-3">{student.name} ({student.id})</td>
                                            <td className="p-3 font-semibold text-center">{sub ? `${sub.score} / ${sub.total}` : <span className="text-gray-500">Chưa làm</span>}</td>
                                            <td className="p-3 font-semibold text-center" style={{ color: sub ? (sub.percentage >= 80 ? 'var(--color-accent-green)' : sub.percentage >= 50 ? 'var(--color-accent-yellow)' : 'var(--color-accent-red)') : 'var(--color-text-muted)' }}>{sub ? `${sub.percentage.toFixed(1)}%` : '-'}</td>
                                            <td className="p-3 text-sm">{sub ? new Date(sub.timestamp).toLocaleString() : 'N/A'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {currentSub && assignment.type === 'file' && (
                <Modal isOpen={!!currentSub} onClose={() => setCurrentSub(null)} title={`Chấm bài: ${currentSub.studentName}`}>
                    <div className="space-y-4">
                        <button onClick={() => setIsFileViewerOpen(true)} className="btn btn-secondary w-full" disabled={!currentSub.fileName || !isStorageServiceOk}>
                            📄 Xem file: {currentSub.fileName || "(Không có file)"}
                        </button>
                        <div>
                            <label htmlFor="gradeInput" className="block text-sm font-medium text-gray-300 mb-2">Điểm số (0 - 10)</label>
                            <input id="gradeInput" type="number" step="0.1" min="0" max="10" value={grade} onChange={(e) => setGrade(e.target.value)} className="form-input" />
                        </div>
                        <div>
                            <label htmlFor="feedbackInput" className="block text-sm font-medium text-gray-300 mb-2">Nhận xét</label>
                            <textarea id="feedbackInput" rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} className="form-textarea" />
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="button" onClick={handleGradeSubmit} className="btn btn-primary">Lưu điểm</button>
                        </div>
                    </div>
                </Modal>
            )}
            <FileViewerModal isOpen={isFileViewerOpen} onClose={() => setIsFileViewerOpen(false)} fileName={currentSub?.fileName} />
        </div>
    );
};
export default GradebookPage;
