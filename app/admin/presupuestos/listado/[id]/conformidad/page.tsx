import Link from "next/link";
import {
  notFound,
} from "next/navigation";

import {
  createSupabaseServerClient,
} from "@/lib/supabase/server";

import ConformidadForm from "./ConformidadForm";

export const metadata = {
  title:
    "Conformidad",
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const BUCKET_TRABAJOS =
  "trabajos-enfri-ar";

function nombreCliente({
  nombre,
  apellido,
  razonSocial,
}: {
  nombre:
    | string
    | null;

  apellido:
    | string
    | null;

  razonSocial:
    | string
    | null;
}) {
  const empresa =
    String(
      razonSocial ?? ""
    ).trim();

  if (empresa) {
    return empresa;
  }

  const persona = [
    nombre,
    apellido,
  ]
    .map((valor) =>
      String(
        valor ?? ""
      ).trim()
    )
    .filter(Boolean)
    .join(" ");

  return (
    persona ||
    "Cliente sin nombre"
  );
}

function nombreTecnico({
  nombre,
  apellido,
}: {
  nombre:
    | string
    | null;

  apellido:
    | string
    | null;
}) {
  const completo = [
    nombre,
    apellido,
  ]
    .map((valor) =>
      String(
        valor ?? ""
      ).trim()
    )
    .filter(Boolean)
    .join(" ");

  return (
    completo ||
    "Técnico sin nombre"
  );
}

function nombreArchivoDesdeRuta(
  ruta: string
) {
  return (
    ruta
      .split("/")
      .pop() ||
    "conformidad.pdf"
  );
}

export default async function ConformidadPage({
  params,
}: Props) {
  const { id } =
    await params;

  const supabase =
    await createSupabaseServerClient();

  /*
   * =========================================
   * PRESUPUESTO
   * =========================================
   */

  const {
    data: presupuesto,
    error:
      presupuestoError,
  } = await supabase
    .from("presupuestos")
    .select(`
      id,
      numero,
      estado,
      cliente_nombre,
      cliente_apellido,
      cliente_razon_social,
      eliminado_at
    `)
    .eq("id", id)
    .maybeSingle();

  if (
    presupuestoError ||
    !presupuesto ||
    presupuesto.eliminado_at
  ) {
    notFound();
  }

  const cliente =
    nombreCliente({
      nombre:
        presupuesto.cliente_nombre,

      apellido:
        presupuesto.cliente_apellido,

      razonSocial:
        presupuesto.cliente_razon_social,
    });

  /*
   * =========================================
   * BUSCAR CONFORMIDAD EXISTENTE
   * =========================================
   *
   * Esta consulta se hace ANTES de mostrar
   * el formulario.
   *
   * Si existe una conformidad, esta página
   * pasa automáticamente a modo consulta.
   */

  const {
    data:
      conformidadExistente,
    error:
      conformidadError,
  } = await supabase
    .from(
      "conformidades"
    )
    .select(`
      id,
      numero_conformidad,
      fecha,
      tecnico_nombre,
      tecnico_apellido,
      tecnico_matricula,
      trabajo_realizado,
      observaciones,
      fecha_finalizacion,
      created_at
    `)
    .eq(
      "presupuesto_id",
      presupuesto.id
    )
    .eq(
      "vigente",
      true
    )
    .maybeSingle();

  if (conformidadError) {
    return (
      <main
        style={{
          minHeight:
            "100vh",
          padding:
            "20px 18px 48px",
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
          <div
            style={
              errorStyle
            }
          >
            No se pudo comprobar
            la conformidad existente.
            No se habilita la generación
            para evitar duplicados.
          </div>

          <div
            style={{
              marginTop:
                "20px",
            }}
          >
            <Link
              href="/admin/presupuestos/listado"
              style={
                volverStyle
              }
            >
              ← Presupuestos realizados
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================================
   * SI YA EXISTE → MOSTRARLA
   * =========================================
   */

  if (
    conformidadExistente
  ) {
    const {
      data:
        archivosConformidad,
      error:
        archivosError,
    } = await supabase
      .from(
        "archivos_trabajo"
      )
      .select(`
        id,
        storage_bucket,
        storage_path,
        nombre_original,
        created_at
      `)
      .eq(
        "conformidad_id",
        conformidadExistente.id
      )
      .eq(
        "documento_clase",
        "conformidad"
      )
      .eq(
        "documento_variante",
        "unico"
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1);

    const archivo =
      !archivosError &&
      archivosConformidad &&
      archivosConformidad.length >
        0
        ? archivosConformidad[0]
        : null;

    let urlVer:
      | string
      | null =
      null;

    let urlDescargar:
      | string
      | null =
      null;

    let nombreArchivo =
      "";

    if (
      archivo?.storage_path
    ) {
      nombreArchivo =
        archivo.nombre_original ||
        nombreArchivoDesdeRuta(
          archivo.storage_path
        );

      const bucket =
        archivo.storage_bucket ||
        BUCKET_TRABAJOS;

      const {
        data:
          enlaceVista,
      } =
        await supabase.storage
          .from(bucket)
          .createSignedUrl(
            archivo.storage_path,
            300
          );

      urlVer =
        enlaceVista
          ?.signedUrl ||
        null;

      const {
        data:
          enlaceDescarga,
      } =
        await supabase.storage
          .from(bucket)
          .createSignedUrl(
            archivo.storage_path,
            300,
            {
              download:
                nombreArchivo,
            }
          );

      urlDescargar =
        enlaceDescarga
          ?.signedUrl ||
        null;
    }

    const tecnico =
      nombreTecnico({
        nombre:
          conformidadExistente
            .tecnico_nombre,

        apellido:
          conformidadExistente
            .tecnico_apellido,
      });

    return (
      <main
        style={{
          minHeight:
            "100vh",

          padding:
            "20px 18px 48px",
        }}
      >
        <div
          style={{
            width:
              "100%",

            maxWidth:
              "1100px",

            margin:
              "0 auto",
          }}
        >
          <header
            style={
              headerStyle
            }
          >
            <p
              style={
                eyebrowStyle
              }
            >
              Conformidad ·
              Enfri.Ar
            </p>

            <h1
              style={
                titleStyle
              }
            >
              {
                conformidadExistente
                  .numero_conformidad
              }
            </h1>

            <p
              style={
                subtitleStyle
              }
            >
              Presupuesto Nº{" "}
              {
                presupuesto.numero
              }{" "}
              · {cliente}
            </p>
          </header>

          <section
            style={
              boxStyle
            }
          >
            <div
              style={
                statusStyle
              }
            >
              Conformidad generada
            </div>

            <div
              style={
                dataGridStyle
              }
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
                  style={
                    datoStrongStyle
                  }
                >
                  Nº{" "}
                  {
                    presupuesto.numero
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
                  style={
                    datoStrongStyle
                  }
                >
                  {cliente}
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
                  {tecnico}
                </strong>

                {conformidadExistente
                  .tecnico_matricula ? (
                  <span
                    style={
                      subDatoStyle
                    }
                  >
                    Matrícula{" "}
                    {
                      conformidadExistente
                        .tecnico_matricula
                    }
                  </span>
                ) : null}
              </div>
            </div>

            {conformidadExistente
              .trabajo_realizado ? (
              <div
                style={
                  infoBoxStyle
                }
              >
                <span
                  style={
                    labelSmallStyle
                  }
                >
                  TRABAJO REALIZADO
                </span>

                <div
                  style={{
                    marginTop:
                      "5px",
                    whiteSpace:
                      "pre-wrap",
                  }}
                >
                  {
                    conformidadExistente
                      .trabajo_realizado
                  }
                </div>
              </div>
            ) : null}

            {conformidadExistente
              .observaciones ? (
              <div
                style={
                  infoBoxStyle
                }
              >
                <span
                  style={
                    labelSmallStyle
                  }
                >
                  OBSERVACIONES
                </span>

                <div
                  style={{
                    marginTop:
                      "5px",
                    whiteSpace:
                      "pre-wrap",
                  }}
                >
                  {
                    conformidadExistente
                      .observaciones
                  }
                </div>
              </div>
            ) : null}

            {archivo &&
            urlVer ? (
              <div
                style={
                  documentoCardStyle
                }
              >
                <div>
                  <span
                    style={
                      labelSmallStyle
                    }
                  >
                    DOCUMENTO
                  </span>

                  <strong
                    style={
                      datoStrongStyle
                    }
                  >
                    PDF de conformidad
                  </strong>

                  {nombreArchivo ? (
                    <span
                      style={
                        archivoStyle
                      }
                    >
                      {
                        nombreArchivo
                      }
                    </span>
                  ) : null}
                </div>

                <div
                  style={
                    botonesStyle
                  }
                >
                  <a
                    href={
                      urlVer
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={
                      verButtonStyle
                    }
                  >
                    Ver PDF
                  </a>

                  {urlDescargar ? (
                    <a
                      href={
                        urlDescargar
                      }
                      style={
                        descargarButtonStyle
                      }
                    >
                      Descargar PDF
                    </a>
                  ) : null}
                </div>
              </div>
            ) : (
              <div
                style={
                  warningStyle
                }
              >
                La conformidad existe,
                pero no se encontró un
                PDF disponible. No se
                generó una segunda
                conformidad.
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

              gap:
                "14px",
            }}
          >
            <Link
              href={`/admin/presupuestos/listado/${presupuesto.id}/editar`}
              style={
                editarButtonStyle
              }
            >
              Editar presupuesto
            </Link>

            <Link
              href="/admin/presupuestos/listado"
              style={
                volverStyle
              }
            >
              ← Volver al listado
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================================
   * SI NO EXISTE → VALIDAR ESTADO
   * =========================================
   */

  const permitido =
    presupuesto.estado ===
      "aceptado" ||
    presupuesto.estado ===
      "realizado";

  if (!permitido) {
    return (
      <main
        style={{
          minHeight:
            "100vh",

          padding:
            "20px 18px 48px",
        }}
      >
        <div
          style={{
            width:
              "100%",

            maxWidth:
              "1100px",

            margin:
              "0 auto",
          }}
        >
          <header
            style={
              headerStyle
            }
          >
            <p
              style={
                eyebrowStyle
              }
            >
              Conformidad ·
              Enfri.Ar
            </p>

            <h1
              style={
                titleStyle
              }
            >
              Presupuesto Nº{" "}
              {
                presupuesto.numero
              }
            </h1>
          </header>

          <div
            style={
              warningStyle
            }
          >
            La conformidad solamente
            puede generarse cuando el
            presupuesto está en estado
            Aceptado o Realizado.
          </div>

          <div
            style={{
              marginTop:
                "20px",
            }}
          >
            <Link
              href="/admin/presupuestos/listado"
              style={
                volverStyle
              }
            >
              ← Presupuestos realizados
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================================
   * ÓRDEN DE TRABAJO
   * =========================================
   */

  const {
    data:
      ordenesActuales,
    error:
      ordenesError,
  } = await supabase
    .from(
      "planillas_trabajo"
    )
    .select(`
      id,
      numero_orden,
      tecnico_id,
      tecnico_nombre,
      tecnico_apellido,
      tecnico_matricula,
      secuencia
    `)
    .eq(
      "presupuesto_id",
      presupuesto.id
    )
    .eq(
      "vigente",
      true
    )
    .order(
      "secuencia",
      {
        ascending: true,
      }
    );

  if (ordenesError) {
    return (
      <main
        style={{
          minHeight:
            "100vh",

          padding:
            "20px 18px 48px",
        }}
      >
        <div
          style={{
            width:
              "100%",

            maxWidth:
              "1100px",

            margin:
              "0 auto",
          }}
        >
          <div
            style={
              errorStyle
            }
          >
            No se pudieron cargar
            las Órdenes de Trabajo
            del presupuesto.
          </div>
        </div>
      </main>
    );
  }

  const ordenes =
    (ordenesActuales || [])
      .map(
        (orden) => ({
          id:
            orden.id,

          numeroOrden:
            orden.numero_orden,

          tecnicoId:
            orden.tecnico_id,

          tecnico:
            [
              orden.tecnico_nombre,
              orden.tecnico_apellido,
            ]
              .filter(Boolean)
              .join(" ") ||
            "Técnico sin nombre",

          matricula:
            orden.tecnico_matricula,
        })
      );

  /*
   * =========================================
   * GENERAR CONFORMIDAD
   * =========================================
   */

  return (
    <main
      style={{
        minHeight:
          "100vh",

        padding:
          "20px 18px 48px",
      }}
    >
      <div
        style={{
          width:
            "100%",

          maxWidth:
            "1100px",

          margin:
            "0 auto",
        }}
      >
        <header
          style={
            headerStyle
          }
        >
          <p
            style={
              eyebrowStyle
            }
          >
            Conformidad ·
            Enfri.Ar
          </p>

          <h1
            style={
              titleStyle
            }
          >
            Generar Conformidad
          </h1>

          <p
            style={
              subtitleStyle
            }
          >
            Presupuesto Nº{" "}
            {
              presupuesto.numero
            }{" "}
            · {cliente}
          </p>
        </header>

        <ConformidadForm
          presupuestoId={
            presupuesto.id
          }
          numeroPresupuesto={
            presupuesto.numero
          }
          cliente={
            cliente
          }
          ordenes={
            ordenes
          }
        />

        <div
          style={{
            marginTop:
              "20px",
          }}
        >
          <Link
            href="/admin/presupuestos/listado"
            style={
              volverStyle
            }
          >
            ← Presupuestos realizados
          </Link>
        </div>
      </div>
    </main>
  );
}

const headerStyle = {
  padding:
    "24px",

  marginBottom:
    "20px",

  border:
    "1px solid rgba(38, 40, 42, 0.12)",

  borderRadius:
    "18px",

  background:
    "rgba(255, 253, 248, 0.92)",

  boxShadow:
    "0 14px 35px rgba(38, 40, 42, 0.08)",
};

const eyebrowStyle = {
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
    "uppercase" as const,
};

const titleStyle = {
  margin: 0,

  color:
    "var(--foreground)",

  fontSize:
    "clamp(1.8rem, 5vw, 2.5rem)",
};

const subtitleStyle = {
  margin:
    "10px 0 0",

  color:
    "var(--muted)",

  lineHeight:
    1.6,
};

const boxStyle = {
  display:
    "grid",

  gap:
    "16px",

  padding:
    "20px",

  border:
    "1px solid rgba(38, 40, 42, 0.12)",

  borderRadius:
    "16px",

  background:
    "rgba(255, 253, 248, 0.92)",
};

const statusStyle = {
  width:
    "fit-content",

  padding:
    "6px 10px",

  borderRadius:
    "999px",

  background:
    "rgba(35, 107, 67, 0.09)",

  color:
    "#236b43",

  fontSize:
    "0.78rem",

  fontWeight:
    800,
};

const dataGridStyle = {
  display:
    "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",

  gap:
    "14px",
};

const labelSmallStyle = {
  color:
    "var(--muted)",

  fontSize:
    "0.72rem",

  fontWeight:
    800,

  letterSpacing:
    "0.08em",
};

const datoStrongStyle = {
  display:
    "block",

  marginTop:
    "4px",

  color:
    "var(--foreground)",
};

const subDatoStyle = {
  display:
    "block",

  marginTop:
    "3px",

  color:
    "var(--muted)",

  fontSize:
    "0.80rem",
};

const infoBoxStyle = {
  padding:
    "13px",

  borderRadius:
    "11px",

  background:
    "rgba(38, 111, 164, 0.06)",

  color:
    "var(--foreground)",

  fontSize:
    "0.84rem",

  lineHeight:
    1.6,
};

const documentoCardStyle = {
  display:
    "flex",

  flexWrap:
    "wrap" as const,

  justifyContent:
    "space-between",

  alignItems:
    "center",

  gap:
    "14px",

  padding:
    "15px",

  border:
    "1px solid rgba(38, 40, 42, 0.12)",

  borderRadius:
    "12px",

  background:
    "#ffffff",
};

const archivoStyle = {
  display:
    "block",

  marginTop:
    "4px",

  color:
    "var(--muted)",

  fontSize:
    "0.78rem",

  wordBreak:
    "break-word" as const,
};

const botonesStyle = {
  display:
    "flex",

  flexWrap:
    "wrap" as const,

  gap:
    "8px",
};

const verButtonStyle = {
  minHeight:
    "40px",

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  boxSizing:
    "border-box" as const,

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

  fontSize:
    "0.82rem",

  fontWeight:
    800,

  textDecoration:
    "none",
};

const descargarButtonStyle = {
  ...verButtonStyle,

  border:
    "1px solid rgba(35, 107, 67, 0.30)",

  background:
    "#236b43",

  color:
    "#ffffff",
};

const editarButtonStyle = {
  ...verButtonStyle,

  background:
    "var(--foreground)",

  color:
    "#ffffff",
};

const volverStyle = {
  color:
    "var(--foreground)",

  fontWeight:
    800,

  textDecoration:
    "none",
};

const errorStyle = {
  padding:
    "18px",

  borderRadius:
    "14px",

  background:
    "rgba(180, 40, 40, 0.08)",

  color:
    "#982828",

  fontWeight:
    800,

  lineHeight:
    1.6,
};

const warningStyle = {
  padding:
    "18px",

  borderRadius:
    "14px",

  background:
    "rgba(180, 120, 20, 0.10)",

  color:
    "#805d18",

  fontWeight:
    800,

  lineHeight:
    1.6,
};
