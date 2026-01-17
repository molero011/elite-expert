import { useState, useEffect } from "react";
import Header from "./Header";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function Dashboard({ user, onLogout }) {

  /* ======================
     STORAGE FIXO (NUNCA MAIS SOME)
  ====================== */
  const STORAGE_KEY = "elite_dashboard_data";

  const isEliteUnico = user?.login === "Elite";

  /* ======================
     STATES
  ====================== */
  const [linhas, setLinhas] = useState([]);
  const [percentualElite, setPercentualElite] = useState("20");
  const [mesSelecionado, setMesSelecionado] = useState(null);
  const [editandoSocio, setEditandoSocio] = useState(null);

  const [socios, setSocios] = useState(() =>
    isEliteUnico
      ? { a: "Sócio Único" }
      : { a: "Sócio A", b: "Sócio B" }
  );

  /* ======================
     LOAD / SAVE
  ====================== */
  useEffect(() => {
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (salvo) {
      setLinhas(salvo.linhas || []);
      setPercentualElite(salvo.percentualElite || "20");
      setSocios(
        isEliteUnico
          ? { a: salvo.socios?.a || "Sócio Único" }
          : salvo.socios || { a: "Sócio A", b: "Sócio B" }
      );
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
    const perc = l.percentualElite
      ? num(l.percentualElite)
      : num(percentualElite);

    const eliteLinha = lucro > 0 ? (lucro * perc) / 100 : 0;

    totalCustos += num(l.custo);
    eliteTotal += eliteLinha;
    saldoFinalTotal += num(l.saldoFinal);

    l.elitePago ? elitePago += eliteLinha : elitePendente += eliteLinha;

    if (lucro > 0) totalLucro += lucro;
    if (lucro < 0) totalPrejuizo += Math.abs(lucro);
  });

  /* ======================
     DISTRIBUIÇÃO SÓCIOS
  ====================== */
  const valorEliteSobreSaldo =
    (saldoFinalTotal * num(percentualElite)) / 100;

  const saldoLiquidoSocios =
    saldoFinalTotal - valorEliteSobreSaldo;

  const socioAValor = isEliteUnico
    ? saldoLiquidoSocios
    : saldoLiquidoSocios / 2;

  const socioBValor = isEliteUnico
    ? 0
    : saldoLiquidoSocios / 2;

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
        percentualElite: "",
        elitePago: false,
        data: new Date().toISOString().slice(0, 10)
      }
    ]);
  }

  function removerLinha(i) {
    const c = [...linhas];
    c.splice(i, 1);
    setLinhas(c);
  }

  /* ======================
     JSX (COMPLETO)
  ====================== */
  return (
    <div className="min-h-screen bg-black text-white">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* % ELITE */}
        <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm">
          <p className="text-sm text-zinc-400">% Elite (padrão)</p>
          <input
            className="input w-28 text-lg"
            value={percentualElite}
            onChange={e => setPercentualElite(limparNumero(e.target.value))}
          />
        </div>

        {/* SÓCIOS */}
        <div className={`grid ${isEliteUnico ? "grid-cols-1" : "grid-cols-2"} gap-6 mb-10`}>
          {Object.keys(socios).map(k => (
            <div key={k} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative">
              {editandoSocio === k ? (
                <input
                  autoFocus
                  className="input mb-2"
                  value={socios[k]}
                  onChange={e => setSocios({ ...socios, [k]: e.target.value })}
                  onBlur={() => setEditandoSocio(null)}
                />
              ) : (
                <>
                  <p className="text-zinc-400 text-sm">Sócio</p>
                  <h3 className="text-xl font-semibold">{socios[k]}</h3>
                </>
              )}

              <button
                onClick={() => setEditandoSocio(k)}
                className="absolute top-3 right-3"
              >
                ✏️
              </button>

              <p className="text-elite text-2xl font-bold mt-2">
                {moeda(k === "a" ? socioAValor : socioBValor)}
              </p>
            </div>
          ))}
        </div>

        {/* TABELA */}
        <h2 className="text-xl mb-4">Contas</h2>

        <div className="overflow-x-auto border border-zinc-800 rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900">
              <tr>
                <th>Conta</th>
                <th>Senha</th>
                <th>Fornecedor</th>
                <th>Saldo Inicial</th>
                <th>Custo</th>
                <th>Saldo Final</th>
                <th>% Elite</th>
                <th>Lucro</th>
                <th>Status</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {linhas.map((l,i)=>{
                const lucro = calcularLucro(l);
                const perc = l.percentualElite || percentualElite;
                const eliteLinha = lucro>0?(lucro*num(perc))/100:0;

                return (
                  <tr key={i}>
                    <td><input className="input" value={l.conta} onChange={e=>atualizar(i,"conta",e.target.value)} /></td>
                    <td><input className="input" value={l.senha} onChange={e=>atualizar(i,"senha",e.target.value)} /></td>
                    <td><input className="input" value={l.fornecedor} onChange={e=>atualizar(i,"fornecedor",e.target.value)} /></td>
                    <td><input className="input" value={l.saldoInicial} onChange={e=>atualizar(i,"saldoInicial",limparNumero(e.target.value))} /></td>
                    <td><input className="input" value={l.custo} onChange={e=>atualizar(i,"custo",limparNumero(e.target.value))} /></td>
                    <td><input className="input" value={l.saldoFinal} onChange={e=>atualizar(i,"saldoFinal",limparNumero(e.target.value))} /></td>
                    <td><input className="input w-20" value={l.percentualElite} onChange={e=>atualizar(i,"percentualElite",limparNumero(e.target.value))} /></td>

                    <td>{moeda(lucro)}</td>

                    <td>
                      <button
                        onClick={()=>atualizar(i,"elitePago",!l.elitePago)}
                      >
                        {l.elitePago?"PAGO":"PENDENTE"}
                      </button>
                    </td>

                    <td><input type="date" className="input" value={l.data} onChange={e=>atualizar(i,"data",e.target.value)} /></td>
                    <td><button onClick={()=>removerLinha(i)}>🗑️</button></td>
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
