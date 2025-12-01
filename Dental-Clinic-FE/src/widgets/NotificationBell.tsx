import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../app/providers/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { hasRole } from '../app/routes/shared/auth';
import { Bell } from 'lucide-react';

// NotificationBell component: notification bell with dropdown
const NotificationBell: React.FC = () => {
    // Lấy danh sách thông báo và hàm xử lý (Notification context)
    const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Đóng dropdown khi bấm ra ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Đánh dấu 1 thông báo là đã đọc
    const handleMarkAsRead = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        markAsRead(id);
    };

    // Xử lý click vào từng thông báo, điều hướng tới trang liên quan
    const handleNotificationClick = (notification: any) => {
        if (!notification.isRead) {
            markAsRead(notification.notificationId);
        }
        setIsOpen(false);

        // Điều hướng dựa vào loại thông báo
        const relatedEntityType = notification.relatedEntityType;
        if (!relatedEntityType) return;

        const isHR = hasRole('HR');
        const isAdmin = hasRole('ADMIN');

        switch (relatedEntityType.toUpperCase()) {
            case 'LEAVE_REQUEST':
                if (isHR) {
                    navigate('/hr/leave-requests');
                } else {
                    navigate('/my-leave-requests');
                }
                break;
            case 'ATTENDANCE':
                if (isHR) {
                    // HR: duyệt/phê duyệt giải trình
                    if (notification.type === 'EXPLANATION_SUBMITTED') {
                        navigate('/hr/attendance/explanations');
                    } else {
                        navigate('/hr/attendance');
                    }
                } else if (isAdmin) {
                    navigate('/admin/attendance');
                } else {
                    // Nhân viên xem bảng chấm công cá nhân
                    navigate('/my-attendance');
                }
                break;
            default:
                break;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-sm font-semibold rounded-full bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF] text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg flex items-center justify-center focus:outline-none"
            >
                <span className="sr-only">Open notifications</span>
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg border-2 border-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
                {/* Hiển thị trạng thái kết nối realtime */}
                <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-md ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                    title={isConnected ? 'Connected' : 'Disconnected'}
                ></span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-200/50">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-[#AACCFF]/10 via-[#6699FF]/10 to-[#3366FF]/10">
                        <h3 className="font-bold text-[#3366FF] text-base">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-xs text-[#3366FF] hover:text-[#6699FF] font-semibold flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg hover:bg-[#3366FF]/10"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="mx-auto text-gray-300 mb-3 text-4xl" aria-hidden>
                                    <Bell className="w-12 h-12 mx-auto text-gray-300" />
                                </div>
                                <p className="text-sm font-medium text-gray-500">No notifications yet</p>
                                <p className="text-xs text-gray-400 mt-1">Notifications you receive will appear here.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <li
                                        key={notification.notificationId}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 hover:bg-gradient-to-r hover:from-[#AACCFF]/5 hover:via-[#6699FF]/5 hover:to-[#3366FF]/5 transition-all cursor-pointer border-l-2 ${!notification.isRead
                                            ? 'bg-gradient-to-r from-[#AACCFF]/10 via-[#6699FF]/10 to-[#3366FF]/10 border-l-[#3366FF]'
                                            : 'border-l-transparent'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                                <p className={`text-sm ${!notification.isRead ? 'font-bold text-[#3366FF]' : 'font-medium text-gray-700'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-2">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                // Đánh dấu đã đọc notification này
                                                <button
                                                    onClick={(e) => handleMarkAsRead(e, notification.notificationId)}
                                                    className="text-gray-400 hover:text-[#3366FF] p-1.5 rounded-full hover:bg-gradient-to-r hover:from-[#AACCFF]/20 hover:via-[#6699FF]/20 hover:to-[#3366FF]/20 transition-all"
                                                    title="Mark as read"
                                                >
                                                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-[#3366FF] to-[#6699FF] rounded-full"></div>
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="p-3 bg-gradient-to-r from-[#AACCFF]/10 via-[#6699FF]/10 to-[#3366FF]/10 text-center border-t border-gray-100">
                        <button className="text-xs font-semibold text-[#3366FF] hover:text-[#6699FF] transition-colors">
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
