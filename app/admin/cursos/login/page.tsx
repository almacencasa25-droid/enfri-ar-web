import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentCursosAdminUser } from "@/lib/auth/cursos";

import { CursosLoginForm } from "./login-form";
import styles from "./login.module.css";

export const metadata = {
  title: "Acceso | Enfri.Ar Cursos",
  robots: { index: false, follow: false },
};

export default async function CursosLoginPage() {
  const user = await getCurrentCursosAdminUser();

  if (user) {
    redirect("/admin/cursos");
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Enfri.Ar Formación</p>
        <h1>Acceso a Cursos</h1>
        <p className={styles.description}>
          Ingresá con el usuario autorizado del sistema de cursos y evaluaciones.
        </p>
        <CursosLoginForm />
        <Link className={styles.back} href="/admin">
          Volver al administrador
        </Link>
      </section>
    </main>
  );
}
