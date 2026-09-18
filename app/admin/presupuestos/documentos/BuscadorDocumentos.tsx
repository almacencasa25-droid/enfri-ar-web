"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DocumentoPresupuesto = {
  id: string;
  numero: string | number;
  cliente: string;
};

type DocumentoOrdenTrabajo = {
  id: string;
  numero_orden: string;
  numero_presupuesto: string | number;
  cliente: string;
  tecnico: string;
  matricula: string | null;
};

type Props = {
  tipoActivo: string;
  busquedaInicial: string;
  presupuestos: DocumentoPresupuesto[];
  ordenes: DocumentoOrdenTrabajo[];
};

type Sugerencia = {
  id: string;
  tipo: "presupuesto" | "orden";
  titulo: string;
  detalle: string;
  valorBusqueda: string;
};

function normalizar(valor: unknown) {
  return String(valor ?? "")
    .trim()
    .toLocaleLowerCase("es-AR");
}

export default function BuscadorDocumentos({
  tipoActivo,
  busquedaInicial,
  presupuestos,
  ordenes,
}: Props) {
  const router = useRouter();

  const [busqueda, setBusqueda] =
    useState(busquedaInicial);

  const [mostrarSugerencias, setMostrarSugerencias] =
    useState(false);

  const sugerencias = useMemo(() => {
    const termino = normalizar(busqueda);

    if (!termino) {
      return [];
    }

    const resultados: Sugerencia[] = [];

    for (const presupuesto of presupuestos) {
      const numero = String(presupuesto.numero);

      const coincide = [
        numero,
        presupuesto.cliente,
      ].some((valor) =>
        normalizar(valor).includes(termino)
      );

      if (coincide) {
        resultados.push({
          id: `presupuesto-${presupuesto.id}`,
          tipo: "presupuesto",
          titulo: `Presupuesto Nº ${numero}`,
          detalle:
            presupuesto.cliente || "Sin cliente",
          valorBusqueda: numero,
        });
      }
    }

    for (const orden of ordenes) {
      const coincide = [
        orden.numero_orden,
        orden.numero_presupuesto,
        orden.cliente,
        orden.tecnico,
        orden.matricula,
      ].some((valor) =>
        normalizar(valor).includes(termino)
      );

      if (coincide) {
        const datosSecundarios = [
          orden.cliente,
          orden.tecnico
            ? `Técnico: ${orden.tecnico}`
            : "",
          orden.matricula
            ? `Matrícula: ${orden.matricula}`
            : "",
        ]
          .filter(Boolean)
          .join(" · ");

        resultados.push({
          id: `orden-${orden.id}`,
          tipo: "orden",
          titulo: orden.numero_orden,
          detalle:
            datosSecundarios ||
            `Presupuesto Nº ${orden.numero_presupuesto}`,
          valorBusqueda: orden.numero_orden,
        });
      }
    }

    return resultados.slice(0, 8);
  }, [busqueda, presupuestos, ordenes]);

  function ejecutarBusqueda(valor: string) {
    const termino = valor.trim();

    if (!termino) {
      router.push(
        `/admin/presupuestos/documentos?tipo=${tipoActivo}`
      );

      return;
    }

    const parametros = new URLSearchParams();

    parametros.set("tipo", tipoActivo);
    parametros.set("q", termino);

    router.push(
      `/admin/presupuestos/documentos?${parametros.toString()}`
    );

    setMostrarSugerencias(false);
  }

  function enviarFormulario(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    ejecutarBusqueda(busqueda);
  }

  function elegirSugerencia(
    sugerencia: Sugerencia
  ) {
    setBusqueda(sugerencia.valorBusqueda);
    ejecutarBusqueda(
      sugerencia.valorBusqueda
    );
  }

  function limpiarBusqueda() {
    setBusqueda("");
    setMostrarSugerencias(false);

    router.push(
      `/admin/presupuestos/documentos?tipo=${tipoActivo}`
    );
  }

  return (
    <section style={contenedorStyle}>
      <form
        onSubmit={enviarFormulario}
        style={formStyle}
      >
        <div style={campoStyle}>
          <label
            htmlFor="buscar-documento"
            style={labelStyle}
          >
            Buscar documentos
          </label>

          <div style={inputWrapperStyle}>
            <input
              id="buscar-documento"
              type="search"
              value={busqueda}
              placeholder="Ej.: 1051, OT-001051-01, cliente, técnico o matrícula"
              autoComplete="off"
              onChange={(event) => {
                setBusqueda(
                  event.target.value
                );

                setMostrarSugerencias(
                  event.target.value.trim()
                    .length > 0
                );
              }}
              onFocus={() => {
                if (busqueda.trim()) {
                  setMostrarSugerencias(
                    true
                  );
                }
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Escape"
                ) {
                  setMostrarSugerencias(
                    false
                  );
                }
              }}
              style={inputStyle}
            />

            {mostrarSugerencias &&
            busqueda.trim() ? (
              <div
                style={sugerenciasStyle}
              >
                {sugerencias.length >
                0 ? (
                  sugerencias.map(
                    (sugerencia) => (
                      <button
                        key={
                          sugerencia.id
                        }
                        type="button"
                        onMouseDown={(
                          event
                        ) => {
                          event.preventDefault();

                          elegirSugerencia(
                            sugerencia
                          );
                        }}
                        style={
                          sugerenciaStyle
                        }
                      >
                        <span
                          style={
                            sugerenciaTipoStyle
                          }
                        >
                          {sugerencia.tipo ===
                          "presupuesto"
                            ? "Presupuesto"
                            : "Orden de Trabajo"}
                        </span>

                        <strong
                          style={
                            sugerenciaTituloStyle
                          }
                        >
                          {
                            sugerencia.titulo
                          }
                        </strong>

                        <span
                          style={
                            sugerenciaDetalleStyle
                          }
                        >
                          {
                            sugerencia.detalle
                          }
                        </span>
                      </button>
                    )
                  )
                ) : (
                  <div
                    style={
                      sinResultadosStyle
                    }
                  >
                    No hay coincidencias
                    para “{busqueda}”.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="submit"
          style={buscarButtonStyle}
        >
          Buscar
        </button>

        {busquedaInicial ? (
          <button
            type="button"
            onClick={
              limpiarBusqueda
            }
            style={limpiarButtonStyle}
          >
            Limpiar
          </button>
        ) : null}
      </form>

      <div style={ayudaStyle}>
        Escribí cualquier parte del número,
        nombre, técnico o matrícula. Las
        coincidencias aparecen automáticamente.
      </div>
    </section>
  );
}

const contenedorStyle = {
  marginTop: "20px",
  padding: "18px",
  border:
    "1px solid rgba(38, 40, 42, 0.12)",
  borderRadius: "16px",
  background:
    "rgba(255, 253, 248, 0.92)",
};

const formStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "10px",
  alignItems: "flex-end",
};

const campoStyle = {
  position: "relative" as const,
  flex: "1 1 420px",
  display: "grid",
  gap: "6px",
  minWidth: 0,
};

const labelStyle = {
  color: "var(--foreground)",
  fontSize: "0.82rem",
  fontWeight: 800,
};

const inputWrapperStyle = {
  position: "relative" as const,
};

const inputStyle = {
  width: "100%",
  minHeight: "42px",
  boxSizing: "border-box" as const,
  padding: "10px 12px",
  border:
    "1px solid rgba(38, 40, 42, 0.18)",
  borderRadius: "10px",
  background: "#ffffff",
  color: "var(--foreground)",
  fontSize: "0.9rem",
  outline: "none",
};

const sugerenciasStyle = {
  position: "absolute" as const,
  zIndex: 50,
  top: "calc(100% + 6px)",
  left: 0,
  right: 0,
  display: "grid",
  maxHeight: "380px",
  overflowY: "auto" as const,
  border:
    "1px solid rgba(38, 40, 42, 0.16)",
  borderRadius: "12px",
  background: "#ffffff",
  boxShadow:
    "0 12px 30px rgba(38, 40, 42, 0.14)",
};

const sugerenciaStyle = {
  display: "grid",
  gap: "3px",
  width: "100%",
  padding: "11px 13px",
  border: "none",
  borderBottom:
    "1px solid rgba(38, 40, 42, 0.08)",
  background: "#ffffff",
  color: "var(--foreground)",
  textAlign: "left" as const,
  cursor: "pointer",
};

const sugerenciaTipoStyle = {
  color: "var(--brand-blue)",
  fontSize: "0.7rem",
  fontWeight: 800,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const sugerenciaTituloStyle = {
  fontSize: "0.9rem",
};

const sugerenciaDetalleStyle = {
  color: "var(--muted)",
  fontSize: "0.78rem",
  lineHeight: 1.4,
};

const sinResultadosStyle = {
  padding: "14px",
  color: "var(--muted)",
  fontSize: "0.82rem",
};

const buscarButtonStyle = {
  minHeight: "42px",
  padding: "10px 18px",
  border: "none",
  borderRadius: "10px",
  background: "var(--brand-blue)",
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
};

const limpiarButtonStyle = {
  minHeight: "42px",
  padding: "10px 16px",
  border:
    "1px solid rgba(38, 40, 42, 0.18)",
  borderRadius: "10px",
  background: "#ffffff",
  color: "var(--foreground)",
  fontWeight: 800,
  cursor: "pointer",
};

const ayudaStyle = {
  marginTop: "10px",
  color: "var(--muted)",
  fontSize: "0.8rem",
};
