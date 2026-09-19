"use client";

import {
  useEffect,
  useState,
  useTransition,
} from "react";

import {
  comprobarDocumentoPresupuestoAction,
  descargarDocumentoPresupuestoAction,
  verDocumentoPresupuestoAction,
} from "./actions";

import {
  repararPresupuestoPdfHistoricoAction,
} from "../listado/pdf/actions";

type Props = {
  documentoId: string;
  storagePath: string;
};

export default function DocumentoPdfAcciones({
  documentoId,
  storagePath,
}: Props) {
  const [
    error,
    setError,
  ] = useState("");

  const [
    existeArchivo,
    setExisteArchivo,
  ] = useState<
    boolean | null
  >(null);

  const [
    procesando,
    startTransition,
  ] = useTransition();

  /*
   * =========================================
   * COMPROBAR EXISTENCIA FÍSICA DEL PDF
   * =========================================
   */

  useEffect(() => {
    let activo = true;

    async function comprobar() {
      setError("");

      const resultado =
        await comprobarDocumentoPresupuestoAction(
          storagePath
        );

      if (!activo) {
        return;
      }

      if (!resultado.ok) {
        setExisteArchivo(
          null
        );

        setError(
          resultado.error ||
            "No se pudo comprobar el PDF."
        );

        return;
      }

      setExisteArchivo(
        resultado.existe
      );
    }

    void comprobar();

    return () => {
      activo = false;
    };
  }, [storagePath]);

  /*
   * =========================================
   * VER PDF
   * =========================================
   */

  function verPdf() {
    setError("");

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

          /*
           * Si falló porque el archivo
           * desapareció físicamente,
           * volvemos a comprobar.
           */
          const comprobacion =
            await comprobarDocumentoPresupuestoAction(
              storagePath
            );

          if (
            comprobacion.ok
          ) {
            setExisteArchivo(
              comprobacion.existe
            );
          }

          return;
        }

        if (nuevaVentana) {
          nuevaVentana.location.href =
            resultado.url;

          return;
        }

        window.open(
          resultado.url,
          "_blank",
          "noopener,noreferrer"
        );
      }
    );
  }

  /*
   * =========================================
   * DESCARGAR PDF
   * =========================================
   */

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

          const comprobacion =
            await comprobarDocumentoPresupuestoAction(
              storagePath
            );

          if (
            comprobacion.ok
          ) {
            setExisteArchivo(
              comprobacion.existe
            );
          }

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

  /*
   * =========================================
   * REPARAR PDF HISTÓRICO
   * =========================================
   */

  function repararPdf() {
    setError("");

    const confirmar =
      window.confirm(
        "El registro histórico existe, pero falta el archivo PDF físico. ¿Querés reconstruir esta misma versión?"
      );

    if (!confirmar) {
      return;
    }

    startTransition(
      async () => {
        const resultado =
          await repararPresupuestoPdfHistoricoAction(
            documentoId
          );

        if (!resultado.ok) {
          setError(
            resultado.error ||
              "No se pudo reparar el PDF histórico."
          );

          return;
        }

        /*
         * La misma versión ya quedó
         * nuevamente guardada en Storage.
         */
        setExisteArchivo(true);
      }
    );
  }

  /*
   * =========================================
   * ESTADO DE COMPROBACIÓN
   * =========================================
   */

  if (
    existeArchivo ===
      null &&
    !error
  ) {
    return (
      <div
        style={
          comprobandoStyle
        }
      >
        Comprobando PDF...
      </div>
    );
  }

  /*
   * =========================================
   * PDF FALTANTE
   * =========================================
   */

  if (
    existeArchivo ===
    false
  ) {
    return (
      <div
        style={{
          display: "grid",
          gap: "8px",
        }}
      >
        <div
          style={
            missingBoxStyle
          }
        >
          El registro histórico
          existe, pero el archivo
          PDF físico no está en
          Storage.
        </div>

        <div>
          <button
            type="button"
            disabled={
              procesando
            }
            onClick={
              repararPdf
            }
            style={{
              ...repairButtonStyle,
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
              ? "Reparando..."
              : "Reparar PDF"}
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

  /*
   * =========================================
   * PDF DISPONIBLE
   * =========================================
   */

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
          disabled={
            procesando
          }
          onClick={
            verPdf
          }
          style={{
            ...viewButtonStyle,
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
          disabled={
            procesando
          }
          onClick={
            descargarPdf
          }
          style={{
            ...downloadButtonStyle,
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

const comprobandoStyle = {
  color:
    "var(--muted)",
  fontSize: "0.82rem",
  fontWeight: 700,
};

const missingBoxStyle = {
  padding: "9px 11px",
  borderRadius: "8px",
  background:
    "rgba(180, 120, 20, 0.09)",
  color: "#8a6215",
  fontSize: "0.8rem",
  fontWeight: 700,
  lineHeight: 1.5,
};

const viewButtonStyle = {
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
};

const downloadButtonStyle = {
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
};

const repairButtonStyle = {
  minHeight: "38px",
  padding: "7px 13px",
  border:
    "1px solid rgba(180, 120, 20, 0.32)",
  borderRadius: "9px",
  background:
    "rgba(180, 120, 20, 0.10)",
  color: "#8a6215",
  font: "inherit",
  fontSize: "0.82rem",
  fontWeight: 800,
};

const errorStyle = {
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
};
