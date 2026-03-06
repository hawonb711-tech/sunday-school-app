import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDMlmDYzb_6_9v7JVmO86icSIRoBwjdO2M",
  authDomain: "sunday-school-ad41a.firebaseapp.com",
  projectId: "sunday-school-ad41a",
  storageBucket: "sunday-school-ad41a.firebasestorage.app",
  messagingSenderId: "580893868378",
  appId: "1:580893868378:web:5130e3211b4d6a84a03363",
  measurementId: "G-8NFSMEFER8",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
