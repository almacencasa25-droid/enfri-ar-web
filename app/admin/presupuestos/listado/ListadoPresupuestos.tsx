"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  anularPresupuestoAction,
  buscarPresupuestosAction,
  cambiarEstadoPresupuestoAction,
  duplicarPresupuestoAction,
  eliminarPresupuestoAction,
  type PresupuestoBusqueda,
} from "./actions";

import {
  emitirPresupuestoPdfAction,
} from "./pdf/actions";

function moneda(valor: number) {
  return new Intl.NumberFormat(
    "es-AR",
    {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }
  ).format(Number(valor || 0));
}

function fechaArgentina(
  fecha: string
) {
  if (!fecha) {
    return "";
  }

  const [anio, mes, dia] =
    fecha.split("-");

  if (
    !anio ||
    !mes ||
    !dia
  ) {
    return fecha;
  }

  return `${dia}/${mes}/${anio}`;
}

function nombreEstado(
  estado: string
) {
  switch (estado) {
    case "borrador":
      return "Borrador";

    case "enviado":
      return "Enviado";

    case "aceptado":
      return "Aceptado";

    case "rechazado":
      return "Rechazado";

    case "realizado":
      return "Realizado";

    case "anulado":
      return "Anulado";

    default:
      return estado;
  }
}

export default function ListadoPresupuestos() {
  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    presupuestos,
    setPresupuestos,
  ] =
    useState<
      PresupuestoBusqueda[]
    >([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    procesando,
    startTransition,
  ] = useTransition();

  const busquedaActual =
    useRef(0);

  async function cargarPresupuestos(
    texto: string
  ) {
    const numero =
      ++busquedaActual.current;

    setCargando(true);
    setError("");

    const resultado =
      await buscarPresupuestosAction(
        texto
      );

    if (
      numero !==
      busquedaActual.current
    ) {
      return;
    }

    setCargando(false);

    if (!resultado.ok) {
      setPresupuestos([]);

      setError(
        resultado.error ||
          "No se pudieron cargar los presupuestos."
      );

      return;
    }

    setPresupuestos(
      resultado.data || []
    );
  }

  useEffect(() => {
    const temporizador =
      window.setTimeout(
        () => {
          void cargarPresupuestos(
            busqueda
          );
        },
        350
      );

    return () => {
      window.clearTimeout(
        temporizador
      );
    };
  }, [busqueda]);

  function refrescar() {
    void cargarPresupuestos(
      busqueda
    );
  }

  function cambiarEstado(
    presupuestoId: string,
    estado: string
  ) {
    setMensaje("");
    setError("");

    startTransition(
      async () => {
        const resultado =
          await cambiarEstadoPresupuestoAction(
            presupuestoId,
            estado
          );

        if (!resultado.ok) {
          setError(
            resultado.error ||
              "No se pudo cambiar el estado."
          );

          return;
        }

        setMensaje(
          "Estado actualizado."
        );

        refrescar();
      }
    );
  }

  function duplicar(
    presupuesto:
      PresupuestoBusqueda
  ) {
    const confirmar =
      window.confirm(
        `¿Querés duplicar el presupuesto Nº ${presupuesto.numero}? Se generará un número nuevo.`
      );

    if (!confirmar) {
      return;
    }

    setMensaje("");
    setError("");

    startTransition(
      async () => {
        const resultado =
          await duplicarPresupuestoAction(
            presupuesto.id
          );

        if (!resultado.ok) {
          setError(
            resultado.error ||
              "No se pudo duplicar el presupuesto."
          );

          return;
        }

        setMensaje(
          "Presupuesto duplicado correctamente."
        );

        refrescar();
      }
    );
  }

  function anular(
    presupuesto:
      PresupuestoBusqueda
  ) {
    const confirmar =
      window.confirm(
        `¿Querés anular el presupuesto Nº ${presupuesto.numero}?`
      );

    if (!confirmar) {
      return;
    }

    setMensaje("");
    setError("");

    startTransition(
      async () => {
        const resultado =
          await anularPresupuestoAction(
            presupuesto.id
          );

        if (!resultado.ok) {
          setError(
            resultado.error ||
              "No se pudo anular el presupuesto."
          );

          return;
        }

        setMensaje(
          "Presupuesto anulado."
        );

        refrescar();
      }
    );
  }

  function eliminar(
    presupuesto:
      PresupuestoBusqueda
  ) {
    const primeraConfirmacion =
      window.confirm(
        `¿Querés eliminar el presupuesto Nº ${presupuesto.numero} del listado?`
      );

    if (
      !primeraConfirmacion
    ) {
      return;
    }

    const segundaConfirmacion =
      window.confirm(
        "SEGUNDA CONFIRMACIÓN: el presupuesto quedará eliminado lógicamente, pero su número e historial se conservarán. ¿Continuar?"
      );

    if (
      !segundaConfirmacion
    ) {
      return;
    }

    setMensaje("");
    setError("");

    startTransition(
      async () => {
        const resultado =
          await eliminarPresupuestoAction(
            presupuesto.id,
            "ELIMINAR"
          );

        if (!resultado.ok) {
          setError(
            resultado.error ||
              "No se pudo eliminar el presupuesto."
          );

          return;
        }

        setMensaje(
          "Presupuesto eliminado del listado."
        );

        refrescar();
      }
    );
  }

  function emitirPdf(
    presupuesto:
      PresupuestoBusqueda
  ) {
    const confirmar =
      window.confirm(
        `¿Querés emitir el PDF del presupuesto Nº ${presupuesto.numero}? Se guardará una versión histórica.`
      );

    if (!confirmar) {
      return;
    }

    setMensaje("");
    setError("");

    startTransition(
      async () => {
        const resultado =
          await emitirPresupuestoPdfAction(
            presupuesto.id
          );

        if (!resultado.ok) {
          setError(
            resultado.error ||
              "No se pudo generar el PDF."
          );

          return;
        }

        setMensaje(
          `PDF emitido correctamente. Versión ${resultado.version}.`
        );

        refrescar();
      }
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "16px",
      }}
    >
      <section
        style={boxStyle}
      >
        <label
          style={labelStyle}
        >
          Buscar presupuesto

          <input
            value={busqueda}
            onChange={(
              event
            ) =>
              setBusqueda(
                event.target.value
              )
            }
            placeholder="Número, cliente, DNI, CUIT, dirección, detalle o estado"
            style={inputStyle}
          />
        </label>

        <p
          style={ayudaStyle}
        >
          La búsqueda se actualiza
          automáticamente mientras
          escribís.
        </p>
      </section>

      {mensaje ? (
        <div
          style={successStyle}
        >
          {mensaje}
        </div>
      ) : null}

      {error ? (
        <div
          style={errorStyle}
        >
          {error}
        </div>
      ) : null}

      <section
        style={boxStyle}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: "10px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize:
                "1.15rem",
              color:
                "var(--foreground)",
            }}
          >
            Presupuestos
          </h2>

          <span
            style={ayudaStyle}
          >
            {cargando
              ? "Cargando..."
              : `${presupuestos.length} encontrados`}
          </span>
        </div>

        {!cargando &&
        presupuestos.length ===
          0 ? (
          <p
            style={ayudaStyle}
          >
            No hay presupuestos
            para mostrar.
          </p>
        ) : null}

        <div
          style={{
            display: "grid",
            gap: "10px",
          }}
        >
          {presupuestos.map(
            (
              presupuesto
            ) => {
              const permiteDocumentos =
                presupuesto.estado ===
                  "aceptado" ||
                presupuesto.estado ===
                  "realizado";

              let accionPrincipal:
                React.ReactNode =
                null;

              if (
                permiteDocumentos
              ) {
                if (
                  presupuesto
                    .tiene_conformidad
                ) {
                  accionPrincipal = (
                    <Link
                      href={`/admin/presupuestos/listado/${presupuesto.id}/conformidad`}
                      style={
                        conformityButtonStyle
                      }
                    >
                      Ver Conformidad
                    </Link>
                  );
                } else if (
                  presupuesto
                    .tiene_orden_trabajo
                ) {
                  accionPrincipal = (
                    <Link
                      href={`/admin/presupuestos/listado/${presupuesto.id}/conformidad`}
                      style={
                        conformityButtonStyle
                      }
                    >
                      Generar Conformidad
                    </Link>
                  );
                } else {
                  accionPrincipal = (
                    <Link
                      href={`/admin/presupuestos/listado/${presupuesto.id}/orden-trabajo`}
                      style={
                        orderButtonStyle
                      }
                    >
                      Generar Orden de Trabajo
                    </Link>
                  );
                }
              }

              return (
                <article
                  key={
                    presupuesto.id
                  }
                  style={
                    presupuestoStyle
                  }
                >
                  <div
                    style={{
                      display:
                        "flex",
                      flexWrap:
                        "wrap",
                      justifyContent:
                        "space-between",
                      gap: "14px",
                      alignItems:
                        "flex-start",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "grid",
                        gap: "7px",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          flexWrap:
                            "wrap",
                          alignItems:
                            "center",
                          gap: "10px",
                        }}
                      >
                        <strong
                          style={{
                            display:
                              "block",
                            fontSize:
                              "1rem",
                            color:
                              "var(--foreground)",
                          }}
                        >
                          Presupuesto Nº{" "}
                          {
                            presupuesto.numero
                          }
                        </strong>

                        <select
                          value={
                            presupuesto.estado
                          }
                          disabled={
                            procesando
                          }
                          onChange={(
                            event
                          ) =>
                            cambiarEstado(
                              presupuesto.id,
                              event.target.value
                            )
                          }
                          aria-label={`Estado del presupuesto Nº ${presupuesto.numero}`}
                          style={
                            estadoSelectStyle
                          }
                        >
                          <option value="borrador">
                            Borrador
                          </option>

                          <option value="enviado">
                            Enviado
                          </option>

                          <option value="aceptado">
                            Aceptado
                          </option>

                          <option value="rechazado">
                            Rechazado
                          </option>

                          <option value="realizado">
                            Realizado
                          </option>

                          <option value="anulado">
                            Anulado
                          </option>
                        </select>
                      </div>

                      <span
                        style={ayudaStyle}
                      >
                        {fechaArgentina(
                          presupuesto.fecha
                        )}
                      </span>
                    </div>

                    <strong
                      style={{
                        fontSize:
                          "1.05rem",
                        color:
                          "var(--foreground)",
                      }}
                    >
                      {moneda(
                        presupuesto.total
                      )}
                    </strong>
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gap: "4px",
                      fontSize:
                        "0.86rem",
                      color:
                        "var(--muted)",
                    }}
                  >
                    <span>
                      Cliente:{" "}
                      <strong>
                        {presupuesto.cliente ||
                          "Sin nombre"}
                      </strong>
                    </span>

                    {presupuesto.dni_cuit ? (
                      <span>
                        DNI/CUIT:{" "}
                        {
                          presupuesto.dni_cuit
                        }
                      </span>
                    ) : null}

                    {presupuesto.detalle_corto ? (
                      <span>
                        Detalle:{" "}
                        {
                          presupuesto.detalle_corto
                        }
                      </span>
                    ) : null}

                    <span>
                      Estado:{" "}
                      <strong>
                        {nombreEstado(
                          presupuesto.estado
                        )}
                      </strong>
                    </span>

                    {presupuesto.trabajo_realizado ? (
                      <span
                        style={{
                          color:
                            "#236b43",
                          fontWeight:
                            800,
                        }}
                      >
                        Trabajo realizado
                      </span>
                    ) : null}
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      flexWrap:
                        "wrap",
                      gap: "8px",
                      alignItems:
                        "center",
                    }}
                  >
                    <Link
                      href={`/admin/presupuestos/listado/${presupuesto.id}/editar`}
                      style={
                        linkButtonStyle
                      }
                    >
                      Modificar
                    </Link>

                    {
                      accionPrincipal
                    }

                    <details
                      style={
                        moreDetailsStyle
                      }
                    >
                      <summary
                        style={
                          moreSummaryStyle
                        }
                      >
                        Más ⋮
                      </summary>

                      <div
                        style={
                          moreMenuStyle
                        }
                      >
                        {presupuesto
                          .tiene_orden_trabajo ? (
                          <Link
                            href={`/admin/presupuestos/listado/${presupuesto.id}/orden-trabajo`}
                            style={
                              menuLinkStyle
                            }
                          >
                            Ver Orden de Trabajo
                          </Link>
                        ) : null}

                        {presupuesto
                          .tiene_conformidad ? (
                          <Link
                            href={`/admin/presupuestos/listado/${presupuesto.id}/conformidad`}
                            style={
                              menuLinkStyle
                            }
                          >
                            Ver Conformidad
                          </Link>
                        ) : null}

                        {presupuesto
                          .tiene_pdf_presupuesto ? (
                          <Link
                            href={`/admin/presupuestos/documentos?tipo=presupuestos&q=${encodeURIComponent(
                              String(
                                presupuesto.numero
                              )
                            )}`}
                            style={
                              menuLinkStyle
                            }
                          >
                            Ver PDF del presupuesto
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              procesando
                            }
                            onClick={() =>
                              emitirPdf(
                                presupuesto
                              )
                            }
                            style={
                              menuButtonStyle
                            }
                          >
                            Emitir PDF del presupuesto
                          </button>
                        )}

                        <Link
                          href={`/admin/presupuestos/documentos?q=${encodeURIComponent(
                            String(
                              presupuesto.numero
                            )
                          )}`}
                          style={
                            menuLinkStyle
                          }
                        >
                          Ver documentos
                        </Link>

                        <button
                          type="button"
                          disabled={
                            procesando
                          }
                          onClick={() =>
                            duplicar(
                              presupuesto
                            )
                          }
                          style={
                            menuButtonStyle
                          }
                        >
                          Duplicar
                        </button>

                        {presupuesto.estado !==
                        "anulado" ? (
                          <button
                            type="button"
                            disabled={
                              procesando
                            }
                            onClick={() =>
                              anular(
                                presupuesto
                              )
                            }
                            style={
                              menuButtonStyle
                            }
                          >
                            Anular
                          </button>
                        ) : null}

                        <button
                          type="button"
                          disabled={
                            procesando
                          }
                          onClick={() =>
                            eliminar(
                              presupuesto
                            )
                          }
                          style={
                            menuDeleteButtonStyle
                          }
                        >
                          Eliminar
                        </button>
                      </div>
                    </details>
                  </div>
                </article>
              );
            }
          )}
        </div>
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
  borderRadius: "16px",
  background:
    "rgba(255, 253, 248, 0.92)",
};

const labelStyle = {
  display: "grid",
  gap: "6px",
  color:
    "var(--foreground)",
  fontSize: "0.86rem",
  fontWeight: 800,
};

const inputStyle = {
  width: "100%",
  minHeight: "42px",
  boxSizing:
    "border-box" as const,
  padding: "9px 11px",
  border:
    "1px solid rgba(38, 40, 42, 0.18)",
  borderRadius: "9px",
  background: "#ffffff",
  color:
    "var(--foreground)",
  font: "inherit",
};

const estadoSelectStyle = {
  minHeight: "34px",
  boxSizing:
    "border-box" as const,
  padding: "5px 10px",
  border:
    "1px solid rgba(38, 40, 42, 0.16)",
  borderRadius: "999px",
  background:
    "rgba(35, 107, 67, 0.08)",
  color:
    "var(--foreground)",
  font: "inherit",
  fontSize: "0.78rem",
  fontWeight: 800,
  cursor: "pointer",
};

const ayudaStyle = {
  margin: 0,
  color:
    "var(--muted)",
  fontSize: "0.82rem",
};

const presupuestoStyle = {
  display: "grid",
  gap: "12px",
  padding: "15px",
  border:
    "1px solid rgba(38, 40, 42, 0.1)",
  borderRadius: "12px",
  background:
    "rgba(255,255,255,0.72)",
};

const linkButtonStyle = {
  minHeight: "38px",
  display:
    "inline-flex",
  alignItems: "center",
  justifyContent:
    "center",
  boxSizing:
    "border-box" as const,
  padding: "7px 12px",
  border:
    "1px solid rgba(38, 40, 42, 0.16)",
  borderRadius: "9px",
  background:
    "var(--foreground)",
  color: "#ffffff",
  fontSize: "0.82rem",
  fontWeight: 800,
  textDecoration: "none",
};

const orderButtonStyle = {
  ...linkButtonStyle,
  background:
    "rgba(224, 130, 35, 0.11)",
  border:
    "1px solid rgba(224, 130, 35, 0.32)",
  color: "#a55a18",
};

const conformityButtonStyle = {
  ...linkButtonStyle,
  background:
    "rgba(35, 107, 67, 0.09)",
  border:
    "1px solid rgba(35, 107, 67, 0.30)",
  color: "#236b43",
};

const moreDetailsStyle = {
  position:
    "relative" as const,
};

const moreSummaryStyle = {
  minHeight: "38px",
  display:
    "inline-flex",
  alignItems: "center",
  justifyContent:
    "center",
  boxSizing:
    "border-box" as const,
  padding: "7px 12px",
  border:
    "1px solid rgba(38, 40, 42, 0.16)",
  borderRadius: "9px",
  background: "#ffffff",
  color:
    "var(--foreground)",
  fontSize: "0.82rem",
  fontWeight: 800,
  cursor: "pointer",
  listStyle: "none",
};

const moreMenuStyle = {
  position:
    "absolute" as const,
  zIndex: 30,
  top: "44px",
  right: 0,
  width: "230px",
  display: "grid",
  gap: "4px",
  padding: "8px",
  border:
    "1px solid rgba(38, 40, 42, 0.14)",
  borderRadius: "11px",
  background: "#ffffff",
  boxShadow:
    "0 12px 30px rgba(0,0,0,0.12)",
};

const menuLinkStyle = {
  display: "block",
  width: "100%",
  boxSizing:
    "border-box" as const,
  padding: "9px 10px",
  borderRadius: "7px",
  color:
    "var(--foreground)",
  fontSize: "0.82rem",
  fontWeight: 700,
  textDecoration: "none",
};

const menuButtonStyle = {
  width: "100%",
  boxSizing:
    "border-box" as const,
  padding: "9px 10px",
  border: 0,
  borderRadius: "7px",
  background: "transparent",
  color:
    "var(--foreground)",
  font: "inherit",
  fontSize: "0.82rem",
  fontWeight: 700,
  textAlign:
    "left" as const,
  cursor: "pointer",
};

const menuDeleteButtonStyle = {
  ...menuButtonStyle,
  color: "#982828",
};

const successStyle = {
  padding: "13px",
  borderRadius:
    "11px",
  background:
    "rgba(35, 107, 67, 0.08)",
  color: "#236b43",
  fontWeight: 800,
};

const errorStyle = {
  padding: "13px",
  borderRadius:
    "11px",
  background:
    "rgba(180, 40, 40, 0.08)",
  color: "#982828",
  fontWeight: 800,
};
