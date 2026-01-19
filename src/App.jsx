import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Admin from "./components/Admin";
import Operadores from "./components/Operadores";

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("elite_user");
    return saved ? JSON.parse(saved) : null;
  });

  // 🔐 LOGOUT ÚNICO (FONTE DA VERDADE)
  function logout() {
    localStorage.removeItem("elite_user");
    setUser(null);
    window.location.href = "/";
  }

  // ❌ NÃO LOGADO
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // 🛠️ PAINEL ADMIN
  if (window.location.pathname === "/admin") {
    if (user.role !== "admin") {
      window.location.href = "/";
      return null;
    }

    return <Admin user={user} onLogout={logout} />;
  }

  // 👷 OPERADORES (ADMIN + USER)
  if (window.location.pathname === "/operadores") {
    return <Operadores user={user} onLogout={logout} />;
  }

  // 📊 DASHBOARD PADRÃO
  return <Dashboard user={user} onLogout={logout} />;
}
