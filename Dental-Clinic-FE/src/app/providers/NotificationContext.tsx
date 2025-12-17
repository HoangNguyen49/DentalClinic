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
    isMarkingAsRead: boolean; // Loading state khi đang mark as read
    markingIds: Set<number>; // Set các notification IDs đang được mark as read
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    fetchNotifications: (page?: number, size?: number) => Promise<void>;
    fetchUnreadCount: () => Promise<void>; // Export để có thể gọi từ component (giống Mobile)
    onNotificationReceived: (callback: (notification: NotificationResponse) => void) => () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
    const markingIdsRef = useRef<Set<number>>(new Set()); // Track các notification đang được mark (dùng ref để tránh dependency)
    const stompClientRef = useRef<Client | null>(null);
    const user = getUser();

    // Danh sách listener được đăng ký để phát event notification realtime giữa các component
    const notificationListenersRef = useRef<Set<(notification: NotificationResponse) => void>>(new Set());

    // Lấy userId cho việc lắng nghe notification riêng của user
    const userId = useMemo(() => {
        if (!user) return null;
        return user.userId || user.id || null;
    }, [user?.userId, user?.id]);

    // Hàm lấy số lượng thông báo chưa đọc (giống commit cũ - đơn giản)
    const fetchUnreadCount = useCallback(async () => {
        const token = getToken();
        if (!token) {
            console.warn('[Notification] Cannot fetch unread count: No token');
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

    // Hàm lấy danh sách thông báo (lọc bỏ audit logs) - giống Mobile đơn giản
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
            

            // Merge với state hiện tại để giữ các notification từ WebSocket (giống Mobile - đơn giản)
            setNotifications((prev) => {
                // Merge: giữ server data, thêm các notification mới từ WebSocket không có trong server response
                const merged = filteredNotifications.map(n => {
                    // Nếu notification đang được mark as read, giữ nguyên state hiện tại để tránh flicker
                    const prevN = prev.find(p => p.notificationId === n.notificationId);
                    if (prevN && markingIdsRef.current.has(n.notificationId)) {
                        return prevN;
                    }
                    // Dùng server data (giống Mobile - đơn giản)
                    // Đảm bảo giữ lại readAt từ server nếu có
                    return {
                        ...n,
                        isRead: n.isRead ?? false,
                        readAt: n.readAt ?? prevN?.readAt
                    };
                });

                // Thêm các notification mới từ WebSocket không có trong server response
                const mergedIds = new Set(merged.map(n => n.notificationId));
                const newNotifications = prev.filter(p => !mergedIds.has(p.notificationId));

                return [...newNotifications, ...merged].sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
            });
        } catch (error: any) {
            if (error.response?.status !== 401) {
                console.error('[Notification] Failed to fetch notifications:', error);
            }
        }
    }, []);

    // Đánh dấu một thông báo đã đọc (làm giống Mobile - đơn giản và ổn định)
    const markAsRead = useCallback(async (id: number) => {
        const token = getToken();
        if (!token) {
            return;
        }

        // Tránh mark nhiều lần cùng một notification
        if (markingIdsRef.current.has(id)) {
            return;
        }

        // Set loading state
        setIsMarkingAsRead(true);
        markingIdsRef.current.add(id);
        setMarkingIds(new Set(markingIdsRef.current)); // Update state ngay lập tức

        try {
            // Gọi API (giống Mobile - đơn giản, không optimistic update)
            const response = await notificationApi.markAsRead(id);

            // Cập nhật UI sau khi API thành công (giống Mobile)
            // Backend trả về NotificationResponse với isRead = true và readAt đã được set
            setNotifications((prev) => {
                return prev.map((n) =>
                    n.notificationId === id
                        ? { 
                            ...n, 
                            isRead: response.data.isRead ?? true, 
                            readAt: response.data.readAt ?? new Date().toISOString() 
                        }
                        : n
                );
            });

            // Fetch lại unread count từ server để đảm bảo sync chính xác (không giảm local trước)
            await fetchUnreadCount();
        } catch (error: any) {
            console.error('[Notification] Mark as read failed:', error);

            // Nếu lỗi 403 (Forbidden) hoặc 404 (Not Found), có thể notification không thuộc về user
            if (error.response?.status === 403 || error.response?.status === 404) {
                // Fetch lại để sync với server (notification có thể đã bị xóa hoặc không thuộc về user)
                await fetchNotifications();
                await fetchUnreadCount();
                toast.error('Notification not found or access denied', {
                    position: "top-right",
                    autoClose: 3000,
                });
            } else if (error.response?.status !== 401) {
                // Lỗi khác (không phải 401 Unauthorized)
                toast.error('Failed to mark notification as read', {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
            // Nếu 401, không hiển thị toast (sẽ được xử lý bởi auth guard)
        } finally {
            // Clear loading state
            markingIdsRef.current.delete(id);
            setMarkingIds(new Set(markingIdsRef.current)); // Update state ngay lập tức
            if (markingIdsRef.current.size === 0) {
                setIsMarkingAsRead(false);
            }
        }
    }, [fetchUnreadCount]);

    // Đánh dấu tất cả thông báo đã đọc (giống commit cũ - đơn giản và hoạt động tốt)
    const markAllAsRead = useCallback(async () => {
        const token = getToken();
        if (!token) {
            return;
        }

        // Không block nếu đang mark một notification đơn lẻ - mark all as read có priority cao hơn
        // Chỉ check nếu đang mark all as read (tránh double click)
        if (isMarkingAsRead && markingIdsRef.current.size === 0) {
            return;
        }

        setIsMarkingAsRead(true);
        // Clear tất cả marking IDs vì chúng ta sẽ mark tất cả
        markingIdsRef.current.clear();
        setMarkingIds(new Set());

        try {
            await notificationApi.markAllAsRead();
            
            // Cập nhật UI: đánh dấu tất cả notifications là đã đọc (giống Mobile - đơn giản)
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            
            // Set unread count về 0 ngay lập tức (giống Mobile)
            setUnreadCount(0);
            
            // Fetch lại unread count từ server để đảm bảo sync (giống Mobile)
            await fetchUnreadCount();
            
            toast.success('All notifications marked as read', {
                position: "top-right",
                autoClose: 2000,
            });
        } catch (error: any) {
            console.error('[Notification] Failed to mark all as read:', error);
            if (error.response?.status !== 401) {
                toast.error('Failed to mark all notifications as read', {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
            // Fetch lại cả notifications và unread count để sync với server (có thể một số đã được mark thành công)
            try {
                await Promise.all([
                    fetchNotifications(),
                    fetchUnreadCount()
                ]);
            } catch (fetchError) {
                console.error('[Notification] Failed to sync after mark all as read:', fetchError);
            }
        } finally {
            setIsMarkingAsRead(false);
            markingIdsRef.current.clear();
            setMarkingIds(new Set());
        }
    }, [isMarkingAsRead]);

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
            // WebSocket debug logs - có thể bật lại nếu cần debug
            // debug: (str) => console.log('[WebSocket Debug]:', str),
            onConnect: () => {
                setIsConnected(true);
                // Khi connect thành công, đồng bộ lại các dữ liệu notification để tránh sót
                // Sử dụng setTimeout để tránh gọi ngay lập tức, đợi WebSocket ổn định
                setTimeout(() => {
                    fetchUnreadCount();
                    fetchNotifications();
                }, 100);

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
                        
                        // Fetch lại unread count từ server thay vì tăng local để đảm bảo sync chính xác
                        // (tránh trường hợp có notification khác đã được mark as read ở nơi khác)
                        fetchUnreadCount().catch(err => {
                            console.error('[WebSocket] Failed to fetch unread count after receiving notification:', err);
                            // Fallback: chỉ tăng nếu notification chưa đọc (nếu fetch thất bại)
                            if (!notification.isRead) {
                                setUnreadCount((prev) => prev + 1);
                            }
                        });

                        // Phát tới các listener đã đăng ký
                        notificationListenersRef.current.forEach((listener) => {
                            try {
                                listener(notification);
                            } catch (error) { }
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
                        } catch (toastError) { }
                    } catch (error) {
                        console.error('[WebSocket] Error parsing message:', error);
                    }
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error('[WebSocket] STOMP Error:', frame);
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
        // Chỉ phụ thuộc vào userId, không phụ thuộc vào functions để tránh recreate interval
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // State để track markingIds (để UI có thể subscribe và re-render khi thay đổi)
    const [markingIds, setMarkingIds] = useState<Set<number>>(new Set());

    // Memoize context để tránh re-render không cần thiết
    const contextValue = useMemo(() => ({
        notifications,
        unreadCount,
        isConnected,
        isMarkingAsRead,
        markingIds,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
        fetchUnreadCount,
        onNotificationReceived,
    }), [notifications, unreadCount, isConnected, isMarkingAsRead, markingIds, markAsRead, markAllAsRead, fetchNotifications, fetchUnreadCount, onNotificationReceived]);

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
