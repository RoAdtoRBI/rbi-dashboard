// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCn-5mhtFJrNQ1sMVSu25r0pmyqBOW0esM",
  authDomain: "rbi-dashboard-3ef19.firebaseapp.com",
  projectId: "rbi-dashboard-3ef19",
  storageBucket: "rbi-dashboard-3ef19.appspot.com", // ⚠️ Note correction from `.app` to `.appspot.com`
  messagingSenderId: "1035712844043",
  appId: "1:1035712844043:web:5e30db3a12dafc99f4920e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
