export type NavigationItem = {
  label: string;
  href: string;
};

export type ServiceItem = {
  id: string;
  title: string;
  description: string;
};

export const navigationItems: NavigationItem[] = [
  {
    label: "Inicio",
    href: "#inicio",
  },
  {
    label: "Servicios",
    href: "#servicios",
  },
  {
    label: "Nuestros trabajos",
    href: "#trabajos",
  },
  {
    label: "Nosotros",
    href: "#nosotros",
  },
  {
    label: "Contacto",
    href: "#contacto",
  },
];

export const services: ServiceItem[] = [
  {
    id: "instalacion-split",
    title: "Instalación de equipos Split",
    description:
      "Instalación profesional y puesta en funcionamiento de equipos de aire acondicionado tipo Split.",
  },
  {
    id: "piso-techo",
    title: "Equipos Piso-Techo",
    description:
      "Instalación, diagnóstico, mantenimiento y reparación de equipos de mayor capacidad.",
  },
  {
    id: "reparaciones",
    title: "Reparaciones y diagnóstico",
    description:
      "Diagnóstico y reparación de fallas eléctricas, electrónicas y frigoríficas.",
  },
  {
    id: "mantenimiento",
    title: "Mantenimiento y limpieza",
    description:
      "Mantenimiento preventivo, limpieza y puesta a punto para favorecer el correcto funcionamiento del equipo.",
  },
];

export const aboutContent = {
  title: "Enfri.Ar Refrigeración",
  description:
    "Brindamos soluciones profesionales de climatización, priorizando la correcta instalación, el diagnóstico técnico, la seguridad, la prolijidad y el cuidado de cada equipo.",
  points: [
    "Instalaciones realizadas con criterio técnico.",
    "Diagnóstico de fallas antes de realizar reparaciones.",
    "Trabajo prolijo y seguro.",
    "Mantenimiento orientado al cuidado y rendimiento del equipo.",
    "Atención clara y profesional.",
  ],
};
