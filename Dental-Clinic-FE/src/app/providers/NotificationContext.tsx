import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import notificationApi, { type NotificationResponse } from '../../services/notificationApi';
import { getToken, getUser } from '../routes/shared/auth';
import { toast } from 'react-toastify';
import { initializeFirebase } from '../../config/firebase';
import { firestoreNotificationService } from '../../services/firestoreNotificationService';

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
    const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);
    const stompClientRef = useRef<Client | null>(null);
    const firestoreUnsubscribeRef = useRef<(() => void) | null>(null);
    const user = getUser();

    // Listener mẫu event emitter để các component khác có thể lắng nghe event notification
    const notificationListenersRef = useRef<Set<(notification: NotificationResponse) => void>>(new Set());

    // Debounce việc sync unreadCount để tránh cập nhật nhiều lần liên tiếp
    const syncUnreadCountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Lưu userId phục vụ việc nhận thông báo push và định danh realtime
    const userId = useMemo(() => {
        if (!user) return null;
        return user.userId || user.id || null;
    }, [user?.userId, user?.id]);

    // Hàm lấy số lượng notification chưa đọc (ưu tiên Firestore, fallback SQL)
    const fetchUnreadCount = useCallback(async () => {
        try {
            if (isFirestoreConnected && userId) {
                const count = await firestoreNotificationService.countUnread(userId);
                setUnreadCount(count);
                return;
            }
        } catch (error) {}
        try {
            const response = await notificationApi.countUnread();
            setUnreadCount(response.data);
        } catch (error) {}
    }, [isFirestoreConnected, userId]);

    // Hàm lấy danh sách notification (chỉ dùng khi Firestore không active)
    const fetchNotifications = useCallback(async (page = 0, size = 50) => {
        if (isFirestoreConnected) return;
        try {
            const response = await notificationApi.getNotifications(page, size);
            setNotifications(response.data.content);
        } catch (error) {}
    }, [isFirestoreConnected]);

    // Đánh dấu 1 notification đã đọc
    const markAsRead = async (id: number) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {}
    };

    // Đánh dấu tất cả notification đã đọc
    const markAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {}
    };

    // Cho phép các component khác đăng ký nhận event notification push
    const onNotificationReceived = useCallback((callback: (notification: NotificationResponse) => void) => {
        notificationListenersRef.current.add(callback);
        return () => {
            notificationListenersRef.current.delete(callback);
        };
    }, []);

    // Hàm sync unreadCount dùng debounce để tránh trùng lặp
    const syncUnreadCountFromServer = useCallback(() => {
        if (syncUnreadCountTimerRef.current) {
            clearTimeout(syncUnreadCountTimerRef.current);
        }
        syncUnreadCountTimerRef.current = setTimeout(() => {
            fetchUnreadCount();
        }, 1000);
    }, [fetchUnreadCount]);

    // Kết nối realtime đến Firestore, tự động cập nhật notification nếu thành công
    useEffect(() => {
        if (!userId) {
            return;
        }

        let updateTimer: ReturnType<typeof setTimeout> | null = null;
        let lastNotificationIds: Set<number> = new Set();

        try {
            initializeFirebase();

            const unsubscribe = firestoreNotificationService.subscribeToNotifications(
                userId,
                (firestoreNotifications) => {
                    if (firestoreNotifications.length === 0 && lastNotificationIds.size === 0) {
                        return;
                    }
                    const currentIds = new Set(firestoreNotifications.map(n => n.notificationId));
                    const hasChanged =
                        currentIds.size !== lastNotificationIds.size ||
                        [...currentIds].some(id => !lastNotificationIds.has(id));
                    if (!hasChanged && lastNotificationIds.size > 0) {
                        return;
                    }
                    if (updateTimer) {
                        clearTimeout(updateTimer);
                    }
                    updateTimer = setTimeout(() => {
                        setIsFirestoreConnected(true);
                        setNotifications(firestoreNotifications);
                        const unread = firestoreNotifications.filter(n => !n.isRead).length;
                        setUnreadCount(unread);
                        lastNotificationIds = currentIds;
                    }, 300);
                },
                {
                    limitCount: 50,
                    onlyUnread: false,
                }
            );

            firestoreUnsubscribeRef.current = unsubscribe;

            const fallbackTimer = setTimeout(() => {
                if (!isFirestoreConnected) {
                    setIsFirestoreConnected(false);
                    fetchUnreadCount();
                    fetchNotifications();
                }
            }, 3000);

            return () => {
                if (updateTimer) {
                    clearTimeout(updateTimer);
                }
                if (fallbackTimer) {
                    clearTimeout(fallbackTimer);
                }
                if (firestoreUnsubscribeRef.current) {
                    firestoreUnsubscribeRef.current();
                    firestoreUnsubscribeRef.current = null;
                }
                firestoreNotificationService.unsubscribe(userId);
                setIsFirestoreConnected(false);
            };
        } catch (error: any) {
            setIsFirestoreConnected(false);
            fetchUnreadCount();
            fetchNotifications();
        }
    }, [userId]);

    // Kết nối WebSocket để nhận push notification (fallback nếu không dùng Firestore)
    useEffect(() => {
        const token = getToken();
        if (!token || !userId) {
            return;
        }

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
            // Tắt hoàn toàn debug logs - không hiển thị STOMP messages trong console
            // Phải là function, không thể là undefined
            debug: () => {
                // Không làm gì cả - tắt hoàn toàn debug logs
            },
            onConnect: () => {
                setIsConnected(true);
                if (!isFirestoreConnected) {
                    fetchUnreadCount();
                    fetchNotifications();
                }
                const destination = `/user/${userId}/queue/notifications`;

                client.subscribe(destination, (message: IMessage) => {
                    try {
                        const notification: NotificationResponse = JSON.parse(message.body);

                        // Khi dùng Firestore thì không cập nhật state ở đây
                        if (!isFirestoreConnected) {
                            setNotifications((prev) => {
                                const exists = prev.some(n => n.notificationId === notification.notificationId);
                                if (exists) return prev;
                                return [notification, ...prev];
                            });
                            setUnreadCount((prev) => prev + 1);
                        }

                        syncUnreadCountFromServer();

                        // Phát event notification tới tất cả listener đã đăng ký
                        notificationListenersRef.current.forEach((listener) => {
                            try {
                                listener(notification);
                            } catch (error) {}
                        });

                        // Hiện popup thông báo ngay khi nhận
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
                    } catch (error) {}
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

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
            if (syncUnreadCountTimerRef.current) {
                clearTimeout(syncUnreadCountTimerRef.current);
            }
        };
    }, [userId, isFirestoreConnected, syncUnreadCountFromServer]);

    // Đồng bộ định kỳ notification mỗi 30s nếu không có realtime Firestore
    useEffect(() => {
        if (isFirestoreConnected || !userId) return;
        const syncInterval = setInterval(() => {
            fetchUnreadCount();
            fetchNotifications();
        }, 30000);
        return () => {
            clearInterval(syncInterval);
        };
    }, [isFirestoreConnected, userId, fetchUnreadCount, fetchNotifications]);

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
