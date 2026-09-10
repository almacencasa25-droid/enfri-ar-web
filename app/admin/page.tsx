import Link from "next/link";

import { requireAdminUser } from "@/lib/auth/admin";

export const metadata = {
  title: "Panel Administrador",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const adminUser = await requireAdminUser();

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto",
          padding: "28px",
          borderRadius: "20px",
          background: "rgba(255, 253, 248, 0.94)",
          border: "1px solid rgba(38, 40, 42, 0.12)",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontWeight: 800,
          }}
        >
          Enfri.Ar Refrigeración
        </p>

        <h1
          style={{
            margin: "0 0 18px",
          }}
        >
          Panel Administrador
        </h1>

        <p>
          Acceso autorizado correctamente.
        </p>

        <p>
          Usuario: <strong>{adminUser.email}</strong>
        </p>

        <p
          style={{
            marginTop: "24px",
            lineHeight: 1.6,
          }}
        >
          Desde este panel vamos a administrar las consultas,
          los datos públicos del sitio y las futuras funciones
          internas de Enfri.Ar.
        </p>

        <Link href="/">
          Volver al sitio público
        </Link>
      </div>
    </main>
  );
}
