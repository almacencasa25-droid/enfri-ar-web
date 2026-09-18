import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import OrdenTrabajoForm from "./OrdenTrabajoForm";

export const metadata = {
  title: "Orden de Trabajo",
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

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

export default async function OrdenTrabajoPage({
  params,
}: Props) {
  const { id } =
    await params;

  const supabase =
    await createSupabaseServerClient();

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
      fecha_programada,
      hora_programada,
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

  const permitido =
    presupuesto.estado ===
      "aceptado" ||
    presupuesto.estado ===
      "realizado";

  const cliente =
    nombreCliente({
      nombre:
        presupuesto.cliente_nombre,

      apellido:
        presupuesto.cliente_apellido,

      razonSocial:
        presupuesto.cliente_razon_social,
    });

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
            width: "100%",
            maxWidth:
              "1100px",
            margin:
              "0 auto",
          }}
        >
          <header
            style={{
              padding:
                "24px",
              border:
                "1px solid rgba(38, 40, 42, 0.12)",
              borderRadius:
                "18px",
              background:
                "rgba(255, 253, 248, 0.92)",
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
              Orden de Trabajo ·
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
              Presupuesto Nº{" "}
              {
                presupuesto.numero
              }
            </h1>
          </header>

          <div
            style={{
              marginTop:
                "18px",
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
            }}
          >
            La Orden de
            Trabajo solamente
            puede generarse
            cuando el
            presupuesto está
            en estado
            Aceptado o
            Realizado.
          </div>

          <div
            style={{
              marginTop:
                "20px",
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
          </div>
        </div>
      </main>
    );
  }

  const {
    data: tecnicos,
    error: tecnicosError,
  } = await supabase
    .from("tecnicos")
    .select(`
      id,
      nombre,
      apellido,
      numero_matricula,
      estado
    `)
    .neq(
      "estado",
      "inactivo"
    )
    .order(
      "apellido",
      {
        ascending: true,
      }
    )
    .order(
      "nombre",
      {
        ascending: true,
      }
    );

  if (tecnicosError) {
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
            style={{
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
            }}
          >
            No se pudieron
            cargar los técnicos.
          </div>
        </div>
      </main>
    );
  }

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
        <header
          style={{
            padding: "24px",
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
            Orden de Trabajo ·
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
            Generar Orden de
            Trabajo
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
            Presupuesto Nº{" "}
            {
              presupuesto.numero
            }{" "}
            · {cliente}
          </p>
        </header>

        <OrdenTrabajoForm
          presupuestoId={
            presupuesto.id
          }
          numeroPresupuesto={
            presupuesto.numero
          }
          cliente={
            cliente
          }
          tecnicos={
            tecnicos || []
          }
          fechaProgramadaInicial={
            presupuesto.fecha_programada
          }
          horaProgramadaInicial={
            presupuesto.hora_programada
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
        </div>
      </div>
    </main>
  );
}
