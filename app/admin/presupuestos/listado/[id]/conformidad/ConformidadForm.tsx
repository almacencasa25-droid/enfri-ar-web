"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  crearConformidadAction,
} from "./actions";

type OrdenTrabajo = {
  id: string;
  numeroOrden: string;
  tecnicoId: string | null;
  tecnico: string;
  matricula:
    | string
    | null;
};

type Props = {
  presupuestoId: string;

  numeroPresupuesto:
    | string
    | number;

  cliente: string;

  ordenes?: OrdenTrabajo[];
};

export default function ConformidadForm({
  presupuestoId,
  numeroPresupuesto,
  cliente,
  ordenes = [],
}: Props) {
  const [
    ordenTrabajoId,
    setOrdenTrabajoId,
  ] = useState("");

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
    conformidadCreada,
    setConformidadCreada,
  ] = useState<{
    id: string;
    numeroConformidad: string;
    tecnico: string;
    matricula:
      | string
      | null;
  } | null>(null);

  const [
    procesando,
    startTransition,
  ] = useTransition();

  useEffect(() => {
    if (
      ordenes.length === 1 &&
      !ordenTrabajoId
    ) {
      setOrdenTrabajoId(
        ordenes[0].id
      );
    }
  }, [
    ordenes,
    ordenTrabajoId,
  ]);

  const ordenSeleccionada =
    useMemo(
      () =>
        ordenes.find(
          (orden) =>
            orden.id ===
            ordenTrabajoId
        ) || null,
      [
        ordenes,
        ordenTrabajoId,
      ]
    );

  function generarConformidad() {
    setMensaje("");
    setError("");

    if (
      ordenes.length === 0
    ) {
      setError(
        "Primero debe existir una Orden de Trabajo para este presupuesto."
      );

      return;
    }

    if (!ordenSeleccionada) {
      setError(
        "Seleccioná la Orden de Trabajo correspondiente."
      );

      return;
    }

    if (
      !ordenSeleccionada.tecnicoId
    ) {
      setError(
        "La Orden de Trabajo seleccionada no tiene un técnico asociado."
      );

      return;
    }

    const confirmar =
      window.confirm(
        `¿Querés generar la conformidad del presupuesto Nº ${numeroPresupuesto} según la ${ordenSeleccionada.numeroOrden}?`
      );

    if (!confirmar) {
      return;
    }

    startTransition(
      async () => {
        const resultado =
          await crearConformidadAction(
            {
              presupuestoId,

              tecnicoId:
                ordenSeleccionada.tecnicoId!,

              fecha: null,

              fechaFinalizacion:
                null,

              observaciones:
                observaciones ||
                null,

              nombreAclaracionCliente:
                null,
            }
          );

        if (!resultado.ok) {
          setError(
            resultado.error ||
              "No se pudo crear la conformidad."
          );

          return;
        }

        setConformidadCreada({
          id:
            resultado.data.id,

          numeroConformidad:
            resultado.data
              .numeroConformidad,

          tecnico:
            resultado.data
              .tecnico,

          matricula:
            resultado.data
              .matricula,
        });

        setMensaje(
          `Conformidad ${resultado.data.numeroConformidad} creada correctamente.`
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
            CLIENTE / ESTABLECIMIENTO
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
          Datos de la Conformidad
        </h2>

        {ordenes.length === 0 ? (
          <div
            style={
              warningStyle
            }
          >
            Este presupuesto todavía
            no tiene una Orden de
            Trabajo. Primero generá la
            Orden de Trabajo y después
            la Conformidad.
          </div>
        ) : null}

        {ordenes.length > 1 ? (
          <label
            style={labelStyle}
          >
            Orden de Trabajo *

            <select
              value={
                ordenTrabajoId
              }
              onChange={(
                event
              ) =>
                setOrdenTrabajoId(
                  event.target
                    .value
                )
              }
              disabled={
                procesando ||
                Boolean(
                  conformidadCreada
                )
              }
              style={inputStyle}
            >
              <option value="">
                Seleccionar Orden de
                Trabajo
              </option>

              {ordenes.map(
                (orden) => (
                  <option
                    key={
                      orden.id
                    }
                    value={
                      orden.id
                    }
                  >
                    {
                      orden.numeroOrden
                    }{" "}
                    ·{" "}
                    {
                      orden.tecnico
                    }

                    {orden.matricula
                      ? ` · ${orden.matricula}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </label>
        ) : null}

        {ordenSeleccionada ? (
          <div
            style={
              tecnicoBoxStyle
            }
          >
            <div>
              <span
                style={
                  labelSmallStyle
                }
              >
                ORDEN DE TRABAJO
              </span>

              <strong
                style={
                  datoStrongStyle
                }
              >
                {
                  ordenSeleccionada.numeroOrden
                }
              </strong>
            </div>

            <div>
              <span
                style={
                  labelSmallStyle
                }
              >
                TÉCNICO
              </span>

              <strong
                style={
                  datoStrongStyle
                }
              >
                {
                  ordenSeleccionada.tecnico
                }
              </strong>

              {ordenSeleccionada.matricula ? (
                <span
                  style={
                    matriculaStyle
                  }
                >
                  Matrícula{" "}
                  {
                    ordenSeleccionada.matricula
                  }
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

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
                conformidadCreada
              )
            }
            rows={5}
            placeholder="Observaciones sobre el trabajo realizado."
            style={{
              ...inputStyle,

              resize:
                "vertical",

              minHeight:
                "110px",
            }}
          />
        </label>

        <div
          style={
            infoStyle
          }
        >
          La fecha de conformidad,
          fecha de finalización, datos
          del responsable del
          establecimiento, DNI, cargo,
          firma y aclaración se
          completarán manualmente en el
          documento impreso.
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

            {conformidadCreada ? (
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
                  conformidadCreada.tecnico
                }

                {conformidadCreada.matricula
                  ? ` · Matrícula ${conformidadCreada.matricula}`
                  : ""}
              </div>
            ) : null}
          </div>
        ) : null}

        {!conformidadCreada ? (
          <button
            type="button"
            disabled={
              procesando ||
              !ordenSeleccionada
            }
            onClick={
              generarConformidad
            }
            style={{
              ...primaryButtonStyle,

              opacity:
                !ordenSeleccionada ||
                procesando
                  ? 0.55
                  : 1,
            }}
          >
            {procesando
              ? "Generando..."
              : "Generar Conformidad"}
          </button>
        ) : null}
      </section>
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

const tecnicoBoxStyle = {
  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",

  gap: "14px",

  padding:
    "14px",

  border:
    "1px solid rgba(35, 107, 67, 0.18)",

  borderRadius:
    "12px",

  background:
    "rgba(35, 107, 67, 0.05)",
};

const datoStrongStyle = {
  display: "block",

  marginTop: "4px",

  color:
    "var(--foreground)",
};

const matriculaStyle = {
  display: "block",

  marginTop: "3px",

  color:
    "var(--muted)",

  fontSize:
    "0.8rem",
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

const warningStyle = {
  padding: "13px",

  borderRadius:
    "11px",

  background:
    "rgba(180, 120, 20, 0.08)",

  color:
    "#805d18",

  fontSize:
    "0.82rem",

  lineHeight: 1.5,

  fontWeight: 700,
};

const infoStyle = {
  padding: "13px",

  borderRadius:
    "11px",

  background:
    "rgba(38, 111, 164, 0.08)",

  color:
    "#266fa4",

  fontSize:
    "0.82rem",

  lineHeight: 1.5,

  fontWeight: 700,
};
