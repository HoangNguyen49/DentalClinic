import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDkv7ROEByRHAPKvz3ocJLEYwBBLNOFbr4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sunshinedental-b30ef.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sunshinedental-b30ef",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sunshinedental-b30ef.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "413328154690",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:413328154690:web:default"
};

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;

// Khởi tạo Firebase app và Firestore, chỉ gọi khi cần thiết
export const initializeFirebase = (): { app: FirebaseApp, firestore: Firestore } => {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      firestore = getFirestore(app);
    } catch (error) {
      // Lỗi khởi tạo Firebase
      throw error;
    }
  }
  if (!firestore) {
    firestore = getFirestore(app);
  }
  return { app, firestore };
};

// Lấy instance firestore, tự động khởi tạo nếu chưa có
export const getFirestoreInstance = (): Firestore => {
  if (!firestore) {
    const { firestore: fs } = initializeFirebase();
    return fs;
  }
  return firestore;
};

export default firebaseConfig;
