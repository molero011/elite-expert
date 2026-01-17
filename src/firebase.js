import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0wFY0xRmdljuIK-OYGq-BJ13mE_AnEok",
  authDomain: "elite-99c81.firebaseapp.com",
  projectId: "elite-99c81",
  storageBucket: "elite-99c81.firebasestorage.app",
  messagingSenderId: "21060621915",
  appId: "1:21060621915:web:66e197fbfb925a01d1917e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
