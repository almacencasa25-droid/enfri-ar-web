export type SiteConfig = {
  companyName: string;
  shortName: string;
  description: string;
  heroTitle: string;
  heroDescription: string;
  whatsappLabel: string;
  phone: string;
  email: string;
  website: string;
  address: string | null;
};

export const siteConfig: SiteConfig = {
  companyName: "Enfri.Ar Refrigeración",
  shortName: "Enfri.Ar",
  description:
    "Servicios profesionales de climatización, instalación, reparación, diagnóstico, mantenimiento y limpieza de equipos de aire acondicionado.",
  heroTitle: "Climatización profesional para tu hogar, comercio o empresa.",
  heroDescription:
    "Instalación, reparación y mantenimiento de equipos de aire acondicionado Split y Piso-Techo.",
  whatsappLabel: "Solicitar servicio por WhatsApp",

  /*
   * Estos datos son temporales durante la construcción.
   *
   * Más adelante dejarán de editarse en este archivo y pasarán a ser
   * administrables desde el Panel de Administración mediante Supabase.
   *
   * La página utilizará siempre una única fuente de datos para evitar
   * teléfonos, WhatsApp o correos repetidos manualmente.
   */
  phone: "",
  email: "",
  website: "",
  address: null,
};
