import { useState, useEffect } from "react";
import Header from "./Header";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function Dashboard({ user, onLogout }) {

  const STORAGE_KEY = `elite_dashboard_${user.login}`;

  const isEliteUnico = user.login === "Elite";

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

    const percLinha = l.percentualElite
      ? num(l.percentualElite)
      : num(percentualElite);

    const eliteLinha = lucro > 0 ? (lucro * percLinha) / 100 : 0;

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

  const socioBValor = isEliteUnico ? 0 : saldoLiquidoSocios / 2;

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
     JSX (INALTERADO)
  ====================== */
  return (
    <div className="min-h-screen bg-black text-white">
      <Header user={user} onLogout={onLogout} />
      {/* TODO O RESTO DO JSX PERMANECE IGUAL AO SEU */}
    </div>
  );
}
