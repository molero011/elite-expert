import logo from "../assets/logo.png";

export default function Header({ user, onLogout }) {
  const nomeSeguro =
    (user && (user.nome || user.login)) || "Usuário";

  return (
    <header className="bg-black border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col items-center gap-4 relative">

        {/* OPERADORES */}
        <button
          onClick={() => (window.location.href = "/operadores")}
          className="absolute top-6 right-6 px-4 py-1 rounded-full border border-elite text-elite hover:bg-elite hover:text-black transition text-xs"
        >
          OPERADORES
        </button>

        {/* LOGO */}
        <img
          src={logo}
          alt="Elite Expert"
          className="h-28 select-none"
        />

        {/* BEM-VINDO */}
        <h1 className="text-3xl md:text-4xl font-semibold text-white text-center">
          Bem-vindo,&nbsp;
          <span className="text-elite font-bold">
            {nomeSeguro.toUpperCase()}
          </span>
        </h1>

        {/* PAINEL ADMIN */}
        {user?.role === "admin" && (
          <button
            onClick={() => (window.location.href = "/admin")}
            className="text-xs text-elite border border-elite px-4 py-1 rounded-full hover:bg-elite hover:text-black transition"
          >
            Painel Admin
          </button>
        )}

        {/* SAIR */}
        <button
          onClick={onLogout}
          className="text-xs text-zinc-400 hover:text-red-500 transition mt-2"
        >
          Sair
        </button>

      </div>
    </header>
  );
}
