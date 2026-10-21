"use client";

import { useState } from "react";

import { generarFichasRevisionAction, generarDorsosPreinstalacionAction } from "./actions";

type FichaRevisionFormProps = {
  proximoNumero: number;
};

export default function FichaRevisionForm({
  proximoNumero,
}: FichaRevisionFormProps) {
  const [tipo, setTipo] = useState<"revision" | "preinstalacion">("revision");

  const [cantidad, setCantidad] =
    useState(1);

  const [loteDorso, setLoteDorso] = useState<number | null>(null);
  const [imprimiendoDorso, setImprimiendoDorso] = useState(false);

  const [generando, setGenerando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const cantidadSegura =
    Number.isFinite(cantidad)
      ? Math.max(
          1,
          Math.min(
            100,
            Math.trunc(cantidad)
          )
        )
      : 1;

  const ultimoNumero =
    proximoNumero +
    cantidadSegura -
    1;

  function numeroVisible(
    numero: number
  ) {
    return String(
      numero
    ).padStart(
      6,
      "0"
    );
  }

  function descargar(base64: string, archivo: string) {
    const binario = atob(base64);
    const bytes = Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], {type:"application/pdf"}));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = archivo;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  async function imprimirDorsos() {
    if (!loteDorso) return;
    setImprimiendoDorso(true);
    setError(null);
    try {
      const resultado = await generarDorsosPreinstalacionAction(loteDorso);
      if (!resultado.ok) { setError(resultado.error); return; }
      descargar(resultado.pdfBase64, `preinstalacion-dorsos-${loteDorso}.pdf`);
      setMensaje("Dorsos descargados. Imprimí todas las páginas al 100%, sin impresión automática a doble cara. Verificá el sentido y orden del lote en tu impresora.");
      setLoteDorso(null);
    } catch { setError("No se pudieron preparar los dorsos."); }
    finally { setImprimiendoDorso(false); }
  }

  async function generarPdf() {
    setGenerando(true);
    setMensaje(null);
    setError(null);

    try {
      const resultado =
        await generarFichasRevisionAction(
          cantidadSegura,
          tipo
        );

      if (!resultado.ok) {
        setError(
          resultado.error
        );

        return;
      }

      descargar(resultado.pdfBase64, resultado.archivo);
      if (tipo === "preinstalacion") setLoteDorso(cantidadSegura);

      setMensaje(
        `Fichas ${numeroVisible(
          resultado.numeroInicial
        )} a ${numeroVisible(
          resultado.numeroFinal
        )} generadas correctamente. Próxima ficha: ${numeroVisible(
          resultado.proximoNumero
        )}.`
      );

      if (tipo !== "preinstalacion") window.setTimeout(() => window.location.reload(), 900);
    } catch (errorGeneracion) {
      console.error(
        "Error al generar fichas de revisión:",
        errorGeneracion
      );

      setError(
        "No fue posible generar las fichas."
      );
    } finally {
      setGenerando(false);
    }
  }

  return (
    <section
      style={{
        border:
          "1px solid rgba(38, 40, 42, 0.12)",
        borderRadius: "18px",
        background:
          "rgba(255, 253, 248, 0.92)",
        boxShadow:
          "0 14px 35px rgba(38, 40, 42, 0.08)",
        padding: "24px",
      }}
    >
      <h2
        style={{
          margin:
            "0 0 8px",
          color:
            "var(--foreground)",
          fontSize:
            "1.25rem",
        }}
      >
        Generar fichas
      </h2>

      <p
        style={{
          margin:
            "0 0 20px",
          color:
            "var(--muted)",
          lineHeight: 1.6,
        }}
      >
        Seleccioná el tipo de visita y elegí cuántas fichas
        necesitás imprimir.
        Cada ficha ocupa una
        hoja A4 y recibe un
        número correlativo.
      </p>

      <div
        style={{
          display: "grid",
          gap: "16px",
          maxWidth: "520px",
        }}
      >
        <label style={{ display: "grid", gap: "8px", fontWeight: 800, color: "var(--foreground)" }}>
          Tipo de ficha
          <select value={tipo} onChange={(event) => setTipo(event.target.value as "revision" | "preinstalacion")} style={{ minHeight: "46px", padding: "10px", borderRadius: "10px", border: "1px solid #b7c3ce", background: "#fff", color: "#222" }}>
            <option value="revision">Revisión técnica (actual)</option>
            <option value="preinstalacion">Visita para preinstalación (con croquis)</option>
          </select>
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          <div
            style={{
              padding:
                "14px",
              border:
                "1px solid rgba(38, 40, 42, 0.12)",
              borderRadius:
                "12px",
              background:
                "rgba(255, 255, 255, 0.7)",
            }}
          >
            <div
              style={{
                color:
                  "var(--muted)",
                fontSize:
                  "0.78rem",
                fontWeight:
                  800,
              }}
            >
              Primera ficha
            </div>

            <div
              style={{
                marginTop:
                  "4px",
                color:
                  "var(--foreground)",
                fontSize:
                  "1.2rem",
                fontWeight:
                  900,
              }}
            >
              {numeroVisible(
                proximoNumero
              )}
            </div>
          </div>

          <div
            style={{
              padding:
                "14px",
              border:
                "1px solid rgba(38, 40, 42, 0.12)",
              borderRadius:
                "12px",
              background:
                "rgba(255, 255, 255, 0.7)",
            }}
          >
            <div
              style={{
                color:
                  "var(--muted)",
                fontSize:
                  "0.78rem",
                fontWeight:
                  800,
              }}
            >
              Última ficha
            </div>

            <div
              style={{
                marginTop:
                  "4px",
                color:
                  "var(--foreground)",
                fontSize:
                  "1.2rem",
                fontWeight:
                  900,
              }}
            >
              {numeroVisible(
                ultimoNumero
              )}
            </div>
          </div>
        </div>

        <label
          style={{
            display: "grid",
            gap: "7px",
            color:
              "var(--foreground)",
            fontWeight: 800,
          }}
        >
          Cantidad de fichas

          <input
            type="number"
            min={1}
            max={100}
            value={cantidad}
            onChange={(
              event
            ) => {
              const valor =
                Number(
                  event.target
                    .value
                );

              if (
                !Number.isFinite(
                  valor
                )
              ) {
                setCantidad(
                  1
                );

                return;
              }

              setCantidad(
                Math.max(
                  1,
                  Math.min(
                    100,
                    Math.trunc(
                      valor
                    )
                  )
                )
              );
            }}
            style={{
              minHeight:
                "44px",
              padding:
                "9px 12px",
              border:
                "1px solid rgba(38, 40, 42, 0.18)",
              borderRadius:
                "10px",
              background:
                "#ffffff",
              color:
                "var(--foreground)",
              font: "inherit",
            }}
          />
        </label>

        <div
          style={{
            padding:
              "12px 14px",
            borderRadius:
              "10px",
            background:
              "rgba(51, 105, 167, 0.08)",
            color:
              "var(--foreground)",
            fontSize:
              "0.9rem",
            lineHeight: 1.55,
          }}
        >
          Se generarán{" "}
          <strong>
            {cantidadSegura}
          </strong>{" "}
          ficha
          {cantidadSegura ===
          1
            ? ""
            : "s"}{" "}
          numerada
          {cantidadSegura ===
          1
            ? ""
            : "s"}{" "}
          desde{" "}
          <strong>
            {numeroVisible(
              proximoNumero
            )}
          </strong>{" "}
          hasta{" "}
          <strong>
            {numeroVisible(
              ultimoNumero
            )}
          </strong>
          .
        </div>

        <button
          type="button"
          disabled={
            generando
          }
          onClick={
            generarPdf
          }
          style={{
            minHeight:
              "46px",
            padding:
              "10px 16px",
            border: 0,
            borderRadius:
              "10px",
            background:
              "var(--foreground)",
            color:
              "#ffffff",
            font: "inherit",
            fontWeight:
              900,
            cursor:
              generando
                ? "wait"
                : "pointer",
            opacity:
              generando
                ? 0.7
                : 1,
          }}
        >
          {generando
            ? "Generando..."
            : "Generar PDF"}
        </button>

        {loteDorso !== null ? (
          <div style={{padding:16,border:"2px solid #3369a7",borderRadius:12,background:"#edf5ff",color:"#17324d"}}>
            <strong>Paso 2: imprimir las {loteDorso} caras traseras</strong>
            <p>Primero imprimí todas las caras 1 del PDF descargado, a tamaño real y a una sola cara. Después colocá nuevamente las {loteDorso} hojas juntas en la bandeja. Según la impresora, puede ser necesario invertir el orden o la orientación; probá primero con una hoja.</p>
            <button type="button" disabled={imprimiendoDorso} onClick={imprimirDorsos} style={{padding:"12px 18px",background:"#176b50",color:"white",border:0,borderRadius:10,fontWeight:800,cursor:"pointer"}}>{imprimiendoDorso ? "Preparando..." : `Descargar e imprimir cara 2 (${loteDorso} hojas)`}</button>
          </div>
        ) : null}

        {mensaje ? (
          <div
            role="status"
            style={{
              padding:
                "12px 14px",
              border:
                "1px solid rgba(47, 143, 134, 0.28)",
              borderRadius:
                "10px",
              background:
                "rgba(47, 143, 134, 0.1)",
              color:
                "var(--foreground)",
              fontSize:
                "0.9rem",
              lineHeight:
                1.5,
            }}
          >
            {mensaje}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            style={{
              padding:
                "12px 14px",
              border:
                "1px solid rgba(180, 50, 50, 0.25)",
              borderRadius:
                "10px",
              background:
                "rgba(180, 50, 50, 0.08)",
              color:
                "#8b1e1e",
              fontSize:
                "0.9rem",
              fontWeight:
                700,
              lineHeight:
                1.5,
            }}
          >
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}
