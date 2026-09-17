import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import EditarPresupuestoForm from "./EditarPresupuestoForm";

export const metadata = {
  title: "Modificar presupuesto",
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarPresupuestoPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase =
    await createSupabaseServerClient();

  const {
    data: presupuesto,
    error: presupuestoError,
  } = await supabase
    .from("presupuestos")
    .select(`
      id,
      numero,
      fecha,
      cliente_id,
      cliente_nombre,
      cliente_apellido,
      cliente_razon_social,
      cliente_dni,
      cliente_cuit,
      cliente_telefono,
      cliente_email,
      cliente_direccion,
      cliente_localidad,
      detalle_corto,
      descuento_tipo,
      descuento_valor,
      recargo_tipo,
      recargo_valor,
      forma_pago,
      condiciones_pago,
      vigencia_dias,
      observaciones_cliente,
      observaciones_internas,
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

  const {
    data: items,
    error: itemsError,
  } = await supabase
    .from("presupuesto_items")
    .select(`
      id,
      trabajo_id,
      nombre_corto,
      detalle,
      tipo,
      cantidad,
      precio_unitario
    `)
    .eq("presupuesto_id", id)
    .order("orden", {
      ascending: true,
    });

  if (itemsError) {
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
          <div
            style={{
              padding: "18px",
              borderRadius: "14px",
              background:
                "rgba(180, 40, 40, 0.08)",
              color: "#982828",
              fontWeight: 800,
            }}
          >
            No se pudieron cargar los trabajos del presupuesto.
          </div>

          <div
            style={{
              marginTop: "20px",
            }}
          >
            <Link
              href="/admin/presupuestos/listado"
              style={{
                color: "var(--foreground)",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              ← Volver a Presupuestos realizados
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const presupuestoCompleto = {
    id: presupuesto.id,
    numero: Number(presupuesto.numero),
    fecha: presupuesto.fecha,

    cliente_id:
      presupuesto.cliente_id,

    cliente_nombre:
      presupuesto.cliente_nombre,

    cliente_apellido:
      presupuesto.cliente_apellido,

    cliente_razon_social:
      presupuesto.cliente_razon_social,

    cliente_dni:
      presupuesto.cliente_dni,

    cliente_cuit:
      presupuesto.cliente_cuit,

    cliente_telefono:
      presupuesto.cliente_telefono,

    cliente_email:
      presupuesto.cliente_email,

    cliente_direccion:
      presupuesto.cliente_direccion,

    cliente_localidad:
      presupuesto.cliente_localidad,

    detalle_corto:
      presupuesto.detalle_corto,

    descuento_tipo:
      presupuesto.descuento_tipo,

    descuento_valor: Number(
      presupuesto.descuento_valor || 0
    ),

    recargo_tipo:
      presupuesto.recargo_tipo,

    recargo_valor: Number(
      presupuesto.recargo_valor || 0
    ),

    forma_pago:
      presupuesto.forma_pago,

    condiciones_pago:
      presupuesto.condiciones_pago,

    vigencia_dias:
      presupuesto.vigencia_dias,

    observaciones_cliente:
      presupuesto.observaciones_cliente,

    observaciones_internas:
      presupuesto.observaciones_internas,

    fecha_programada:
      presupuesto.fecha_programada,

    hora_programada:
      presupuesto.hora_programada,

    items: (items || []).map(
      (item) => ({
        id: item.id,
        trabajo_id:
          item.trabajo_id,

        nombre_corto:
          item.nombre_corto,

        detalle:
          item.detalle,

        tipo:
          item.tipo,

        cantidad: Number(
          item.cantidad || 0
        ),

        precio_unitario: Number(
          item.precio_unitario || 0
        ),
      })
    ),
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
            padding: "24px",
            marginBottom: "20px",
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
            Modificar presupuesto Nº{" "}
            {presupuesto.numero}
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "var(--muted)",
              lineHeight: 1.6,
            }}
          >
            Modificá cliente, trabajos, precios,
            condiciones y observaciones sin cambiar
            el número original del presupuesto.
          </p>
        </header>

        <EditarPresupuestoForm
          presupuesto={presupuestoCompleto}
        />

        <div
          style={{
            marginTop: "22px",
          }}
        >
          <Link
            href="/admin/presupuestos/listado"
            style={{
              color: "var(--foreground)",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            ← Volver a Presupuestos realizados
          </Link>
        </div>
      </div>
    </main>
  );
}
