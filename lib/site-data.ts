import {
  siteConfig,
  type SiteConfig,
} from "@/lib/site-config";

import {
  aboutContent,
  navigationItems,
  services,
} from "@/lib/site-content";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/*
 * Esta capa concentra el acceso a los datos públicos de Enfri.Ar.
 *
 * Los componentes visuales no necesitan saber si los datos provienen
 * actualmente de archivos locales o de Supabase.
 *
 * Esto permite cambiar la fuente de datos sin tener que reconstruir
 * encabezado, portada, contacto, footer, WhatsApp u otros componentes.
 */

type SiteSettingsRow = {
  company_name: string;
  short_name: string;

  whatsapp_label: string;
  whatsapp_number: string;
  whatsapp_message: string;

  phone: string;
  email: string;
  website: string;
  address: string | null;

  renacli_name: string;
  renacli_full_name: string;
  renacli_website: string;
  renacli_section_title: string;
  renacli_section_description: string;
  renacli_button_label: string;
};

/*
 * Obtiene la configuración pública principal.
 *
 * Supabase es la fuente principal.
 *
 * Si la conexión falla temporalmente, faltan variables de entorno
 * o no existe todavía la fila de configuración, utilizamos siteConfig
 * como respaldo para evitar que la página pública deje de funcionar.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select(
        `
          company_name,
          short_name,
          whatsapp_label,
          whatsapp_number,
          whatsapp_message,
          phone,
          email,
          website,
          address,
          renacli_name,
          renacli_full_name,
          renacli_website,
          renacli_section_title,
          renacli_section_description,
          renacli_button_label
        `
      )
      .eq("id", 1)
      .maybeSingle<SiteSettingsRow>();

    if (error || !data) {
      return siteConfig;
    }

    return {
      ...siteConfig,

      companyName: data.company_name,
      shortName: data.short_name,

      whatsappLabel: data.whatsapp_label,
      whatsappNumber: data.whatsapp_number,
      whatsappMessage: data.whatsapp_message,

      phone: data.phone,
      email: data.email,
      website: data.website,
      address: data.address,

      renacli: {
        name: data.renacli_name,
        fullName: data.renacli_full_name,
        website: data.renacli_website,
        sectionTitle: data.renacli_section_title,
        sectionDescription:
          data.renacli_section_description,
        buttonLabel: data.renacli_button_label,
      },
    };
  } catch {
    return siteConfig;
  }
}

export async function getNavigationItems() {
  return navigationItems;
}

export async function getServices() {
  return services;
}

export async function getAboutContent() {
  return aboutContent;
}
