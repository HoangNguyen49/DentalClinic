import { useState, useEffect } from 'react';
import { useNotification } from '../../app/providers/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCircle2 } from 'lucide-react';
import { hasRole } from '../../app/routes/shared/auth';
import { useNavigate } from 'react-router-dom';
import Header from '../../widgets/Header/Header';
import Footer from '../../widgets/Footer/Footer';

const NotificationPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotification();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    };
    loadNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.notificationId);
    }

    const relatedEntityType = notification.relatedEntityType;
    if (!relatedEntityType) return;

    const isHR = hasRole('HR');
    const isAdmin = hasRole('ADMIN');

    switch (relatedEntityType.toUpperCase()) {
      case 'LEAVE_REQUEST':
        if (isAdmin) {
          navigate('/admin/leave-requests');
        } else if (isHR) {
          navigate('/hr/leave-requests');
        } else {
          navigate('/my-leave-requests');
        }
        break;
      case 'ATTENDANCE':
        if (isHR) {
          if (notification.type === 'EXPLANATION_SUBMITTED') {
            navigate('/hr/attendance/explanations');
          } else {
            navigate('/hr/attendance');
          }
        } else if (isAdmin) {
          navigate('/admin/attendance');
        } else {
          navigate('/my-attendance');
        }
        break;
      case 'APPOINTMENT':
        // Thông báo về lịch hẹn (xác nhận, hủy, hoàn thành, v.v.)
        if (notification.type === 'APPOINTMENT_CONFIRMED' || 
            notification.type === 'APPOINTMENT_CANCELLED' ||
            notification.type === 'APPOINTMENT_COMPLETED' ||
            notification.type === 'APPOINTMENT_IN_PROGRESS' ||
            notification.type === 'APPOINTMENT_STATUS_UPDATED' ||
            notification.type === 'APPOINTMENT_REMINDER') {
          navigate('/appointments');
        } else if (notification.actionUrl) {
          navigate(notification.actionUrl);
        } else {
          navigate('/appointments');
        }
        break;
      case 'MEDICAL_RECORD':
        // Thông báo về bệnh án (hoàn thành, cập nhật)
        if (notification.type === 'MEDICAL_RECORD_COMPLETED' || 
            notification.type === 'MEDICAL_RECORD_UPDATED') {
          navigate('/patients/records');
        } else if (notification.actionUrl) {
          navigate(notification.actionUrl);
        } else {
          navigate('/patients/records');
        }
        break;
      case 'DOCTOR_SCHEDULE':
        // Thông báo về bác sĩ chưa check-in hoặc check-in trễ
        if (notification.type === 'DOCTOR_MISSING_CHECKIN' || notification.type === 'DOCTOR_LATE_CHECKIN') {
          if (isHR) {
            navigate('/hr/attendance');
          } else if (isAdmin) {
            navigate('/admin/attendance');
          } else if (hasRole('RECEPTION')) {
            navigate('/hr/attendance');
          } else {
            navigate('/my-attendance');
          }
        } else if (notification.actionUrl) {
          navigate(notification.actionUrl);
        }
        break;
      default:
        if (notification.actionUrl) {
          navigate(notification.actionUrl);
        }
        break;
    }
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
                    onClick={markAllAsRead}
                    className="px-4 py-2 text-sm font-semibold text-[#3366FF] hover:text-[#254EDB] bg-white border border-[#3366FF] rounded-lg hover:bg-[#3366FF]/10 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark all as read
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
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-6 hover:bg-gradient-to-r hover:from-[#AACCFF]/5 hover:via-[#6699FF]/5 hover:to-[#3366FF]/5 transition-all cursor-pointer border-l-4 ${
                      !notification.isRead
                        ? 'bg-gradient-to-r from-[#AACCFF]/10 via-[#6699FF]/10 to-[#3366FF]/10 border-l-[#3366FF]'
                        : 'border-l-transparent'
                    }`}
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
                                markAsRead(notification.notificationId);
                              }}
                              className="flex-shrink-0 text-gray-400 hover:text-[#3366FF] p-2 rounded-full hover:bg-gradient-to-r hover:from-[#AACCFF]/20 hover:via-[#6699FF]/20 hover:to-[#3366FF]/20 transition-all"
                              title="Mark as read"
                            >
                              <CheckCircle2 className="w-5 h-5" />
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

