
import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AppProviders';
import GlobalStyles from '../common/GlobalStyles';

const LockoutScreen: React.FC = () => {
  const { logout } = useContext(AuthContext)!;
  return (
    <>
      <GlobalStyles />
      <div id="auth-page" className="flex items-center justify-center min-h-screen p-4">
        <div className="card p-8 text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-red-500 mb-4">Tài khoản bị khóa</h1>
          <p className="text-gray-300 mb-6">
            Tài khoản của bạn đã bị Quản trị viên khóa. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.
          </p>
          <button onClick={logout} className="btn btn-primary">
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
};

export default LockoutScreen;
