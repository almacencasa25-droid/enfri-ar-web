"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> = {
  ok: boolean;
  data?: T;
  error?: string;
};

type ClienteBusqueda = {
  id: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
  dni: string | null;
  cuit: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  localidad: string | null;
  relevancia: number;
};

type TrabajoBusqueda = {
  id: string;
  nombre_corto: string;
  detalle: string;
  categoria: string | null;
  tipo: string | null;
  precio_unitario: number;
  relevancia: number;
};

type ItemPresupuesto = {
  trabajo_id?: string | null;
  nombre_corto: string;
  detalle: string;
  tipo?: string | null;
  cantidad: number;
  precio_unitario: number;
};

type CrearPresupuestoInput = {
  numeroManual?: number | null;
  fecha: string;

  clienteId?: string | null;
  clienteNombre?: string | null;
  clienteApellido?: string | null;
  clienteRazonSocial?: string | null;
  clienteDni?: string | null;
  clienteCuit?: string | null;
  clienteTelefono?: string | null;
  clienteEmail?: string | null;
  clienteDireccion: string;
  clienteLocalidad?: string | null;

  detalleCorto?: string | null;

  descuentoTipo?: string | null;
  descuentoValor?: number;

  recargoTipo?: string | null;
  recargoValor?: number;

  formaPago?: string | null;
  condicionesPago?: string | null;

  vigenciaDias?: number | null;

  observacionesCliente?: string | null;
  observacionesInternas?: string | null;

  fechaProgramada?: string | null;
  horaProgramada?: string | null;

  items: ItemPresupuesto[];
};

function limpiarTexto(
  valor: string | null | undefined
) {
  const texto = valor?.trim();

  return texto ? texto : null;
}

export async function buscarClientesPresupuestoAction(
  busqueda: string
): Promise<ActionResult<ClienteBusqueda[]>> {
  await requireAdminUser();

  const texto = busqueda.trim();

  if (!texto) {
    return {
      ok: true,
      data: [],
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const { data, error } = await supabase.rpc(
    "buscar_clientes_enfriar",
    {
      p_busqueda: texto,
      p_limite: 15,
    }
  );

  if (error) {
    return {
      ok: false,
      error:
        "No se pudo buscar clientes.",
    };
  }

  return {
    ok: true,
    data: (data || []) as ClienteBusqueda[],
  };
}

export async function buscarTrabajosPresupuestoAction(
  busqueda: string
): Promise<ActionResult<TrabajoBusqueda[]>> {
  await requireAdminUser();

  const texto = busqueda.trim();

  if (!texto) {
    return {
      ok: true,
      data: [],
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const { data, error } = await supabase.rpc(
    "buscar_trabajos_enfriar",
    {
      p_busqueda: texto,
      p_limite: 15,
    }
  );

  if (error) {
    return {
      ok: false,
      error:
        "No se pudo buscar trabajos.",
    };
  }

  return {
    ok: true,
    data: (data || []) as TrabajoBusqueda[],
  };
}

export async function crearPresupuestoAction(
  input: CrearPresupuestoInput
): Promise<ActionResult<{ id: string }>> {
  await requireAdminUser();

  if (!input.fecha) {
    return {
      ok: false,
      error:
        "Ingresá la fecha del presupuesto.",
    };
  }

  if (!input.clienteDireccion?.trim()) {
    return {
      ok: false,
      error:
        "La dirección del cliente es obligatoria.",
    };
  }

  const tieneIdentidadCliente =
    Boolean(input.clienteNombre?.trim()) ||
    Boolean(input.clienteApellido?.trim()) ||
    Boolean(
      input.clienteRazonSocial?.trim()
    );

  if (!tieneIdentidadCliente) {
    return {
      ok: false,
      error:
        "Ingresá nombre, apellido o razón social del cliente.",
    };
  }

  if (
    !Array.isArray(input.items) ||
    input.items.length === 0
  ) {
    return {
      ok: false,
      error:
        "Agregá al menos un trabajo al presupuesto.",
    };
  }

  for (const item of input.items) {
    if (!item.nombre_corto?.trim()) {
      return {
        ok: false,
        error:
          "Todos los trabajos deben tener nombre.",
      };
    }

    if (!item.detalle?.trim()) {
      return {
        ok: false,
        error:
          "Todos los trabajos deben tener detalle.",
      };
    }

    if (
      !Number.isFinite(item.cantidad) ||
      item.cantidad <= 0
    ) {
      return {
        ok: false,
        error:
          "La cantidad de cada trabajo debe ser mayor a cero.",
      };
    }

    if (
      !Number.isFinite(
        item.precio_unitario
      ) ||
      item.precio_unitario < 0
    ) {
      return {
        ok: false,
        error:
          "El precio unitario no puede ser negativo.",
      };
    }
  }

  const descuentoValor =
    Number(input.descuentoValor || 0);

  const recargoValor =
    Number(input.recargoValor || 0);

  if (
    descuentoValor < 0 ||
    recargoValor < 0
  ) {
    return {
      ok: false,
      error:
        "Descuentos y recargos no pueden ser negativos.",
    };
  }

  if (
    input.descuentoTipo ===
      "porcentaje" &&
    descuentoValor > 100
  ) {
    return {
      ok: false,
      error:
        "El descuento porcentual no puede superar el 100%.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  const items = input.items.map(
    (item) => ({
      trabajo_id:
        limpiarTexto(item.trabajo_id),
      nombre_corto:
        item.nombre_corto.trim(),
      detalle: item.detalle.trim(),
      tipo:
        limpiarTexto(item.tipo) ||
        "mano_obra",
      cantidad: item.cantidad,
      precio_unitario:
        item.precio_unitario,
    })
  );

  const { data, error } = await supabase.rpc(
    "crear_presupuesto_enfriar",
    {
      p_numero_manual:
        input.numeroManual || null,

      p_fecha: input.fecha,

      p_cliente_id:
        limpiarTexto(input.clienteId),

      p_cliente_nombre:
        limpiarTexto(
          input.clienteNombre
        ),

      p_cliente_apellido:
        limpiarTexto(
          input.clienteApellido
        ),

      p_cliente_razon_social:
        limpiarTexto(
          input.clienteRazonSocial
        ),

      p_cliente_dni:
        limpiarTexto(input.clienteDni),

      p_cliente_cuit:
        limpiarTexto(input.clienteCuit),

      p_cliente_telefono:
        limpiarTexto(
          input.clienteTelefono
        ),

      p_cliente_email:
        limpiarTexto(
          input.clienteEmail
        ),

      p_cliente_direccion:
        input.clienteDireccion.trim(),

      p_cliente_localidad:
        limpiarTexto(
          input.clienteLocalidad
        ),

      p_detalle_corto:
        limpiarTexto(
          input.detalleCorto
        ),

      p_descuento_tipo:
        limpiarTexto(
          input.descuentoTipo
        ),

      p_descuento_valor:
        descuentoValor,

      p_recargo_tipo:
        limpiarTexto(
          input.recargoTipo
        ),

      p_recargo_valor:
        recargoValor,

      p_forma_pago:
        limpiarTexto(input.formaPago),

      p_condiciones_pago:
        limpiarTexto(
          input.condicionesPago
        ),

      p_vigencia_dias:
        input.vigenciaDias ?? null,

      p_observaciones_cliente:
        limpiarTexto(
          input.observacionesCliente
        ),

      p_observaciones_internas:
        limpiarTexto(
          input.observacionesInternas
        ),

      p_fecha_programada:
        limpiarTexto(
          input.fechaProgramada
        ),

      p_hora_programada:
        limpiarTexto(
          input.horaProgramada
        ),

      p_empresa_snapshot: {},

      p_items: items,
    }
  );

  if (error) {
    return {
      ok: false,
      error:
        error.message ||
        "No se pudo crear el presupuesto.",
    };
  }

  const presupuestoId =
    typeof data === "string"
      ? data
      : null;

  if (!presupuestoId) {
    return {
      ok: false,
      error:
        "El presupuesto fue procesado pero no se recibió su identificación.",
    };
  }

  revalidatePath(
    "/admin/presupuestos"
  );

  revalidatePath(
    "/admin/presupuestos/listado"
  );

  return {
    ok: true,
    data: {
      id: presupuestoId,
    },
  };
}
