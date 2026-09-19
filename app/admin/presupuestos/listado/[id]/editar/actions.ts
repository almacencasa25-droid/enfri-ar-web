"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  emitirPresupuestoPdfAction,
} from "../../pdf/actions";

type ActionResult = {
  ok: boolean;
  error?: string;
};

type ItemPresupuesto = {
  trabajo_id?: string | null;
  nombre_corto: string;
  detalle: string;
  tipo?: string | null;
  cantidad: number;
  precio_unitario: number;
};

export type ModificarPresupuestoInput = {
  presupuestoId: string;

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

export async function modificarPresupuestoAction(
  input: ModificarPresupuestoInput
): Promise<ActionResult> {
  await requireAdminUser();

  if (!input.presupuestoId) {
    return {
      ok: false,
      error: "Presupuesto inexistente.",
    };
  }

  if (!input.fecha) {
    return {
      ok: false,
      error: "Ingresá la fecha del presupuesto.",
    };
  }

  if (!input.clienteDireccion?.trim()) {
    return {
      ok: false,
      error:
        "La dirección del cliente es obligatoria.",
    };
  }

  const tieneCliente =
    Boolean(input.clienteNombre?.trim()) ||
    Boolean(input.clienteApellido?.trim()) ||
    Boolean(
      input.clienteRazonSocial?.trim()
    );

  if (!tieneCliente) {
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
        "El presupuesto debe contener al menos un trabajo.",
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
          "La cantidad debe ser mayor a cero.",
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

  const items = input.items.map(
    (item) => ({
      trabajo_id:
        limpiarTexto(item.trabajo_id),

      nombre_corto:
        item.nombre_corto.trim(),

      detalle:
        item.detalle.trim(),

      tipo:
        limpiarTexto(item.tipo) ||
        "mano_obra",

      cantidad:
        Number(item.cantidad),

      precio_unitario:
        Number(item.precio_unitario),
    })
  );

  const supabase =
    await createSupabaseServerClient();

  const { error } = await supabase.rpc(
    "modificar_presupuesto_enfriar",
    {
      p_presupuesto_id:
        input.presupuestoId,

      p_fecha:
        input.fecha,

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
        limpiarTexto(
          input.formaPago
        ),

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

      p_items:
        items,
    }
  );

  if (error) {
    return {
      ok: false,
      error:
        error.message ||
        "No se pudo modificar el presupuesto.",
    };
  }

  /*
   * Después de guardar correctamente la edición,
   * emitimos automáticamente una nueva versión
   * histórica del PDF del presupuesto.
   *
   * La acción de emisión reutiliza una versión
   * pendiente si existiera, para no duplicarla
   * en caso de un fallo anterior.
   */
  const resultadoPdf =
    await emitirPresupuestoPdfAction(
      input.presupuestoId
    );

  if (!resultadoPdf.ok) {
    return {
      ok: false,
      error:
        `El presupuesto fue modificado, pero no se pudo generar su nueva versión PDF. ${
          resultadoPdf.error ||
          "Probá guardar nuevamente."
        }`,
    };
  }

  revalidatePath(
    "/admin/presupuestos/listado"
  );

  revalidatePath(
    `/admin/presupuestos/listado/${input.presupuestoId}/editar`
  );

  revalidatePath(
    "/admin/presupuestos/documentos"
  );

  return {
    ok: true,
  };
}
