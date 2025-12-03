
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { DataContext, PageContext } from '../../contexts/AppProviders';
import type { WafLog } from '../../types';

const SecurityPage: React.FC = () => {
    const { db, toggleUserLock, sendAnnouncement } = useContext(DataContext)!;
    const { navigate } = useContext(PageContext)!;
    const [wafLogs, setWafLogs] = useState<WafLog[]>(() => db.WAF_LOGS || []);
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        const intervalId = setInterval(() => {
            const newLog: WafLog = {
                id: `waf_${Date.now()}`,
                ip: `172.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
                type: Math.random() > 0.6 ? (Math.random() > 0.5 ? 'XSS' : 'SQLi') : 'CSRF',
                path: Math.random() > 0.5 ? '/course/CS101/forum' : '/profile/update',
                timestamp: new Date()
            };
            setWafLogs(prevLogs => [newLog, ...prevLogs].slice(0, 50));
        }, 4000);
        return () => clearInterval(intervalId);
    }, []);

    const handleSendAnn = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!announcement.trim()) return;
        sendAnnouncement(announcement);
        setAnnouncement('');
        alert("Đã gửi thông báo!");
    }, [announcement, sendAnnouncement]);

    const users = useMemo(() => Object.values(db.USERS), [db.USERS]);

    return (
        <div className="space-y-8">
            <div>
                <button onClick={() => navigate('dashboard')} className="text-sm text-blue-400 hover:underline">&larr; Quay lại Admin Dashboard</button>
                <h1 className="text-3xl font-bold text-gradient mt-2">An ninh & Vận hành</h1>
            </div>

            <div className="card p-0 overflow-hidden">
                <h2 className="text-xl font-semibold p-6 border-b border-gray-700">Quản lý Người dùng</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="border-b border-gray-700 text-sm text-gray-400 uppercase">
                            <tr>
                                <th className="p-3">User ID</th><th className="p-3">Tên</th>
                                <th className="p-3">Vai trò</th><th className="p-3 text-center">Trạng thái</th>
                                <th className="p-3">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-700/50">
                                    <td className="p-3 font-mono text-sm">{user.id}</td>
                                    <td className="p-3">{user.name}</td><td className="p-3">{user.role}</td>
                                    <td className="p-3 text-center"><span className={`px-2 py-1 text-xs rounded-full ${user.isLocked ? 'bg-red-800 text-red-300' : 'bg-green-800 text-green-300'}`}>{user.isLocked ? 'Đã khóa' : 'Hoạt động'}</span></td>
                                    <td className="p-3">{user.role !== 'ADMIN' && <button type="button" onClick={() => toggleUserLock(user.id)} className={`btn text-sm ${user.isLocked ? 'btn-primary' : 'btn-secondary border border-red-700 text-red-400'}`}>{user.isLocked ? '🔓 Mở khóa' : '🔒 Khóa'}</button>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">Gửi Thông báo Toàn hệ thống</h2>
                <form onSubmit={handleSendAnn} className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <input id="announcementInput" type="text" className="form-input flex-1" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
                    <button type="submit" className="btn btn-primary self-start sm:self-center">Gửi</button>
                </form>
            </div>

            <div className="card p-0 overflow-hidden">
                <h2 className="text-xl font-semibold p-6 border-b border-gray-700">Giám sát WAF (Demo)</h2>
                <div className="p-6">
                    <div className="bg-gray-900 p-4 rounded-lg font-mono text-xs h-80 overflow-y-auto custom-scrollbar border border-gray-700">
                        {wafLogs.map(log => (
                            <p key={log.id} className={`mb-1 ${log.type === 'XSS' || log.type === 'SQLi' ? 'text-red-400' : 'text-yellow-400'}`}>
                                <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span> [WAF] Blocked <span className="font-semibold">{log.type}</span> from <span className="underline">{log.ip}</span> on '{log.path}'
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default SecurityPage;
