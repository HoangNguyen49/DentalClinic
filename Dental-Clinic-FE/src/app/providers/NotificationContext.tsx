import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import notificationApi, { type NotificationResponse } from '../../services/notificationApi';
import { getToken, getUser } from '../routes/shared/auth';
import { toast } from 'react-toastify';

// Interface context thông báo (quản lý trạng thái và các hàm xử lý thông báo)
interface NotificationContextType {
    notifications: NotificationResponse[];
    unreadCount: number;
    isConnected: boolean;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    fetchNotifications: (page?: number, size?: number) => Promise<void>;
    onNotificationReceived: (callback: (notification: NotificationResponse) => void) => () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const stompClientRef = useRef<Client | null>(null);
    const user = getUser();

    // Danh sách listener được đăng ký để phát event notification realtime giữa các component
    const notificationListenersRef = useRef<Set<(notification: NotificationResponse) => void>>(new Set());

    // Lấy userId cho việc lắng nghe notification riêng của user
    const userId = useMemo(() => {
        if (!user) return null;
        return user.userId || user.id || null;
    }, [user?.userId, user?.id]);

    // Hàm lấy số lượng thông báo chưa đọc
    const fetchUnreadCount = useCallback(async () => {
        const token = getToken();
        if (!token) {
            return;
        }
        try {
            const response = await notificationApi.countUnread();
            setUnreadCount(response.data);
        } catch (error: any) {
            if (error.response?.status !== 401) {
                console.error('[Notification] Failed to fetch unread count:', error);
            }
        }
    }, []);

    // Hàm lấy danh sách thông báo (lọc bỏ audit logs)
    const fetchNotifications = useCallback(async (page = 0, size = 50) => {
        const token = getToken();
        if (!token) {
            return;
        }
        try {
            const response = await notificationApi.getNotifications(page, size);
            const filteredNotifications = response.data.content.filter(
                (n: NotificationResponse) => n.type?.toUpperCase() !== 'AUDIT'
            );
            setNotifications(filteredNotifications);
        } catch (error: any) {
            if (error.response?.status !== 401) {
                console.error('[Notification] Failed to fetch notifications:', error);
            }
        }
    }, []);

    // Đánh dấu một thông báo đã đọc
    const markAsRead = async (id: number) => {
        const token = getToken();
        if (!token) {
            return;
        }
        try {
            await notificationApi.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error: any) {
            if (error.response?.status !== 401) {
                console.error('[Notification] Failed to mark as read:', error);
            }
        }
    };

    // Đánh dấu tất cả thông báo đã đọc
    const markAllAsRead = async () => {
        const token = getToken();
        if (!token) {
            return;
        }
        try {
            await notificationApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error: any) {
            if (error.response?.status !== 401) {
                console.error('[Notification] Failed to mark all as read:', error);
            }
        }
    };

    // Đăng ký callback để lắng nghe sự kiện notification mới realtime (quản lý hủy bằng function trả về)
    const onNotificationReceived = useCallback((callback: (notification: NotificationResponse) => void) => {
        notificationListenersRef.current.add(callback);
        return () => {
            notificationListenersRef.current.delete(callback);
        };
    }, []);

    // Kết nối WebSocket để nhận push notification realtime từ server
    useEffect(() => {
        const token = getToken();
        if (!token || !userId) {
            return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const baseUrl = apiUrl.replace(/\/+$/, '');
        const socketUrl = `${baseUrl}/ws`;

        const client = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            debug: (str) => {
                console.log('[WebSocket Debug]:', str);
            },
            onConnect: () => {
                setIsConnected(true);
                // Khi connect thành công, đồng bộ lại các dữ liệu notification để tránh sót
                fetchUnreadCount();
                fetchNotifications();

                // Subcribe tới kênh notification dành riêng cho user hiện tại
                const destination = `/user/queue/notifications`;
                client.subscribe(destination, (message: IMessage) => {
                    try {
                        const notification: NotificationResponse = JSON.parse(message.body);

                        // Bỏ qua notification dạng AUDIT
                        if (notification.type?.toUpperCase() === 'AUDIT') {
                            return;
                        }

                        // Thêm notification mới vào đầu danh sách nếu chưa tồn tại (tránh trùng)
                        setNotifications((prev) => {
                            const exists = prev.some(n => n.notificationId === notification.notificationId);
                            if (exists) return prev;
                            return [notification, ...prev];
                        });
                        setUnreadCount((prev) => prev + 1);

                        // Phát tới các listener đã đăng ký
                        notificationListenersRef.current.forEach((listener) => {
                            try {
                                listener(notification);
                            } catch (error) {}
                        });

                        // Thông báo popup nhỏ khi có notification mới
                        try {
                            toast.success(`New Notification: ${notification.title}`, {
                                position: "top-right",
                                autoClose: 5000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                            });
                        } catch (toastError) {}
                    } catch (error) {
                        console.error('[WebSocket] Error parsing message:', error);
                    }
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
            },
            onStompError: () => {
                setIsConnected(false);
            },
            onWebSocketError: () => {
                setIsConnected(false);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.activate();
        stompClientRef.current = client;

        // Dọn dẹp khi unmount/kết thúc
        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
        };
    }, [userId]);

    // Đồng bộ lại notifications và số chưa đọc định kỳ mỗi 30s (chống miss sót!) 
    useEffect(() => {
        if (!userId) return;
        const syncInterval = setInterval(() => {
            fetchUnreadCount();
            fetchNotifications();
        }, 30000);
        return () => {
            clearInterval(syncInterval);
        };
    }, [userId, fetchUnreadCount, fetchNotifications]);

    // Memoize context để tránh re-render không cần thiết
    const contextValue = useMemo(() => ({
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
        onNotificationReceived,
    }), [notifications, unreadCount, isConnected, markAsRead, markAllAsRead, fetchNotifications, onNotificationReceived]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

// Hook sử dụng context notification (bắt buộc phải dùng trong NotificationProvider)
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
