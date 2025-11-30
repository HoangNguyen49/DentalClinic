import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type QuerySnapshot,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirestoreInstance } from '../config/firebase';
import type { NotificationResponse } from './notificationApi';

// Service for reading notifications from Firestore in realtime (like the mobile app)
export class FirestoreNotificationService {
  private firestore = getFirestoreInstance();
  private subscriptions: Map<number, Unsubscribe> = new Map();

  // Lắng nghe thông báo realtime cho từng user  
  subscribeToNotifications(
    userId: number,
    callback: (notifications: NotificationResponse[]) => void,
    options?: {
      limitCount?: number;
      onlyUnread?: boolean;
    }
  ): Unsubscribe {
    const { limitCount = 50, onlyUnread = false } = options || {};

    try {
      const collectionPath = `notifications/${userId}/items`;
      const notificationsRef = collection(this.firestore, collectionPath);

      let q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(limitCount));

      // Nếu chỉ lấy thông báo chưa đọc thì thêm filter
      if (onlyUnread) {
        q = query(notificationsRef, where('isRead', '==', false), orderBy('createdAt', 'desc'), limit(limitCount));
      }

      // Đăng ký lắng nghe realtime Firestore cho user này
      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          // Nếu đang có pending writes từ cache thì bỏ qua
          if (snapshot.metadata.fromCache && snapshot.metadata.hasPendingWrites) {
            return;
          }

          const notifications: NotificationResponse[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            try {
              const notification: NotificationResponse = {
                notificationId: data.notificationId || parseInt(doc.id, 10),
                userId: data.userId || userId,
                type: data.type || '',
                priority: data.priority || 'MEDIUM',
                title: data.title || '',
                message: data.message || '',
                actionUrl: data.actionUrl || undefined,
                relatedEntityType: data.relatedEntityType || undefined,
                relatedEntityId: data.relatedEntityId || undefined,
                isRead: data.isRead || false,
                readAt: data.readAt ? new Date(data.readAt).toISOString() : undefined,
                createdAt: this.parseFirestoreTimestamp(data.createdAt),
                expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
              };
              notifications.push(notification);
            } catch (error) {
              // Ghi log lỗi parse (có thể thiếu field)
              console.error('[Firestore] Parse notification error:', error, data);
            }
          });

          // Gọi callback trả về danh sách notification (có thể rỗng)
          callback(notifications);
        },
        (error: any) => {
          // Kiểm tra lỗi quyền Firestore - fallback sang API khác nếu cần
          const isPermissionError =
            error?.code === 'permission-denied' ||
            error?.message?.includes('permission') ||
            error?.message?.includes('Missing or insufficient permissions');

          if (isPermissionError) {
            // Lỗi quyền: fallback backend API khác
            console.warn('[Firestore] Permission denied:', error.message);
          }
          callback([]);
        }
      );

      // Lưu lại để có thể hủy đăng ký khi cần
      this.subscriptions.set(userId, unsubscribe);

      return unsubscribe;
    } catch (error) {
      // Lỗi setup Firestore subscription
      console.error('[Firestore] Cannot setup subscription:', error);
      return () => {};
    }
  }

  // Hủy lắng nghe thông báo cho 1 user
  unsubscribe(userId: number): void {
    const unsubscribe = this.subscriptions.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(userId);
    }
  }

  // Hủy tất cả các subscription hiện tại
  unsubscribeAll(): void {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();
  }

  // Chuyển đổi Timestamp Firestore về ISO string cho dữ liệu thống nhất
  private parseFirestoreTimestamp(timestamp: any): string {
    if (!timestamp) return new Date().toISOString();
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toISOString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    return new Date().toISOString();
  }

  // Đếm số lượng thông báo chưa đọc cho 1 user
  async countUnread(userId: number): Promise<number> {
    return new Promise((resolve) => {
      try {
        const collectionPath = `notifications/${userId}/items`;
        const notificationsRef = collection(this.firestore, collectionPath);
        const q = query(notificationsRef, where('isRead', '==', false));

        // Lấy realtime count (dùng onSnapshot)
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            resolve(snapshot.size);
          },
          (error) => {
            resolve(0);
          }
        );

        // Hủy đăng ký sau 5s để tránh memory leak
        setTimeout(() => {
          unsubscribe();
        }, 5000);
      } catch (error) {
        resolve(0);
      }
    });
  }
}

// Export singleton instance
export const firestoreNotificationService = new FirestoreNotificationService();
