import { useEffect, useState } from "react";
import { listarUsuarios, toggleUsuario } from "../services/users";

export default function Admin({ user, onLogout }) {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    if (user.role !== "admin") {
      window.location.href = "/";
      return;
    }

    async function carregar() {
      const lista = await listarUsuarios();
      setUsuarios(lista);
    }

    carregar();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-3xl font-bold text-elite mb-6">
        Painel Admin
      </h1>

      <button onClick={onLogout} className="text-red-400 mb-6">
        Sair
      </button>

      <table className="w-full text-sm border border-zinc-800">
        <thead className="bg-zinc-900">
          <tr>
            <th className="p-2">Login</th>
            <th className="p-2">Criado em</th>
            <th className="p-2">Status</th>
            <th className="p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id} className="border-t border-zinc-800">
              <td className="p-2">{u.login}</td>
              <td className="p-2">
                {new Date(u.criadoEm).toLocaleDateString()}
              </td>
              <td className="p-2">
                {u.ativo ? "Ativo" : "Desativado"}
              </td>
              <td className="p-2">
                <button
                  onClick={async () => {
                    await toggleUsuario(u.id, !u.ativo);
                    setUsuarios(us =>
                      us.map(x =>
                        x.id === u.id ? { ...x, ativo: !x.ativo } : x
                      )
                    );
                  }}
                  className="text-yellow-400"
                >
                  Ativar / Desativar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
