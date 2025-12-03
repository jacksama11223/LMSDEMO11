
import React, { useContext, useMemo, useCallback } from 'react';
import { GlobalStateContext, PageContext } from '../../contexts/AppProviders';
import type { ServiceName, ServiceStatusValue } from '../../types';

const AdminResiliencePage: React.FC = () => {
  const { serviceStatus, toggleServiceStatus } = useContext(GlobalStateContext)!;
  const { navigate } = useContext(PageContext)!;

  const getStatusClasses = useCallback((status: ServiceStatusValue) => {
    switch (status) {
      case 'OPERATIONAL': return { text: 'text-green-400', border: 'border-green-500' };
      case 'DEGRADED': return { text: 'text-yellow-400', border: 'border-yellow-500' };
      case 'CRITICAL': return { text: 'text-red-500', border: 'border-red-500' };
      default: return { text: 'text-gray-500', border: 'border-gray-600' };
    }
  }, []);

  const services = useMemo<{ key: ServiceName; name: string }[]>(() => [
    { key: 'user_management', name: 'User Management' },
    { key: 'course_management', name: 'Course Management' },
    { key: 'content_delivery', name: 'Content Delivery' },
    { key: 'assessment_taking', name: 'Assessment (SV làm bài)' },
    { key: 'storage_service', name: 'Storage (Nộp file)' },
    { key: 'grading_service', name: 'Grading (GV chấm bài)' },
    { key: 'notification_service', name: 'Notification (Thông báo)' },
    { key: 'chat_service', name: 'Chat 1-1' },
    { key: 'group_service', name: 'Group Chat' },
    { key: 'forum_service', name: 'Forum (Thảo luận)' },
    { key: 'ai_tutor_service', name: 'AI Tutor (Sinh viên)' },
    { key: 'ai_assistant_service', name: 'AI Assistant (Giáo viên)' },
    { key: 'personalization', name: 'Personalization (Gợi ý)' },
    { key: 'analytics', name: 'Analytics (Phân tích)' },
  ], []);

  return (
    <div className="space-y-8">
      <div>
        <button onClick={() => navigate('dashboard')} className="text-sm text-blue-400 hover:underline">
          &larr; Quay lại Admin Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gradient mt-2">Quản lý Độ ổn định (Resilience)</h1>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold text-gray-200 mb-4">Trạng thái Microservice</h2>
        <p className="text-sm text-gray-400 mb-4">
          Nhấp vào một dịch vụ để thay đổi trạng thái của nó (Operational &rarr; Degraded &rarr; Critical &rarr; Operational) và
          kiểm tra trải nghiệm của Sinh viên/Giáo viên (Demo Service Composition & Resilience).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map(service => {
             const statusClasses = getStatusClasses(serviceStatus[service.key]);
             return (
                <button
                  key={service.key}
                  onClick={() => toggleServiceStatus(service.key)}
                  className={`card p-4 text-left transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500
                             border-l-4 ${statusClasses.border}`}
                >
                  <p className="font-semibold text-gray-200">{service.name}</p>
                  <p className={`text-sm font-bold ${statusClasses.text}`}>
                    {serviceStatus[service.key] || 'N/A'}
                  </p>
                </button>
             );
          })}
        </div>
      </div>
    </div>
  );
};
export default AdminResiliencePage;
