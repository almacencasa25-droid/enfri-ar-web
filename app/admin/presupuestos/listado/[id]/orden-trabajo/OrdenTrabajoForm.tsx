"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  crearOrdenTrabajoAction,
} from "./actions";

import {
  generarOrdenTrabajoPdfsAction,
} from "./pdf/actions";

type Tecnico = {
  id: string;
  nombre: string;
  apellido: string;
  numero_matricula:
    | string
    | null;
  estado: string;
};

type Props = {
  presupuestoId: string;

  numeroPresupuesto:
    | string
    | number;

  cliente: string;

  tecnicos: Tecnico[];

  fechaProgramadaInicial?:
    | string
    | null;

  horaProgramadaInicial?:
    | string
    | null;
};

type DocumentoPdf = {
  url: string;
  nombreArchivo: string;
};

type DocumentosOrden = {
  original: DocumentoPdf;
  copia: DocumentoPdf;
};

function fechaLocalHoy() {
  const hoy =
    new Date();

  const anio =
    hoy.getFullYear();

  const mes =
    String(
      hoy.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dia =
    String(
      hoy.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${anio}-${mes}-${dia}`;
}

export default function OrdenTrabajoForm({
  presupuestoId,
  numeroPresupuesto,
  cliente,
  tecnicos,
  fechaProgramadaInicial,
  horaProgramadaInicial,
}: Props) {
  const [
    tecnicoId,
    setTecnicoId,
  ] = useState("");

  const [
    fecha,
    setFecha,
  ] = useState(
    fechaLocalHoy()
  );

  const [
    fechaProgramada,
    setFechaProgramada,
  ] = useState(
    fechaProgramadaInicial ||
      ""
  );

  const [
    horaProgramada,
    setHoraProgramada,
  ] = useState(
    horaProgramadaInicial
      ? horaProgramadaInicial.slice(
          0,
          5
        )
      : ""
  );

  const [
    observaciones,
    setObservaciones,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    ordenCreada,
    setOrdenCreada,
  ] = useState<{
    id: string;
    numeroOrden: string;
    tecnico: string;
    matricula:
      | string
      | null;
  } | null>(null);

  const [
    documentos,
    setDocumentos,
  ] =
    useState<DocumentosOrden | null>(
      null
    );

  const [
    descargando,
    setDescargando,
  ] = useState("");

  const [
    procesando,
    startTransition,
  ] = useTransition();

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
          "No se pudo descargar el PDF."
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
    } catch (
      downloadError
    ) {
      console.error(
        downloadError
      );

      setError(
        "No se pudo descargar el PDF. Probá nuevamente."
      );
    } finally {
      setDescargando("");
    }
  }

  function generarOrden() {
    setMensaje("");
    setError("");
    setDocumentos(null);

    if (!tecnicoId) {
      setError(
        "Seleccioná un técnico."
      );

      return;
    }

    const confirmar =
      window.confirm(
        `¿Querés generar la Orden de Trabajo del presupuesto Nº ${numeroPresupuesto}?`
      );

    if (!confirmar) {
      return;
    }

    startTransition(
      async () => {
        const resultado =
          await crearOrdenTrabajoAction(
            {
              presupuestoId,

              tecnicoId,

              fecha,

              fechaProgramada:
                fechaProgramada ||
                null,

              horaProgramada:
                horaProgramada ||
                null,

              observaciones:
                observaciones ||
                null,
            }
          );

        if (!resultado.ok) {
          setError(
            resultado.error ||
              "No se pudo crear la Orden de Trabajo."
          );

          return;
        }

        setOrdenCreada({
          id:
            resultado.data.id,

          numeroOrden:
            resultado.data
              .numeroOrden,

          tecnico:
            resultado.data
              .tecnico,

          matricula:
            resultado.data
              .matricula,
        });

        setMensaje(
          `Orden de Trabajo ${resultado.data.numeroOrden} creada correctamente. Generando ORIGINAL y COPIA...`
        );

        /*
         * =========================================
         * GENERAR PDF ORIGINAL + COPIA
         * =========================================
         */

        const resultadoPdf =
          await generarOrdenTrabajoPdfsAction(
            resultado.data.id
          );

        if (
          !resultadoPdf.ok
        ) {
          setMensaje(
            `Orden de Trabajo ${resultado.data.numeroOrden} creada correctamente.`
          );

          setError(
            resultadoPdf.error ||
              "La Orden de Trabajo fue creada, pero no se pudieron generar los PDF."
          );

          return;
        }

        setDocumentos({
          original: {
            url:
              resultadoPdf.original
                .url,

            nombreArchivo:
              resultadoPdf.original
                .nombreArchivo,
          },

          copia: {
            url:
              resultadoPdf.copia
                .url,

            nombreArchivo:
              resultadoPdf.copia
                .nombreArchivo,
          },
        });

        setMensaje(
          `Orden de Trabajo ${resultado.data.numeroOrden} creada correctamente. ORIGINAL y COPIA guardados.`
        );
      }
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "18px",
      }}
    >
      <section
        style={boxStyle}
      >
        <div>
          <span
            style={
              labelSmallStyle
            }
          >
            PRESUPUESTO
          </span>

          <strong
            style={{
              display:
                "block",

              marginTop:
                "4px",

              color:
                "var(--foreground)",

              fontSize:
                "1.05rem",
            }}
          >
            Nº{" "}
            {
              numeroPresupuesto
            }
          </strong>
        </div>

        <div>
          <span
            style={
              labelSmallStyle
            }
          >
            CLIENTE
          </span>

          <strong
            style={{
              display:
                "block",

              marginTop:
                "4px",

              color:
                "var(--foreground)",
            }}
          >
            {cliente}
          </strong>
        </div>
      </section>

      <section
        style={boxStyle}
      >
        <h2
          style={{
            margin: 0,

            color:
              "var(--foreground)",

            fontSize:
              "1.15rem",
          }}
        >
          Datos de la Orden de
          Trabajo
        </h2>

        <label
          style={labelStyle}
        >
          Técnico *

          <select
            value={tecnicoId}
            onChange={(
              event
            ) =>
              setTecnicoId(
                event.target
                  .value
              )
            }
            disabled={
              procesando ||
              Boolean(
                ordenCreada
              )
            }
            style={inputStyle}
          >
            <option value="">
              Seleccionar técnico
            </option>

            {tecnicos.map(
              (tecnico) => (
                <option
                  key={
                    tecnico.id
                  }
                  value={
                    tecnico.id
                  }
                >
                  {
                    tecnico.nombre
                  }{" "}
                  {
                    tecnico.apellido
                  }

                  {tecnico.numero_matricula
                    ? ` · ${tecnico.numero_matricula}`
                    : ""}
                </option>
              )
            )}
          </select>
        </label>

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",

            gap: "12px",
          }}
        >
          <label
            style={labelStyle}
          >
            Fecha de emisión *

            <input
              type="date"
              value={fecha}
              onChange={(
                event
              ) =>
                setFecha(
                  event.target
                    .value
                )
              }
              disabled={
                procesando ||
                Boolean(
                  ordenCreada
                )
              }
              style={
                inputStyle
              }
            />
          </label>

          <label
            style={labelStyle}
          >
            Fecha programada

            <input
              type="date"
              value={
                fechaProgramada
              }
              onChange={(
                event
              ) =>
                setFechaProgramada(
                  event.target
                    .value
                )
              }
              disabled={
                procesando ||
                Boolean(
                  ordenCreada
                )
              }
              style={
                inputStyle
              }
            />
          </label>

          <label
            style={labelStyle}
          >
            Hora programada

            <input
              type="time"
              value={
                horaProgramada
              }
              onChange={(
                event
              ) =>
                setHoraProgramada(
                  event.target
                    .value
                )
              }
              disabled={
                procesando ||
                Boolean(
                  ordenCreada
                )
              }
              style={
                inputStyle
              }
            />
          </label>
        </div>

        <label
          style={labelStyle}
        >
          Observaciones

          <textarea
            value={
              observaciones
            }
            onChange={(
              event
            ) =>
              setObservaciones(
                event.target
                  .value
              )
            }
            disabled={
              procesando ||
              Boolean(
                ordenCreada
              )
            }
            rows={5}
            placeholder="Indicaciones para el técnico, acceso al lugar, datos importantes, etc."
            style={{
              ...inputStyle,

              resize:
                "vertical",

              minHeight:
                "110px",
            }}
          />
        </label>

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

            {ordenCreada ? (
              <div
                style={{
                  marginTop:
                    "8px",

                  fontWeight:
                    600,
                }}
              >
                Técnico:{" "}
                {
                  ordenCreada.tecnico
                }

                {ordenCreada.matricula
                  ? ` · Matrícula ${ordenCreada.matricula}`
                  : ""}
              </div>
            ) : null}
          </div>
        ) : null}

        {!ordenCreada ? (
          <button
            type="button"
            disabled={
              procesando
            }
            onClick={
              generarOrden
            }
            style={
              primaryButtonStyle
            }
          >
            {procesando
              ? "Generando..."
              : "Generar Orden de Trabajo"}
          </button>
        ) : null}

        {procesando &&
        ordenCreada &&
        !documentos ? (
          <div
            style={
              generatingStyle
            }
          >
            Generando y guardando
            ORIGINAL y COPIA...
          </div>
        ) : null}
      </section>

      {documentos ? (
        <section
          style={boxStyle}
        >
          <div>
            <span
              style={
                labelSmallStyle
              }
            >
              DOCUMENTOS GENERADOS
            </span>

            <h2
              style={{
                margin:
                  "5px 0 0",

                color:
                  "var(--foreground)",

                fontSize:
                  "1.15rem",
              }}
            >
              {
                ordenCreada
                  ?.numeroOrden
              }
            </h2>
          </div>

          <div
            style={
              documentosGridStyle
            }
          >
            <div
              style={
                documentoCardStyle
              }
            >
              <strong>
                ORIGINAL
              </strong>

              <span
                style={
                  archivoNombreStyle
                }
              >
                {
                  documentos
                    .original
                    .nombreArchivo
                }
              </span>

              <div
                style={
                  buttonsRowStyle
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    verPdf(
                      documentos.original
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
                      documentos.original
                    )
                  }
                  style={
                    downloadButtonStyle
                  }
                >
                  {descargando ===
                  documentos.original
                    .nombreArchivo
                    ? "Descargando..."
                    : "Descargar ORIGINAL"}
                </button>
              </div>
            </div>

            <div
              style={
                documentoCardStyle
              }
            >
              <strong>
                COPIA
              </strong>

              <span
                style={
                  archivoNombreStyle
                }
              >
                {
                  documentos
                    .copia
                    .nombreArchivo
                }
              </span>

              <div
                style={
                  buttonsRowStyle
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    verPdf(
                      documentos.copia
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
                      documentos.copia
                    )
                  }
                  style={
                    downloadButtonStyle
                  }
                >
                  {descargando ===
                  documentos.copia
                    .nombreArchivo
                    ? "Descargando..."
                    : "Descargar COPIA"}
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

const boxStyle = {
  display: "grid",
  gap: "14px",
  padding: "20px",

  border:
    "1px solid rgba(38, 40, 42, 0.12)",

  borderRadius:
    "16px",

  background:
    "rgba(255, 253, 248, 0.92)",
};

const labelSmallStyle = {
  color:
    "var(--muted)",

  fontSize:
    "0.72rem",

  fontWeight: 800,

  letterSpacing:
    "0.08em",
};

const labelStyle = {
  display: "grid",

  gap: "6px",

  color:
    "var(--foreground)",

  fontSize:
    "0.86rem",

  fontWeight: 800,
};

const inputStyle = {
  width: "100%",

  minHeight:
    "42px",

  boxSizing:
    "border-box" as const,

  padding:
    "9px 11px",

  border:
    "1px solid rgba(38, 40, 42, 0.18)",

  borderRadius:
    "9px",

  background:
    "#ffffff",

  color:
    "var(--foreground)",

  font:
    "inherit",
};

const primaryButtonStyle = {
  minHeight:
    "44px",

  padding:
    "9px 15px",

  border: "none",

  borderRadius:
    "10px",

  background:
    "var(--foreground)",

  color:
    "#ffffff",

  font:
    "inherit",

  fontSize:
    "0.88rem",

  fontWeight: 800,

  cursor: "pointer",
};

const secondaryButtonStyle = {
  minHeight:
    "40px",

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

  font:
    "inherit",

  fontSize:
    "0.82rem",

  fontWeight: 800,

  cursor: "pointer",
};

const downloadButtonStyle = {
  minHeight:
    "40px",

  padding:
    "8px 13px",

  border:
    "none",

  borderRadius:
    "9px",

  background:
    "#236b43",

  color:
    "#ffffff",

  font:
    "inherit",

  fontSize:
    "0.82rem",

  fontWeight: 800,

  cursor: "pointer",
};

const successStyle = {
  padding: "13px",

  borderRadius:
    "11px",

  background:
    "rgba(35, 107, 67, 0.08)",

  color:
    "#236b43",

  fontWeight: 800,
};

const errorStyle = {
  padding: "13px",

  borderRadius:
    "11px",

  background:
    "rgba(180, 40, 40, 0.08)",

  color:
    "#982828",

  fontWeight: 800,
};

const generatingStyle = {
  padding: "13px",

  borderRadius:
    "11px",

  background:
    "rgba(38, 111, 164, 0.08)",

  color:
    "#266fa4",

  fontWeight: 800,
};

const documentosGridStyle = {
  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(260px, 1fr))",

  gap: "12px",
};

const documentoCardStyle = {
  display: "grid",

  gap: "10px",

  padding: "15px",

  border:
    "1px solid rgba(38, 40, 42, 0.12)",

  borderRadius:
    "12px",

  background:
    "#ffffff",
};

const archivoNombreStyle = {
  color:
    "var(--muted)",

  fontSize:
    "0.78rem",

  wordBreak:
    "break-word" as const,
};

const buttonsRowStyle = {
  display: "flex",

  flexWrap:
    "wrap" as const,

  gap: "8px",
};
