type WhatsAppLinkOptions = {
  number: string;
  message?: string;
};

/*
 * Normaliza el número para utilizarlo en enlaces de WhatsApp.
 *
 * Ejemplo:
 * "+54 9 11 1234-5678"
 *
 * se transforma internamente en:
 *
 * "5491112345678"
 */
export function normalizeWhatsAppNumber(number: string): string {
  return number.replace(/\D/g, "");
}

/*
 * Genera el enlace oficial de WhatsApp a partir de los datos
 * centralizados de configuración.
 *
 * Si no existe un número válido, devuelve null.
 *
 * De esta forma ningún componente necesita escribir manualmente:
 * - el número,
 * - la URL de WhatsApp,
 * - ni la codificación del mensaje.
 */
export function createWhatsAppLink({
  number,
  message = "",
}: WhatsAppLinkOptions): string | null {
  const normalizedNumber = normalizeWhatsAppNumber(number);

  if (!normalizedNumber) {
    return null;
  }

  const baseUrl = `https://wa.me/${normalizedNumber}`;
  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    return baseUrl;
  }

  return `${baseUrl}?text=${encodeURIComponent(trimmedMessage)}`;
}
