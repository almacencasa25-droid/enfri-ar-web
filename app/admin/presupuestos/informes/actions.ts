"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PresupuestoInformeEncontrado = {
  id: string;
  numero: number;
  fecha: string;
  cliente_nombre: string | null;
  cliente_apellido: string | null;
  cliente_razon_social: string | null;
  cliente_dni: string | null;
  cliente_cuit: string | null;
  cliente_telefono: string | null;
  cliente_email: string | null;
  cliente_direccion: string;
  cliente_localidad: string | null;
  detalle_corto: string | null;
  items: Array<{
    nombre_corto: string;
    detalle: string;
    cantidad: number;
    precio_unitario: number;
    equipo_orden: number | null;
    equipo_tipo: string | null;
    equipo_marca: string | null;
    equipo_modelo: string | null;
    equipo_capacidad: string | null;
    equipo_ubicacion: string | null;
    equipo_refrigerante: string | null;
    equipo_serie: string | null;
  }>;
};

export type CrearInformeDetalleInput = {
  tipoDocumento:
    | "detalle_trabajo"
    | "informe_mensual"
    | "informe_cuatrimestral";
  presupuestoId?: string | null;
  numeroPresupuesto?: number | null;
  ordenCompra?: string | null;
  numeroFactura?: string | null;
  estadoCobro:
    | "pendiente"
    | "abonada"
    | "no_corresponde";
  fechaEmision: string;
  mesInformado?: number | null;
  anioInformado?: number | null;
  cuatrimestre?: number | null;
  clienteRazonSocial?: string | null;
  clienteDireccion?: string | null;
  clienteLocalidad?: string | null;
  destino?: string | null;
  inventario?: string | null;
  detalle: string;
  observaciones?: string | null;
};

function texto(
  valor: string | null | undefined,
  max = 500
) {
  const limpio = (valor || "").trim();

  return limpio
    ? limpio.slice(0, max)
    : null;
}

export async function buscarPresupuestoParaInformeAction(
  valor: string
) {
  await requireAdminUser();

  const numero = Number(
    valor.trim()
  );

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return {
      ok: false as const,
      error:
        "Ingresá un número de presupuesto válido.",
    };
  }

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
      cliente_nombre,
      cliente_apellido,
      cliente_razon_social,
      cliente_dni,
      cliente_cuit,
      cliente_telefono,
      cliente_email,
      cliente_direccion,
      cliente_localidad,
      detalle_corto
    `)
    .eq("numero", numero)
    .is("eliminado_at", null)
    .maybeSingle();

  if (presupuestoError) {
    console.error(
      "Error al buscar presupuesto para informe:",
      presupuestoError
    );

    return {
      ok: false as const,
      error:
        "No se pudo buscar el presupuesto.",
    };
  }

  if (!presupuesto) {
    return {
      ok: false as const,
      error:
        `No existe el presupuesto N.º ${numero}.`,
    };
  }

  const {
    data: items,
    error: itemsError,
  } = await supabase
    .from("presupuesto_items")
    .select(`
      nombre_corto,
      detalle,
      cantidad,
      precio_unitario,
      equipo_orden,
      equipo_tipo,
      equipo_marca,
      equipo_modelo,
      equipo_capacidad,
      equipo_ubicacion,
      equipo_refrigerante,
      equipo_serie
    `)
    .eq(
      "presupuesto_id",
      presupuesto.id
    )
    .order(
      "equipo_orden",
      {
        ascending: true,
        nullsFirst: false,
      }
    )
    .order(
      "created_at",
      {
        ascending: true,
      }
    );

  if (itemsError) {
    console.error(
      "Error al buscar items del presupuesto:",
      itemsError
    );

    return {
      ok: false as const,
      error:
        "Se encontró el presupuesto, pero no se pudieron cargar sus trabajos.",
    };
  }

  const resultado: PresupuestoInformeEncontrado = {
    id:
      presupuesto.id,
    numero:
      Number(
        presupuesto.numero
      ),
    fecha:
      presupuesto.fecha,
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
    items:
      (items || []).map(
        (item) => ({
          ...item,
          cantidad:
            Number(
              item.cantidad || 0
            ),
          precio_unitario:
            Number(
              item.precio_unitario ||
                0
            ),
        })
      ),
  };

  return {
    ok: true as const,
    data: resultado,
  };
}

export async function crearInformeDetalleAction(
  input: CrearInformeDetalleInput
) {
  const user =
    await requireAdminUser();

  const tipoDocumento =
    input.tipoDocumento;

  if (
    ![
      "detalle_trabajo",
      "informe_mensual",
      "informe_cuatrimestral",
    ].includes(tipoDocumento)
  ) {
    return {
      ok: false as const,
      error:
        "El tipo de documento no es válido.",
    };
  }

  const detalle =
    texto(
      input.detalle,
      12000
    );

  if (!detalle) {
    return {
      ok: false as const,
      error:
        "Ingresá el detalle del trabajo o informe.",
    };
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      input.fechaEmision
    )
  ) {
    return {
      ok: false as const,
      error:
        "La fecha de emisión no es válida.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  let presupuesto:
    | {
        id: string;
        numero: number;
        cliente_nombre: string | null;
        cliente_apellido: string | null;
        cliente_razon_social: string | null;
        cliente_dni: string | null;
        cliente_cuit: string | null;
        cliente_telefono: string | null;
        cliente_email: string | null;
        cliente_direccion: string;
        cliente_localidad: string | null;
      }
    | null = null;

  if (input.presupuestoId) {
    const {
      data,
      error,
    } = await supabase
      .from("presupuestos")
      .select(`
        id,
        numero,
        cliente_nombre,
        cliente_apellido,
        cliente_razon_social,
        cliente_dni,
        cliente_cuit,
        cliente_telefono,
        cliente_email,
        cliente_direccion,
        cliente_localidad
      `)
      .eq(
        "id",
        input.presupuestoId
      )
      .is(
        "eliminado_at",
        null
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Error al validar presupuesto del informe:",
        error
      );

      return {
        ok: false as const,
        error:
          "No se pudo validar el presupuesto relacionado.",
      };
    }

    if (!data) {
      return {
        ok: false as const,
        error:
          "El presupuesto relacionado ya no existe.",
      };
    }

    presupuesto = {
      ...data,
      numero:
        Number(
          data.numero
        ),
    };
  }

  const mesInformado =
    input.mesInformado &&
    input.mesInformado >= 1 &&
    input.mesInformado <= 12
      ? input.mesInformado
      : null;

  const anioInformado =
    input.anioInformado &&
    input.anioInformado >= 2000 &&
    input.anioInformado <= 2200
      ? input.anioInformado
      : null;

  const cuatrimestre =
    input.cuatrimestre &&
    input.cuatrimestre >= 1 &&
    input.cuatrimestre <= 3
      ? input.cuatrimestre
      : null;

  if (
    tipoDocumento ===
      "informe_mensual" &&
    (!mesInformado ||
      !anioInformado)
  ) {
    return {
      ok: false as const,
      error:
        "Indicá el mes y año que informa la nota mensual.",
    };
  }

  if (
    tipoDocumento ===
      "informe_cuatrimestral" &&
    (!cuatrimestre ||
      !anioInformado)
  ) {
    return {
      ok: false as const,
      error:
        "Indicá el cuatrimestre y año del informe.",
    };
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "informes_detalles_trabajo"
    )
    .insert({
      tipo_documento:
        tipoDocumento,

      presupuesto_id:
        presupuesto?.id ||
        null,

      numero_presupuesto_snapshot:
        presupuesto?.numero ||
        input.numeroPresupuesto ||
        null,

      orden_compra:
        texto(
          input.ordenCompra,
          120
        ),

      numero_factura:
        texto(
          input.numeroFactura,
          120
        ),

      estado_cobro:
        input.estadoCobro,

      fecha_emision:
        input.fechaEmision,

      mes_informado:
        tipoDocumento ===
        "informe_mensual"
          ? mesInformado
          : null,

      anio_informado:
        tipoDocumento ===
        "detalle_trabajo"
          ? null
          : anioInformado,

      cuatrimestre:
        tipoDocumento ===
        "informe_cuatrimestral"
          ? cuatrimestre
          : null,

      cliente_nombre:
        presupuesto?.cliente_nombre ||
        null,

      cliente_apellido:
        presupuesto?.cliente_apellido ||
        null,

      cliente_razon_social:
        presupuesto?.cliente_razon_social ||
        texto(
          input.clienteRazonSocial,
          220
        ),

      cliente_dni:
        presupuesto?.cliente_dni ||
        null,

      cliente_cuit:
        presupuesto?.cliente_cuit ||
        null,

      cliente_telefono:
        presupuesto?.cliente_telefono ||
        null,

      cliente_email:
        presupuesto?.cliente_email ||
        null,

      cliente_direccion:
        presupuesto?.cliente_direccion ||
        texto(
          input.clienteDireccion,
          300
        ),

      cliente_localidad:
        presupuesto?.cliente_localidad ||
        texto(
          input.clienteLocalidad,
          150
        ),

      destino:
        texto(
          input.destino,
          500
        ),

      inventario:
        texto(
          input.inventario,
          120
        ),

      detalle,

      observaciones:
        texto(
          input.observaciones,
          4000
        ),

      created_by:
        user.id,
    })
    .select(
      "id"
    )
    .single();

  if (error) {
    console.error(
      "Error al guardar informe/detalle:",
      error
    );

    return {
      ok: false as const,
      error:
        "No se pudo guardar el informe o detalle.",
    };
  }

  revalidatePath(
    "/admin/presupuestos/informes"
  );

  return {
    ok: true as const,
    data: {
      id:
        data.id,
    },
  };
}
