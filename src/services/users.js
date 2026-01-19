import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  getDoc
} from "firebase/firestore";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

import { db, auth } from "../firebase";

const USERS_COLLECTION = "users";

/* =========================
   HELPERS
========================= */
function emailFake(login) {
  return `${login.toLowerCase()}@elite.local`;
}

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
  if (!login || !senha) {
    throw new Error("Login e senha são obrigatórios");
  }

  const email = emailFake(login);

  /* 🔐 1. CRIA NO FIREBASE AUTH */
  const cred = await createUserWithEmailAndPassword(
    auth,
    email,
    senha
  );

  const uid = cred.user.uid;

  /* 📄 2. CRIA NO FIRESTORE */
  await addDoc(collection(db, USERS_COLLECTION), {
    uid,
    login,
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
  const email = emailFake(login);

  /* 🔐 1. AUTENTICA NO AUTH */
  const cred = await signInWithEmailAndPassword(
    auth,
    email,
    senha
  );

  const uid = cred.user.uid;

  /* 📄 2. BUSCA DADOS NO FIRESTORE */
  const q = query(
    collection(db, USERS_COLLECTION),
    where("uid", "==", uid),
    where("ativo", "==", true)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const d = snap.docs[0];
  return {
    id: d.id,
    uid,
    ...d.data()
  };
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
