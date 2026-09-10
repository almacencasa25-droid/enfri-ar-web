import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/app/admin/login/login-form";
import { getCurrentAdminUser } from "@/lib/auth/admin";

import styles from "./login.module.css";

export const metadata = {
  title: "Administrador",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage() {
  const adminUser = await getCurrentAdminUser();

  if (adminUser) {
    redirect("/admin");
  }

  return (
    <main className={styles.page}>
      <section
        className={styles.card}
        aria-labelledby="admin-login-title"
      >
        <header className={styles.header}>
          <p className={styles.eyebrow}>
            Enfri.Ar Refrigeración
          </p>

          <h1
            className={styles.title}
            id="admin-login-title"
          >
            Acceso Administrador
          </h1>

          <p className={styles.description}>
            Ingresá con el usuario autorizado para administrar
            la información de Enfri.Ar.
          </p>
        </header>

        <AdminLoginForm />

        <div className={styles.back}>
          <Link href="/" className={styles.backLink}>
            Volver al sitio público
          </Link>
        </div>
      </section>
    </main>
  );
}
