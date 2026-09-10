import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ConfigurationForm } from "@/app/admin/configuracion/configuracion-form";
import { requireAdminUser } from "@/lib/auth/admin";
import { getSiteConfig } from "@/lib/site-data";

import styles from "./configuracion.module.css";

export const metadata = {
  title: "Configuración del sitio",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminConfiguracionPage() {
  await requireAdminUser();

  const config = await getSiteConfig();

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <p className={styles.eyebrow}>
                Enfri.Ar Refrigeración
              </p>

              <h1 className={styles.title}>
                Configuración del sitio
              </h1>

              <p className={styles.description}>
                Modificá los datos públicos de Enfri.Ar sin tocar
                el código de la página.
              </p>
            </div>

            <Link href="/admin" className={styles.backLink}>
              <ArrowLeft size={17} aria-hidden="true" />
              Volver al panel
            </Link>
          </div>
        </header>

        <ConfigurationForm config={config} />
      </div>
    </main>
  );
}
