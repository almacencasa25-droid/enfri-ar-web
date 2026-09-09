import { ExternalLink } from "lucide-react";

import { getSiteConfig } from "@/lib/site-data";

import styles from "./renacli-section.module.css";

export async function RenacliSection() {
  const config = await getSiteConfig();
  const renacli = config.renacli;

  return (
    <section
      className={styles.section}
      aria-labelledby="renacli-section-title"
    >
      <div className={styles.container}>
        <div className={styles.card}>
          <span className={styles.badge}>
            Servicio complementario
          </span>

          <h2
            id="renacli-section-title"
            className={styles.title}
          >
            {renacli.sectionTitle}
          </h2>

          <p className={styles.description}>
            {renacli.sectionDescription}
          </p>

          <div className={styles.actions}>
            <a
              href={renacli.website}
              className={styles.primaryButton}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${renacli.buttonLabel} en ${renacli.name}`}
            >
              {renacli.buttonLabel}
              <ExternalLink
                size={18}
                aria-hidden="true"
              />
            </a>
          </div>

          <p className={styles.note}>
            La matrícula y su validación corresponden a{" "}
            <span className={styles.renacliName}>
              {renacli.name}
            </span>
            , {renacli.fullName}. Enfri.Ar y RENACLI mantienen
            identidades y funciones diferenciadas.
          </p>
        </div>
      </div>
    </section>
  );
}
