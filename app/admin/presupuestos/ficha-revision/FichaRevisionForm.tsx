"use client";

import { useState } from "react";

import { generarFichasRevisionAction } from "./actions";

type FichaRevisionFormProps = {
  proximoNumero: number;
};

export default function FichaRevisionForm({
  proximoNumero,
}: FichaRevisionFormProps) {
  const [cantidad, setCantidad] =
    useState(1);

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

  async function generarPdf() {
    setGenerando(true);
    setMensaje(null);
    setError(null);

    try {
      const resultado =
        await generarFichasRevisionAction(
          cantidadSegura
        );

      if (!resultado.ok) {
        setError(
          resultado.error
        );

        return;
      }

      const binario =
        atob(
          resultado.pdfBase64
        );

      const bytes =
        new Uint8Array(
          binario.length
        );

      for (
        let indice = 0;
        indice <
        binario.length;
        indice += 1
      ) {
        bytes[indice] =
          binario.charCodeAt(
            indice
          );
      }

      const blob =
        new Blob(
          [bytes],
          {
            type:
              "application/pdf",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const enlace =
        document.createElement(
          "a"
        );

      enlace.href = url;
      enlace.download =
        resultado.archivo;

      document.body.appendChild(
        enlace
      );

      enlace.click();

      enlace.remove();

      window.setTimeout(
        () => {
          URL.revokeObjectURL(
            url
          );
        },
        1000
      );

      setMensaje(
        `Fichas ${numeroVisible(
          resultado.numeroInicial
        )} a ${numeroVisible(
          resultado.numeroFinal
        )} generadas correctamente. Próxima ficha: ${numeroVisible(
          resultado.proximoNumero
        )}.`
      );

      window.setTimeout(
        () => {
          window.location.reload();
        },
        900
      );
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
        Elegí cuántas fichas
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
