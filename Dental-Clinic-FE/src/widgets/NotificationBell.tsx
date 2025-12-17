import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../app/providers/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { hasRole } from '../app/routes/shared/auth';
import { Bell } from 'lucide-react';

// NotificationBell component: notification bell with dropdown
const NotificationBell: React.FC = () => {
    // Lấy danh sách thông báo và hàm xử lý (Notification context)
    const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected, isMarkingAsRead, markingIds, fetchNotifications, fetchUnreadCount, onNotificationReceived } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [badgeAnimation, setBadgeAnimation] = useState<'bounce' | 'pulse' | ''>('');
    const prevUnreadCountRef = useRef(unreadCount);

    // Refresh notifications và unread count khi mở dropdown (giống Mobile - refresh khi mở screen)
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
            fetchUnreadCount();
        }
        // Chỉ phụ thuộc vào isOpen, không phụ thuộc vào functions để tránh re-render không cần thiết
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

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

    // Thêm CSS animation tùy chỉnh vào document
    useEffect(() => {
        const styleId = 'notification-badge-animation';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @keyframes badgePop {
                    0% { 
                        transform: scale(1) translateY(0); 
                    }
                    25% { 
                        transform: scale(1.4) translateY(-6px); 
                    }
                    50% { 
                        transform: scale(1.2) translateY(-3px); 
                    }
                    75% { 
                        transform: scale(1.1) translateY(-1px); 
                    }
                    100% { 
                        transform: scale(1) translateY(0); 
                    }
                }
                .animate-badgePop {
                    animation: badgePop 0.6s ease-in-out;
                }
            `;
            document.head.appendChild(style);
        }
        return () => {
            // Không xóa style vì có thể component khác cũng dùng
        };
    }, []);

    // Animation khi số thông báo thay đổi (fallback nếu callback không trigger)
    useEffect(() => {
        // Nếu số thông báo tăng lên (có thông báo mới)
        if (unreadCount > prevUnreadCountRef.current) {
            // Animation bounce khi có thông báo mới
            setBadgeAnimation('bounce');
            // Reset animation sau khi hoàn thành
            const timer = setTimeout(() => {
                setBadgeAnimation('');
            }, 600);
            return () => clearTimeout(timer);
        }
        // Cập nhật previous count
        prevUnreadCountRef.current = unreadCount;
    }, [unreadCount]);

    // Nhận notification mới trực tiếp từ WebSocket (realtime, không đợi state update)
    useEffect(() => {
        const unsubscribe = onNotificationReceived(() => {
            // Trigger animation ngay lập tức khi nhận notification mới
            setBadgeAnimation('bounce');
            // Reset animation sau khi hoàn thành
            setTimeout(() => {
                setBadgeAnimation('');
            }, 600);
        });
        return unsubscribe;
    }, [onNotificationReceived]);

    // Đánh dấu 1 thông báo là đã đọc (giống Mobile - đơn giản)
    const handleMarkAsRead = useCallback((e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        e.preventDefault();
        markAsRead(id).catch((error) => {
            console.error('[NotificationBell] Error in markAsRead:', error);
        });
    }, [markAsRead]);

    // Helper function để navigate với delay nhỏ để đảm bảo dropdown đóng trước
    const navigateWithDelay = useCallback((path: string) => {
        setTimeout(() => {
            try {
                navigate(path);
            } catch (error) {
                console.error('[NotificationBell] Navigation error:', error);
            }
        }, 150);
    }, [navigate]);

    // Xử lý click vào từng thông báo, điều hướng tới trang liên quan
    const handleNotificationClick = (notification: any) => {
        // Mark as read nếu chưa đọc (không block navigation) - giống Mobile
        if (!notification.isRead) {
            // Gọi markAsRead nhưng không await để không block navigation
            markAsRead(notification.notificationId).catch(err => {
                console.error('[NotificationBell] Error marking as read:', err);
            });
        }
        
        // Đóng dropdown trước khi navigate
        setIsOpen(false);

        // Điều hướng dựa vào loại thông báo (không đợi markAsRead)
        const relatedEntityType = notification.relatedEntityType;
        
        // Nếu có actionUrl, ưu tiên dùng actionUrl
        if (notification.actionUrl && notification.actionUrl.trim() !== '') {
            const navPath = notification.actionUrl.trim();
            navigateWithDelay(navPath);
            return;
        }
        
        if (!relatedEntityType || relatedEntityType.trim() === '') {
            // Nếu không có relatedEntityType và actionUrl, điều hướng đến trang notifications
            navigateWithDelay('/notifications');
            return;
        }

        const isHR = hasRole('HR');
        const isAdmin = hasRole('ADMIN');

        switch (relatedEntityType.toUpperCase()) {
            case 'LEAVE_REQUEST':
                try {
                    let navPath = '';
                    if (isAdmin) {
                        navPath = '/admin/leave-requests';
                    } else if (isHR) {
                        navPath = '/hr/leave-requests';
                    } else {
                        navPath = '/my-leave-requests';
                    }
                    navigateWithDelay(navPath);
                } catch (error) {
                    console.error('[NotificationBell] Navigation error for LEAVE_REQUEST:', error);
                }
                break;
            case 'ATTENDANCE':
                try {
                        if (isHR) {
                            // HR: duyệt/phê duyệt giải trình
                            if (notification.type === 'EXPLANATION_SUBMITTED') {
                                navigateWithDelay('/hr/attendance/explanations');
                            } else {
                                navigateWithDelay('/hr/attendance');
                            }
                        } else if (isAdmin) {
                            navigateWithDelay('/admin/attendance');
                        } else {
                            // Nhân viên xem bảng chấm công cá nhân
                            // ATTENDANCE_CHECKIN, ATTENDANCE_CHECKOUT, ATTENDANCE_ABSENT, EXPLANATION_APPROVED, EXPLANATION_REJECTED
                            navigateWithDelay('/my-attendance');
                        }
                } catch (error) {
                    console.error('[NotificationBell] Navigation error for ATTENDANCE:', error);
                }
                break;
            case 'APPOINTMENT':
                // Thông báo về lịch hẹn (tạo mới, xác nhận, hủy, hoàn thành, nhắc nhở, v.v.)
                try {
                    // Dựa vào role để điều hướng đúng
                    let navPath = '';
                    if (hasRole('DOCTOR')) {
                        navPath = '/doctor/appointments';
                    } else if (hasRole('RECEPTION')) {
                        navPath = '/reception/appointments';
                    } else if (hasRole('PATIENT') || hasRole('USER')) {
                        navPath = '/my-appointments';
                    } else {
                        navPath = '/my-appointments'; // Fallback
                    }
                    navigateWithDelay(navPath);
                } catch (error) {
                    console.error('[NotificationBell] Navigation error for APPOINTMENT:', error);
                }
                break;
            case 'MEDICAL_RECORD':
                // Thông báo về bệnh án (hoàn thành, cập nhật)
                try {
                    // Doctor xem medical records của patients
                    let navPath = '';
                    if (hasRole('DOCTOR')) {
                        navPath = '/doctor/dashboard'; // Fallback về dashboard vì cần patientId
                    } else {
                        navPath = '/patient-profile'; // Patient xem profile của mình
                    }
                    navigateWithDelay(navPath);
                } catch (error) {
                    console.error('[NotificationBell] Navigation error for MEDICAL_RECORD:', error);
                }
                break;
            case 'DOCTOR_SCHEDULE':
                // Thông báo về bác sĩ chưa check-in hoặc check-in trễ
                try {
                    if (notification.type === 'DOCTOR_MISSING_CHECKIN' || notification.type === 'DOCTOR_LATE_CHECKIN') {
                        if (isHR) {
                            navigateWithDelay('/hr/attendance');
                        } else if (isAdmin) {
                            navigateWithDelay('/admin/attendance');
                        } else if (hasRole('RECEPTION')) {
                            navigateWithDelay('/hr/attendance');
                        } else {
                            navigateWithDelay('/my-attendance');
                        }
                    } else {
                        // Fallback cho các type khác của DOCTOR_SCHEDULE
                        navigateWithDelay('/my-attendance');
                    }
                } catch (error) {
                    console.error('[NotificationBell] Navigation error for DOCTOR_SCHEDULE:', error);
                }
                break;
            case 'SCHEDULE':
                // Thông báo về lịch làm việc bị hủy hoặc khôi phục (do holiday)
                try {
                    // Điều hướng đến trang lịch làm việc
                    let navPath = '';
                    if (isHR) {
                        navPath = '/hr/schedules';
                    } else if (hasRole('DOCTOR')) {
                        navPath = '/doctor/schedule';
                    } else {
                        navPath = '/doctor/schedule'; // Fallback
                    }
                    navigateWithDelay(navPath);
                } catch (error) {
                    console.error('[NotificationBell] Navigation error for SCHEDULE:', error);
                }
                break;
            case 'HOLIDAY':
                // Thông báo về ngày nghỉ lễ
                try {
                    // Điều hướng đến trang quản lý system (nếu là admin) hoặc trang chủ
                    let navPath = '';
                    if (isAdmin) {
                        navPath = '/admin/system'; // System config page
                    } else {
                        navPath = '/';
                    }
                    navigateWithDelay(navPath);
                } catch (error) {
                    console.error('[NotificationBell] Navigation error for HOLIDAY:', error);
                }
                break;
            case 'FACEPROFILEUPDATEREQUEST':
                // Thông báo về yêu cầu duyệt cập nhật khuôn mặt
                try {
                    let navPath = '';
                    if (isHR || isAdmin) {
                        // HR/Admin: điều hướng đến trang duyệt face profile
                        navPath = '/hr/face-profile-approvals';
                    } else {
                        // Nhân viên: xem trạng thái yêu cầu của mình
                        navPath = '/my-account'; // Profile page
                    }
                    navigateWithDelay(navPath);
                } catch (error) {
                    console.error('[NotificationBell] Navigation error for FACEPROFILEUPDATEREQUEST:', error);
                }
                break;
            default:
                // Fallback: Điều hướng đến trang danh sách notifications
                // (actionUrl đã được xử lý ở trên, nên đến đây chắc chắn không có actionUrl)
                try {
                    navigateWithDelay('/notifications');
                } catch (error) {
                    console.error('[NotificationBell] Navigation error in default case:', error);
                }
                break;
        }
    };

    // Tính toán vị trí dropdown dựa trên button position
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Tính toán và cập nhật vị trí dropdown khi mở hoặc khi scroll/resize
    useEffect(() => {
        const updatePosition = () => {
            if (isOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + 8, // mt-2 = 8px
                    right: window.innerWidth - rect.right
                });
            } else {
                setDropdownPosition(null);
            }
        };

        updatePosition();

        // Cập nhật position khi scroll hoặc resize
        if (isOpen) {
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-sm font-semibold rounded-full bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF] text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg flex items-center justify-center focus:outline-none"
            >
                <span className="sr-only">Open notifications</span>
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span 
                        className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg border-2 border-white transition-all duration-300 ${
                            badgeAnimation === 'bounce' 
                                ? 'animate-badgePop' 
                                : ''
                        }`}
                        key={`badge-${unreadCount}`}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
                {/* Hiển thị trạng thái kết nối realtime */}
                <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-md ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                    title={isConnected ? 'Connected' : 'Disconnected'}
                ></span>
            </button>

            {isOpen && dropdownPosition && typeof document !== 'undefined' && createPortal(
                <>
                    {/* Backdrop overlay */}
                    <div 
                        className="fixed inset-0 bg-black/10 z-[99998]"
                        onClick={(e) => {
                            // Chỉ đóng dropdown nếu click vào backdrop, không phải vào dropdown panel
                            const target = e.target as HTMLElement;
                            if (target.classList.contains('bg-black/10') || target === e.currentTarget) {
                                setIsOpen(false);
                            }
                        }}
                    />
                    {/* Dropdown panel - sử dụng fixed positioning với z-index rất cao để đảm bảo luôn ở trên cùng */}
                    <div 
                        className="fixed w-80 sm:w-96 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200/50 z-[99999]"
                        style={{
                            top: `${dropdownPosition.top}px`,
                            right: `${dropdownPosition.right}px`,
                            pointerEvents: 'auto'
                        }}
                        onMouseDown={(e) => {
                            // Ngăn backdrop đóng dropdown khi click vào panel
                            e.stopPropagation();
                        }}
                    >
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-[#AACCFF]/10 via-[#6699FF]/10 to-[#3366FF]/10">
                            <h3 className="font-bold text-[#3366FF] text-base">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            
                                            if (isMarkingAsRead) {
                                                return;
                                            }
                                            
                                            if (!markAllAsRead) {
                                                console.error('[NotificationBell] markAllAsRead function is undefined!');
                                                return;
                                            }
                                            
                                            markAllAsRead().catch(err => {
                                                console.error('[NotificationBell] Error in markAllAsRead:', err);
                                            });
                                        }}
                                        disabled={isMarkingAsRead}
                                        style={{ pointerEvents: 'auto', zIndex: 10000 }}
                                        className={`text-xs text-[#3366FF] hover:text-[#6699FF] font-semibold flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg hover:bg-[#3366FF]/10 ${
                                            isMarkingAsRead ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                        }`}
                                    >
                                        {isMarkingAsRead ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-[#3366FF] border-t-transparent rounded-full animate-spin"></div>
                                                Marking...
                                            </>
                                        ) : (
                                            'Mark all as read'
                                        )}
                                    </button>
                                )}
                            </div>
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
                                            onClick={(e) => {
                                                // Ngăn event bubble lên backdrop để không đóng dropdown
                                                e.stopPropagation();
                                                
                                                // Chỉ handle click nếu không phải click vào button mark as read
                                                const target = e.target as HTMLElement;
                                                const clickedButton = target.closest('button[type="button"]');
                                                
                                                if (clickedButton) {
                                                    return; // Button sẽ handle event của nó
                                                }
                                                
                                                // Gọi handleNotificationClick để điều hướng
                                                handleNotificationClick(notification);
                                            }}
                                            className={`p-4 hover:bg-gradient-to-r hover:from-[#AACCFF]/5 hover:via-[#6699FF]/5 hover:to-[#3366FF]/5 transition-all duration-200 cursor-pointer border-l-2 ${!notification.isRead
                                                ? 'bg-gradient-to-r from-[#AACCFF]/10 via-[#6699FF]/10 to-[#3366FF]/10 border-l-[#3366FF]'
                                                : 'border-l-transparent bg-white'
                                                }`}
                                            style={{ pointerEvents: 'auto' }}
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
                                                {!notification.isRead ? (
                                                    // Đánh dấu đã đọc notification này
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            handleMarkAsRead(e, notification.notificationId);
                                                        }}
                                                        onMouseDown={(e) => {
                                                            // Ngăn event bubble lên li element
                                                            e.stopPropagation();
                                                        }}
                                                        disabled={markingIds.has(notification.notificationId)}
                                                        className={`text-gray-400 hover:text-[#3366FF] p-2 rounded-full hover:bg-gradient-to-r hover:from-[#AACCFF]/20 hover:via-[#6699FF]/20 hover:to-[#3366FF]/20 transition-all duration-200 z-10 relative ${
                                                            markingIds.has(notification.notificationId) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                                        }`}
                                                        title="Mark as read"
                                                        style={{ pointerEvents: 'auto', zIndex: 10, minWidth: '28px', minHeight: '28px' }}
                                                    >
                                                        {markingIds.has(notification.notificationId) ? (
                                                            <div className="w-4 h-4 border-2 border-[#3366FF] border-t-transparent rounded-full animate-spin"></div>
                                                        ) : (
                                                            <div className="w-4 h-4 bg-gradient-to-r from-[#3366FF] to-[#6699FF] rounded-full transition-transform duration-200 hover:scale-110"></div>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <div className="w-3 h-3"></div> // Spacer để giữ layout
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="p-3 bg-gradient-to-r from-[#AACCFF]/10 via-[#6699FF]/10 to-[#3366FF]/10 text-center border-t border-gray-100">
                            <button 
                                onClick={() => navigate('/notifications')}
                                className="text-xs font-semibold text-[#3366FF] hover:text-[#6699FF] transition-colors"
                            >
                                View all notifications
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

export default NotificationBell;
