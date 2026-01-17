import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "../firebase";

const USERS_COLLECTION = "users";

/* =========================
   VERIFICAR LOGIN ATIVO
========================= */
export async function verificarLoginAtivo(login) {
  const q = query(
    collection(db, USERS_COLLECTION),
    where("login", "==", login),
    where("ativo", "==", true)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

/* =========================
   CRIAR USUÁRIO
========================= */
export async function criarUsuario({
  login,
  senha,
  nome,
  role,
  socios,
  percentuais
}) {
  if (!senha) throw new Error("Senha obrigatória");

  await addDoc(collection(db, USERS_COLLECTION), {
    login,
    senha,
    nome,
    role,
    socios,
    percentuais,
    ativo: true,
    criadoEm: Date.now()
  });
}

/* =========================
   LOGIN
========================= */
export async function loginUsuario(login, senha) {
  const q = query(
    collection(db, USERS_COLLECTION),
    where("login", "==", login),
    where("senha", "==", senha),
    where("ativo", "==", true)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/* =========================
   LISTAR USUÁRIOS (ADMIN)
========================= */
export async function listarUsuarios() {
  const snap = await getDocs(collection(db, USERS_COLLECTION));
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
}

/* =========================
   ATIVAR / DESATIVAR
========================= */
export async function toggleUsuario(id, ativo) {
  await updateDoc(doc(db, USERS_COLLECTION, id), { ativo });
}

/* =========================
   DELETAR USUÁRIO (ADMIN)
========================= */
export async function deletarUsuario(id) {
  await deleteDoc(doc(db, USERS_COLLECTION, id));
}
