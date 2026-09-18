"use client";

import {
  useState,
} from "react";

import {
  generarOrdenTrabajoPdfsAction,
} from "./pdf/actions";

type OrdenExistente = {
  id: string;
  numeroOrden: string;
  fecha: string;

  tecnico: string;

  matricula:
    | string
    | null;

  fechaProgramada:
    | string
    | null;

  horaProgramada:
    | string
    | null;
};

type DocumentoPdf = {
  url: string;
  nombreArchivo: string;
};

type DocumentosGenerados = {
  original: DocumentoPdf;
  copia: DocumentoPdf;
};

type Props = {
  ordenes: OrdenExistente[];
};

function fechaArgentina(
  valor:
    | string
    | null
) {
  if (!valor) {
    return "-";
  }

  const partes =
    valor
      .slice(0, 10)
      .split("-");

  if (
    partes.length !== 3
  ) {
    return valor;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export default function OrdenesTrabajoExistentes({
  ordenes,
}: Props) {
  const [
    procesandoId,
    setProcesandoId,
  ] = useState("");

  const [
    modoProcesando,
    setModoProcesando,
  ] = useState<
    "recuperar" | "regenerar" | ""
  >("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    documentos,
    setDocumentos,
  ] = useState<
    Record<
      string,
      DocumentosGenerados
    >
  >({});

  const [
    descargando,
    setDescargando,
  ] = useState("");

  async function generarPdfs(
    orden: OrdenExistente,
    regenerar = false
  ) {
    setError("");
    setMensaje("");

    if (regenerar) {
      const confirmar =
        window.confirm(
          `¿Querés regenerar el ORIGINAL y la COPIA de ${orden.numeroOrden}? Se actualizarán los PDF de esta misma Orden de Trabajo, sin crear una nueva.`
        );

      if (!confirmar) {
        return;
      }
    }

    setProcesandoId(
      orden.id
    );

    setModoProcesando(
      regenerar
        ? "regenerar"
        : "recuperar"
    );

    const resultado =
      await generarOrdenTrabajoPdfsAction(
        orden.id,
        {
          regenerar,
        }
      );

    setProcesandoId("");
    setModoProcesando("");

    if (!resultado.ok) {
      setError(
        resultado.error ||
          "No se pudieron generar los PDF."
      );

      return;
    }

    setDocumentos(
      (actuales) => ({
        ...actuales,

        [orden.id]: {
          original: {
            url:
              resultado.original
                .url,

            nombreArchivo:
              resultado.original
                .nombreArchivo,
          },

          copia: {
            url:
              resultado.copia
                .url,

            nombreArchivo:
              resultado.copia
                .nombreArchivo,
          },
        },
      })
    );

    setMensaje(
      regenerar
        ? `${orden.numeroOrden}: ORIGINAL y COPIA regenerados correctamente.`
        : `${orden.numeroOrden}: ORIGINAL y COPIA disponibles.`
    );
  }

  function verPdf(
    documento: DocumentoPdf
  ) {
    window.open(
      documento.url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function descargarPdf(
    documento: DocumentoPdf
  ) {
    setError("");

    setDescargando(
      documento.nombreArchivo
    );

    try {
      const respuesta =
        await fetch(
          documento.url
        );

      if (!respuesta.ok) {
        throw new Error(
          "No se pudo descargar."
        );
      }

      const blob =
        await respuesta.blob();

      const urlTemporal =
        URL.createObjectURL(
          blob
        );

      const enlace =
        document.createElement(
          "a"
        );

      enlace.href =
        urlTemporal;

      enlace.download =
        documento.nombreArchivo;

      document.body.appendChild(
        enlace
      );

      enlace.click();

      enlace.remove();

      URL.revokeObjectURL(
        urlTemporal
      );
    } catch {
      setError(
        "No se pudo descargar el PDF."
      );
    } finally {
      setDescargando("");
    }
  }

  if (
    ordenes.length === 0
  ) {
    return null;
  }

  return (
    <section
      style={sectionStyle}
    >
      <div>
        <span
          style={
            smallLabelStyle
          }
        >
          ÓRDENES YA CREADAS
        </span>

        <h2
          style={{
            margin:
              "5px 0 0",

            color:
              "var(--foreground)",

            fontSize:
              "1.2rem",
          }}
        >
          Órdenes de Trabajo
          existentes
        </h2>

        <p
          style={{
            margin:
              "8px 0 0",

            color:
              "var(--muted)",

            lineHeight: 1.5,
          }}
        >
          Podés recuperar los
          documentos existentes o
          regenerarlos sin crear
          otra Orden de Trabajo.
        </p>
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

      {mensaje ? (
        <div
          style={
            successStyle
          }
        >
          {mensaje}
        </div>
      ) : null}

      <div
        style={{
          display:
            "grid",

          gap: "12px",
        }}
      >
        {ordenes.map(
          (orden) => {
            const pdfs =
              documentos[
                orden.id
              ];

            const procesando =
              procesandoId ===
              orden.id;

            return (
              <article
                key={
                  orden.id
                }
                style={
                  ordenStyle
                }
              >
                <div
                  style={{
                    display:
                      "grid",

                    gap: "5px",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "var(--foreground)",

                      fontSize:
                        "1.05rem",
                    }}
                  >
                    {
                      orden.numeroOrden
                    }
                  </strong>

                  <span
                    style={
                      datoStyle
                    }
                  >
                    Emitida:{" "}
                    {fechaArgentina(
                      orden.fecha
                    )}
                  </span>

                  <span
                    style={
                      datoStyle
                    }
                  >
                    Técnico:{" "}
                    {
                      orden.tecnico
                    }

                    {orden.matricula
                      ? ` · Matrícula ${orden.matricula}`
                      : ""}
                  </span>

                  {orden.fechaProgramada ? (
                    <span
                      style={
                        datoStyle
                      }
                    >
                      Programada:{" "}
                      {fechaArgentina(
                        orden.fechaProgramada
                      )}

                      {orden.horaProgramada
                        ? ` · ${orden.horaProgramada.slice(
                            0,
                            5
                          )} hs`
                        : ""}
                    </span>
                  ) : null}
                </div>

                {!pdfs ? (
                  <div
                    style={
                      actionRowStyle
                    }
                  >
                    <button
                      type="button"
                      disabled={
                        Boolean(
                          procesandoId
                        )
                      }
                      onClick={() =>
                        generarPdfs(
                          orden,
                          false
                        )
                      }
                      style={
                        primaryButtonStyle
                      }
                    >
                      {procesando &&
                      modoProcesando ===
                        "recuperar"
                        ? "Recuperando PDFs..."
                        : "Generar / recuperar PDFs"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        Boolean(
                          procesandoId
                        )
                      }
                      onClick={() =>
                        generarPdfs(
                          orden,
                          true
                        )
                      }
                      style={
                        regenerateButtonStyle
                      }
                    >
                      {procesando &&
                      modoProcesando ===
                        "regenerar"
                        ? "Regenerando PDFs..."
                        : "Regenerar PDFs"}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display:
                        "grid",

                      gap: "12px",
                    }}
                  >
                    <div
                      style={
                        successStyle
                      }
                    >
                      ORIGINAL y
                      COPIA
                      disponibles.
                    </div>

                    <div
                      style={
                        documentosGridStyle
                      }
                    >
                      <div
                        style={
                          documentoStyle
                        }
                      >
                        <strong>
                          ORIGINAL
                        </strong>

                        <button
                          type="button"
                          onClick={() =>
                            verPdf(
                              pdfs.original
                            )
                          }
                          style={
                            secondaryButtonStyle
                          }
                        >
                          Ver ORIGINAL
                        </button>

                        <button
                          type="button"
                          disabled={
                            Boolean(
                              descargando
                            )
                          }
                          onClick={() =>
                            descargarPdf(
                              pdfs.original
                            )
                          }
                          style={
                            downloadButtonStyle
                          }
                        >
                          {descargando ===
                          pdfs.original
                            .nombreArchivo
                            ? "Descargando..."
                            : "Descargar ORIGINAL"}
                        </button>
                      </div>

                      <div
                        style={
                          documentoStyle
                        }
                      >
                        <strong>
                          COPIA
                        </strong>

                        <button
                          type="button"
                          onClick={() =>
                            verPdf(
                              pdfs.copia
                            )
                          }
                          style={
                            secondaryButtonStyle
                          }
                        >
                          Ver COPIA
                        </button>

                        <button
                          type="button"
                          disabled={
                            Boolean(
                              descargando
                            )
                          }
                          onClick={() =>
                            descargarPdf(
                              pdfs.copia
                            )
                          }
                          style={
                            downloadButtonStyle
                          }
                        >
                          {descargando ===
                          pdfs.copia
                            .nombreArchivo
                            ? "Descargando..."
                            : "Descargar COPIA"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={
                        Boolean(
                          procesandoId
                        )
                      }
                      onClick={() =>
                        generarPdfs(
                          orden,
                          true
                        )
                      }
                      style={
                        regenerateButtonStyle
                      }
                    >
                      {procesando &&
                      modoProcesando ===
                        "regenerar"
                        ? "Regenerando ORIGINAL y COPIA..."
                        : "Regenerar ORIGINAL y COPIA"}
                    </button>
                  </div>
                )}
              </article>
            );
          }
        )}
      </div>
    </section>
  );
}

const sectionStyle = {
  display: "grid",
  gap: "15px",

  padding: "20px",

  marginBottom:
    "20px",

  border:
    "1px solid rgba(38, 40, 42, 0.12)",

  borderRadius:
    "16px",

  background:
    "rgba(255, 253, 248, 0.92)",
};

const smallLabelStyle = {
  color:
    "var(--brand-blue)",

  fontSize:
    "0.72rem",

  fontWeight: 800,

  letterSpacing:
    "0.08em",
};

const ordenStyle = {
  display: "grid",

  gap: "14px",

  padding: "16px",

  border:
    "1px solid rgba(38, 40, 42, 0.12)",

  borderRadius:
    "12px",

  background:
    "#ffffff",
};

const datoStyle = {
  color:
    "var(--muted)",

  fontSize:
    "0.85rem",
};

const actionRowStyle = {
  display: "flex",

  flexWrap:
    "wrap" as const,

  gap: "9px",
};

const primaryButtonStyle = {
  minHeight:
    "42px",

  padding:
    "9px 14px",

  border: "none",

  borderRadius:
    "9px",

  background:
    "var(--foreground)",

  color:
    "#ffffff",

  font:
    "inherit",

  fontWeight: 800,

  cursor: "pointer",
};

const regenerateButtonStyle = {
  minHeight:
    "42px",

  padding:
    "9px 14px",

  border:
    "1px solid rgba(192, 110, 25, 0.35)",

  borderRadius:
    "9px",

  background:
    "rgba(192, 110, 25, 0.10)",

  color:
    "#9a5814",

  font:
    "inherit",

  fontWeight: 800,

  cursor: "pointer",
};

const secondaryButtonStyle = {
  minHeight:
    "38px",

  padding:
    "8px 12px",

  border:
    "1px solid rgba(38, 40, 42, 0.18)",

  borderRadius:
    "8px",

  background:
    "#ffffff",

  color:
    "var(--foreground)",

  font:
    "inherit",

  fontWeight: 800,

  cursor: "pointer",
};

const downloadButtonStyle = {
  ...secondaryButtonStyle,

  border: "none",

  background:
    "#236b43",

  color:
    "#ffffff",
};

const documentosGridStyle = {
  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",

  gap: "10px",
};

const documentoStyle = {
  display: "grid",

  gap: "8px",

  padding: "12px",

  borderRadius:
    "10px",

  background:
    "rgba(38, 111, 164, 0.05)",
};

const successStyle = {
  padding: "11px",

  borderRadius:
    "9px",

  background:
    "rgba(35, 107, 67, 0.08)",

  color:
    "#236b43",

  fontWeight: 800,
};

const errorStyle = {
  padding: "12px",

  borderRadius:
    "10px",

  background:
    "rgba(180, 40, 40, 0.08)",

  color:
    "#982828",

  fontWeight: 800,
};
