import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import TrabajoEditor from "./TrabajoEditor";
import ListaTrabajosBuscable from "./ListaTrabajosBuscable";

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
            <ListaTrabajosBuscable trabajos={trabajos} />
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
