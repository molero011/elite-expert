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
  const [mostrarSenha, setMostrarSenha] = useState({});
  const [editandoSocio, setEditandoSocio] = useState(null);

  const [socios, setSocios] = useState(() => ({
    a: "Sócio A",
    b: "Sócio B"
  }));

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
    const eliteLinha = lucro > 0 ? (lucro * num(percentualElite)) / 100 : 0;

    totalCustos += num(l.custo);
    eliteTotal += eliteLinha;
    saldoFinalTotal += num(l.saldoFinal);

    l.elitePago ? elitePago += eliteLinha : elitePendente += eliteLinha;

    if (lucro > 0) totalLucro += lucro;
    if (lucro < 0) totalPrejuizo += Math.abs(lucro);
  });

  /* ======================
     🔥 NOVA REGRA SÓCIOS
     saldo final - elite
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
    { name: "% Elite", value: eliteTotal }
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
     JSX
  ====================== */
  return (
    <div className="min-h-screen bg-black text-white">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* % ELITE */}
        <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm">
          <p className="text-sm text-zinc-400">% Elite</p>
          <input
            className="input w-28 text-lg"
            value={percentualElite}
            onChange={e => setPercentualElite(limparNumero(e.target.value))}
          />
        </div>

        {/* MESES */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setMesSelecionado(null)}
            className={`px-3 py-1 rounded-full ${mesSelecionado===null?"bg-elite text-black":"bg-zinc-800"}`}
          >
            TOTAL
          </button>
          {MESES.map((m,i)=>(
            <button
              key={i}
              onClick={()=>setMesSelecionado(i)}
              className={`px-3 py-1 rounded-full ${mesSelecionado===i?"bg-elite text-black":"bg-zinc-800"}`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* SÓCIOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {["a","b"].map(k => (
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
                className="absolute top-3 right-3 text-zinc-400 hover:text-elite"
              >
                ✏️
              </button>

              <p className="text-elite text-2xl font-bold mt-2">
                {moeda(k === "a" ? socioAValor : socioBValor)}
              </p>
            </div>
          ))}
        </div>

        {/* STATUS ELITE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900 p-6 rounded-2xl">
            <p>Elite Total</p>
            <p className="text-sky-400 font-bold">{moeda(eliteTotal)}</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-2xl">
            <p>Elite Pago</p>
            <p className="text-green-400 font-bold">{moeda(elitePago)}</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-2xl">
            <p>Elite Pendente</p>
            <p className="text-red-400 font-bold">{moeda(elitePendente)}</p>
          </div>
        </div>

        {/* 🍕 PIZZA */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-14">
          <h3 className="text-center font-semibold mb-6">
            Distribuição Financeira
          </h3>
          <div className="flex justify-center">
            <PieChart width={360} height={360}>
              <Pie data={dadosPizza} dataKey="value" innerRadius={80} outerRadius={140}>
                {dadosPizza.map((_, i) => (
                  <Cell key={i} fill={CORES[i]} />
                ))}
              </Pie>
              <Tooltip formatter={v => moeda(v)} />
              <Legend />
            </PieChart>
          </div>
        </div>

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
              {linhas.filter(pertenceAoMes).map((l,i)=>{
                const lucro = calcularLucro(l);
                const eliteLinha = lucro>0?(lucro*num(percentualElite))/100:0;
                return (
                  <tr key={i} className="border-t border-zinc-800">
                    <td><input className="input" value={l.conta} onChange={e=>atualizar(i,"conta",e.target.value)} /></td>
                    <td><input type="password" className="input" value={l.senha} onChange={e=>atualizar(i,"senha",e.target.value)} /></td>
                    <td><input className="input" value={l.fornecedor} onChange={e=>atualizar(i,"fornecedor",e.target.value)} /></td>
                    <td><input className="input" value={l.saldoInicial} onChange={e=>atualizar(i,"saldoInicial",limparNumero(e.target.value))} /></td>
                    <td><input className="input" value={l.custo} onChange={e=>atualizar(i,"custo",limparNumero(e.target.value))} /></td>
                    <td><input className="input" value={l.saldoFinal} onChange={e=>atualizar(i,"saldoFinal",limparNumero(e.target.value))} /></td>

                    <td className={lucro>0?"text-elite":lucro<0?"text-red-500":"text-zinc-400"}>
                      {lucro<0?`- ${moeda(Math.abs(lucro))}`:moeda(lucro)}
                    </td>

                    <td className="text-sky-400">{eliteLinha?moeda(eliteLinha):"—"}</td>

                    <td>
                      <button
                        onClick={()=>atualizar(i,"elitePago",!l.elitePago)}
                        className={`px-3 py-1 rounded-full text-xs ${l.elitePago?"bg-green-600":"bg-red-600"} text-black`}
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
