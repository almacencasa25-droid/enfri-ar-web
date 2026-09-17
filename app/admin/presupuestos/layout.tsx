import type { Metadata } from "next";

import { requireAdminUser } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: {
    default: "Presupuestos | Enfri.Ar",
    template: "%s | Presupuestos | Enfri.Ar",
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export default async function PresupuestosLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminUser();

  return children;
}
