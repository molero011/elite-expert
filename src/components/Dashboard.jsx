<tbody>
  {linhas.filter(pertenceAoMes).map((l, i) => {
    const lucro = calcularLucro(l);
    const eliteLinha =
      lucro > 0
        ? (lucro * num(percentualElite)) / 100
        : 0;

    return (
      <tr key={i} className="border-t border-zinc-800">

        {/* CONTA */}
        <td>
          <div className="flex items-center gap-2">
            <input
              className="input"
              value={l.conta}
              onChange={e =>
                atualizar(i, "conta", e.target.value)
              }
            />
            <button
              onClick={() => copiarTexto(l.conta)}
              title="Copiar conta"
            >
              📋
            </button>
          </div>
        </td>

        {/* SENHA */}
        <td>
          <div className="flex items-center gap-2">
            <input
              type={mostrarSenha[i] ? "text" : "password"}
              className="input"
              value={l.senha}
              onChange={e =>
                atualizar(i, "senha", e.target.value)
              }
            />

            <button
              onClick={() =>
                setMostrarSenha(prev => ({
                  ...prev,
                  [i]: !prev[i],
                }))
              }
              title="Mostrar / esconder senha"
            >
              {mostrarSenha[i] ? "🙈" : "👁️"}
            </button>

            <button
              onClick={() => copiarTexto(l.senha)}
              title="Copiar senha"
            >
              📋
            </button>
          </div>
        </td>

        {/* FORNECEDOR */}
        <td>
          <input
            className="input"
            value={l.fornecedor}
            onChange={e =>
              atualizar(i, "fornecedor", e.target.value)
            }
          />
        </td>

        {/* SALDO INICIAL */}
        <td>
          <input
            className="input"
            value={l.saldoInicial}
            onChange={e =>
              atualizar(
                i,
                "saldoInicial",
                limparNumero(e.target.value)
              )
            }
          />
        </td>

        {/* CUSTO */}
        <td>
          <input
            className="input"
            value={l.custo}
            onChange={e =>
              atualizar(
                i,
                "custo",
                limparNumero(e.target.value)
              )
            }
          />
        </td>

        {/* SALDO FINAL */}
        <td>
          <input
            className="input"
            value={l.saldoFinal}
            onChange={e =>
              atualizar(
                i,
                "saldoFinal",
                limparNumero(e.target.value)
              )
            }
          />
        </td>

        {/* LUCRO */}
        <td
          className={
            lucro > 0
              ? "text-elite"
              : lucro < 0
              ? "text-red-500"
              : "text-zinc-400"
          }
        >
          {lucro < 0
            ? `- ${moeda(Math.abs(lucro))}`
            : moeda(lucro)}
        </td>

        {/* ELITE */}
        <td className="text-sky-400">
          {eliteLinha ? moeda(eliteLinha) : "—"}
        </td>

        {/* STATUS */}
        <td>
          <button
            onClick={() =>
              atualizar(i, "elitePago", !l.elitePago)
            }
            className={`px-3 py-1 rounded-full text-xs ${
              l.elitePago
                ? "bg-green-600"
                : "bg-red-600"
            } text-black`}
          >
            {l.elitePago ? "PAGO" : "PENDENTE"}
          </button>
        </td>

        {/* DATA */}
        <td>
          <input
            type="date"
            className="input"
            value={l.data}
            onChange={e =>
              atualizar(i, "data", e.target.value)
            }
          />
        </td>

        {/* REMOVER */}
        <td>
          <button onClick={() => removerLinha(i)}>
            🗑️
          </button>
        </td>

      </tr>
    );
  })}
</tbody>
