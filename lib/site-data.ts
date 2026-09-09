import { siteConfig } from "@/lib/site-config";
import {
  aboutContent,
  navigationItems,
  services,
} from "@/lib/site-content";

/*
 * Esta capa concentra el acceso a los datos públicos de Enfri.Ar.
 *
 * Durante la etapa inicial utiliza la configuración local del proyecto.
 *
 * Más adelante, cuando conectemos Supabase, podremos cambiar internamente
 * estas funciones para obtener los datos desde la base de datos sin tener
 * que modificar los componentes visuales de la página.
 */

export async function getSiteConfig() {
  return siteConfig;
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
