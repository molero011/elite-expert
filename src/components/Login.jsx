import { useState } from "react";
import { criarUsuario, loginUsuario } from "../services/users";

const ADMIN_LOGIN = "Molero";
const ADMIN_SENHA = "admin123";
const CODIGO_CRIACAO = "Elite2026@!$";

export default function Login({ onLogin }) {
  const [modo, setModo] = useState("login");
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [mostrar, setMostrar] = useState(false);

  async function entrar() {
    setErro("");

    // ADMIN FIXO
    if (login === ADMIN_LOGIN && senha === ADMIN_SENHA) {
      const admin = { nome: "ADMIN", role: "admin" };
      localStorage.setItem("elite_user", JSON.stringify(admin));
      onLogin(admin);
      return;
    }

    const user = await loginUsuario(login, senha);
    if (!user) {
      setErro("Login ou senha inválidos.");
      return;
    }

    localStorage.setItem("elite_user", JSON.stringify(user));
    onLogin(user);
  }

  async function registrar() {
    setErro("");

    if (!login || !senha || !codigo) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (codigo !== CODIGO_CRIACAO) {
      setErro("Código inválido.");
      return;
    }

    await criarUsuario({ login, senha });
    alert("Conta criada! Faça login.");
    setModo("login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-elite">
          Elite Expert
        </h1>

        <input
          className="input mb-3 w-full"
          placeholder="Login"
          value={login}
          onChange={e => setLogin(e.target.value)}
        />

        <div className="relative mb-3">
          <input
            type={mostrar ? "text" : "password"}
            className="input w-full pr-10"
            placeholder="Senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
          />
          <button
            onClick={() => setMostrar(!mostrar)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            {mostrar ? "🙈" : "👁️"}
          </button>
        </div>

        {modo === "register" && (
          <input
            className="input mb-3 w-full"
            placeholder="Código de criação"
            value={codigo}
            onChange={e => setCodigo(e.target.value)}
          />
        )}

        {erro && <p className="text-red-500 text-sm mb-3">{erro}</p>}

        <button
          onClick={modo === "login" ? entrar : registrar}
          className="w-full bg-elite text-black py-2 rounded-xl font-semibold"
        >
          {modo === "login" ? "Entrar" : "Criar conta"}
        </button>

        <p
          onClick={() => setModo(modo === "login" ? "register" : "login")}
          className="text-zinc-400 text-sm text-center mt-4 cursor-pointer"
        >
          {modo === "login"
            ? "Criar conta (precisa de código)"
            : "Já tenho conta, fazer login"}
        </p>
      </div>
    </div>
  );
}
