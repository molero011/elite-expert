import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/*
  ⚠️ CONFIG OFICIAL DO APP WEB
  NÃO misturar com configs antigos
*/
const firebaseConfig = {
  apiKey: "AIzaSyC0wFY0xRmdljuIK-OYGq-BJ13mE_AnEok",
  authDomain: "elite-99c81.firebaseapp.com",
  projectId: "elite-99c81",
  storageBucket: "elite-99c81.appspot.com", // 🔥 sempre .appspot.com
  messagingSenderId: "21060621915",
  appId: "1:21060621915:web:23524353d1f0999ed1917e"
};

// Inicializa o app
const app = initializeApp(firebaseConfig);

// Serviços usados no projeto
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
