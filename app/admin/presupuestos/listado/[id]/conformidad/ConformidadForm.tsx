"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  crearConformidadAction,
} from "./actions";

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

export default function ConformidadForm({
  presupuestoId,
  numeroPresupuesto,
  cliente,
  tecnicos,
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
    fechaFinalizacion,
    setFechaFinalizacion,
  ] = useState(
    fechaLocalHoy()
  );

  const [
    observaciones,
    setObservaciones,
  ] = useState("");

  const [
    nombreAclaracionCliente,
    setNombreAclaracionCliente,
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

  function generarConformidad() {
    setMensaje("");
    setError("");

    if (!tecnicoId) {
      setError(
        "Seleccioná un técnico."
      );

      return;
    }

    if (!fecha) {
      setError(
        "La fecha es obligatoria."
      );

      return;
    }

    if (!fechaFinalizacion) {
      setError(
        "La fecha de finalización es obligatoria."
      );

      return;
    }

    if (
      fechaFinalizacion <
      fecha
    ) {
      setError(
        "La fecha de finalización no puede ser anterior a la fecha de la conformidad."
      );

      return;
    }

    if (
      !nombreAclaracionCliente.trim()
    ) {
      setError(
        "Ingresá el nombre y aclaración del cliente."
      );

      return;
    }

    const confirmar =
      window.confirm(
        `¿Querés generar la conformidad del presupuesto Nº ${numeroPresupuesto}?`
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

              tecnicoId,

              fecha,

              fechaFinalizacion,

              observaciones:
                observaciones ||
                null,

              nombreAclaracionCliente:
                nombreAclaracionCliente ||
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
          Datos de la Conformidad
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
                conformidadCreada
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
            Fecha de conformidad *

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
                  conformidadCreada
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
            Fecha de finalización *

            <input
              type="date"
              value={
                fechaFinalizacion
              }
              onChange={(
                event
              ) =>
                setFechaFinalizacion(
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
              style={
                inputStyle
              }
            />
          </label>
        </div>

        <label
          style={labelStyle}
        >
          Nombre y aclaración del cliente *

          <input
            type="text"
            value={
              nombreAclaracionCliente
            }
            onChange={(
              event
            ) =>
              setNombreAclaracionCliente(
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
            placeholder="Nombre completo de quien presta conformidad"
            style={inputStyle}
          />
        </label>

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
            placeholder="Observaciones sobre el trabajo realizado o la conformidad."
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
            warningStyle
          }
        >
          La firma del cliente se incorporará
          en el siguiente paso. Primero vamos
          a comprobar la creación correcta de
          la conformidad y su numeración.
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
              procesando
            }
            onClick={
              generarConformidad
            }
            style={
              primaryButtonStyle
            }
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
