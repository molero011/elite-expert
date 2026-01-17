import { useState, useEffect } from "react";
import Header from "./Header";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function Dashboard({ user, onLogout }) {
  const STORAGE_KEY = `elite_dashboard_${user.login}`;

  /* ======================
     STATES
  ====================== */
  const [linhas, setLinhas] = useState([]);
  const [percentualElite, setPercentualElite] = useState("20");
  const [mesSelecionado, setMesSelecionado] = useState(null);
  const [editandoSocio, setEditandoSocio] = useState(null);
  const [mostrarSenha, setMostrarSenha] = useState({}); // 👁️ AQUI

  const [socios, setSocios] = useState({
    a: "Sócio A",
    b: "Sócio B",
  });

  /* ======================
     LOAD / SAVE
  ====================== */
  useEffect(() => {
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (salvo) {
      setLinhas(salvo.linhas || []);
      setPercentualElite(salvo.percentualElite || "20");
      setSocios(salvo.socios || socios);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ linhas, percentualElite, socios })
    );
  }, [linhas, percentualElite, socios]);

  /* ======================
     HELPERS
  ====================== */
  const limparNumero = v => v.replace(/\D/g, "");
  const num = v => Number(v) || 0;
  const moeda = v =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function calcularLucro(l) {
    const si = num(l.saldoInicial);
    const sf = num(l.saldoFinal);
    const c = num(l.custo);
    if (sf <= si) return -c;
    return Math.max(sf - si - c, 0);
  }

  function pertenceAoMes(l) {
    if (mesSelecionado === null) return true;
    return new Date(l.data).getMonth() === mesSelecionado;
  }

  /* ======================
     TOTAIS
  ====================== */
  let totalLucro = 0;
  let totalPrejuizo = 0;
  let totalCustos = 0;
  let eliteTotal = 0;
  let elitePago = 0;
  let elitePendente = 0;
  let saldoFinalTotal = 0;

  linhas.filter(pertenceAoMes).forEach(l => {
    const lucro = calcularLucro(l);
    const eliteLinha =
      lucro > 0 ? (lucro * num(percentualElite)) / 100 : 0;

    totalCustos += num(l.custo);
    eliteTotal += eliteLinha;
    saldoFinalTotal += num(l.saldoFinal);

    l.elitePago
      ? (elitePago += eliteLinha)
      : (elitePendente += eliteLinha);

    if (lucro > 0) totalLucro += lucro;
    if (lucro < 0) totalPrejuizo += Math.abs(lucro);
  });

  /* ======================
     REGRA SÓCIOS
  ====================== */
  const valorEliteSobreSaldo =
    (saldoFinalTotal * num(percentualElite)) / 100;

  const saldoLiquidoSocios =
    saldoFinalTotal - valorEliteSobreSaldo;

  const socioAValor = saldoLiquidoSocios / 2;
  const socioBValor = saldoLiquidoSocios / 2;

  /* ======================
     PIZZA
  ====================== */
  const dadosPizza = [
    { name: "Lucro", value: totalLucro },
    { name: "Prejuízo", value: totalPrejuizo },
    { name: "Custos", value: totalCustos },
    { name: "% Elite", value: eliteTotal },
  ];

  const CORES = ["#22c55e", "#ef4444", "#f59e0b", "#38bdf8"];
  const MESES = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];

  /* ======================
     CRUD
  ====================== */
  function atualizar(i, campo, valor) {
    const c = [...linhas];
    c[i][campo] = valor;
    setLinhas(c);
  }

  function adicionarLinha() {
    setLinhas([
      ...linhas,
      {
        conta: "",
        senha: "",
        fornecedor: "",
        saldoInicial: "",
        custo: "",
        saldoFinal: "",
        elitePago: false,
        data: new Date().toISOString().slice(0, 10),
      },
    ]);
  }

  function removerLinha(i) {
    const c = [...linhas];
    c.splice(i, 1);
    setLinhas(c);
  }

  /* ======================
     JSX
  ====================== */
  return (
    <div className="min-h-screen bg-black text-white">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* TABELA */}
        <h2 className="text-xl mb-4">Contas da Elite</h2>

        <div className="overflow-x-auto border border-zinc-800 rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900">
              <tr>
                <th className="p-3">Conta</th>
                <th className="p-3">Senha</th>
                <th className="p-3">Fornecedor</th>
                <th className="p-3">Saldo Inicial</th>
                <th className="p-3">Custo</th>
                <th className="p-3">Saldo Final</th>
                <th className="p-3">Lucro</th>
                <th className="p-3">Elite</th>
                <th className="p-3">Status</th>
                <th className="p-3">Data</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {linhas.filter(pertenceAoMes).map((l, i) => {
                const lucro = calcularLucro(l);
                const eliteLinha =
                  lucro > 0
                    ? (lucro * num(percentualElite)) / 100
                    : 0;

                return (
                  <tr key={i} className="border-t border-zinc-800">
                    <td>
                      <input
                        className="input"
                        value={l.conta}
                        onChange={e =>
                          atualizar(i, "conta", e.target.value)
                        }
                      />
                    </td>

                    {/* 👁️ SENHA COM OLHINHO */}
                    <td>
                      <div className="relative">
                        <input
                          type={mostrarSenha[i] ? "text" : "password"}
                          className="input pr-10"
                          value={l.senha}
                          onChange={e =>
                            atualizar(i, "senha", e.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setMostrarSenha(prev => ({
                              ...prev,
                              [i]: !prev[i],
                            }))
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-elite"
                        >
                          {mostrarSenha[i] ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </td>

                    <td>
                      <input
                        className="input"
                        value={l.fornecedor}
                        onChange={e =>
                          atualizar(i, "fornecedor", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        className="input"
                        value={l.saldoInicial}
                        onChange={e =>
                          atualizar(i, "saldoInicial", limparNumero(e.target.value))
                        }
                      />
                    </td>

                    <td>
                      <input
                        className="input"
                        value={l.custo}
                        onChange={e =>
                          atualizar(i, "custo", limparNumero(e.target.value))
                        }
                      />
                    </td>

                    <td>
                      <input
                        className="input"
                        value={l.saldoFinal}
                        onChange={e =>
                          atualizar(i, "saldoFinal", limparNumero(e.target.value))
                        }
                      />
                    </td>

                    <td className={lucro > 0 ? "text-elite" : lucro < 0 ? "text-red-500" : "text-zinc-400"}>
                      {lucro < 0 ? `- ${moeda(Math.abs(lucro))}` : moeda(lucro)}
                    </td>

                    <td className="text-sky-400">
                      {eliteLinha ? moeda(eliteLinha) : "—"}
                    </td>

                    <td>
                      <button
                        onClick={() => atualizar(i, "elitePago", !l.elitePago)}
                        className={`px-3 py-1 rounded-full text-xs ${
                          l.elitePago ? "bg-green-600" : "bg-red-600"
                        } text-black`}
                      >
                        {l.elitePago ? "PAGO" : "PENDENTE"}
                      </button>
                    </td>

                    <td>
                      <input
                        type="date"
                        className="input"
                        value={l.data}
                        onChange={e => atualizar(i, "data", e.target.value)}
                      />
                    </td>

                    <td>
                      <button onClick={() => removerLinha(i)}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          onClick={adicionarLinha}
          className="mt-4 bg-elite text-black px-4 py-2 rounded-xl"
        >
          + Adicionar Conta
        </button>
      </main>
    </div>
  );
}
