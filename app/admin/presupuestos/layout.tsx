import type { Metadata } from "next";

import { requireAdminUser } from "@/lib/auth/admin";

import BackButton from "./BackButton";

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

  return (
    <>
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "18px 18px 0",
          boxSizing: "border-box",
        }}
      >
        <BackButton />
      </div>

      {children}
    </>
  );
}
