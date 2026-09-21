import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import FichaRevisionForm from "./FichaRevisionForm";

export const metadata = {
  title: "Ficha de revisión técnica",
};

export default async function FichaRevisionPage() {
  const supabase =
    await createSupabaseServerClient();

  const {
    data,
    error,
  } = await supabase
    .from("presupuesto_config")
    .select(
      "proximo_numero_ficha_revision"
    )
    .eq("id", 1)
    .single();

  if (
    error ||
    !data
  ) {
    throw new Error(
      "No fue posible obtener la numeración de las fichas de revisión."
    );
  }

  const proximoNumero =
    Number(
      data.proximo_numero_ficha_revision
    );

  if (
    !Number.isFinite(
      proximoNumero
    )
  ) {
    throw new Error(
      "La numeración de las fichas de revisión no es válida."
    );
  }

  return (
    <main
      style={{
        minHeight:
          "100vh",
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
            marginBottom:
              "20px",
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
            Enfri.Ar Refrigeración
          </p>

          <h1
            style={{
              margin: 0,
              color:
                "var(--foreground)",
              fontSize:
                "clamp(1.8rem, 5vw, 2.6rem)",
              lineHeight:
                1.1,
            }}
          >
            Ficha de revisión técnica
          </h1>

          <p
            style={{
              margin:
                "10px 0 0",
              color:
                "var(--muted)",
              lineHeight:
                1.6,
              maxWidth:
                "760px",
            }}
          >
            Generá fichas numeradas para llevar a una revisión técnica antes de realizar el presupuesto.
            Cada ficha se imprime en blanco y se completa manualmente durante la visita.
          </p>
        </header>

        <FichaRevisionForm
          proximoNumero={
            proximoNumero
          }
        />

        <div
          style={{
            marginTop:
              "20px",
          }}
        >
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
            ← Volver a Presupuestos y trabajos
          </Link>
        </div>
      </div>
    </main>
  );
}
