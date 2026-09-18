"use server";

import { Buffer } from "node:buffer";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  generarOrdenTrabajoPdf,
  type OrdenTrabajoPdfDatos,
  type OrdenTrabajoVariante,
} from "../../../../lib/generarOrdenTrabajoPdf";

const BUCKET = "trabajos-enfri-ar";

type ArchivoExistente = {
  id: string;
  documento_variante: string | null;
  storage_path: string;
  nombre_original: string | null;
};

type GenerarOrdenTrabajoPdfsOpciones = {
  regenerar?: boolean;
};

function mensajeError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    return String(
      (
        error as {
          message?: unknown;
        }
      ).message
    );
  }

  return "Ocurrió un error inesperado.";
}

function limpiarNombre(valor: string) {
  return valor
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-");
}

function esArchivoExistente(error: unknown) {
  if (
    !error ||
    typeof error !== "object"
  ) {
    return false;
  }

  const dato = error as {
    message?: unknown;
    statusCode?: unknown;
    status?: unknown;
  };

  const estado = Number(
    dato.statusCode ??
      dato.status ??
      0
  );

  const mensaje = String(
    dato.message ?? ""
  ).toLowerCase();

  return (
    estado === 409 ||
    mensaje.includes("already exists") ||
    mensaje.includes("duplicate") ||
    mensaje.includes(
      "resource already exists"
    )
  );
}

async function crearEnlace(
  storagePath: string,
  nombreArchivo: string
) {
  const supabase =
    await createSupabaseServerClient();

  const { data, error } =
    await supabase.storage
      .from(BUCKET)
      .createSignedUrl(
        storagePath,
        300
      );

  if (
    error ||
    !data?.signedUrl
  ) {
    return {
      ok: false as const,
      error:
        error?.message ||
        `No se pudo generar el enlace para ${nombreArchivo}.`,
    };
  }

  return {
    ok: true as const,
    url: data.signedUrl,
  };
}

export async function generarOrdenTrabajoPdfsAction(
  planillaId: string,
  opciones?: GenerarOrdenTrabajoPdfsOpciones
) {
  try {
    await requireAdminUser();

    const id = String(
      planillaId ?? ""
    ).trim();

    const regenerar =
      Boolean(
        opciones?.regenerar
      );

    if (!id) {
      return {
        ok: false as const,
        error:
          "La Orden de Trabajo no es válida.",
      };
    }

    const supabase =
      await createSupabaseServerClient();

    /*
     * =========================================
     * CARGAR ORDEN DE TRABAJO
     * =========================================
     */

    const {
      data: planilla,
      error: planillaError,
    } = await supabase
      .from("planillas_trabajo")
      .select(`
        id,
        presupuesto_id,
        numero_orden,
        fecha,
        cliente_nombre,
        cliente_apellido,
        cliente_razon_social,
        cliente_dni,
        cliente_cuit,
        cliente_telefono,
        cliente_direccion,
        cliente_localidad,
        tecnico_nombre,
        tecnico_apellido,
        tecnico_dni,
        tecnico_telefono,
        tecnico_matricula,
        tecnico_direccion,
        tecnico_localidad,
        trabajo_detalle,
        fecha_programada,
        hora_programada,
        observaciones,
        empresa_snapshot
      `)
      .eq("id", id)
      .single();

    if (
      planillaError ||
      !planilla
    ) {
      return {
        ok: false as const,
        error:
          planillaError?.message ||
          "No se encontró la Orden de Trabajo.",
      };
    }

    const planillaSegura =
      planilla;

    /*
     * =========================================
     * NÚMERO DEL PRESUPUESTO RELACIONADO
     * =========================================
     */

    const {
      data: presupuesto,
      error: presupuestoError,
    } = await supabase
      .from("presupuestos")
      .select(`
        id,
        numero
      `)
      .eq(
        "id",
        planillaSegura.presupuesto_id
      )
      .single();

    if (
      presupuestoError ||
      !presupuesto
    ) {
      return {
        ok: false as const,
        error:
          presupuestoError?.message ||
          "No se pudo recuperar el presupuesto relacionado.",
      };
    }

    const datosPdf: OrdenTrabajoPdfDatos = {
      numero_orden:
        planillaSegura.numero_orden,

      presupuesto_id:
        planillaSegura.presupuesto_id,

      numero_presupuesto:
        presupuesto.numero,

      fecha:
        planillaSegura.fecha,

      cliente_nombre:
        planillaSegura.cliente_nombre,

      cliente_apellido:
        planillaSegura.cliente_apellido,

      cliente_razon_social:
        planillaSegura.cliente_razon_social,

      cliente_dni:
        planillaSegura.cliente_dni,

      cliente_cuit:
        planillaSegura.cliente_cuit,

      cliente_telefono:
        planillaSegura.cliente_telefono,

      cliente_direccion:
        planillaSegura.cliente_direccion,

      cliente_localidad:
        planillaSegura.cliente_localidad,

      tecnico_nombre:
        planillaSegura.tecnico_nombre,

      tecnico_apellido:
        planillaSegura.tecnico_apellido,

      tecnico_dni:
        planillaSegura.tecnico_dni,

      tecnico_telefono:
        planillaSegura.tecnico_telefono,

      tecnico_matricula:
        planillaSegura.tecnico_matricula,

      tecnico_direccion:
        planillaSegura.tecnico_direccion,

      tecnico_localidad:
        planillaSegura.tecnico_localidad,

      trabajo_detalle:
        planillaSegura.trabajo_detalle,

      fecha_programada:
        planillaSegura.fecha_programada,

      hora_programada:
        planillaSegura.hora_programada,

      observaciones:
        planillaSegura.observaciones,

      empresa_snapshot:
        planillaSegura.empresa_snapshot,
    };

    /*
     * =========================================
     * REVISAR ORIGINAL / COPIA EXISTENTES
     * =========================================
     */

    const {
      data: archivosActuales,
      error: archivosError,
    } = await supabase
      .from("archivos_trabajo")
      .select(`
        id,
        documento_variante,
        storage_path,
        nombre_original
      `)
      .eq(
        "planilla_trabajo_id",
        id
      )
      .eq(
        "documento_clase",
        "orden_trabajo"
      );

    if (archivosError) {
      return {
        ok: false as const,
        error:
          archivosError.message,
      };
    }

    const existentes =
      (archivosActuales ||
        []) as ArchivoExistente[];

    const numeroSeguro =
      limpiarNombre(
        planillaSegura.numero_orden
      );

    async function asegurarPdf(
      variante: OrdenTrabajoVariante
    ) {
      const existente =
        existentes.find(
          (archivo) =>
            archivo.documento_variante ===
            variante
        );

      /*
       * Si existe y NO pedimos regeneración,
       * conservamos el PDF histórico actual.
       */
      if (
        existente &&
        !regenerar
      ) {
        const nombreArchivo =
          existente.nombre_original ||
          `${numeroSeguro}-${variante}.pdf`;

        const enlace =
          await crearEnlace(
            existente.storage_path,
            nombreArchivo
          );

        if (!enlace.ok) {
          return enlace;
        }

        return {
          ok: true as const,
          archivoId:
            existente.id,
          storagePath:
            existente.storage_path,
          nombreArchivo,
          url:
            enlace.url,
        };
      }

      /*
       * =====================================
       * GENERAR PDF NUEVO
       * =====================================
       */

      const bytes =
        await generarOrdenTrabajoPdf(
          datosPdf,
          variante
        );

      const nombreArchivo =
        existente?.nombre_original ||
        `${numeroSeguro}-${variante}.pdf`;

      const storagePath =
        existente?.storage_path ||
        `ordenes-trabajo/${id}/${nombreArchivo}`;

      /*
       * =====================================
       * SUBIR AL STORAGE PRIVADO
       * =====================================
       *
       * Si estamos regenerando un documento
       * existente usamos upsert para reemplazar
       * solamente el archivo de ESA MISMA OT.
       */

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(BUCKET)
          .upload(
            storagePath,
            Buffer.from(bytes),
            {
              contentType:
                "application/pdf",

              cacheControl:
                "3600",

              upsert:
                Boolean(
                  existente &&
                  regenerar
                ),
            }
          );

      if (
        uploadError &&
        !(
          !existente &&
          esArchivoExistente(
            uploadError
          )
        )
      ) {
        return {
          ok: false as const,
          error:
            uploadError.message,
        };
      }

      /*
       * =====================================
       * SI YA EXISTÍA, ACTUALIZAR SU REGISTRO
       * =====================================
       */

      if (existente) {
        const {
          data: archivoActualizado,
          error: actualizarError,
        } = await supabase
          .from("archivos_trabajo")
          .update({
            storage_bucket:
              BUCKET,

            storage_path:
              storagePath,

            nombre_original:
              nombreArchivo,

            mime_type:
              "application/pdf",

            tamanio_bytes:
              bytes.byteLength,

            descripcion:
              `Orden de Trabajo ${planillaSegura.numero_orden} - ${
                variante ===
                "original"
                  ? "ORIGINAL"
                  : "COPIA"
              }`,

            documento_clase:
              "orden_trabajo",

            documento_variante:
              variante,
          })
          .eq(
            "id",
            existente.id
          )
          .select(`
            id,
            storage_path,
            nombre_original
          `)
          .single();

        if (
          actualizarError ||
          !archivoActualizado
        ) {
          return {
            ok: false as const,
            error:
              actualizarError?.message ||
              "El PDF fue regenerado, pero no se pudo actualizar su registro.",
          };
        }

        const enlace =
          await crearEnlace(
            storagePath,
            nombreArchivo
          );

        if (!enlace.ok) {
          return enlace;
        }

        return {
          ok: true as const,

          archivoId:
            archivoActualizado.id,

          storagePath,

          nombreArchivo,

          url:
            enlace.url,
        };
      }

      /*
       * =====================================
       * SI ES NUEVO, REGISTRARLO EN LA BASE
       * =====================================
       */

      const {
        data: archivoCreado,
        error: insertarError,
      } = await supabase
        .from("archivos_trabajo")
        .insert({
          presupuesto_id:
            planillaSegura.presupuesto_id,

          tipo:
            "documento",

          storage_bucket:
            BUCKET,

          storage_path:
            storagePath,

          nombre_original:
            nombreArchivo,

          mime_type:
            "application/pdf",

          tamanio_bytes:
            bytes.byteLength,

          descripcion:
            `Orden de Trabajo ${planillaSegura.numero_orden} - ${
              variante ===
              "original"
                ? "ORIGINAL"
                : "COPIA"
            }`,

          planilla_trabajo_id:
            id,

          conformidad_id:
            null,

          documento_clase:
            "orden_trabajo",

          documento_variante:
            variante,
        })
        .select(`
          id,
          storage_path,
          nombre_original
        `)
        .single();

      if (
        insertarError ||
        !archivoCreado
      ) {
        return {
          ok: false as const,
          error:
            insertarError?.message ||
            "El PDF fue generado, pero no se pudo registrar en Documentos.",
        };
      }

      const enlace =
        await crearEnlace(
          storagePath,
          nombreArchivo
        );

      if (!enlace.ok) {
        return enlace;
      }

      return {
        ok: true as const,

        archivoId:
          archivoCreado.id,

        storagePath,

        nombreArchivo,

        url:
          enlace.url,
      };
    }

    /*
     * =========================================
     * ORIGINAL
     * =========================================
     */

    const original =
      await asegurarPdf(
        "original"
      );

    if (!original.ok) {
      return {
        ok: false as const,
        error:
          `No se pudo generar el ORIGINAL: ${original.error}`,
      };
    }

    /*
     * =========================================
     * COPIA
     * =========================================
     */

    const copia =
      await asegurarPdf(
        "copia"
      );

    if (!copia.ok) {
      return {
        ok: false as const,
        error:
          `El ORIGINAL quedó guardado, pero no se pudo generar la COPIA: ${copia.error}`,
      };
    }

    return {
      ok: true as const,

      numeroOrden:
        planillaSegura.numero_orden,

      regenerado:
        regenerar,

      original,

      copia,
    };
  } catch (error) {
    return {
      ok: false as const,
      error:
        mensajeError(error),
    };
  }
}
