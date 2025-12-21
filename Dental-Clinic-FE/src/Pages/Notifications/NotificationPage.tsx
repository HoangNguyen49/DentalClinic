import { useState, useEffect } from 'react';
import { useNotification } from '../../app/providers/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCircle2 } from 'lucide-react';
import { hasRole } from '../../app/routes/shared/auth';
import { useNavigate } from 'react-router-dom';
import Header from '../../widgets/Header/Header';
import Footer from '../../widgets/Footer/Footer';

const NotificationPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications, fetchUnreadCount, isMarkingAsRead, markingIds } = useNotification();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      await fetchNotifications();
      // Refresh unread count when opening notification screen (giống Mobile)
      await fetchUnreadCount();
      setLoading(false);
    };
    loadNotifications();
    // Chỉ chạy một lần khi component mount, không phụ thuộc vào functions để tránh re-render không cần thiết
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const handleNotificationClick = (notification: any) => {
    console.log('[NotificationPage] ===== handleNotificationClick CALLED =====');
    console.log('[NotificationPage] Notification:', notification);
    console.log('[NotificationPage] actionUrl:', notification.actionUrl);
    console.log('[NotificationPage] relatedEntityType:', notification.relatedEntityType);
    console.log('[NotificationPage] type:', notification.type);
    
    // Mark as read nếu chưa đọc (không block navigation)
    if (!notification.isRead) {
      console.log('[NotificationPage] Clicking notification, marking as read:', notification.notificationId);
      // Gọi markAsRead nhưng không await để không block navigation
      markAsRead(notification.notificationId).catch(err => {
        console.error('[NotificationPage] Error marking as read:', err);
      });
    }

    // Nếu có actionUrl, ưu tiên dùng actionUrl
    if (notification.actionUrl && notification.actionUrl.trim() !== '') {
      console.log('[NotificationPage] Navigating to actionUrl:', notification.actionUrl);
      try {
        const navPath = notification.actionUrl.trim();
        console.log('[NotificationPage] Calling navigate with path:', navPath);
        navigate(navPath);
        console.log('[NotificationPage] navigate() called successfully');
        return;
      } catch (error) {
        console.error('[NotificationPage] Navigation error:', error);
        // Fallback: ở lại trang hiện tại
      }
    }

    const relatedEntityType = notification.relatedEntityType;
    if (!relatedEntityType || relatedEntityType.trim() === '') {
      // Nếu không có relatedEntityType và actionUrl, ở lại trang hiện tại
      console.log('[NotificationPage] No relatedEntityType, staying on current page');
      return;
    }

    const isHR = hasRole('HR');
    const isAdmin = hasRole('ADMIN');
    
    console.log('[NotificationPage] isHR:', isHR, 'isAdmin:', isAdmin);
    console.log('[NotificationPage] Processing relatedEntityType:', relatedEntityType.toUpperCase());

    switch (relatedEntityType.toUpperCase()) {
      case 'LEAVE_REQUEST':
        try {
          if (isAdmin) {
            console.log('[NotificationPage] Navigating to /admin/leave-requests');
            navigate('/admin/leave-requests');
          } else if (isHR) {
            console.log('[NotificationPage] Navigating to /hr/leave-requests');
            navigate('/hr/leave-requests');
          } else {
            console.log('[NotificationPage] Navigating to /my-leave-requests');
            navigate('/my-leave-requests');
          }
        } catch (error) {
          console.error('[NotificationPage] Navigation error for LEAVE_REQUEST:', error);
        }
        break;
      case 'ATTENDANCE':
        try {
          if (isHR) {
            if (notification.type === 'EXPLANATION_SUBMITTED') {
              console.log('[NotificationPage] Navigating to /hr/attendance/explanations');
              navigate('/hr/attendance/explanations');
            } else {
              console.log('[NotificationPage] Navigating to /hr/attendance');
              navigate('/hr/attendance');
            }
          } else if (isAdmin) {
            console.log('[NotificationPage] Navigating to /admin/attendance');
            navigate('/admin/attendance');
          } else {
            // ATTENDANCE_CHECKIN, ATTENDANCE_CHECKOUT, ATTENDANCE_ABSENT, EXPLANATION_APPROVED (MISSING_CHECK_OUT), EXPLANATION_REJECTED
            console.log('[NotificationPage] Navigating to /my-attendance');
            navigate('/my-attendance');
          }
        } catch (error) {
          console.error('[NotificationPage] Navigation error for ATTENDANCE:', error);
        }
        break;
      case 'APPOINTMENT':
        // Thông báo về lịch hẹn (tạo mới, xác nhận, hủy, hoàn thành, nhắc nhở, v.v.)
        console.log('[NotificationPage] APPOINTMENT type:', notification.type);
        try {
          let navPath = '';
          if (notification.actionUrl && notification.actionUrl.trim() !== '') {
            navPath = notification.actionUrl.trim();
          } else {
            // Dựa vào role để điều hướng đúng
            if (hasRole('DOCTOR')) {
              navPath = '/doctor/appointments';
            } else if (hasRole('RECEPTION')) {
              navPath = '/reception/appointments';
            } else if (hasRole('PATIENT') || hasRole('USER')) {
              navPath = '/my-appointments';
            } else {
              navPath = '/my-appointments'; // Fallback
            }
          }
          console.log('[NotificationPage] Navigating to:', navPath);
          console.log('[NotificationPage] Calling navigate with path:', navPath);
          navigate(navPath);
          console.log('[NotificationPage] navigate() called successfully');
        } catch (error) {
          console.error('[NotificationPage] Navigation error for APPOINTMENT:', error);
        }
        break;
      case 'MEDICAL_RECORD':
        // Thông báo về bệnh án (hoàn thành, cập nhật)
        try {
          let navPath = '';
          if (notification.actionUrl && notification.actionUrl.trim() !== '') {
            navPath = notification.actionUrl.trim();
          } else {
            // Doctor xem medical records của patients
            if (hasRole('DOCTOR')) {
              navPath = '/doctor/dashboard'; // Fallback về dashboard vì cần patientId
            } else {
              navPath = '/patient-profile'; // Patient xem profile của mình
            }
          }
          console.log('[NotificationPage] Navigating to:', navPath);
          console.log('[NotificationPage] Calling navigate with path:', navPath);
          navigate(navPath);
          console.log('[NotificationPage] navigate() called successfully');
        } catch (error) {
          console.error('[NotificationPage] Navigation error for MEDICAL_RECORD:', error);
        }
        break;
      case 'DOCTOR_SCHEDULE':
        // Thông báo về bác sĩ chưa check-in hoặc check-in trễ
        try {
          if (notification.type === 'DOCTOR_MISSING_CHECKIN' || notification.type === 'DOCTOR_LATE_CHECKIN') {
            if (isHR) {
              console.log('[NotificationPage] Navigating to /hr/attendance');
              navigate('/hr/attendance');
            } else if (isAdmin) {
              console.log('[NotificationPage] Navigating to /admin/attendance');
              navigate('/admin/attendance');
            } else if (hasRole('RECEPTION')) {
              console.log('[NotificationPage] Navigating to /hr/attendance (RECEPTION)');
              navigate('/hr/attendance');
            } else {
              console.log('[NotificationPage] Navigating to /my-attendance');
              navigate('/my-attendance');
            }
          } else if (notification.actionUrl && notification.actionUrl.trim() !== '') {
            console.log('[NotificationPage] Navigating to actionUrl:', notification.actionUrl);
            navigate(notification.actionUrl);
          } else {
            console.log('[NotificationPage] Fallback: Navigating to /my-attendance');
            navigate('/my-attendance');
          }
        } catch (error) {
          console.error('[NotificationPage] Navigation error for DOCTOR_SCHEDULE:', error);
        }
        break;
      case 'SCHEDULE':
        // Thông báo về lịch làm việc bị hủy hoặc khôi phục (do holiday)
        try {
          let navPath = '';
          if (notification.actionUrl && notification.actionUrl.trim() !== '') {
            navPath = notification.actionUrl.trim();
          } else {
            // Điều hướng đến trang lịch làm việc
            if (isHR) {
              navPath = '/hr/schedules';
            } else if (hasRole('DOCTOR')) {
              navPath = '/doctor/schedule';
            } else {
              navPath = '/doctor/schedule'; // Fallback
            }
          }
          console.log('[NotificationPage] Navigating to:', navPath);
          console.log('[NotificationPage] Calling navigate with path:', navPath);
          navigate(navPath);
          console.log('[NotificationPage] navigate() called successfully');
        } catch (error) {
          console.error('[NotificationPage] Navigation error for SCHEDULE:', error);
        }
        break;
      case 'HOLIDAY':
        // Thông báo về ngày nghỉ lễ
        try {
          let navPath = '';
          if (notification.actionUrl && notification.actionUrl.trim() !== '') {
            navPath = notification.actionUrl.trim();
          } else {
            // Điều hướng đến trang quản lý system (nếu là admin) hoặc trang chủ
            if (isAdmin) {
              navPath = '/admin/system'; // System config page
            } else {
              navPath = '/';
            }
          }
          console.log('[NotificationPage] Navigating to:', navPath);
          console.log('[NotificationPage] Calling navigate with path:', navPath);
          navigate(navPath);
          console.log('[NotificationPage] navigate() called successfully');
        } catch (error) {
          console.error('[NotificationPage] Navigation error for HOLIDAY:', error);
        }
        break;
      case 'FACEPROFILEUPDATEREQUEST':
        // Thông báo về yêu cầu duyệt cập nhật khuôn mặt
        try {
          let navPath = '';
          if (notification.actionUrl && notification.actionUrl.trim() !== '') {
            navPath = notification.actionUrl.trim();
          } else {
            if (isHR || isAdmin) {
              // HR/Admin: điều hướng đến trang duyệt face profile
              navPath = '/hr/face-profile-approvals';
            } else {
              // Nhân viên: xem trạng thái yêu cầu của mình
              navPath = '/my-account'; // Profile page
            }
          }
          console.log('[NotificationPage] Navigating to:', navPath);
          console.log('[NotificationPage] Calling navigate with path:', navPath);
          navigate(navPath);
          console.log('[NotificationPage] navigate() called successfully');
        } catch (error) {
          console.error('[NotificationPage] Navigation error for FACEPROFILEUPDATEREQUEST:', error);
        }
        break;
      default:
        console.log('[NotificationPage] Default case, relatedEntityType:', relatedEntityType);
        try {
          if (notification.actionUrl && notification.actionUrl.trim() !== '') {
            console.log('[NotificationPage] Navigating to actionUrl:', notification.actionUrl);
            navigate(notification.actionUrl);
          } else {
            console.log('[NotificationPage] No actionUrl in default case, staying on current page');
          }
        } catch (error) {
          console.error('[NotificationPage] Navigation error in default case:', error);
        }
        break;
    }
    
    console.log('[NotificationPage] ===== handleNotificationClick COMPLETED =====');
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#AACCFF]/10 via-[#6699FF]/10 to-[#3366FF]/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-8 h-8 text-[#3366FF]" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-sm text-gray-600 mt-1">
                      {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      console.log('[NotificationPage] Mark all as read button clicked');
                      markAllAsRead().catch(err => {
                        console.error('[NotificationPage] Error in markAllAsRead:', err);
                      });
                    }}
                    disabled={isMarkingAsRead}
                    className={`px-4 py-2 text-sm font-semibold text-[#3366FF] hover:text-[#254EDB] bg-white border border-[#3366FF] rounded-lg hover:bg-[#3366FF]/10 transition-colors flex items-center gap-2 ${
                      isMarkingAsRead ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isMarkingAsRead ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#3366FF] border-t-transparent rounded-full animate-spin"></div>
                        Marking...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Mark all as read
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === 'all'
                      ? 'bg-[#3366FF] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === 'unread'
                      ? 'bg-[#3366FF] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3366FF]"></div>
                  <p className="mt-4 text-gray-500">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-lg font-medium text-gray-900">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {filter === 'unread' 
                      ? 'You\'re all caught up!' 
                      : 'Notifications you receive will appear here.'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.notificationId}
                    onClick={(e) => {
                      console.log('[NotificationPage] div onClick triggered for notification:', notification.notificationId);
                      // Chỉ handle click nếu không phải click vào button mark as read
                      const target = e.target as HTMLElement;
                      if (target.closest('button[type="button"]')) {
                        console.log('[NotificationPage] Click detected on button, skipping div onClick');
                        return; // Button sẽ handle event của nó
                      }
                      console.log('[NotificationPage] Calling handleNotificationClick');
                      e.preventDefault();
                      e.stopPropagation();
                      handleNotificationClick(notification);
                    }}
                    className={`p-6 hover:bg-gradient-to-r hover:from-[#AACCFF]/5 hover:via-[#6699FF]/5 hover:to-[#3366FF]/5 transition-all duration-200 cursor-pointer border-l-4 ${
                      !notification.isRead
                        ? 'bg-gradient-to-r from-[#AACCFF]/10 via-[#6699FF]/10 to-[#3366FF]/10 border-l-[#3366FF]'
                        : 'border-l-transparent bg-white'
                    }`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${
                        !notification.isRead ? 'bg-[#3366FF]' : 'bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className={`text-base ${!notification.isRead ? 'font-bold text-[#3366FF]' : 'font-semibold text-gray-900'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                              <p className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </p>
                              {notification.priority && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  notification.priority === 'HIGH' 
                                    ? 'bg-red-100 text-red-700'
                                    : notification.priority === 'MEDIUM'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {notification.priority}
                                </span>
                              )}
                            </div>
                          </div>
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                markAsRead(notification.notificationId);
                              }}
                              disabled={markingIds.has(notification.notificationId)}
                              className={`flex-shrink-0 text-gray-400 hover:text-[#3366FF] p-2 rounded-full hover:bg-gradient-to-r hover:from-[#AACCFF]/20 hover:via-[#6699FF]/20 hover:to-[#3366FF]/20 transition-all ${
                                markingIds.has(notification.notificationId) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                              title="Mark as read"
                              type="button"
                            >
                              {markingIds.has(notification.notificationId) ? (
                                <div className="w-5 h-5 border-2 border-[#3366FF] border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <CheckCircle2 className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotificationPage;

