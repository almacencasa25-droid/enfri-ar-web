"use client";

import {
  useState,
} from "react";

import {
  descargarDocumentoOrdenTrabajoAction,
  verDocumentoOrdenTrabajoAction,
} from "./actions";

type Props = {
  storagePath: string;
};

export default function DocumentoOrdenTrabajoAcciones({
  storagePath,
}: Props) {
  const [
    error,
    setError,
  ] = useState("");

  const [
    viendo,
    setViendo,
  ] = useState(false);

  const [
    descargando,
    setDescargando,
  ] = useState(false);

  async function verPdf() {
    setError("");
    setViendo(true);

    /*
     * Abrimos la pestaña inmediatamente
     * para evitar que el navegador
     * bloquee la vista previa.
     */
    const nuevaVentana =
      window.open(
        "",
        "_blank"
      );

    if (!nuevaVentana) {
      setViendo(false);

      setError(
        "El navegador bloqueó la nueva pestaña."
      );

      return;
    }

    try {
      nuevaVentana.document.title =
        "Cargando Orden de Trabajo...";

      const resultado =
        await verDocumentoOrdenTrabajoAction(
          storagePath
        );

      if (!resultado.ok) {
        nuevaVentana.close();

        setError(
          resultado.error ||
            "No se pudo abrir el PDF."
        );

        return;
      }

      nuevaVentana.location.href =
        resultado.url;
    } catch {
      nuevaVentana.close();

      setError(
        "No se pudo abrir el PDF."
      );
    } finally {
      setViendo(false);
    }
  }

  async function descargarPdf() {
    setError("");
    setDescargando(true);

    try {
      const resultado =
        await descargarDocumentoOrdenTrabajoAction(
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

      document.body.appendChild(
        enlace
      );

      enlace.click();

      enlace.remove();
    } catch {
      setError(
        "No se pudo descargar el PDF."
      );
    } finally {
      setDescargando(false);
    }
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
          onClick={verPdf}
          disabled={
            viendo ||
            descargando
          }
          style={
            previewButtonStyle
          }
        >
          {viendo
            ? "Abriendo..."
            : "Ver PDF"}
        </button>

        <button
          type="button"
          onClick={
            descargarPdf
          }
          disabled={
            viendo ||
            descargando
          }
          style={
            downloadButtonStyle
          }
        >
          {descargando
            ? "Descargando..."
            : "Descargar PDF"}
        </button>
      </div>

      {error ? (
        <div
          style={
            errorStyle
          }
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}

const previewButtonStyle = {
  minHeight: "38px",

  padding:
    "8px 13px",

  border:
    "1px solid rgba(38, 40, 42, 0.18)",

  borderRadius:
    "9px",

  background:
    "#ffffff",

  color:
    "var(--foreground)",

  font: "inherit",

  fontSize:
    "0.82rem",

  fontWeight: 800,

  cursor: "pointer",
};

const downloadButtonStyle = {
  ...previewButtonStyle,

  border: "none",

  background:
    "#236b43",

  color: "#ffffff",
};

const errorStyle = {
  padding: "10px",

  borderRadius:
    "9px",

  background:
    "rgba(180, 40, 40, 0.08)",

  color: "#982828",

  fontSize:
    "0.8rem",

  fontWeight: 800,
};
