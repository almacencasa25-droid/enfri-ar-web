"use server";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  generarFichaRevisionPdf,
  type FichaRevisionEmpresa,
} from "../lib/generarFichaRevisionPdf";

export type GenerarFichasRevisionResultado =
  | {
      ok: true;
      pdfBase64: string;
      archivo: string;
      numeroInicial: number;
      numeroFinal: number;
      proximoNumero: number;
    }
  | {
      ok: false;
      error: string;
    };

export async function generarFichasRevisionAction(
  cantidad: number
): Promise<GenerarFichasRevisionResultado> {
  await requireAdminUser();

  const cantidadNormalizada =
    Number(cantidad);

  if (
    !Number.isInteger(
      cantidadNormalizada
    ) ||
    cantidadNormalizada < 1 ||
    cantidadNormalizada > 100
  ) {
    return {
      ok: false,
      error:
        "La cantidad de fichas debe ser un número entero entre 1 y 100.",
    };
  }

  const supabase =
    await createSupabaseServerClient();

  /*
   * Primero obtenemos los datos actuales
   * de Enfri.Ar.
   *
   * Esto se hace antes de consumir
   * numeración.
   */
  const {
    data: empresaData,
    error: empresaError,
  } = await supabase.rpc(
    "obtener_empresa_snapshot_enfriar"
  );

  if (
    empresaError ||
    !empresaData
  ) {
    console.error(
      "Error al obtener datos de Enfri.Ar para ficha de revisión:",
      empresaError
    );

    return {
      ok: false,
      error:
        "No fue posible obtener los datos de Enfri.Ar.",
    };
  }

  /*
   * Reservamos el lote completo
   * de números de forma correlativa.
   */
  const {
    data: reservaData,
    error: reservaError,
  } = await supabase.rpc(
    "reservar_numeros_ficha_revision",
    {
      p_cantidad:
        cantidadNormalizada,
    }
  );

  if (
    reservaError ||
    !Array.isArray(
      reservaData
    ) ||
    reservaData.length === 0
  ) {
    console.error(
      "Error al reservar numeración de fichas de revisión:",
      reservaError
    );

    return {
      ok: false,
      error:
        "No fue posible reservar la numeración de las fichas.",
    };
  }

  const reserva =
    reservaData[0] as {
      numero_inicial:
        | number
        | string;
      numero_final:
        | number
        | string;
      proximo_numero:
        | number
        | string;
    };

  const numeroInicial =
    Number(
      reserva.numero_inicial
    );

  const numeroFinal =
    Number(
      reserva.numero_final
    );

  const proximoNumero =
    Number(
      reserva.proximo_numero
    );

  if (
    !Number.isFinite(
      numeroInicial
    ) ||
    !Number.isFinite(
      numeroFinal
    ) ||
    !Number.isFinite(
      proximoNumero
    )
  ) {
    return {
      ok: false,
      error:
        "La numeración reservada no es válida.",
    };
  }

  try {
    const pdfBytes =
      await generarFichaRevisionPdf(
        {
          numeroInicial,
          cantidad:
            cantidadNormalizada,
          empresa:
            empresaData as FichaRevisionEmpresa,
        }
      );

    const pdfBase64 =
      Buffer.from(
        pdfBytes
      ).toString(
        "base64"
      );

    const numeroInicialVisible =
      String(
        numeroInicial
      ).padStart(
        6,
        "0"
      );

    const numeroFinalVisible =
      String(
        numeroFinal
      ).padStart(
        6,
        "0"
      );

    const archivo =
      cantidadNormalizada === 1
        ? `ficha-revision-${numeroInicialVisible}.pdf`
        : `fichas-revision-${numeroInicialVisible}-${numeroFinalVisible}.pdf`;

    return {
      ok: true,
      pdfBase64,
      archivo,
      numeroInicial,
      numeroFinal,
      proximoNumero,
    };
  } catch (error) {
    console.error(
      "Error al generar PDF de fichas de revisión:",
      error
    );

    return {
      ok: false,
      error:
        "La numeración fue reservada, pero no fue posible generar el PDF.",
    };
  }
}
