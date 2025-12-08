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

// service đọc notification firestore realtime
export class FirestoreNotificationService {
  private firestore = getFirestoreInstance();
  private subscriptions: Map<number, Unsubscribe> = new Map();

  // lắng nghe notification realtime cho user
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
      if (onlyUnread) {
        q = query(notificationsRef, where('isRead', '==', false), orderBy('createdAt', 'desc'), limit(limitCount));
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          // bỏ qua các thay đổi chỉ có trong cache
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
              // lỗi parse notification
              console.error('[Firestore] Parse notification error:', error, data);
            }
          });
          callback(notifications);
        },
        (error: any) => {
          // lỗi quyền truy cập firestore
          const isPermissionError =
            error?.code === 'permission-denied' ||
            error?.message?.includes('permission') ||
            error?.message?.includes('Missing or insufficient permissions');
          if (isPermissionError) {
            console.warn('[Firestore] Permission denied:', error.message);
          }
          callback([]);
        }
      );

      this.subscriptions.set(userId, unsubscribe);
      return unsubscribe;
    } catch (error) {
      // lỗi không thể thiết lập subscription firestore
      console.error('[Firestore] Cannot setup subscription:', error);
      return () => {};
    }
  }

  // hủy lắng nghe theo userId
  unsubscribe(userId: number): void {
    const unsubscribe = this.subscriptions.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(userId);
    }
  }

  // hủy toàn bộ subscription
  unsubscribeAll(): void {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();
  }

  // chuyển timestamp firestore về ISO string
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

  // đếm số lượng notification chưa đọc của user
  async countUnread(userId: number): Promise<number> {
    return new Promise((resolve) => {
      try {
        const collectionPath = `notifications/${userId}/items`;
        const notificationsRef = collection(this.firestore, collectionPath);
        const q = query(notificationsRef, where('isRead', '==', false));

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            resolve(snapshot.size);
          },
          (error) => {
            resolve(0);
          }
        );

        setTimeout(() => {
          unsubscribe();
        }, 5000);
      } catch (error) {
        resolve(0);
      }
    });
  }
}

export const firestoreNotificationService = new FirestoreNotificationService();
