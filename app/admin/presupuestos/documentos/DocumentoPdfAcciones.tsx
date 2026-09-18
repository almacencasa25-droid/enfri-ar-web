"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  descargarDocumentoPresupuestoAction,
  verDocumentoPresupuestoAction,
} from "./actions";

type Props = {
  storagePath: string;
};

export default function DocumentoPdfAcciones({
  storagePath,
}: Props) {
  const [
    error,
    setError,
  ] = useState("");

  const [
    procesando,
    startTransition,
  ] = useTransition();

  function verPdf() {
    setError("");

    /*
     * Abrimos primero una pestaña vacía.
     * Así el navegador no bloquea la
     * vista previa mientras esperamos
     * el enlace seguro de Supabase.
     */
    const nuevaVentana =
      window.open(
        "about:blank",
        "_blank"
      );

    if (nuevaVentana) {
      nuevaVentana.opener =
        null;

      nuevaVentana.document.title =
        "Cargando PDF...";
    }

    startTransition(
      async () => {
        const resultado =
          await verDocumentoPresupuestoAction(
            storagePath
          );

        if (!resultado.ok) {
          if (
            nuevaVentana &&
            !nuevaVentana.closed
          ) {
            nuevaVentana.close();
          }

          setError(
            resultado.error ||
              "No se pudo abrir el PDF."
          );

          return;
        }

        if (nuevaVentana) {
          nuevaVentana.location.href =
            resultado.url;

          return;
        }

        /*
         * Respaldo para navegadores
         * que bloqueen la pestaña.
         */
        window.open(
          resultado.url,
          "_blank",
          "noopener,noreferrer"
        );
      }
    );
  }

  function descargarPdf() {
    setError("");

    startTransition(
      async () => {
        const resultado =
          await descargarDocumentoPresupuestoAction(
            storagePath
          );

        if (!resultado.ok) {
          setError(
            resultado.error ||
              "No se pudo descargar el PDF."
          );

          return;
        }

        const enlace =
          document.createElement(
            "a"
          );

        enlace.href =
          resultado.url;

        enlace.download =
          resultado.nombreArchivo;

        enlace.rel =
          "noopener noreferrer";

        document.body.appendChild(
          enlace
        );

        enlace.click();

        enlace.remove();
      }
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <button
          type="button"
          disabled={procesando}
          onClick={verPdf}
          style={{
            minHeight: "38px",
            padding: "7px 13px",
            border:
              "1px solid rgba(38, 40, 42, 0.18)",
            borderRadius: "9px",
            background: "#ffffff",
            color:
              "var(--foreground)",
            font: "inherit",
            fontSize: "0.82rem",
            fontWeight: 800,
            cursor:
              procesando
                ? "wait"
                : "pointer",
            opacity:
              procesando
                ? 0.65
                : 1,
          }}
        >
          Ver PDF
        </button>

        <button
          type="button"
          disabled={procesando}
          onClick={
            descargarPdf
          }
          style={{
            minHeight: "38px",
            padding: "7px 13px",
            border:
              "1px solid rgba(20, 110, 160, 0.28)",
            borderRadius: "9px",
            background:
              "rgba(20, 110, 160, 0.08)",
            color: "#146e9f",
            font: "inherit",
            fontSize: "0.82rem",
            fontWeight: 800,
            cursor:
              procesando
                ? "wait"
                : "pointer",
            opacity:
              procesando
                ? 0.65
                : 1,
          }}
        >
          {procesando
            ? "Procesando..."
            : "Descargar PDF"}
        </button>
      </div>

      {error ? (
        <div
          style={{
            padding:
              "8px 10px",
            borderRadius:
              "8px",
            background:
              "rgba(180, 40, 40, 0.08)",
            color:
              "#982828",
            fontSize:
              "0.78rem",
            fontWeight:
              700,
          }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
