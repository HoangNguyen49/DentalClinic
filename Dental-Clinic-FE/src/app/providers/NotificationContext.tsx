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
    fetchUnreadCount: (immediate?: boolean) => Promise<void>; // ✅ Export với optional immediate để tránh "nhảy số"
    onNotificationReceived: (callback: (notification: NotificationResponse) => void) => () => void;
    reconnectWebSocket: () => void; // ✅ Export để component có thể trigger reconnect manually
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
    
    // ✅ Track fetchUnreadCount đang chạy để tránh race condition và "nhảy số"
    const isFetchingUnreadCountRef = useRef<boolean>(false);
    const fetchUnreadCountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Danh sách listener được đăng ký để phát event notification realtime giữa các component
    const notificationListenersRef = useRef<Set<(notification: NotificationResponse) => void>>(new Set());

    // Lấy userId cho việc lắng nghe notification riêng của user
    const userId = useMemo(() => {
        if (!user) return null;
        return user.userId || user.id || null;
    }, [user?.userId, user?.id]);

    // Lấy token để trigger reconnect khi token thay đổi
    const token = useMemo(() => getToken(), [user]); // Re-compute khi user thay đổi

    // ✅ Hàm lấy số lượng thông báo chưa đọc với debounce và tránh race condition
    const fetchUnreadCount = useCallback(async (immediate = false) => {
        const currentToken = getToken();
        if (!currentToken) {
            console.warn('[Notification] Cannot fetch unread count: No token');
            return;
        }
        
        // ✅ Nếu đang fetch và không phải immediate, debounce 300ms
        if (isFetchingUnreadCountRef.current && !immediate) {
            // Hủy timeout cũ nếu có
            if (fetchUnreadCountTimeoutRef.current) {
                clearTimeout(fetchUnreadCountTimeoutRef.current);
            }
            // Set timeout mới để fetch sau khi fetch hiện tại hoàn thành
            fetchUnreadCountTimeoutRef.current = setTimeout(async () => {
                // Đợi fetch hiện tại hoàn thành (tối đa 2s)
                let waitCount = 0;
                while (isFetchingUnreadCountRef.current && waitCount < 20) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    waitCount++;
                }
                // Nếu đã hết thời gian chờ, bỏ qua
                if (isFetchingUnreadCountRef.current) {
                    return;
                }
                // Gọi lại với immediate=true
                await fetchUnreadCount(true);
            }, 300);
            return;
        }
        
        // ✅ Nếu đang fetch và là immediate, đợi fetch hiện tại hoàn thành (nhưng không quá 500ms)
        if (isFetchingUnreadCountRef.current && immediate) {
            // Đợi tối đa 500ms cho fetch hiện tại hoàn thành (giảm từ 2s để responsive hơn)
            let waitCount = 0;
            while (isFetchingUnreadCountRef.current && waitCount < 5) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waitCount++;
            }
            // ✅ Nếu vẫn đang fetch sau 500ms, vẫn tiếp tục fetch mới để đảm bảo số được update
            // (không bỏ qua để tránh mất số khi có nhiều notification đến cùng lúc)
        }
        
        // ✅ Hủy timeout cũ nếu có (trước khi fetch mới)
        if (fetchUnreadCountTimeoutRef.current) {
            clearTimeout(fetchUnreadCountTimeoutRef.current);
            fetchUnreadCountTimeoutRef.current = null;
        }
        
        // ✅ Set flag đang fetch
        isFetchingUnreadCountRef.current = true;
        
        try {
            const response = await notificationApi.countUnread();
            // ✅ Luôn update với giá trị từ server để đảm bảo sync chính xác
            // (Optimistic update đã được thực hiện ở WebSocket handler, giờ sync với server)
            setUnreadCount(response.data);
        } catch (error: any) {
            if (error.response?.status !== 401) {
                console.error('[Notification] Failed to fetch unread count:', error);
            }
        } finally {
            // ✅ Clear flag
            isFetchingUnreadCountRef.current = false;
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

            // ✅ Fetch lại unread count từ server (immediate để đảm bảo sync ngay)
            await fetchUnreadCount(true);
        } catch (error: any) {
            console.error('[Notification] Mark as read failed:', error);

            // Nếu lỗi 403 (Forbidden) hoặc 404 (Not Found), có thể notification không thuộc về user
            if (error.response?.status === 403 || error.response?.status === 404) {
                // ✅ Fetch lại để sync với server (immediate để đảm bảo sync ngay)
                await fetchNotifications();
                await fetchUnreadCount(true);
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
            
            // ✅ Set unread count về 0 ngay lập tức để UI responsive (giống Mobile)
            setUnreadCount(0);
            
            // ✅ Fetch lại unread count từ server (immediate để đảm bảo sync ngay)
            await fetchUnreadCount(true);
            
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
            // ✅ Fetch lại cả notifications và unread count để sync với server (immediate)
            try {
                await Promise.all([
                    fetchNotifications(),
                    fetchUnreadCount(true)
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

    // Hàm reconnect WebSocket (có thể gọi từ bên ngoài)
    const reconnectWebSocket = useCallback(() => {
        const currentToken = getToken();
        const currentUserId = userId;
        if (!currentToken || !currentUserId) {
            // Disconnect nếu không có token hoặc userId
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
            setIsConnected(false);
            return;
        }

        // Disconnect client cũ nếu có
        if (stompClientRef.current) {
            stompClientRef.current.deactivate();
            stompClientRef.current = null;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const baseUrl = apiUrl.replace(/\/+$/, '');
        const socketUrl = `${baseUrl}/ws`;

        const client = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            connectHeaders: {
                Authorization: `Bearer ${currentToken}`,
            },
            onConnect: () => {
                setIsConnected(true);
                // ✅ Khi connect thành công, đồng bộ lại các dữ liệu notification (immediate)
                setTimeout(() => {
                    fetchUnreadCount(true);
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
                        
                        // ✅ Optimistic update: Tăng số ngay lập tức nếu notification chưa đọc để user thấy ngay
                        if (!notification.isRead) {
                            setUnreadCount((prev) => prev + 1);
                        }
                        
                        // ✅ Fetch lại unread count từ server ngay lập tức (immediate) để đảm bảo sync chính xác
                        // (tránh trường hợp có notification khác đã được mark as read ở nơi khác)
                        fetchUnreadCount(true).catch(err => {
                            console.error('[WebSocket] Failed to fetch unread count after receiving notification:', err);
                            // ✅ Nếu fetch thất bại, giữ nguyên optimistic update đã tăng ở trên
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
                // Tự động reconnect sau 5s (dùng closure để tránh circular dependency)
                setTimeout(() => {
                    const token = getToken();
                    const uid = userId;
                    if (token && uid) {
                        reconnectWebSocket();
                    }
                }, 5000);
            },
            onStompError: (frame) => {
                console.error('[WebSocket] STOMP Error:', frame);
                setIsConnected(false);
                // Tự động reconnect sau 5s
                setTimeout(() => {
                    const token = getToken();
                    const uid = userId;
                    if (token && uid) {
                        reconnectWebSocket();
                    }
                }, 5000);
            },
            onWebSocketError: (event) => {
                console.error('[WebSocket] WebSocket Error:', event);
                setIsConnected(false);
                // Tự động reconnect sau 5s
                setTimeout(() => {
                    const token = getToken();
                    const uid = userId;
                    if (token && uid) {
                        reconnectWebSocket();
                    }
                }, 5000);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.activate();
        stompClientRef.current = client;
    }, [userId, fetchUnreadCount, fetchNotifications]);

    // Kết nối WebSocket khi userId hoặc token thay đổi
    useEffect(() => {
        if (!token || !userId) {
            // Disconnect nếu không có token hoặc userId
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
            setIsConnected(false);
            return;
        }

        reconnectWebSocket();

        // ✅ Dọn dẹp khi unmount/kết thúc
        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
            // ✅ Cleanup timeout để tránh memory leak
            if (fetchUnreadCountTimeoutRef.current) {
                clearTimeout(fetchUnreadCountTimeoutRef.current);
                fetchUnreadCountTimeoutRef.current = null;
            }
        };
    }, [userId, token, reconnectWebSocket]);

    // Đồng bộ lại notifications và số chưa đọc định kỳ mỗi 30s (chống miss sót!)
    // ✅ FIX: Sync ngay khi mount, không đợi interval
    useEffect(() => {
        if (!userId) return;
        
        // ✅ Sync ngay khi mount (immediate để đảm bảo hiện ngay)
        fetchUnreadCount(true);
        fetchNotifications();
        
        // ✅ Sau đó mới set interval (giảm xuống 15s và dùng immediate để sync nhanh hơn)
        const syncInterval = setInterval(() => {
            fetchUnreadCount(true); // ✅ Dùng immediate để đảm bảo sync ngay, không debounce
            fetchNotifications();
        }, 15000); // ✅ Giảm từ 30s xuống 15s để sync nhanh hơn và đảm bảo không bỏ sót
        
        return () => {
            clearInterval(syncInterval);
            // ✅ Cleanup timeout khi unmount để tránh memory leak
            if (fetchUnreadCountTimeoutRef.current) {
                clearTimeout(fetchUnreadCountTimeoutRef.current);
                fetchUnreadCountTimeoutRef.current = null;
            }
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
        reconnectWebSocket, // ✅ Export để component có thể trigger reconnect manually
    }), [notifications, unreadCount, isConnected, isMarkingAsRead, markingIds, markAsRead, markAllAsRead, fetchNotifications, fetchUnreadCount, onNotificationReceived, reconnectWebSocket]);

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
