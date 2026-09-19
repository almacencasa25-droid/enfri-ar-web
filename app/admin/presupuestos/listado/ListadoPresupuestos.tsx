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
  obtenerPdfConformidadAction,
  obtenerPdfOrdenTrabajoAction,
  obtenerPdfPresupuestoAction,
  type PresupuestoBusqueda,
} from "./actions";

function moneda(valor: number) {
  return new Intl.NumberFormat(
    "es-AR",
    {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }
  ).format(
    Number(valor || 0)
  );
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

  function abrirPdfPresupuesto(
    presupuesto:
      PresupuestoBusqueda
  ) {
    if (
      !presupuesto.pdf_presupuesto_id
    ) {
      setError(
        "No se encontró el PDF actual del presupuesto."
      );
      return;
    }

    setMensaje("");
    setError("");

    const ventanaPdf =
      window.open(
        "",
        "_blank"
      );

    if (ventanaPdf) {
      ventanaPdf.document.title =
        "Abriendo presupuesto...";

      ventanaPdf.document.body.innerHTML =
        "<p style='font-family:Arial,sans-serif;padding:24px'>Abriendo PDF del presupuesto...</p>";
    }

    startTransition(
      async () => {
        const resultado =
          await obtenerPdfPresupuestoAction(
            presupuesto.pdf_presupuesto_id!
          );

        if (
          !resultado.ok ||
          !resultado.data?.url
        ) {
          if (ventanaPdf) {
            ventanaPdf.close();
          }

          setError(
            resultado.error ||
              "No se pudo abrir el PDF del presupuesto."
          );

          return;
        }

        if (ventanaPdf) {
          ventanaPdf.location.href =
            resultado.data.url;
        } else {
          window.open(
            resultado.data.url,
            "_blank",
            "noopener,noreferrer"
          );
        }
      }
    );
  }

  function abrirPdfOrdenTrabajo(
    presupuesto:
      PresupuestoBusqueda
  ) {
    if (
      !presupuesto.orden_trabajo_id
    ) {
      setError(
        "No se encontró la Orden de Trabajo vigente."
      );
      return;
    }

    setMensaje("");
    setError("");

    const ventanaPdf =
      window.open(
        "",
        "_blank"
      );

    if (ventanaPdf) {
      ventanaPdf.document.title =
        "Abriendo Orden de Trabajo...";

      ventanaPdf.document.body.innerHTML =
        "<p style='font-family:Arial,sans-serif;padding:24px'>Abriendo PDF de Orden de Trabajo...</p>";
    }

    startTransition(
      async () => {
        const resultado =
          await obtenerPdfOrdenTrabajoAction(
            presupuesto.orden_trabajo_id!
          );

        if (
          !resultado.ok ||
          !resultado.data?.url
        ) {
          if (ventanaPdf) {
            ventanaPdf.close();
          }

          setError(
            resultado.error ||
              "No se pudo abrir el PDF de la Orden de Trabajo."
          );

          return;
        }

        if (ventanaPdf) {
          ventanaPdf.location.href =
            resultado.data.url;
        } else {
          window.open(
            resultado.data.url,
            "_blank",
            "noopener,noreferrer"
          );
        }
      }
    );
  }

  function abrirPdfConformidad(
    presupuesto:
      PresupuestoBusqueda
  ) {
    if (
      !presupuesto.conformidad_id
    ) {
      setError(
        "No se encontró la conformidad vigente."
      );
      return;
    }

    setMensaje("");
    setError("");

    const ventanaPdf =
      window.open(
        "",
        "_blank"
      );

    if (ventanaPdf) {
      ventanaPdf.document.title =
        "Abriendo conformidad...";

      ventanaPdf.document.body.innerHTML =
        "<p style='font-family:Arial,sans-serif;padding:24px'>Abriendo PDF de conformidad...</p>";
    }

    startTransition(
      async () => {
        const resultado =
          await obtenerPdfConformidadAction(
            presupuesto.conformidad_id!
          );

        if (
          !resultado.ok ||
          !resultado.data?.url
        ) {
          if (ventanaPdf) {
            ventanaPdf.close();
          }

          setError(
            resultado.error ||
              "No se pudo abrir el PDF de la conformidad."
          );

          return;
        }

        if (ventanaPdf) {
          ventanaPdf.location.href =
            resultado.data.url;
        } else {
          window.open(
            resultado.data.url,
            "_blank",
            "noopener,noreferrer"
          );
        }
      }
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

  function accionDocumento(
    presupuesto:
      PresupuestoBusqueda
  ) {
    const hrefPdf =
      `/admin/presupuestos/documentos?tipo=presupuestos&q=${encodeURIComponent(
        String(
          presupuesto.numero
        )
      )}`;

    const hrefOrden =
      `/admin/presupuestos/listado/${presupuesto.id}/orden-trabajo`;

    const hrefConformidad =
      `/admin/presupuestos/listado/${presupuesto.id}/conformidad`;

    if (
      presupuesto.estado ===
      "borrador"
    ) {
      return null;
    }

    if (
      presupuesto.estado ===
        "enviado" ||
      presupuesto.estado ===
        "rechazado" ||
      presupuesto.estado ===
        "anulado"
    ) {
      return (
        <Link
          href={hrefPdf}
          style={
            pdfButtonStyle
          }
        >
          Ver PDF
        </Link>
      );
    }

    if (
      presupuesto.estado ===
        "aceptado" ||
      presupuesto.estado ===
        "realizado"
    ) {
      if (
        presupuesto
          .tiene_conformidad
      ) {
        return (
          <Link
            href={
              hrefConformidad
            }
            style={
              conformityButtonStyle
            }
          >
            Ver Conformidad
          </Link>
        );
      }

      if (
        presupuesto
          .tiene_orden_trabajo
      ) {
        return (
          <Link
            href={
              hrefConformidad
            }
            style={
              conformityButtonStyle
            }
          >
            Generar Conformidad
          </Link>
        );
      }

      return (
        <Link
          href={hrefOrden}
          style={
            orderButtonStyle
          }
        >
          Generar Orden de Trabajo
        </Link>
      );
    }

    return null;
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
            gap: "8px",
          }}
        >
          {presupuestos.map(
            (
              presupuesto
            ) => (
              <details
                key={
                  presupuesto.id
                }
                style={
                  presupuestoStyle
                }
              >
                <summary
                  style={
                    resumenStyle
                  }
                >
                  <div
                    style={
                      resumenPrincipalStyle
                    }
                  >
                    <strong
                      style={
                        numeroStyle
                      }
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
                      onClick={(
                        event
                      ) => {
                        event.stopPropagation();
                      }}
                      onChange={(
                        event
                      ) => {
                        event.stopPropagation();

                        cambiarEstado(
                          presupuesto.id,
                          event.target.value
                        );
                      }}
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

                    <span
                      style={
                        clienteResumenStyle
                      }
                    >
                      {presupuesto.cliente ||
                        "Sin nombre"}
                    </span>
                  </div>

                  <div
                    style={
                      resumenDatosStyle
                    }
                  >
                    <span>
                      {fechaArgentina(
                        presupuesto.fecha
                      )}
                    </span>

                    <strong>
                      {moneda(
                        presupuesto.total
                      )}
                    </strong>

                    <span
                      style={
                        abrirStyle
                      }
                    >
                      Ver
                    </span>
                  </div>
                </summary>

                <div
                  style={
                    detalleStyle
                  }
                >
                  <div
                    style={
                      dataGridStyle
                    }
                  >
                    <div>
                      <span
                        style={
                          dataLabelStyle
                        }
                      >
                        Cliente
                      </span>

                      <strong>
                        {presupuesto.cliente ||
                          "Sin nombre"}
                      </strong>
                    </div>

                    {presupuesto.dni_cuit ? (
                      <div>
                        <span
                          style={
                            dataLabelStyle
                          }
                        >
                          DNI/CUIT
                        </span>

                        <strong>
                          {
                            presupuesto.dni_cuit
                          }
                        </strong>
                      </div>
                    ) : null}

                    <div>
                      <span
                        style={
                          dataLabelStyle
                        }
                      >
                        Fecha
                      </span>

                      <strong>
                        {fechaArgentina(
                          presupuesto.fecha
                        )}
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          dataLabelStyle
                        }
                      >
                        Total
                      </span>

                      <strong>
                        {moneda(
                          presupuesto.total
                        )}
                      </strong>
                    </div>
                  </div>

                  {presupuesto.detalle_corto ? (
                    <div
                      style={
                        detalleTrabajoStyle
                      }
                    >
                      <span
                        style={
                          dataLabelStyle
                        }
                      >
                        Detalle
                      </span>

                      <strong>
                        {
                          presupuesto.detalle_corto
                        }
                      </strong>
                    </div>
                  ) : null}

                  {presupuesto.trabajo_realizado ? (
                    <span
                      style={
                        realizadoStyle
                      }
                    >
                      Trabajo realizado
                    </span>
                  ) : null}

                  <div
                    style={
                      accionesStyle
                    }
                  >
                    <Link
                      href={`/admin/presupuestos/listado/${presupuesto.id}/editar`}
                      style={
                        primaryButtonStyle
                      }
                    >
                      Editar
                    </Link>

                    {
                      accionDocumento(
                        presupuesto
                      )
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
                          .tiene_pdf_presupuesto ? (
                          <button
                            type="button"
                            disabled={
                              procesando
                            }
                            onClick={() =>
                              abrirPdfPresupuesto(
                                presupuesto
                              )
                            }
                            style={
                              menuButtonStyle
                            }
                          >
                            Ver PDF del presupuesto
                          </button>
                        ) : (
                          <div
                            style={
                              menuDisabledStyle
                            }
                          >
                            PDF del presupuesto pendiente
                          </div>
                        )}

                        {presupuesto
                          .tiene_orden_trabajo ? (
                          <button
                            type="button"
                            disabled={
                              procesando
                            }
                            onClick={() =>
                              abrirPdfOrdenTrabajo(
                                presupuesto
                              )
                            }
                            style={
                              menuButtonStyle
                            }
                          >
                            Ver Orden de Trabajo
                          </button>
                        ) : null}

                        {presupuesto
                          .tiene_conformidad ? (
                          <button
                            type="button"
                            disabled={
                              procesando
                            }
                            onClick={() =>
                              abrirPdfConformidad(
                                presupuesto
                              )
                            }
                            style={
                              menuButtonStyle
                            }
                          >
                            Ver Conformidad
                          </button>
                        ) : null}

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
                </div>
              </details>
            )
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

const ayudaStyle = {
  margin: 0,
  color:
    "var(--muted)",
  fontSize: "0.82rem",
};

const presupuestoStyle = {
  border:
    "1px solid rgba(38, 40, 42, 0.10)",
  borderRadius: "12px",
  background:
    "rgba(255,255,255,0.76)",
  overflow: "visible",
};

const resumenStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "13px 14px",
  cursor: "pointer",
  listStyle: "none",
};

const resumenPrincipalStyle = {
  minWidth: "220px",
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  gap: "10px",
};

const numeroStyle = {
  color:
    "var(--foreground)",
  fontSize: "0.94rem",
};

const clienteResumenStyle = {
  color:
    "var(--muted)",
  fontSize: "0.84rem",
};

const resumenDatosStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  justifyContent:
    "flex-end",
  gap: "12px",
  color:
    "var(--muted)",
  fontSize: "0.80rem",
};

const abrirStyle = {
  color:
    "var(--brand-blue)",
  fontWeight: 800,
};

const detalleStyle = {
  display: "grid",
  gap: "14px",
  padding:
    "15px 14px 16px",
  borderTop:
    "1px solid rgba(38, 40, 42, 0.08)",
};

const dataGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px",
  color:
    "var(--foreground)",
  fontSize: "0.84rem",
};

const dataLabelStyle = {
  display: "block",
  marginBottom: "3px",
  color:
    "var(--muted)",
  fontSize: "0.76rem",
};

const detalleTrabajoStyle = {
  padding: "10px 12px",
  borderRadius: "9px",
  background:
    "rgba(38, 111, 164, 0.05)",
  color:
    "var(--foreground)",
  fontSize: "0.84rem",
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

const realizadoStyle = {
  color: "#236b43",
  fontSize: "0.82rem",
  fontWeight: 800,
};

const accionesStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  gap: "8px",
};

const primaryButtonStyle = {
  minHeight: "38px",
  display:
    "inline-flex",
  alignItems: "center",
  justifyContent:
    "center",
  boxSizing:
    "border-box" as const,
  padding: "7px 14px",
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

const pdfButtonStyle = {
  ...primaryButtonStyle,
  background:
    "rgba(20, 110, 160, 0.08)",
  border:
    "1px solid rgba(20, 110, 160, 0.28)",
  color: "#146e9f",
};

const orderButtonStyle = {
  ...primaryButtonStyle,
  background:
    "rgba(224, 130, 35, 0.11)",
  border:
    "1px solid rgba(224, 130, 35, 0.32)",
  color: "#a55a18",
};

const conformityButtonStyle = {
  ...primaryButtonStyle,
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
  left: 0,
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

const menuDisabledStyle = {
  width: "100%",
  boxSizing:
    "border-box" as const,
  padding: "9px 10px",
  color:
    "var(--muted)",
  fontSize: "0.80rem",
  fontWeight: 700,
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
