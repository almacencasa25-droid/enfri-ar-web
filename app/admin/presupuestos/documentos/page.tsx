import Link from "next/link";

import DocumentoPdfAcciones from "./DocumentoPdfAcciones";
import DocumentoOrdenTrabajoAcciones from "./DocumentoOrdenTrabajoAcciones";

import {
  listarDocumentosOrdenTrabajoAction,
  listarDocumentosPresupuestoAction,
} from "./actions";

export const metadata = {
  title: "Documentos",
};

type TipoDocumento =
  | "presupuestos"
  | "ordenes"
  | "conformidades";

function fechaArgentina(fecha: string) {
  if (!fecha) {
    return "-";
  }

  const fechaSimple = fecha.slice(0, 10);
  const partes = fechaSimple.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function fechaHoraArgentina(fecha: string) {
  if (!fecha) {
    return "-";
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(valor);
}

function varianteVisible(variante: string) {
  if (variante === "original") {
    return "ORIGINAL";
  }

  if (variante === "copia") {
    return "COPIA";
  }

  return variante.toUpperCase();
}

function tipoDocumentoValido(
  valor: string | undefined
): TipoDocumento {
  if (valor === "ordenes") {
    return "ordenes";
  }

  if (valor === "conformidades") {
    return "conformidades";
  }

  return "presupuestos";
}

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string;
  }>;
}) {
  const parametros = await searchParams;

  const tipoActivo = tipoDocumentoValido(
    parametros.tipo
  );

  const [
    resultadoPresupuestos,
    resultadoOrdenes,
  ] = await Promise.all([
    listarDocumentosPresupuestoAction(),
    listarDocumentosOrdenTrabajoAction(),
  ]);

  const documentos =
    resultadoPresupuestos.ok
      ? resultadoPresupuestos.data
      : [];

  const ordenes =
    resultadoOrdenes.ok
      ? resultadoOrdenes.data
      : [];

  const errorPresupuestos =
    resultadoPresupuestos.ok
      ? ""
      : resultadoPresupuestos.error;

  const errorOrdenes =
    resultadoOrdenes.ok
      ? ""
      : resultadoOrdenes.error;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 18px 48px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            padding: "24px",
            border:
              "1px solid rgba(38, 40, 42, 0.12)",
            borderRadius: "18px",
            background:
              "rgba(255, 253, 248, 0.92)",
            boxShadow:
              "0 14px 35px rgba(38, 40, 42, 0.08)",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              color: "var(--brand-blue)",
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Presupuestos y trabajos · Enfri.Ar
          </p>

          <h1
            style={{
              margin: 0,
              color: "var(--foreground)",
              fontSize:
                "clamp(1.8rem, 5vw, 2.5rem)",
            }}
          >
            Documentos
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "var(--muted)",
              lineHeight: 1.6,
            }}
          >
            Centro de consulta de documentos
            históricos de presupuestos,
            Órdenes de Trabajo y conformidades.
          </p>
        </header>

        {/* =========================================
            PESTAÑAS
        ========================================= */}

        <nav
          aria-label="Tipos de documentos"
          style={tabsContainerStyle}
        >
          <Link
            href="/admin/presupuestos/documentos?tipo=presupuestos"
            style={{
              ...tabStyle,
              ...(tipoActivo === "presupuestos"
                ? activeTabStyle
                : {}),
            }}
          >
            Presupuestos
            <span style={tabCounterStyle}>
              {documentos.length}
            </span>
          </Link>

          <Link
            href="/admin/presupuestos/documentos?tipo=ordenes"
            style={{
              ...tabStyle,
              ...(tipoActivo === "ordenes"
                ? activeTabStyle
                : {}),
            }}
          >
            Órdenes de Trabajo
            <span style={tabCounterStyle}>
              {ordenes.length}
            </span>
          </Link>

          <Link
            href="/admin/presupuestos/documentos?tipo=conformidades"
            style={{
              ...tabStyle,
              ...(tipoActivo === "conformidades"
                ? activeTabStyle
                : {}),
            }}
          >
            Conformidades
          </Link>
        </nav>

        {/* =========================================
            PRESUPUESTOS
        ========================================= */}

        {tipoActivo === "presupuestos" ? (
          <>
            {errorPresupuestos ? (
              <div style={errorBoxStyle}>
                Presupuestos:{" "}
                {errorPresupuestos}
              </div>
            ) : null}

            <section style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>
                    Presupuestos emitidos
                  </h2>

                  <p
                    style={
                      sectionDescriptionStyle
                    }
                  >
                    Cada versión se conserva como
                    documento histórico
                    independiente.
                  </p>
                </div>

                <strong style={counterStyle}>
                  {documentos.length} documentos
                </strong>
              </div>

              {documentos.length === 0 ? (
                <div style={emptyStyle}>
                  Todavía no hay presupuestos
                  históricos para mostrar.
                </div>
              ) : (
                <div style={listStyle}>
                  {documentos.map(
                    (documento) => (
                      <article
                        key={documento.id}
                        style={cardStyle}
                      >
                        <div
                          style={
                            cardHeaderStyle
                          }
                        >
                          <div>
                            <strong
                              style={
                                cardTitleStyle
                              }
                            >
                              Presupuesto Nº{" "}
                              {
                                documento.numero
                              }
                            </strong>

                            <span
                              style={
                                versionStyle
                              }
                            >
                              Versión{" "}
                              {
                                documento.version
                              }
                            </span>
                          </div>

                          {documento.storage_path ? (
                            <span
                              style={
                                savedBadgeStyle
                              }
                            >
                              PDF guardado
                            </span>
                          ) : (
                            <span
                              style={
                                pendingBadgeStyle
                              }
                            >
                              PDF pendiente
                            </span>
                          )}
                        </div>

                        <div
                          style={dataGridStyle}
                        >
                          <div>
                            <span>
                              Cliente
                            </span>

                            <strong
                              style={
                                dataStrongStyle
                              }
                            >
                              {
                                documento.cliente
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Fecha del presupuesto
                            </span>

                            <strong
                              style={
                                dataStrongStyle
                              }
                            >
                              {fechaArgentina(
                                documento.fecha_presupuesto
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Emitido
                            </span>

                            <strong
                              style={
                                dataStrongStyle
                              }
                            >
                              {fechaHoraArgentina(
                                documento.creado_en
                              )}
                            </strong>
                          </div>
                        </div>

                        {documento.storage_path ? (
                          <DocumentoPdfAcciones
                            storagePath={
                              documento.storage_path
                            }
                          />
                        ) : (
                          <span
                            style={
                              pendingTextStyle
                            }
                          >
                            Esta versión todavía
                            no tiene un PDF
                            asociado.
                          </span>
                        )}
                      </article>
                    )
                  )}
                </div>
              )}
            </section>
          </>
        ) : null}

        {/* =========================================
            ÓRDENES DE TRABAJO
        ========================================= */}

        {tipoActivo === "ordenes" ? (
          <>
            {errorOrdenes ? (
              <div style={errorBoxStyle}>
                Órdenes de Trabajo:{" "}
                {errorOrdenes}
              </div>
            ) : null}

            <section style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>
                    Órdenes de Trabajo
                  </h2>

                  <p
                    style={
                      sectionDescriptionStyle
                    }
                  >
                    ORIGINAL y COPIA de cada
                    Orden de Trabajo quedan
                    identificados
                    individualmente.
                  </p>
                </div>

                <strong style={counterStyle}>
                  {ordenes.length} documentos
                </strong>
              </div>

              {ordenes.length === 0 ? (
                <div style={emptyStyle}>
                  Todavía no hay PDF de Órdenes
                  de Trabajo guardados.
                </div>
              ) : (
                <div style={listStyle}>
                  {ordenes.map((orden) => (
                    <article
                      key={orden.id}
                      style={cardStyle}
                    >
                      <div
                        style={
                          cardHeaderStyle
                        }
                      >
                        <div>
                          <strong
                            style={
                              cardTitleStyle
                            }
                          >
                            {
                              orden.numero_orden
                            }
                          </strong>

                          <span
                            style={
                              orderVariantStyle
                            }
                          >
                            {varianteVisible(
                              orden.variante
                            )}
                          </span>
                        </div>

                        <span
                          style={
                            savedBadgeStyle
                          }
                        >
                          PDF guardado
                        </span>
                      </div>

                      <div
                        style={
                          relationBoxStyle
                        }
                      >
                        Según Presupuesto Nº{" "}
                        <strong>
                          {
                            orden.numero_presupuesto
                          }
                        </strong>
                      </div>

                      <div
                        style={dataGridStyle}
                      >
                        <div>
                          <span>
                            Cliente
                          </span>

                          <strong
                            style={
                              dataStrongStyle
                            }
                          >
                            {orden.cliente}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Técnico
                          </span>

                          <strong
                            style={
                              dataStrongStyle
                            }
                          >
                            {orden.tecnico}
                          </strong>

                          {orden.matricula ? (
                            <span
                              style={
                                subDataStyle
                              }
                            >
                              Matrícula{" "}
                              {
                                orden.matricula
                              }
                            </span>
                          ) : null}
                        </div>

                        <div>
                          <span>
                            Fecha de la OT
                          </span>

                          <strong
                            style={
                              dataStrongStyle
                            }
                          >
                            {fechaArgentina(
                              orden.fecha_orden
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            PDF guardado
                          </span>

                          <strong
                            style={
                              dataStrongStyle
                            }
                          >
                            {fechaHoraArgentina(
                              orden.creado_en
                            )}
                          </strong>
                        </div>
                      </div>

                      <DocumentoOrdenTrabajoAcciones
                        storagePath={
                          orden.storage_path
                        }
                      />
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}

        {/* =========================================
            CONFORMIDADES
        ========================================= */}

        {tipoActivo === "conformidades" ? (
          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>
                  Conformidades
                </h2>

                <p
                  style={
                    sectionDescriptionStyle
                  }
                >
                  Documentos de conformidad del
                  trabajo realizado.
                </p>
              </div>
            </div>

            <div style={emptyStyle}>
              El módulo de conformidades todavía
              no fue implementado. Esta pestaña
              queda preparada para incorporarlo
              cuando corresponda.
            </div>
          </section>
        ) : null}

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <Link
            href="/admin/presupuestos/listado"
            style={backLinkStyle}
          >
            ← Presupuestos realizados
          </Link>

          <Link
            href="/admin/presupuestos"
            style={backLinkStyle}
          >
            Volver a Presupuestos y trabajos
          </Link>
        </div>
      </div>
    </main>
  );
}

const tabsContainerStyle = {
  marginTop: "20px",
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px",
  padding: "10px",
  border:
    "1px solid rgba(38, 40, 42, 0.12)",
  borderRadius: "14px",
  background:
    "rgba(255, 253, 248, 0.92)",
};

const tabStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "10px 14px",
  border:
    "1px solid rgba(38, 40, 42, 0.12)",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.72)",
  color: "var(--foreground)",
  fontSize: "0.88rem",
  fontWeight: 800,
  textDecoration: "none",
};

const activeTabStyle = {
  border: "1px solid var(--brand-blue)",
  background: "var(--brand-blue)",
  color: "#ffffff",
};

const tabCounterStyle = {
  minWidth: "22px",
  padding: "2px 6px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.22)",
  fontSize: "0.74rem",
  textAlign: "center" as const,
};

const sectionStyle = {
  marginTop: "20px",

  padding: "22px",

  border:
    "1px solid rgba(38, 40, 42, 0.12)",

  borderRadius: "18px",

  background:
    "rgba(255, 253, 248, 0.92)",
};

const sectionHeaderStyle = {
  display: "flex",

  flexWrap: "wrap" as const,

  justifyContent: "space-between",

  alignItems: "center",

  gap: "10px",

  marginBottom: "18px",
};

const sectionTitleStyle = {
  margin: 0,

  color: "var(--foreground)",

  fontSize: "1.15rem",
};

const sectionDescriptionStyle = {
  margin: "5px 0 0",

  color: "var(--muted)",

  fontSize: "0.84rem",

  lineHeight: 1.5,
};

const counterStyle = {
  color: "var(--foreground)",

  fontSize: "0.85rem",
};

const emptyStyle = {
  padding: "18px",

  border:
    "1px dashed rgba(38, 40, 42, 0.18)",

  borderRadius: "12px",

  color: "var(--muted)",

  lineHeight: 1.6,
};

const listStyle = {
  display: "grid",

  gap: "12px",
};

const cardStyle = {
  display: "grid",

  gap: "14px",

  padding: "16px",

  border:
    "1px solid rgba(38, 40, 42, 0.1)",

  borderRadius: "14px",

  background: "rgba(255,255,255,0.75)",
};

const cardHeaderStyle = {
  display: "flex",

  flexWrap: "wrap" as const,

  justifyContent: "space-between",

  alignItems: "flex-start",

  gap: "14px",
};

const cardTitleStyle = {
  display: "block",

  color: "var(--foreground)",

  fontSize: "1rem",
};

const versionStyle = {
  display: "block",

  marginTop: "4px",

  color: "var(--brand-blue)",

  fontSize: "0.82rem",

  fontWeight: 800,
};

const orderVariantStyle = {
  ...versionStyle,

  color: "#9a5814",
};

const savedBadgeStyle = {
  padding: "5px 9px",

  borderRadius: "999px",

  background: "rgba(35, 107, 67, 0.09)",

  color: "#236b43",

  fontSize: "0.76rem",

  fontWeight: 800,
};

const pendingBadgeStyle = {
  padding: "5px 9px",

  borderRadius: "999px",

  background: "rgba(180, 120, 20, 0.1)",

  color: "#8a6215",

  fontSize: "0.76rem",

  fontWeight: 800,
};

const relationBoxStyle = {
  padding: "9px 11px",

  borderRadius: "9px",

  background:
    "rgba(38, 111, 164, 0.06)",

  color: "var(--foreground)",

  fontSize: "0.84rem",
};

const dataGridStyle = {
  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",

  gap: "10px",

  color: "var(--muted)",

  fontSize: "0.84rem",

  lineHeight: 1.5,
};

const dataStrongStyle = {
  display: "block",

  color: "var(--foreground)",
};

const subDataStyle = {
  display: "block",

  marginTop: "2px",

  color: "var(--muted)",

  fontSize: "0.78rem",
};

const pendingTextStyle = {
  color: "var(--muted)",

  fontSize: "0.82rem",
};

const errorBoxStyle = {
  marginTop: "18px",

  padding: "14px 16px",

  borderRadius: "12px",

  background: "rgba(180, 40, 40, 0.08)",

  color: "#982828",

  fontWeight: 800,
};

const backLinkStyle = {
  color: "var(--foreground)",

  fontWeight: 800,

  textDecoration: "none",
};
