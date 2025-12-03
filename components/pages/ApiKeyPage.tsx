
import React, { useContext } from 'react';
import { GlobalStateContext } from '../../contexts/AppProviders';

const ApiKeyPage: React.FC = () => {
  const { setPage: setGlobalPage } = useContext(GlobalStateContext)!;

  return (
    <div className="card p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gradient mb-4">Cấu hình API Key</h1>
      <p className="text-gray-400 mb-4">
        Vui lòng nhập Gemini API Key của bạn từ cửa sổ pop-up.
      </p>
      <p className="text-gray-400">
        Nếu cửa sổ không tự mở, hãy nhấp vào biểu tượng 🔑 trên thanh tiêu đề phía trên bên phải.
      </p>
       <button
          onClick={() => setGlobalPage('api_key', { isApiKeyModalOpen: true })}
          className="btn btn-secondary mt-6"
       >
          Mở lại cửa sổ nhập API Key
       </button>
    </div>
  );
};

export default ApiKeyPage;
