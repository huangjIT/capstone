import { initializeApp, getApps } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Go to Firebase Console → Project Settings → Your apps → Web app → Config
// https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: "AIzaSyDfj8Pw1c9OOj-75oalmW3oec5iLuRVkME",
  authDomain: "mobile-9d6dd.firebaseapp.com",
  databaseURL: "https://mobile-9d6dd-default-rtdb.firebaseio.com",
  projectId: "mobile-9d6dd",
  storageBucket: "mobile-9d6dd.firebasestorage.app",
  messagingSenderId: "279020382757",
  appId: "1:279020382757:web:01b8427a8553f38a84edcc"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const storage = getStorage(app);
