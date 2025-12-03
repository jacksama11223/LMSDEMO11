
import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { DataContext } from '../../contexts/AppProviders';

const NotificationBell: React.FC = () => {
  const { db, dismissAnnouncement } = useContext(DataContext)!;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const announcements = useMemo(() => db.ANNOUNCEMENTS || [], [db.ANNOUNCEMENTS]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-white relative p-1">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        {announcements.length > 0 && (
          <span className="absolute top-0 right-0 h-3 w-3 flex items-center justify-center">
             <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 card p-0 overflow-hidden z-20 shadow-xl">
          <div className="p-3 border-b border-gray-700">
            <h3 className="font-semibold text-gray-200">Thông báo</h3>
          </div>
          {announcements.length === 0 ? (
            <p className="text-gray-400 text-sm p-4">Không có thông báo mới.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {announcements.map(ann => (
                <div key={ann.id} className="p-3 border-b border-gray-700 last:border-b-0 hover:bg-gray-700">
                  <p className="text-sm text-gray-300">{ann.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(ann.timestamp).toLocaleString()}</p>
                  <button
                    onClick={() => dismissAnnouncement(ann.id)}
                    className="text-xs text-blue-400 hover:underline mt-1"
                  >
                    Đánh dấu đã đọc
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
