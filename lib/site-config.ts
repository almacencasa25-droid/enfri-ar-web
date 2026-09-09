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

  renacli: {
    name: string;
    fullName: string;
    website: string;
    sectionTitle: string;
    sectionDescription: string;
    buttonLabel: string;
  };
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
   * Número inicial de WhatsApp de Enfri.Ar.
   *
   * Se guarda en formato internacional para que pueda mostrarse
   * correctamente y también generar automáticamente el enlace de WhatsApp.
   *
   * La función normalizeWhatsAppNumber() lo transforma internamente en:
   * 5491138473222
   *
   * Cuando conectemos el Panel de Administración con Supabase,
   * este valor dejará de depender del código y será administrable.
   *
   * Al modificarlo desde Administración deberán actualizarse
   * automáticamente todos los lugares que utilicen WhatsApp:
   * - botón principal,
   * - burbuja flotante,
   * - sección Contacto,
   * - pie de página,
   * - futuros enlaces o botones de WhatsApp.
   */
  whatsappNumber: "+54 9 11 3847-3222",

  /*
   * Mensaje inicial opcional que acompaña los enlaces de WhatsApp.
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

  /*
   * Información centralizada de RENACLI.
   *
   * Enfri.Ar y RENACLI deben mantenerse visual y funcionalmente
   * diferenciados.
   *
   * Estos datos se utilizarán únicamente en los sectores donde
   * corresponda informar sobre matriculación.
   *
   * El enlace no debe escribirse manualmente en distintos componentes.
   */
  renacli: {
    name: "RENACLI",
    fullName: "Registro Nacional de Climatización y Refrigeración",
    website: "https://renacli.com.ar",
    sectionTitle: "¿Sos técnico y querés matricularte?",
    sectionDescription:
      "Te ayudamos a gestionar tu matrícula a través de RENACLI – Registro Nacional de Climatización y Refrigeración.",
    buttonLabel: "Información para matricularme",
  },
};
