import React, { useState, useContext, useCallback, useEffect } from 'react';
import { AuthContext, DataContext } from '../../contexts/AppProviders';
import type { UserRole } from '../../types';
import ParticleBackground from '../common/ParticleBackground'; // Updated Import

// --- 3D COMPONENTS ---

const GlowingOrb = () => (
  <div className="absolute top-[-150px] left-[50%] transform -translate-x-1/2 w-[600px] h-[600px] z-[-1] pointer-events-none transition-all duration-1000">
    {/* Core Planet */}
    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-indigo-500 to-black shadow-[0_0_100px_rgba(99,102,241,0.4)] animate-spin-slow opacity-80"></div>
    {/* Atmosphere Ring */}
    <div className="absolute inset-[-20px] rounded-full border border-indigo-400/20 blur-sm"></div>
    <div className="absolute inset-[-60px] rounded-full border border-purple-500/10 blur-md rotate-45"></div>
  </div>
);

const TactileInput = ({ 
  id, 
  type, 
  value, 
  onChange, 
  placeholder, 
  icon 
}: { 
  id: string, 
  type: string, 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  placeholder: string,
  icon: string 
}) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-cyan-400 transition-colors">
      <span className="text-xl drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{icon}</span>
    </div>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      className="block w-full pl-12 pr-4 py-4 bg-[#0a0f1c]/90 text-gray-100 rounded-xl border-0 ring-1 ring-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),inset_0_-1px_1px_rgba(255,255,255,0.05)] focus:ring-2 focus:ring-cyan-500/50 focus:shadow-[inset_0_2px_10px_rgba(0,0,0,1),0_0_20px_rgba(34,211,238,0.2)] transition-all duration-300 placeholder-gray-600 font-medium"
      placeholder={placeholder}
      required
    />
  </div>
);

const RoleSwitch = ({ role, setRole }: { role: UserRole, setRole: (r: UserRole) => void }) => (
  <div className="relative flex bg-[#050810] p-1.5 rounded-2xl shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.1)] border border-white/5">
    {/* Sliding Indicator */}
    <div 
      className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-gradient-to-b from-gray-700 to-gray-800 shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-300 ease-out z-0`}
      style={{ left: role === 'STUDENT' ? '6px' : 'calc(50%)' }}
    ></div>
    
    <button
      type="button"
      onClick={() => setRole('STUDENT')}
      className={`flex-1 relative z-10 py-3 text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${role === 'STUDENT' ? 'text-white text-shadow-glow' : 'text-gray-500 hover:text-gray-300'}`}
    >
      Sinh viên
    </button>
    <button
      type="button"
      onClick={() => setRole('TEACHER')}
      className={`flex-1 relative z-10 py-3 text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${role === 'TEACHER' ? 'text-white text-shadow-glow' : 'text-gray-500 hover:text-gray-300'}`}
    >
      Giáo viên
    </button>
  </div>
);

const PrimaryButton3D = ({ children, onClick, disabled, loading }: any) => (
  <button
    type="submit"
    onClick={onClick}
    disabled={disabled || loading}
    className={`
      relative w-full py-4 rounded-xl font-black text-white uppercase tracking-widest text-sm
      transition-all duration-100 transform active:scale-[0.98] active:translate-y-1
      disabled:opacity-50 disabled:cursor-not-allowed
      group overflow-hidden
    `}
    style={{
      background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
      boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.5), 0 6px 0 #1e3a8a, inset 0 1px 0 rgba(255,255,255,0.3)'
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
    <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-md">
      {loading ? (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      ) : children}
    </span>
  </button>
);

const AuthPage: React.FC = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<UserRole>('STUDENT');
    
    const [registerError, setRegisterError] = useState<string | null>(null);
    const [pendingLogin, setPendingLogin] = useState<{user: string, pass: string} | null>(null);

    const { login, error: authError } = useContext(AuthContext)!;
    const { db, registerUser } = useContext(DataContext)!;

    // Unified Login Handler
    const handleLogin = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        login(username, password);
    }, [username, password, login]);

    // Registration Handler
    const handleRegister = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setRegisterError(null);
        
        if (!username || !password || !name) {
            setRegisterError("Vui lòng điền đầy đủ thông tin.");
            return;
        }

        try {
            registerUser(username, password, name, role);
            setPendingLogin({ user: username, pass: password });
        } catch (err) {
            setRegisterError(err instanceof Error ? err.message : "Lỗi đăng ký không xác định.");
        }
    }, [username, password, name, role, registerUser]);

    // Auto-login effect
    useEffect(() => {
        if (pendingLogin && db.USERS[pendingLogin.user]) {
            login(pendingLogin.user, pendingLogin.pass);
            setPendingLogin(null);
        }
    }, [db.USERS, pendingLogin, login]);

    // Reset errors when switching modes
    useEffect(() => {
        setRegisterError(null);
    }, [isRegistering]);

    return (
        <div id="auth-page" className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden bg-[#050b14] perspective-1000">
            {/* Dynamic Backgrounds */}
            <ParticleBackground />
            <GlowingOrb />
            
            {/* Main Holographic Console */}
            <div 
                className="relative w-full max-w-md transition-all duration-500 ease-in-out transform hover:scale-[1.01]"
                style={{ perspective: '2000px' }}
            >
                {/* Glass Panel Effect */}
                <div className="relative z-10 bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),inset_0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_20px_rgba(255,255,255,0.05)] overflow-hidden">
                    
                    {/* Top Shine */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>

                    {/* Header */}
                    <div className="text-center mb-10 space-y-2">
                        <div className="inline-block p-4 rounded-full bg-gradient-to-br from-blue-900/50 to-black border border-white/10 mb-4 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]">
                            <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">🌌</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight text-shadow-lg">
                            TRẠM VŨ TRỤ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">EDULEARN</span>
                        </h1>
                        <p className="text-blue-200/60 text-sm font-medium tracking-wide uppercase">
                            {isRegistering ? 'Đăng ký thành viên phi hành đoàn' : 'Xác thực quyền truy cập'}
                        </p>
                    </div>

                    <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
                        
                        {/* Name Field (Register Only) */}
                        {isRegistering && (
                            <div className="space-y-4 animate-pop-in">
                                <RoleSwitch role={role} setRole={setRole} />
                                <TactileInput 
                                    id="reg-name" 
                                    type="text" 
                                    placeholder="Họ và Tên (VD: Nguyễn Văn A)" 
                                    icon="🏷️" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                />
                            </div>
                        )}

                        {/* Common Fields */}
                        <TactileInput 
                            id="username" 
                            type="text" 
                            placeholder={isRegistering ? "Tạo User ID (VD: sv099)" : "Nhập User ID"} 
                            icon="👤" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                        />
                        
                        <TactileInput 
                            id="password" 
                            type="password" 
                            placeholder="Mật khẩu bảo mật" 
                            icon="🔒" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />

                        {/* Errors */}
                        {(authError || registerError) && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm text-center font-medium shadow-[inset_0_0_10px_rgba(239,68,68,0.2)] animate-shake">
                                ⚠️ {authError || registerError}
                            </div>
                        )}

                        {/* Submit Button */}
                        <PrimaryButton3D 
                            loading={!!pendingLogin} 
                            disabled={!!pendingLogin}
                        >
                            {pendingLogin ? 'ĐANG ĐỒNG BỘ...' : (isRegistering ? 'GIA NHẬP' : 'KHỞI ĐỘNG')}
                        </PrimaryButton3D>
                    </form>

                    {/* Footer Toggle */}
                    <div className="mt-8 text-center">
                        <button 
                            type="button"
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-sm font-semibold text-gray-400 hover:text-white transition-colors duration-300 relative group"
                        >
                            {isRegistering ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký mới'}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full"></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;