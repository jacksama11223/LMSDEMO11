
import React, { useContext, useMemo } from 'react';
import { GlobalStateContext, PageContext } from '../../contexts/AppProviders';
import type { FeatureFlagStatus } from '../../types';

interface StatusRadioGroupProps {
    flagKey: string;
    currentStatus: FeatureFlagStatus;
}

const StatusRadioGroup: React.FC<StatusRadioGroupProps> = ({ flagKey, currentStatus }) => {
    const { setFeatureFlag } = useContext(GlobalStateContext)!;
    return (
        <div className="flex">
            <button onClick={() => setFeatureFlag(flagKey, 'OFF')} className={`radio-group-btn ${currentStatus === 'OFF' ? 'active' : ''}`}>TẮT</button>
            <button onClick={() => setFeatureFlag(flagKey, 'SPECIFIC')} className={`radio-group-btn ${currentStatus === 'SPECIFIC' ? 'active' : ''}`}>CHỈ ĐỊNH</button>
            <button onClick={() => setFeatureFlag(flagKey, 'ALL')} className={`radio-group-btn ${currentStatus === 'ALL' ? 'active' : ''}`}>BẬT TẤT CẢ</button>
        </div>
    );
};

const DeploymentPage: React.FC = () => {
    const { featureFlags, setFeatureFlag } = useContext(GlobalStateContext)!;
    const { navigate } = useContext(PageContext)!;

    const features = useMemo(() => [
        { key: 'v2_chat', name: 'Chat 1-1 (API v2)', desc: 'Kích hoạt tính năng chat trực tiếp giữa Sinh viên và Giáo viên.' },
        { key: 'v3_ai_analytics', name: 'Phân tích AI (API v3)', desc: 'Cung cấp bảng phân tích học tập nâng cao bằng AI cho Giáo viên.' },
        { key: 'v4_gamify', name: 'Game hóa (API v4)', desc: 'Thêm cơ chế điểm thưởng và huy hiệu vào trang chủ của Sinh viên.' },
        { key: 'v5_groups', name: 'Nhóm học tập (API v5)', desc: 'Cho phép Sinh viên tạo, tham gia và trò chuyện trong các nhóm học tập.' },
    ], []);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <button onClick={() => navigate('dashboard')} className="text-sm text-blue-400 hover:underline">&larr; Quay lại Admin Dashboard</button>
                <h1 className="text-3xl font-bold text-gradient mt-2">Quản lý Phát hành (Canary Release)</h1>
            </div>
            <p className="text-gray-400">Sử dụng các tùy chọn bên dưới để kiểm soát quyền truy cập các tính năng mới.</p>
            <div className="space-y-6">
                {features.map(feature => {
                    const flag = featureFlags[feature.key] || { status: 'OFF', specificUsers: '' };
                    return (
                        <div key={feature.key} className="card p-6 border-l-4 border-blue-500">
                            <h2 className="text-xl font-semibold text-gray-200">{feature.name}</h2>
                            <p className="text-sm text-gray-400 mt-1 mb-4">{feature.desc}</p>
                            <div className="mb-4">
                                <StatusRadioGroup flagKey={feature.key} currentStatus={flag.status} />
                            </div>
                            {flag.status === 'SPECIFIC' && (
                                <div>
                                    <label htmlFor={`users_${feature.key}`} className="block text-sm font-medium text-gray-300 mb-2">Chỉ định User ID (cách nhau bởi dấu phẩy):</label>
                                    <textarea id={`users_${feature.key}`} className="form-textarea font-mono text-sm" rows={3} placeholder="sv001, sv002, gv001"
                                        value={flag.specificUsers} onChange={(e) => setFeatureFlag(feature.key, 'SPECIFIC', e.target.value)} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
export default DeploymentPage;
