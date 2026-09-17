import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

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
            Trabajos y precios
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "var(--muted)",
              lineHeight: 1.6,
            }}
          >
            Base de trabajos precargados para utilizar
            posteriormente al crear presupuestos.
          </p>
        </header>

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
            No se pudieron cargar los trabajos.
          </div>
        ) : null}

        <section
          style={{
            marginTop: "20px",
            padding: "22px",
            border:
              "1px solid rgba(38, 40, 42, 0.12)",
            borderRadius: "18px",
            background:
              "rgba(255, 253, 248, 0.92)",
            boxShadow:
              "0 14px 35px rgba(38, 40, 42, 0.08)",
          }}
        >
          <h2
            style={{
              margin: "0 0 16px",
              color: "var(--foreground)",
              fontSize: "1.25rem",
            }}
          >
            Trabajos cargados
          </h2>

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
                    border:
                      "1px solid rgba(38, 40, 42, 0.1)",
                    borderRadius: "13px",
                    opacity: trabajo.activo
                      ? 1
                      : 0.6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent:
                        "space-between",
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
                          color:
                            "var(--foreground)",
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
                        }}
                      >
                        {trabajo.detalle}
                      </p>
                    </div>

                    <strong
                      style={{
                        color:
                          "var(--foreground)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      $
                      {Number(
                        trabajo.precio_unitario
                      ).toLocaleString("es-AR")}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "12px",
                      fontSize: "0.82rem",
                    }}
                  >
                    <span>
                      {trabajo.categoria ||
                        "Sin categoría"}
                    </span>

                    <span>·</span>

                    <span>
                      {trabajo.tipo ===
                      "mano_obra"
                        ? "Mano de obra"
                        : trabajo.tipo ===
                            "material"
                          ? "Material"
                          : "Otro"}
                    </span>

                    <span>·</span>

                    <strong>
                      {trabajo.activo
                        ? "Activo"
                        : "Inactivo"}
                    </strong>
                  </div>
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
