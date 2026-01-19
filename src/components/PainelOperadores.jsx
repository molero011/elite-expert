import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "firebase/firestore";

const ADMIN_LOGIN = "eliteadm";

/* ======================
   HELPERS
====================== */
function formatarTempo(segundos = 0) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  return `${h}h ${m}m ${s}s`;
}

function formatarHora(data) {
  return new Date(data).toLocaleTimeString("pt-BR");
}

/* ======================
   COMPONENT
====================== */
export default function PainelOperadores({ user }) {
  if (!user || user.login !== ADMIN_LOGIN) return null;

  const [operadores, setOperadores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      const snap = await getDocs(collection(db, "operadores"));

      const lista = snap.docs.map(d => ({
        uid: d.id,
        ...d.data()
      }));

      setOperadores(lista);
      setLoading(false);
    }

    carregar();
  }, []);

  async function togglePago(uid, index) {
    const operador = operadores.find(o => o.uid === uid);
    if (!operador) return;

    const novoHistorico = operador.historico.map((h, i) =>
      i === index ? { ...h, pago: !h.pago } : h
    );

    await updateDoc(doc(db, "operadores", uid), {
      historico: novoHistorico
    });

    setOperadores(ops =>
      ops.map(o =>
        o.uid === uid ? { ...o, historico: novoHistorico } : o
      )
    );
  }

  async function salvarValorHora(uid, valorHora) {
    await updateDoc(doc(db, "operadores", uid), {
      valorHora
    });

    setOperadores(ops =>
      ops.map(o =>
        o.uid === uid ? { ...o, valorHora } : o
      )
    );
  }

  if (loading) {
    return (
      <p className="text-zinc-400 mt-10 text-center">
        Carregando painel de operadores...
      </p>
    );
  }

  return (
    <div className="mt-14">
      <h2 className="text-2xl mb-6 text-elite">
        Painel Operadores (ADMIN)
      </h2>

      {operadores.map(op => (
        <div
          key={op.uid}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-10"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">
              Operador:{" "}
              <span className="text-elite">{op.uid}</span>
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">
                Valor/hora:
              </span>
              <input
                type="number"
                defaultValue={op.valorHora}
                className="bg-zinc-800 px-2 py-1 rounded w-24"
                onBlur={e =>
                  salvarValorHora(
                    op.uid,
                    Number(e.target.value)
                  )
                }
              />
            </div>
          </div>

          {(!op.historico || op.historico.length === 0) && (
            <p className="text-zinc-500">
              Nenhum ponto registrado.
            </p>
          )}

          {op.historico?.map((h, i) => (
            <div
              key={i}
              className="grid grid-cols-7 gap-3 text-sm border-b border-zinc-800 py-3 items-center"
            >
              <div>
                {new Date(h.data).toLocaleDateString("pt-BR")}
              </div>

              <div>
                {h.inicio ? formatarHora(h.inicio) : "-"}
              </div>

              <div>{formatarTempo(h.segundos)}</div>

              <div>R$ {h.valor.toFixed(2)}</div>

              <button
                onClick={() => togglePago(op.uid, i)}
                className={`px-3 py-1 rounded-full font-bold ${
                  h.pago
                    ? "bg-green-500 text-black"
                    : "bg-red-500 text-black"
                }`}
              >
                {h.pago ? "PAGO" : "PENDENTE"}
              </button>

              <div className="flex gap-2">
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
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
