import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Admin from "./components/Admin"; // ✅ CAMINHO CORRETO

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("elite_user");
    return saved ? JSON.parse(saved) : null;
  });

  // NÃO LOGADO
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // PAINEL ADMIN
  if (window.location.pathname === "/admin") {
    if (user.role !== "admin") {
      window.location.href = "/";
      return null;
    }

    return (
      <Admin
        user={user}
        onLogout={() => {
          localStorage.removeItem("elite_user");
          setUser(null);
          window.location.href = "/";
        }}
      />
    );
  }

  // DASHBOARD NORMAL
  return (
    <Dashboard
      user={user}
      onLogout={() => {
        localStorage.removeItem("elite_user");
        setUser(null);
      }}
    />
  );
}
