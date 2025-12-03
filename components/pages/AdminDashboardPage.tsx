
import React, { useContext, useMemo } from 'react';
import { AuthContext, DataContext, GlobalStateContext, PageContext } from '../../contexts/AppProviders';
import { useMockMetrics } from '../../hooks/useAppHooks';
import type { MockTestResultStatus } from '../../types';

interface TestCardProps {
    type: 'unit' | 'integration' | 'e2e';
    name: string;
    description: string;
    duration: string;
}

const TestCard: React.FC<TestCardProps> = ({ type, name, description, duration }) => {
    const { db, runMockTest } = useContext(DataContext)!;
    const status: MockTestResultStatus = db.MOCK_TEST_RESULTS[type];
  
    const getStatusContent = () => {
      switch (status) {
        case 'RUNNING':
          return (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin-slow mb-3 text-4xl">⚙️</div>
              <p className="text-lg font-semibold text-blue-400">ĐANG CHẠY...</p>
              <p className="text-sm text-gray-500">(~{duration})</p>
            </div>
          );
        case 'PASS':
          return (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-5xl mb-2 text-shadow-pass">✅</div>
              <p className="text-xl font-bold text-green-400">PASS</p>
            </div>
          );
        case 'FAIL':
          return (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-5xl mb-2 text-shadow-fail">❌</div>
              <p className="text-xl font-bold text-red-500">FAIL</p>
            </div>
          );
        default:
          return (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-3 text-gray-500">⏱️</div>
              <p className="text-lg font-semibold text-gray-400">Sẵn sàng chạy</p>
              <p className="text-sm text-gray-500">(~{duration})</p>
            </div>
          );
      }
    };
  
    return (
      <div className="card p-4 flex flex-col justify-between border-l-4 border-gray-600 h-full">
        <div>
          <h3 className="text-xl font-semibold text-gray-200">{name}</h3>
          <p className="text-sm text-gray-400 mt-1 mb-4 h-12">{description}</p>
        </div>
        <div className="h-32 bg-gray-900/50 rounded-lg p-4 mb-4 border border-gray-700">
          {getStatusContent()}
        </div>
        <button
          onClick={() => runMockTest(type)}
          className="btn btn-secondary w-full"
          disabled={status === 'RUNNING'}
        >
          {status === 'RUNNING' ? 'Đang chạy...' : `Chạy ${name}`}
        </button>
      </div>
    );
};

const MockTestRunner: React.FC = () => {
    return (
      <div className="card p-6">
        <h2 className="text-2xl font-semibold text-gray-200 mb-4">Trung tâm Kiểm thử (Mock CI/CD)</h2>
        <p className="text-sm text-gray-400 mb-6">
          Giả lập việc chạy các bộ kiểm thử tự động trong đường ống (pipeline) CI/CD.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TestCard type="unit" name="Unit Tests" description="Kiểm tra các hàm và component nhỏ, độc lập. (Nhanh)" duration="3s" />
          <TestCard type="integration" name="Integration Tests" description="Kiểm tra sự tương tác giữa các dịch vụ (ví dụ: API và Database)." duration="5s" />
          <TestCard type="e2e" name="End-to-End Tests" description="Kiểm tra toàn bộ luồng người dùng (ví dụ: Đăng nhập -> Nộp bài)." duration="8s" />
        </div>
      </div>
    );
};

const SystemHealthGraph = ({ metrics }: { metrics: any }) => {
    return (
        <div className="card p-6 col-span-1 lg:col-span-4 bg-black/40 border-gray-700">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">System Load History</h3>
            <div className="h-24 flex items-end gap-1">
                {[...Array(20)].map((_, i) => {
                    const h = Math.random() * 100;
                    return (
                        <div 
                            key={i} 
                            className={`flex-1 rounded-t-sm transition-all duration-500 ${h > 80 ? 'bg-red-500' : 'bg-green-500/50'}`}
                            style={{ height: `${h}%` }}
                        ></div>
                    )
                })}
            </div>
        </div>
    )
}

const AdminDashboardPage: React.FC = () => {
    const { user } = useContext(AuthContext)!;
    const { serviceStatus } = useContext(GlobalStateContext)!;
    const { navigate } = useContext(PageContext)!;
    const { unlockAllUsers } = useContext(DataContext)!;
    const metrics = useMockMetrics(serviceStatus);

    const degradedServices = useMemo(() =>
        Object.values(serviceStatus).filter(s => s === 'DEGRADED' || s === 'CRITICAL').length
    , [serviceStatus]);

    const getStatusColor = () => {
        if (degradedServices > 3) return 'text-red-500';
        if (degradedServices > 0) return 'text-yellow-400';
        return 'text-green-400';
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 0 && hour <= 10) return "Chào buổi sáng";
        if (hour >= 11 && hour <= 12) return "Chào buổi trưa";
        if (hour >= 13 && hour <= 17) return "Chào buổi chiều";
        return "Chào buổi tối";
    };
    
    const greeting = getGreeting();

    if (!user) return null;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gradient">{greeting}, {user.name} (Admin)</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card p-6 transform hover:scale-105 transition-transform duration-200">
                    <p className="text-sm text-gray-400">Trạng thái Hệ thống</p>
                    <p className={`text-3xl font-bold mt-1 ${getStatusColor()}`}>
                        {degradedServices > 0 ? `${degradedServices} Dịch vụ lỗi` : 'Hoạt động'}
                    </p>
                </div>
                <div className="card p-6 transform hover:scale-105 transition-transform duration-200">
                    <p className="text-sm text-gray-400">CPU Load</p>
                    <p className="text-3xl font-bold text-gray-200 mt-1">{metrics.cpu.toFixed(1)}%</p>
                </div>
                <div className="card p-6 transform hover:scale-105 transition-transform duration-200">
                    <p className="text-sm text-gray-400">Memory Usage</p>
                    <p className="text-3xl font-bold text-gray-200 mt-1">{metrics.memory.toFixed(1)}%</p>
                </div>
                <div className="card p-6 transform hover:scale-105 transition-transform duration-200">
                    <p className="text-sm text-gray-400">Error Rate</p>
                    <p className="text-3xl font-bold text-gray-200 mt-1">{metrics.errorRate.toFixed(2)}%</p>
                </div>
                
                <SystemHealthGraph metrics={metrics} />
            </div>

            <MockTestRunner />

            <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-gray-200">Bảng điều khiển</h2>
                    <button onClick={() => { unlockAllUsers(); alert("Đã mở khóa tất cả tài khoản."); }} className="btn btn-secondary text-xs">🔓 Mở khóa Tất cả Users</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={() => navigate('admin_resilience')} className="btn btn-secondary text-base p-6 justify-start text-left h-full">
                        <div>
                            <p className="font-semibold text-lg">🔧 Quản lý Độ ổn định (Resilience)</p>
                            <p className="text-sm font-normal text-gray-400 mt-1">Bật/tắt các microservice để kiểm thử Service Composition.</p>
                        </div>
                    </button>
                    <button onClick={() => navigate('deployment')} className="btn btn-secondary text-base p-6 justify-start text-left h-full">
                        <div>
                            <p className="font-semibold text-lg">🚀 Quản lý Phát hành (Canary)</p>
                            <p className="text-sm font-normal text-gray-400 mt-1">Quản lý Feature Flags (v2, v3, v4...) cho từng nhóm người dùng.</p>
                        </div>
                    </button>
                    <button onClick={() => navigate('security')} className="btn btn-secondary text-base p-6 justify-start text-left h-full">
                        <div>
                            <p className="font-semibold text-lg">🛡️ An ninh & Vận hành (SecOps)</p>
                            <p className="text-sm font-normal text-gray-400 mt-1">Khóa người dùng, gửi thông báo toàn hệ thống, xem WAF logs.</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};
export default AdminDashboardPage;
