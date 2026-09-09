export type SiteConfig = {
  companyName: string;
  shortName: string;
  description: string;
  heroTitle: string;
  heroDescription: string;

  whatsappLabel: string;
  whatsappNumber: string;
  whatsappMessage: string;

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

  heroTitle:
    "Climatización profesional para tu hogar, comercio o empresa.",

  heroDescription:
    "Instalación, reparación y mantenimiento de equipos de aire acondicionado Split y Piso-Techo.",

  whatsappLabel: "Solicitar servicio por WhatsApp",

  /*
   * El número de WhatsApp se guarda como un único dato central.
   *
   * Cuando conectemos el Panel de Administración con Supabase,
   * este valor será administrable sin modificar código.
   *
   * Los botones y enlaces de WhatsApp deberán generar su URL
   * automáticamente utilizando este dato.
   *
   * No debemos escribir manualmente enlaces wa.me ni repetir
   * el número en distintos componentes.
   */
  whatsappNumber: "",

  /*
   * Mensaje inicial opcional que podrá acompañar los enlaces
   * de WhatsApp.
   *
   * También podrá hacerse administrable posteriormente.
   */
  whatsappMessage:
    "Hola, quisiera consultar por un servicio de Enfri.Ar Refrigeración.",

  /*
   * Estos datos son temporales durante la construcción.
   *
   * Más adelante dejarán de editarse en este archivo y pasarán a ser
   * administrables desde el Panel de Administración mediante Supabase.
   *
   * La página utilizará siempre una única fuente de datos para evitar
   * teléfonos, WhatsApp, correos u otros datos repetidos manualmente.
   */
  phone: "",
  email: "",
  website: "",
  address: null,
};
