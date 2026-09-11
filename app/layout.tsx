import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteTitle =
  "Enfri.Ar Refrigeración | Aire acondicionado Split y Piso-Techo";

const siteDescription =
  "Instalación, reparación, diagnóstico, mantenimiento y limpieza profesional de equipos de aire acondicionado Split y Piso-Techo.";

export const metadata: Metadata = {
  title: {
    default: siteTitle,
    template: "%s | Enfri.Ar Refrigeración",
  },

  description: siteDescription,

  applicationName: "Enfri.Ar Refrigeración",

  authors: [
    {
      name: "Enfri.Ar Refrigeración",
    },
  ],

  creator: "Enfri.Ar Refrigeración",
  publisher: "Enfri.Ar Refrigeración",

  category: "Refrigeración y climatización",

  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Enfri.Ar Refrigeración",
    title: siteTitle,
    description: siteDescription,
  },

  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
  },

  icons: {
    icon: [
      {
        url: "/favicon-enfri-ar.png",
        type: "image/png",
      },
    ],
    shortcut: "/favicon-enfri-ar.png",
    apple: "/favicon-enfri-ar.png",
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
