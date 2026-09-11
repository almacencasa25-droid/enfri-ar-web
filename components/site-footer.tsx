import Link from "next/link";

import { getSiteConfig } from "@/lib/site-data";

import styles from "./site-footer.module.css";

export async function SiteFooter() {
  const config = await getSiteConfig();

  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.brand}>
            <h2 className={styles.title}>
              {config.companyName}
            </h2>

            <p className={styles.description}>
              Instalación, diagnóstico, reparación, mantenimiento y limpieza de
              equipos de aire acondicionado Split y Piso-Techo.
            </p>
          </div>

          <ul className={styles.contactList}>
            {config.phone && (
              <li className={styles.contactItem}>
                <a
                  href={`tel:${config.phone.replace(/\D/g, "")}`}
                  className={styles.contactLink}
                >
                  Teléfono: {config.phone}
                </a>
              </li>
            )}

            {config.email && (
              <li className={styles.contactItem}>
                <a
                  href={`mailto:${config.email}`}
                  className={styles.contactLink}
                >
                  Correo: {config.email}
                </a>
              </li>
            )}

            {config.website && (
              <li className={styles.contactItem}>
                <a
                  href={
                    config.website.startsWith("http")
                      ? config.website
                      : `https://${config.website}`
                  }
                  className={styles.contactLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Web: {config.website}
                </a>
              </li>
            )}

            {config.address && (
              <li className={styles.contactItem}>
                Dirección: {config.address}
              </li>
            )}
          </ul>
        </div>

        <div className={styles.secondary}>
          <div className={styles.renacli}>
            <span className={styles.renacliTitle}>
              Matrículas a través de RENACLI
            </span>
            <br />
            Registro Nacional de Climatización y Refrigeración
          </div>

          <div>
            <p className={styles.copyright}>
              © {currentYear} {config.companyName}
            </p>

            <Link
              href="/privacidad"
              className={styles.contactLink}
            >
              Política de privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
