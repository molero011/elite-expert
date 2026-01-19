import { useEffect, useRef, useState } from "react";
import Header from "./Header";
import PainelOperadores from "./PainelOperadores";
import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const ADMIN_LOGIN = "eliteadm";
const SENHA_MESTRA = "EliteExpert";

/* ======================
   HELPERS
====================== */
const formatarTempo = (s = 0) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${h}h ${m}m ${sec}s`;
};

const formatarHora = (d) =>
  new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const inicioSemana = () => {
  const d = new Date();
  const day = d.getDay() || 7;
  if (day !== 1) d.setDate(d.getDate() - (day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

const inicioDia = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/* ======================
   COMPONENTE
====================== */
export default function Operadores({ user }) {
  const uid = user?.login || user?.email || "admin";
  const isAdmin = user?.login === ADMIN_LOGIN;

  const intervalo = useRef(null);
  const inicioRef = useRef(null);

  const [rodando, setRodando] = useState(false);
  const [segundos, setSegundos] = useState(0);

  const [valorHora, setValorHora] = useState(20);
  const [travado, setTravado] = useState(true);

  const [nome, setNome] = useState(user?.login || "");
  const [historico, setHistorico] = useState([]);

  const [contas, setContas] = useState(1);
  const [loading, setLoading] = useState(true);

  /* ======================
     LOAD
  ====================== */
  useEffect(() => {
    async function load() {
      const ref = doc(db, "operadores", uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const d = snap.data();
        setValorHora(d.valorHora ?? 20);
        setHistorico(d.historico ?? []);
        setNome(d.nome ?? user?.login ?? "");
      } else {
        await setDoc(ref, {
          valorHora: 20,
          historico: [],
          nome: user?.login ?? "",
        });
      }
      setLoading(false);
    }
    load();
  }, [uid, user]);

  /* ======================
     CRONÔMETRO
  ====================== */
  useEffect(() => {
    if (!rodando) return;

    intervalo.current = setInterval(() => {
      setSegundos((s) => s + 1);
    }, 1000);

    return () => clearInterval(intervalo.current);
  }, [rodando]);

  const saldoAtual = (segundos / 3600) * valorHora;

  /* ======================
     CONTROLES
  ====================== */
  const iniciar = () => {
    if (!window.confirm("Você deseja iniciar o expediente?")) return;
    inicioRef.current = new Date();
    setSegundos(0);
    setContas(1);
    setRodando(true);
  };

  const parar = async () => {
    if (!window.confirm("Você deseja finalizar o expediente?")) return;

    clearInterval(intervalo.current);
    setRodando(false);

    const fim = new Date();

    const log = {
      nome,
      data: inicioRef.current.toISOString(),
      entrada: inicioRef.current.toISOString(),
      saida: fim.toISOString(),
      segundos,
      qtdeContas: contas,
      valor: saldoAtual,
      pago: false,
      comprovante: null,
    };

    const novo = [log, ...historico];
    setHistorico(novo);
    setSegundos(0);

    await updateDoc(doc(db, "operadores", uid), { historico: novo });
  };

  const marcarPago = async (i) => {
    const novo = historico.map((h, idx) =>
      idx === i ? { ...h, pago: !h.pago } : h
    );
    setHistorico(novo);
    await updateDoc(doc(db, "operadores", uid), { historico: novo });
  };

  const upload = (e, i) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);

    const novo = historico.map((h, idx) =>
      idx === i ? { ...h, comprovante: url } : h
    );
    setHistorico(novo);
    updateDoc(doc(db, "operadores", uid), { historico: novo });
  };

  const excluir = async (i) => {
    const senha = prompt("Senha mestra:");
    if (senha !== SENHA_MESTRA) return;

    const novo = historico.filter((_, idx) => idx !== i);
    setHistorico(novo);
    await updateDoc(doc(db, "operadores", uid), { historico: novo });
  };

  const desbloquear = () => {
    if (isAdmin) return setTravado(false);
    const s = prompt("Senha mestra:");
    if (s === SENHA_MESTRA) setTravado(false);
  };

  const salvarConfigs = async () => {
    await updateDoc(doc(db, "operadores", uid), { valorHora, nome });
    setTravado(true);
  };

  /* ======================
     RESUMOS
  ====================== */
  const hojeInicio = inicioDia();
  const iniSemana = inicioSemana();
  const agora = new Date();

  const totalHojeLogs = historico
    .filter(h => new Date(h.data) >= hojeInicio)
    .reduce((a, b) => a + b.valor, 0);

  const hoje = totalHojeLogs + (rodando ? saldoAtual : 0);

  const semanal = historico
    .filter(h => new Date(h.data) >= iniSemana)
    .reduce((a, b) => a + b.valor, 0);

  const mensal = historico
    .filter(h => new Date(h.data).getMonth() === agora.getMonth())
    .reduce((a, b) => a + b.valor, 0);

  const recebido = historico.filter(h => h.pago).reduce((a, b) => a + b.valor, 0);
  const pendente = historico.filter(h => !h.pago).reduce((a, b) => a + b.valor, 0);

  if (loading) return null;

  /* ======================
     JSX
  ====================== */
  return (
    <div className="min-h-screen bg-black text-white">
      <Header user={user} />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        <button
          onClick={() => (window.location.href = "/")}
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700"
        >
          ← Voltar para o Dashboard
        </button>

        <div className="text-2xl font-bold text-green-400">
          ⏱ {formatarTempo(segundos)} — R$ {saldoAtual.toFixed(2)}
        </div>

        {!rodando ? (
          <button
            onClick={iniciar}
            className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold"
          >
            Iniciar Expediente
          </button>
        ) : (
          <button
            onClick={parar}
            className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-black font-bold"
          >
            Finalizar Expediente
          </button>
        )}

        {/* CONFIG */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-zinc-900 p-4 rounded-xl">
            <p className="text-zinc-400 text-sm mb-1">Nome do operador</p>
            <input
              disabled={travado}
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full bg-zinc-800 rounded px-3 py-2 text-white"
            />
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl">
            <p className="text-zinc-400 text-sm mb-1">Valor por hora</p>
            <input
              type="number"
              disabled={travado}
              value={valorHora}
              onChange={e => setValorHora(+e.target.value)}
              className="w-full bg-zinc-800 rounded px-3 py-2 text-white"
            />
          </div>

          <div className="flex items-end gap-2">
            {travado ? (
              <button
                onClick={desbloquear}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700"
              >
                🔒 Desbloquear
              </button>
            ) : (
              <button
                onClick={salvarConfigs}
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 text-black font-bold"
              >
                Salvar
              </button>
            )}
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl">
            <p className="text-zinc-400 text-sm mb-2">Contas operadas</p>
            <div className="flex items-center gap-3">
              <button
                disabled={!rodando || contas <= 1}
                onClick={() => setContas(c => c - 1)}
                className="w-8 h-8 rounded bg-zinc-700 hover:bg-zinc-600"
              >−</button>
              <span className="font-bold">{contas}</span>
              <button
                disabled={!rodando}
                onClick={() => setContas(c => c + 1)}
                className="w-8 h-8 rounded bg-zinc-700 hover:bg-zinc-600"
              >+</button>
            </div>
          </div>
        </div>

        {/* RESUMOS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Resumo titulo="Hoje" valor={hoje} />
          <Resumo titulo="Semana" valor={semanal} />
          <Resumo titulo="Mês" valor={mensal} />
          <Resumo titulo="Recebido" valor={recebido} />
          <Resumo titulo="Pendente" valor={pendente} />
        </div>

        {/* HISTÓRICO */}
        <div className="bg-zinc-900 p-6 rounded-xl space-y-4">
          <h2 className="text-xl font-bold">Histórico</h2>

          {historico.map((h, i) => (
            <div
              key={i}
              className="bg-zinc-800 p-4 rounded-lg grid md:grid-cols-7 gap-3 items-center"
            >
              <div>
                <p className="font-bold">{h.nome}</p>
                <p className="text-zinc-400 text-sm">
                  {new Date(h.data).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-400">Entrada</p>
                <p>{formatarHora(h.entrada)}</p>
              </div>

              <div>
                <p className="text-xs text-zinc-400">Saída</p>
                <p>{formatarHora(h.saida)}</p>
              </div>

              <div>
                <p className="text-xs text-zinc-400">Tempo</p>
                <p>{formatarTempo(h.segundos)}</p>
              </div>

              <div>
                <p className="text-xs text-zinc-400">Contas</p>
                <p>{h.qtdeContas}</p>
              </div>

              <div>
                <p className="font-bold">R$ {h.valor.toFixed(2)}</p>
                <button
                  onClick={() => marcarPago(i)}
                  className={
                    h.pago
                      ? "mt-1 px-4 py-1 rounded-full bg-green-500 text-black text-xs font-bold"
                      : "mt-1 px-4 py-1 rounded-full bg-red-500 text-white text-xs font-bold"
                  }
                >
                  {h.pago ? "PAGO" : "PENDENTE"}
                </button>
              </div>

              <div className="flex gap-2 items-center">
                <label className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-700 hover:bg-zinc-600 cursor-pointer text-xl">
                  📎
                  <input hidden type="file" onChange={e => upload(e, i)} />
                </label>

                {h.comprovante && (
                  <>
                    <a href={h.comprovante} target="_blank">👁️</a>
                    <a href={h.comprovante} download>💾</a>
                  </>
                )}

                <button onClick={() => excluir(i)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>

        {isAdmin && <PainelOperadores user={user} />}
      </main>
    </div>
  );
}

function Resumo({ titulo, valor }) {
  return (
    <div className="bg-zinc-900 p-4 rounded-xl">
      <p className="text-zinc-400">{titulo}</p>
      <p className="text-green-400 font-bold text-lg">
        R$ {valor.toFixed(2)}
      </p>
    </div>
  );
}
