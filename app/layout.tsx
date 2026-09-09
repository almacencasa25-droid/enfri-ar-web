import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Enfri.Ar Refrigeración",
    template: "%s | Enfri.Ar Refrigeración",
  },
  description:
    "Instalación, reparación, diagnóstico, mantenimiento y limpieza de equipos de aire acondicionado Split y Piso-Techo.",
  applicationName: "Enfri.Ar Refrigeración",
  authors: [{ name: "Enfri.Ar Refrigeración" }],
  creator: "Enfri.Ar Refrigeración",
  publisher: "Enfri.Ar Refrigeración",
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
