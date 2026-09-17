import Link from "next/link";



import { createSupabaseServerClient } from "@/lib/supabase/server";



import TecnicoEditor from "./TecnicoEditor";



export const metadata = {

  title: "Técnicos",

};



function matriculaVencida(

  vencimiento: string | null

) {

  if (!vencimiento) {

    return false;

  }



  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);



  const fecha = new Date(

    `${vencimiento}T00:00:00`

  );



  return fecha < hoy;

}



export default async function TecnicosPage() {

  const supabase =

    await createSupabaseServerClient();



  const { data: tecnicos, error } =

    await supabase

      .from("tecnicos")

      .select(`

        id,

        nombre,

        apellido,

        dni,

        telefono,

        email,

        direccion,

        localidad,

        numero_matricula,

        vencimiento_matricula,

        especialidad,

        observaciones,

        foto_storage_path,

        estado

      `)

      .order("apellido", {

        ascending: true,

      })

      .order("nombre", {

        ascending: true,

      });



  const tecnicosConFoto = await Promise.all(

    (tecnicos || []).map(

      async (tecnico) => {

        let fotoUrl: string | null = null;



        if (tecnico.foto_storage_path) {

          const { data } =

            await supabase.storage

              .from("tecnicos-enfri-ar")

              .createSignedUrl(

                tecnico.foto_storage_path,

                3600

              );



          fotoUrl =

            data?.signedUrl || null;

        }



        return {

          ...tecnico,

          fotoUrl,

        };

      }

    )

  );



  const cardStyle = {

    border:

      "1px solid rgba(38, 40, 42, 0.12)",

    borderRadius: "18px",

    background:

      "rgba(255, 253, 248, 0.92)",

    boxShadow:

      "0 14px 35px rgba(38, 40, 42, 0.08)",

  };



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

            ...cardStyle,

            padding: "24px",

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

            Presupuestos · Enfri.Ar

          </p>



          <h1

            style={{

              margin: 0,

              color: "var(--foreground)",

              fontSize:

                "clamp(1.8rem, 5vw, 2.5rem)",

            }}

          >

            Técnicos

          </h1>



          <p

            style={{

              margin: "10px 0 0",

              color: "var(--muted)",

              lineHeight: 1.6,

            }}

          >

            Administrá técnicos, matrícula,

            vencimiento, disponibilidad y foto.

          </p>

        </header>



        <section

          style={{

            ...cardStyle,

            marginTop: "20px",

            padding: "22px",

          }}

        >

          <h2

            style={{

              margin: "0 0 18px",

              color: "var(--foreground)",

              fontSize: "1.25rem",

            }}

          >

            Agregar técnico

          </h2>



          <TecnicoEditor />

        </section>



        {error ? (

          <div

            style={{

              marginTop: "20px",

              padding: "18px",

              borderRadius: "14px",

              background:

                "rgba(180, 40, 40, 0.08)",

              color: "#8b1f1f",

              fontWeight: 700,

            }}

          >

            No se pudieron cargar los técnicos.

          </div>

        ) : null}



        <section

          style={{

            ...cardStyle,

            marginTop: "20px",

            padding: "22px",

          }}

        >

          <h2

            style={{

              margin: "0 0 16px",

              color: "var(--foreground)",

              fontSize: "1.25rem",

            }}

          >

            Técnicos registrados

          </h2>



          {tecnicosConFoto.length === 0 ? (

            <p

              style={{

                margin: 0,

                color: "var(--muted)",

              }}

            >

              Todavía no hay técnicos cargados.

            </p>

          ) : (

            <div

              style={{

                display: "grid",

                gap: "12px",

              }}

            >

              {tecnicosConFoto.map(

                (tecnico) => {

                  const vencida =

                    matriculaVencida(

                      tecnico.vencimiento_matricula

                    );



                  return (

                    <article

                      key={tecnico.id}

                      style={{

                        padding: "16px",

                        border:

                          "1px solid rgba(38, 40, 42, 0.1)",

                        borderRadius: "13px",

                        background:

                          "rgba(255, 255, 255, 0.7)",

                      }}

                    >

                      <div

                        style={{

                          display: "flex",

                          flexWrap: "wrap",

                          gap: "16px",

                          alignItems: "flex-start",

                        }}

                      >

                        {tecnico.fotoUrl ? (

                          <img

                            src={tecnico.fotoUrl}

                            alt={`${tecnico.nombre} ${tecnico.apellido}`}

                            width={90}

                            height={90}

                            style={{

                              width: "90px",

                              height: "90px",

                              objectFit: "cover",

                              borderRadius: "12px",

                              border:

                                "1px solid rgba(38, 40, 42, 0.12)",

                            }}

                          />

                        ) : (

                          <div

                            style={{

                              width: "90px",

                              height: "90px",

                              display: "grid",

                              placeItems: "center",

                              borderRadius: "12px",

                              background:

                                "rgba(38, 40, 42, 0.06)",

                              color:

                                "var(--muted)",

                              fontSize:

                                "0.75rem",

                              fontWeight: 800,

                              textAlign:

                                "center",

                            }}

                          >

                            Sin foto

                          </div>

                        )}



                        <div

                          style={{

                            flex: "1 1 300px",

                            minWidth: 0,

                          }}

                        >

                          <h3

                            style={{

                              margin:

                                "0 0 8px",

                              color:

                                "var(--foreground)",

                              fontSize: "1rem",

                            }}

                          >

                            {tecnico.nombre}{" "}

                            {tecnico.apellido}

                          </h3>



                          <div

                            style={{

                              display: "grid",

                              gap: "4px",

                              color:

                                "var(--muted)",

                              fontSize:

                                "0.86rem",

                              lineHeight: 1.45,

                            }}

                          >

                            <span>

                              Matrícula:{" "}

                              <strong>

                                {

                                  tecnico.numero_matricula

                                }

                              </strong>

                            </span>



                            {tecnico.vencimiento_matricula ? (

                              <span

                                style={{

                                  color: vencida

                                    ? "#a32626"

                                    : undefined,

                                  fontWeight:

                                    vencida

                                      ? 800

                                      : undefined,

                                }}

                              >

                                Vencimiento:{" "}

                                {

                                  tecnico.vencimiento_matricula

                                }

                                {vencida

                                  ? " · MATRÍCULA VENCIDA"

                                  : ""}

                              </span>

                            ) : null}



                            <span>

                              Tel.:{" "}

                              {tecnico.telefono}

                            </span>



                            <span>

                              {tecnico.direccion}

                              {tecnico.localidad

                                ? ` · ${tecnico.localidad}`

                                : ""}

                            </span>



                            {tecnico.especialidad ? (

                              <span>

                                Especialidad:{" "}

                                {

                                  tecnico.especialidad

                                }

                              </span>

                            ) : null}



                            <span>

                              Estado:{" "}

                              <strong>

                                {tecnico.estado ===

                                "disponible"

                                  ? "Disponible"

                                  : tecnico.estado ===

                                      "no_disponible"

                                    ? "No disponible"

                                    : "Inactivo"}

                              </strong>

                            </span>

                          </div>

                        </div>

                      </div>



                      <TecnicoEditor

                        tecnico={tecnico}

                      />

                    </article>

                  );

                }

              )}

            </div>

          )}

        </section>



        <div

          style={{

            marginTop: "20px",

          }}

        >

          <Link

            href="/admin/presupuestos"

            style={{

              color: "var(--foreground)",

              fontWeight: 800,

              textDecoration: "none",

            }}

          >

            ← Volver a Presupuestos y trabajos

          </Link>

        </div>

      </div>

    </main>

  );

}
