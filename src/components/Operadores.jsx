import { useEffect, useRef, useState } from "react";
import Header from "./Header";
import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

/* ======================
   CONFIG
====================== */
const SENHA_MESTRA = "EliteExpert";
const ADMIN_LOGIN = "eliteadm";

/* ======================
   HELPERS
====================== */
function formatarTempo(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  return `${h}h ${m}m ${s}s`;
}

function formatarHora(date) {
  return date.toLocaleTimeString("pt-BR");
}

/* ======================
   COMPONENT
====================== */
export default function Operadores({ user, onLogout }) {
  if (!user) return null;

  const uid = user.login || user.email;

  const isAdmin =
    user.login === ADMIN_LOGIN ||
    user.email === ADMIN_LOGIN;

  /* ======================
     STATES
  ====================== */
  const [rodando, setRodando] = useState(false);
  const [inicioMs, setInicioMs] = useState(null);
  const [inicioDate, setInicioDate] = useState(null);
  const [ultimoTick, setUltimoTick] = useState(null);

  const [segundos, setSegundos] = useState(0);
  const [saldo, setSaldo] = useState(0);

  const [valorHora, setValorHora] = useState(20);
  const [travado, setTravado] = useState(true);

  const [historico, setHistorico] = useState([]);

  const intervalo = useRef(null);

  /* ======================
     LOAD
  ====================== */
  useEffect(() => {
    async function carregar() {
      const ref = doc(db, "operadores", uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const d = snap.data();
        setValorHora(d.valorHora ?? 20);
        setHistorico(d.historico ?? []);
      } else {
        await setDoc(ref, {
          valorHora: 20,
          historico: []
        });
      }
    }

    carregar();
  }, [uid]);

  /* ======================
     CRONÔMETRO + DINHEIRO (CORRETO)
  ====================== */
  useEffect(() => {
    if (!rodando) return;

    intervalo.current = setInterval(() => {
      const agora = Date.now();

      if (!ultimoTick) {
        setUltimoTick(agora);
        return;
      }

      const deltaMs = agora - ultimoTick;

      const ganho =
        (deltaMs / 1000) * (valorHora / 3600);

      setSaldo(v => v + ganho);
      setSegundos(s => s + deltaMs / 1000);
      setUltimoTick(agora);
    }, 200);

    return () => clearInterval(intervalo.current);
  }, [rodando, ultimoTick, valorHora]);

  /* ======================
     CONTROLES
  ====================== */
  function iniciar() {
    setRodando(true);
    setInicioMs(Date.now());
    setInicioDate(new Date());
    setUltimoTick(null);
    setSaldo(0);
    setSegundos(0);
  }

  async function parar() {
    const ok = window.confirm(
      "Você deseja mesmo encerrar o expediente?"
    );
    if (!ok) return;

    clearInterval(intervalo.current);
    setRodando(false);

    const novoLog = {
      data: new Date().toISOString(),
      inicio: inicioDate?.toISOString(),
      segundos: segundos,
      valor: saldo,
      pago: false,
      comprovante: null
    };

    const novoHistorico = [novoLog, ...historico];
    setHistorico(novoHistorico);

    await updateDoc(doc(db, "operadores", uid), {
      historico: novoHistorico
    });

    setSaldo(0);
    setSegundos(0);
  }

  function desbloquear() {
    if (isAdmin) {
      setTravado(false);
      return;
    }

    const senha = prompt("Senha para alterar valor:");
    if (senha === SENHA_MESTRA) setTravado(false);
    else alert("Senha incorreta");
  }

  async function salvarValor() {
    await updateDoc(doc(db, "operadores", uid), {
      valorHora
    });
    setTravado(true);
  }

  function marcarPago(index) {
    if (!isAdmin) return;

    const novo = historico.map((h, i) =>
      i === index ? { ...h, pago: !h.pago } : h
    );

    setHistorico(novo);
    updateDoc(doc(db, "operadores", uid), {
      historico: novo
    });
  }

  function uploadComprovante(e, index) {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const novo = historico.map((h, i) =>
      i === index ? { ...h, comprovante: url } : h
    );

    setHistorico(novo);
    updateDoc(doc(db, "operadores", uid), {
      historico: novo
    });
  }

  function excluirLog(index) {
    const senha = prompt("Senha para excluir log:");
    if (senha !== SENHA_MESTRA) return;

    const novo = historico.filter((_, i) => i !== index);
    setHistorico(novo);
    updateDoc(doc(db, "operadores", uid), {
      historico: novo
    });
  }

  /* ======================
     TOTAIS
  ====================== */
  const recebido = historico
    .filter(h => h.pago)
    .reduce((a, b) => a + b.valor, 0);

  const pendente = historico
    .filter(h => !h.pago)
    .reduce((a, b) => a + b.valor, 0);

  /* ======================
     JSX
  ====================== */
  return (
    <div className="min-h-screen bg-black text-white">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <button
          onClick={() => (window.location.href = "/")}
          className="text-zinc-400 mb-6"
        >
          ← Voltar Dashboard
        </button>

        <div className="text-elite mb-1">
          ⏱ {formatarTempo(segundos)}
        </div>

        {inicioDate && (
          <div className="text-zinc-400 text-sm mb-3">
            Início: {formatarHora(inicioDate)}
          </div>
        )}

        {!rodando ? (
          <button
            onClick={iniciar}
            className="bg-elite text-black px-6 py-3 rounded-xl"
          >
            Iniciar
          </button>
        ) : (
          <button
            onClick={parar}
            className="bg-red-500 text-black px-6 py-3 rounded-xl"
          >
            Parar
          </button>
        )}

        <div className="grid grid-cols-2 gap-6 my-6">
          <div>
            <p>Saldo atual</p>
            <p className="text-elite text-xl">
              R$ {saldo.toFixed(3)}
            </p>
          </div>

          <div>
            <p>Valor por hora</p>
            <div className="flex gap-2">
              <input
                type="number"
                value={valorHora}
                disabled={travado}
                onChange={e =>
                  setValorHora(Number(e.target.value))
                }
                className="bg-zinc-800 p-2 rounded"
              />
              {travado ? (
                <button onClick={desbloquear}>🔒</button>
              ) : (
                <button onClick={salvarValor}>💾</button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Resumo titulo="Recebido" valor={recebido} cor="green" />
          <Resumo titulo="Pendente" valor={pendente} cor="red" />
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl">
          <h2 className="mb-4">Histórico</h2>

          {historico.map((h, i) => (
            <div
              key={i}
              className="flex justify-between items-center border-b border-zinc-700 py-3 text-sm"
            >
              <div>
                <p>
                  {new Date(h.data).toLocaleDateString()}
                </p>
                <p className="text-zinc-400">
                  Início:{" "}
                  {h.inicio
                    ? formatarHora(new Date(h.inicio))
                    : "-"}
                </p>
                <p className="text-zinc-400">
                  {formatarTempo(h.segundos)}
                </p>
              </div>

              <div>
                R$ {h.valor.toFixed(2)}
                <span
                  className={`ml-2 px-2 py-1 rounded-full ${
                    h.pago
                      ? "bg-green-500 text-black"
                      : "bg-red-500 text-black"
                  }`}
                >
                  {h.pago ? "PAGO" : "PENDENTE"}
                </span>
              </div>

              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  onChange={e =>
                    uploadComprovante(e, i)
                  }
                />

                {h.comprovante && (
                  <>
                    <a
                      href={h.comprovante}
                      target="_blank"
                      rel="noreferrer"
                    >
                      👁️
                    </a>
                    <a href={h.comprovante} download>
                      💾
                    </a>
                  </>
                )}

                {isAdmin && (
                  <>
                    <button
                      onClick={() => marcarPago(i)}
                    >
                      ✅
                    </button>
                    <button
                      onClick={() => excluirLog(i)}
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function Resumo({ titulo, valor, cor }) {
  return (
    <div className="bg-zinc-900 p-4 rounded-xl">
      <p className="text-zinc-400">{titulo}</p>
      <p className={`text-${cor}-400 font-bold`}>
        R$ {valor.toFixed(2)}
      </p>
    </div>
  );
}
