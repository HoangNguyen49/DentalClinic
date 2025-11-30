import axiosClient from '../huybro_api/axiosClient';

export interface NotificationResponse {
    notificationId: number;
    userId: number;
    type: string;
    priority: string;
    title: string;
    message: string;
    isRead: boolean;
    readAt?: string;
    actionUrl?: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
    createdAt: string;
    expiresAt?: string;
}

export interface NotificationStatistics {
    totalNotifications: number;
    unreadCount: number;
    readCount: number;
    highPriorityCount: number;
    mediumPriorityCount: number;
    lowPriorityCount: number;
    expiredCount: number;
    todayCount: number;
    thisWeekCount: number;
    thisMonthCount: number;
}

const notificationApi = {
    getNotifications: (page = 0, size = 10, includeExpired = false) => {
        return axiosClient.get<{ content: NotificationResponse[]; totalElements: number; totalPages: number }>(
            '/api/notifications',
            { params: { page, size, includeExpired } }
        );
    },

    getUnreadNotifications: () => {
        return axiosClient.get<NotificationResponse[]>('/api/notifications/unread');
    },

    markAsRead: (id: number) => {
        return axiosClient.put<NotificationResponse>(`/api/notifications/${id}/read`);
    },

    markAllAsRead: () => {
        return axiosClient.put<void>('/api/notifications/read-all');
    },

    countUnread: () => {
        return axiosClient.get<number>('/api/notifications/unread-count');
    },

    getStatistics: () => {
        return axiosClient.get<NotificationStatistics>('/api/notifications/statistics');
    },

    registerDevice: (token: string, deviceType = 'WEB') => {
        return axiosClient.post('/api/notifications/device', null, {
            params: { token, deviceType },
        });
    },
};

export default notificationApi;
