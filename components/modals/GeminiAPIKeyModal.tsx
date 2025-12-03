
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext, DataContext } from '../../contexts/AppProviders';
import { callGeminiApi } from '../../services/geminiService';
import Modal from '../common/Modal';

interface GeminiAPIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GeminiAPIKeyModal: React.FC<GeminiAPIKeyModalProps> = ({ isOpen, onClose }) => {
  const { user } = useContext(AuthContext)!;
  const { db, setApiKey } = useContext(DataContext)!;

  const [localApiKey, setLocalApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen && user && db.USERS[user.id]) {
      setLocalApiKey(db.USERS[user.id].apiKey || '');
      setError(null);
    }
  }, [isOpen, user, db.USERS]);

  const handleTestKey = async () => {
    if (!localApiKey.trim()) {
      setError("Vui lòng nhập API Key.");
      return;
    }
    setError("Đang kiểm tra...");
    setIsTesting(true);
    
    try {
        const testPrompt = "Test: respond with just the word 'OK'";
        const response = await callGeminiApi(localApiKey, testPrompt, null);
        
        if (response.trim().includes('OK')) {
            setError("✅ Kiểm tra thành công! Key hợp lệ.");
        } else {
            setError("⚠️ Key có vẻ hoạt động, nhưng phản hồi không như mong đợi.");
        }
    } catch (err: unknown) {
        console.error("Test API Key failed:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(`❌ Lỗi: ${errorMessage}`);
    } finally {
        setIsTesting(false);
    }
  };


  const handleSave = useCallback(() => {
    if (user) {
      setApiKey(user.id, localApiKey);
      alert("Đã lưu API Key.");
    }
    onClose();
  }, [user, localApiKey, setApiKey, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Cấu hình Gemini API Key" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Tính năng Gemini (Tạo Quiz, Hỏi đáp) yêu cầu API Key của Google AI Studio.
        </p>
        <div>
          <label htmlFor="apiKeyInput" className="block text-sm font-medium text-gray-300 mb-2">Gemini API Key</label>
          <input
            id="apiKeyInput"
            type="password"
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            className="form-input"
            placeholder="AIzaSy..."
          />
        </div>

        {error && (
            <p className={`text-sm p-2 rounded ${
                error.startsWith('✅') ? 'bg-green-900 text-green-300' :
                error.startsWith('❌') ? 'bg-red-900 text-red-300' :
                'bg-yellow-900 text-yellow-300'
            }`}>
              {error}
            </p>
        )}

        <div className="flex justify-between items-center pt-2">
           <button type="button" onClick={handleTestKey} className="btn btn-secondary" disabled={isTesting}>
             {isTesting ? 'Đang kiểm tra...' : 'Kiểm tra Key'}
           </button>
           <div className="flex space-x-3">
             <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Hủy
             </button>
             <button type="button" onClick={handleSave} className="btn btn-primary">
                Lưu
             </button>
           </div>
        </div>
      </div>
    </Modal>
  );
};

export default GeminiAPIKeyModal;
