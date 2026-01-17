import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from "firebase/firestore";
import { db } from "../firebase";

const USERS_COLLECTION = "users";

// 🔹 CRIAR USUÁRIO
export async function criarUsuario({ login, senha }) {
  await addDoc(collection(db, USERS_COLLECTION), {
    login,
    senha,
    role: "user",
    ativo: true,
    criadoEm: Date.now()
  });
}

// 🔹 LOGIN
export async function loginUsuario(login, senha) {
  const q = query(
    collection(db, USERS_COLLECTION),
    where("login", "==", login),
    where("senha", "==", senha),
    where("ativo", "==", true)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const docu = snap.docs[0];
  return { id: docu.id, ...docu.data() };
}

// 🔹 LISTAR USUÁRIOS (ADMIN)
export async function listarUsuarios() {
  const snap = await getDocs(collection(db, USERS_COLLECTION));
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
}

// 🔹 ATIVAR / DESATIVAR
export async function toggleUsuario(id, ativo) {
  await updateDoc(doc(db, USERS_COLLECTION, id), { ativo });
}
