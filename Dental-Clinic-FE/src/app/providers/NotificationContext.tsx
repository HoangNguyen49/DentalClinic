import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import notificationApi, { type NotificationResponse } from '../../services/notificationApi';
import { getToken, getUser } from '../routes/shared/auth';
import { toast } from 'react-toastify';

// Định nghĩa kiểu context thông báo
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

    // Listener mẫu event emitter để các component khác có thể lắng nghe event notification
    const notificationListenersRef = useRef<Set<(notification: NotificationResponse) => void>>(new Set());

    // Lưu userId phục vụ việc nhận thông báo push và định danh realtime
    const userId = useMemo(() => {
        if (!user) return null;
        return user.userId || user.id || null;
    }, [user?.userId, user?.id]);

    // Hàm lấy số lượng notification chưa đọc
    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await notificationApi.countUnread();
            setUnreadCount(response.data);
        } catch (error) { }
    }, []);

    // Hàm lấy danh sách notification
    const fetchNotifications = useCallback(async (page = 0, size = 50) => {
        try {
            const response = await notificationApi.getNotifications(page, size);
            setNotifications(response.data.content);
        } catch (error) { }
    }, []);

    // Đánh dấu 1 notification đã đọc
    const markAsRead = async (id: number) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) { }
    };

    // Đánh dấu tất cả notification đã đọc
    const markAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) { }
    };

    // Cho phép các component khác đăng ký nhận event notification push
    const onNotificationReceived = useCallback((callback: (notification: NotificationResponse) => void) => {
        notificationListenersRef.current.add(callback);
        return () => {
            notificationListenersRef.current.delete(callback);
        };
    }, []);

    // Kết nối WebSocket để nhận push notification
    useEffect(() => {
        const token = getToken();
        if (!token || !userId) {
            return;
        }

        // Luôn fetch dữ liệu mới nhất từ API khi component mount
        fetchUnreadCount();
        fetchNotifications();

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
                console.log('[WebSocket] Connected successfully');
                setIsConnected(true);

                // Fetch lại lần nữa khi connect thành công để đảm bảo sync
                fetchUnreadCount();
                fetchNotifications();

                // Subscribe to the user-specific queue.
                // Spring's convertAndSendToUser sends to /user/queue/notifications (mapped to session)
                // Do NOT include userId in the path here.
                const destination = `/user/queue/notifications`;
                console.log('[WebSocket] Subscribing to:', destination);

                client.subscribe(destination, (message: IMessage) => {
                    console.log('[WebSocket] Received message:', message.body);
                    try {
                        const notification: NotificationResponse = JSON.parse(message.body);

                        // Cập nhật state ngay lập tức khi nhận WebSocket
                        setNotifications((prev) => {
                            const exists = prev.some(n => n.notificationId === notification.notificationId);
                            if (exists) return prev;
                            return [notification, ...prev];
                        });
                        setUnreadCount((prev) => prev + 1);

                        // Phát event notification tới tất cả listener đã đăng ký
                        notificationListenersRef.current.forEach((listener) => {
                            try {
                                listener(notification);
                            } catch (error) { }
                        });

                        // Hiện popup thông báo
                        try {
                            toast.success(`New Notification: ${notification.title}`, {
                                position: "top-right",
                                autoClose: 5000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                            });
                        } catch (toastError) { }
                    } catch (error) {
                        console.error('[WebSocket] Error parsing message:', error);
                    }
                });
            },
            onDisconnect: () => {
                console.log('[WebSocket] Disconnected');
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error('[WebSocket] Stomp Error:', frame);
                setIsConnected(false);
            },
            onWebSocketError: (event) => {
                console.error('[WebSocket] WebSocket Error:', event);
                setIsConnected(false);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
        };
    }, [userId]);

    // Đồng bộ định kỳ notification mỗi 30s để đảm bảo không bị miss
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

// Hook lấy context notification cho component
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
