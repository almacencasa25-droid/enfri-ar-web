import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import TrabajoEditor from "./TrabajoEditor";

export const metadata = {
  title: "Trabajos y precios",
};

export default async function TrabajosPreciosPage() {
  const supabase = await createSupabaseServerClient();

  const { data: trabajos, error } = await supabase
    .from("trabajos_precios")
    .select(
      `
        id,
        nombre_corto,
        detalle,
        categoria,
        tipo,
        precio_unitario,
        activo
      `
    )
    .order("activo", {
      ascending: false,
    })
    .order("nombre_corto", {
      ascending: true,
    });

  const cardStyle = {
    border: "1px solid rgba(38, 40, 42, 0.12)",
    borderRadius: "18px",
    background: "rgba(255, 253, 248, 0.92)",
    boxShadow: "0 14px 35px rgba(38, 40, 42, 0.08)",
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
              fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
            }}
          >
            Trabajos y precios
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "var(--muted)",
              lineHeight: 1.6,
            }}
          >
            Cargá y administrá los trabajos que después vas a seleccionar
            automáticamente al crear un presupuesto.
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
              margin: "0 0 6px",
              color: "var(--foreground)",
              fontSize: "1.25rem",
            }}
          >
            Agregar nuevo trabajo
          </h2>

          <p
            style={{
              margin: "0 0 18px",
              color: "var(--muted)",
              lineHeight: 1.5,
            }}
          >
            El precio cargado acá será el valor sugerido. Después podrá
            modificarse dentro de un presupuesto sin cambiar este precio base.
          </p>

          <TrabajoEditor />
        </section>

        {error ? (
          <div
            style={{
              marginTop: "20px",
              padding: "18px",
              borderRadius: "14px",
              background: "rgba(180, 40, 40, 0.08)",
              color: "#8b1f1f",
              fontWeight: 700,
            }}
          >
            No se pudieron cargar los trabajos.
          </div>
        ) : null}

        <section
          style={{
            ...cardStyle,
            marginTop: "20px",
            padding: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "var(--foreground)",
                fontSize: "1.25rem",
              }}
            >
              Trabajos cargados
            </h2>

            <span
              style={{
                color: "var(--muted)",
                fontSize: "0.88rem",
                fontWeight: 700,
              }}
            >
              {trabajos?.length ?? 0} registrados
            </span>
          </div>

          {!trabajos || trabajos.length === 0 ? (
            <p
              style={{
                margin: 0,
                color: "var(--muted)",
              }}
            >
              Todavía no hay trabajos cargados.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {trabajos.map((trabajo) => (
                <article
                  key={trabajo.id}
                  style={{
                    padding: "16px",
                    border: "1px solid rgba(38, 40, 42, 0.1)",
                    borderRadius: "13px",
                    background: trabajo.activo
                      ? "rgba(255, 255, 255, 0.7)"
                      : "rgba(38, 40, 42, 0.035)",
                    opacity: trabajo.activo ? 1 : 0.72,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        minWidth: 0,
                        flex: "1 1 300px",
                      }}
                    >
                      <h3
                        style={{
                          margin: "0 0 6px",
                          color: "var(--foreground)",
                          fontSize: "1rem",
                        }}
                      >
                        {trabajo.nombre_corto}
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          color: "var(--muted)",
                          lineHeight: 1.5,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {trabajo.detalle}
                      </p>
                    </div>

                    <strong
                      style={{
                        color: "var(--foreground)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      $
                      {Number(trabajo.precio_unitario).toLocaleString(
                        "es-AR"
                      )}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "12px",
                      color: "var(--muted)",
                      fontSize: "0.82rem",
                    }}
                  >
                    <span>{trabajo.categoria || "Sin categoría"}</span>

                    <span>·</span>

                    <span>
                      {trabajo.tipo === "mano_obra"
                        ? "Mano de obra"
                        : trabajo.tipo === "material"
                          ? "Material"
                          : "Otro"}
                    </span>

                    <span>·</span>

                    <strong
                      style={{
                        color: trabajo.activo
                          ? "#236b43"
                          : "#8a4f1d",
                      }}
                    >
                      {trabajo.activo ? "Activo" : "Inactivo"}
                    </strong>
                  </div>

                  <TrabajoEditor trabajo={trabajo} />
                </article>
              ))}
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
