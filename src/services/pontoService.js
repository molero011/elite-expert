import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
 import { auth, db } from "../firebase";


// 🔐 REGISTRA ENTRADA (horário vem do servidor)
export async function baterEntrada(userId) {
  return addDoc(collection(db, "pontos"), {
    userId,
    entrada: serverTimestamp(),
    saida: null,
    totalHoras: null
  });
}

// 🔐 REGISTRA SAÍDA (horário vem do servidor)
export async function baterSaida(pontoId) {
  const ref = doc(db, "pontos", pontoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const entrada = snap.data().entrada?.toDate();
  const saida = new Date();
  const horas = (saida - entrada) / 3600000;

  await updateDoc(ref, {
    saida,
    totalHoras: Number(horas.toFixed(2))
  });
}

// 📄 BUSCA ÚLTIMO PONTO ABERTO DO USUÁRIO
export async function buscarPontoAberto(userId) {
  const q = query(
    collection(db, "pontos"),
    where("userId", "==", userId),
    where("saida", "==", null)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// 📊 BUSCA HISTÓRICO DO USUÁRIO
export async function listarPontosUsuario(userId) {
  const q = query(
    collection(db, "pontos"),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
