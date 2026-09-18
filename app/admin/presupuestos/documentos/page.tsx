import Link from "next/link";

import DocumentoPdfAcciones from "./DocumentoPdfAcciones";
import {
  listarDocumentosPresupuestoAction,
} from "./actions";

export const metadata = {
  title: "Documentos",
};

function fechaArgentina(
  fecha: string
) {
  if (!fecha) {
    return "-";
  }

  const fechaSimple =
    fecha.slice(0, 10);

  const partes =
    fechaSimple.split("-");

  if (
    partes.length !== 3
  ) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function fechaHoraArgentina(
  fecha: string
) {
  if (!fecha) {
    return "-";
  }

  const valor =
    new Date(fecha);

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return fecha;
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      dateStyle: "short",
      timeStyle: "short",
      timeZone:
        "America/Argentina/Buenos_Aires",
    }
  ).format(valor);
}

export default async function DocumentosPage() {
  const resultado =
    await listarDocumentosPresupuestoAction();

  const documentos =
    resultado.ok
      ? resultado.data
      : [];

  const error =
    resultado.ok
      ? ""
      : resultado.error;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding:
          "32px 18px 48px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth:
            "1100px",
          margin:
            "0 auto",
        }}
      >
        <header
          style={{
            padding: "24px",
            border:
              "1px solid rgba(38, 40, 42, 0.12)",
            borderRadius:
              "18px",
            background:
              "rgba(255, 253, 248, 0.92)",
            boxShadow:
              "0 14px 35px rgba(38, 40, 42, 0.08)",
          }}
        >
          <p
            style={{
              margin:
                "0 0 6px",
              color:
                "var(--brand-blue)",
              fontSize:
                "0.78rem",
              fontWeight:
                800,
              letterSpacing:
                "0.12em",
              textTransform:
                "uppercase",
            }}
          >
            Presupuestos ·
            Enfri.Ar
          </p>

          <h1
            style={{
              margin: 0,
              color:
                "var(--foreground)",
              fontSize:
                "clamp(1.8rem, 5vw, 2.5rem)",
            }}
          >
            Documentos
          </h1>

          <p
            style={{
              margin:
                "10px 0 0",
              color:
                "var(--muted)",
              lineHeight:
                1.6,
            }}
          >
            Historial de
            presupuestos emitidos.
            Podés revisar cada
            versión antes de
            decidir si querés
            descargarla.
          </p>
        </header>

        {error ? (
          <div
            style={{
              marginTop:
                "18px",
              padding:
                "14px 16px",
              borderRadius:
                "12px",
              background:
                "rgba(180, 40, 40, 0.08)",
              color:
                "#982828",
              fontWeight:
                800,
            }}
          >
            {error}
          </div>
        ) : null}

        <section
          style={{
            marginTop:
              "20px",
            padding:
              "22px",
            border:
              "1px solid rgba(38, 40, 42, 0.12)",
            borderRadius:
              "18px",
            background:
              "rgba(255, 253, 248, 0.92)",
          }}
        >
          <div
            style={{
              display:
                "flex",
              flexWrap:
                "wrap",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: "10px",
              marginBottom:
                "18px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color:
                    "var(--foreground)",
                  fontSize:
                    "1.15rem",
                }}
              >
                Presupuestos
                emitidos
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color:
                    "var(--muted)",
                  fontSize:
                    "0.84rem",
                }}
              >
                Cada versión se
                conserva como
                documento histórico
                independiente.
              </p>
            </div>

            <strong
              style={{
                color:
                  "var(--foreground)",
                fontSize:
                  "0.85rem",
              }}
            >
              {
                documentos.length
              }{" "}
              documentos
            </strong>
          </div>

          {documentos.length ===
          0 ? (
            <div
              style={{
                padding:
                  "18px",
                border:
                  "1px dashed rgba(38, 40, 42, 0.18)",
                borderRadius:
                  "12px",
                color:
                  "var(--muted)",
                lineHeight:
                  1.6,
              }}
            >
              Todavía no hay
              presupuestos
              históricos para
              mostrar.
            </div>
          ) : (
            <div
              style={{
                display:
                  "grid",
                gap: "12px",
              }}
            >
              {documentos.map(
                (
                  documento
                ) => (
                  <article
                    key={
                      documento.id
                    }
                    style={{
                      display:
                        "grid",
                      gap: "14px",
                      padding:
                        "16px",
                      border:
                        "1px solid rgba(38, 40, 42, 0.1)",
                      borderRadius:
                        "14px",
                      background:
                        "rgba(255,255,255,0.75)",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        flexWrap:
                          "wrap",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap:
                          "14px",
                      }}
                    >
                      <div>
                        <strong
                          style={{
                            display:
                              "block",
                            color:
                              "var(--foreground)",
                            fontSize:
                              "1rem",
                          }}
                        >
                          Presupuesto
                          Nº{" "}
                          {
                            documento.numero
                          }
                        </strong>

                        <span
                          style={{
                            display:
                              "block",
                            marginTop:
                              "4px",
                            color:
                              "var(--brand-blue)",
                            fontSize:
                              "0.82rem",
                            fontWeight:
                              800,
                          }}
                        >
                          Versión{" "}
                          {
                            documento.version
                          }
                        </span>
                      </div>

                      {documento.storage_path ? (
                        <span
                          style={{
                            padding:
                              "5px 9px",
                            borderRadius:
                              "999px",
                            background:
                              "rgba(35, 107, 67, 0.09)",
                            color:
                              "#236b43",
                            fontSize:
                              "0.76rem",
                            fontWeight:
                              800,
                          }}
                        >
                          PDF guardado
                        </span>
                      ) : (
                        <span
                          style={{
                            padding:
                              "5px 9px",
                            borderRadius:
                              "999px",
                            background:
                              "rgba(180, 120, 20, 0.1)",
                            color:
                              "#8a6215",
                            fontSize:
                              "0.76rem",
                            fontWeight:
                              800,
                          }}
                        >
                          PDF pendiente
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap:
                          "10px",
                        color:
                          "var(--muted)",
                        fontSize:
                          "0.84rem",
                        lineHeight:
                          1.5,
                      }}
                    >
                      <div>
                        <span>
                          Cliente
                        </span>

                        <strong
                          style={{
                            display:
                              "block",
                            color:
                              "var(--foreground)",
                          }}
                        >
                          {
                            documento.cliente
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Fecha del
                          presupuesto
                        </span>

                        <strong
                          style={{
                            display:
                              "block",
                            color:
                              "var(--foreground)",
                          }}
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
                          style={{
                            display:
                              "block",
                            color:
                              "var(--foreground)",
                          }}
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
                        style={{
                          color:
                            "var(--muted)",
                          fontSize:
                            "0.82rem",
                        }}
                      >
                        Esta versión
                        todavía no
                        tiene un PDF
                        asociado.
                      </span>
                    )}
                  </article>
                )
              )}
            </div>
          )}
        </section>

        <div
          style={{
            marginTop:
              "20px",
            display:
              "flex",
            flexWrap:
              "wrap",
            gap: "16px",
          }}
        >
          <Link
            href="/admin/presupuestos/listado"
            style={{
              color:
                "var(--foreground)",
              fontWeight:
                800,
              textDecoration:
                "none",
            }}
          >
            ← Presupuestos
            realizados
          </Link>

          <Link
            href="/admin/presupuestos"
            style={{
              color:
                "var(--foreground)",
              fontWeight:
                800,
              textDecoration:
                "none",
            }}
          >
            Volver a
            Presupuestos y
            trabajos
          </Link>
        </div>
      </div>
    </main>
  );
}
