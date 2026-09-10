import { getSiteConfig } from "@/lib/site-data";

import styles from "./hero-section.module.css";

export async function HeroSection() {
  const config = await getSiteConfig();

  return (
    <section id="inicio" className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>
            Enfri.Ar Refrigeración
          </p>

          <h1 className={styles.title}>
            {config.heroTitle}
          </h1>

          <p className={styles.description}>
            {config.heroDescription}
          </p>
        </div>

        <div
          className={styles.media}
          aria-label="Espacio para fotografía real de un trabajo de Enfri.Ar"
        >
          <div className={styles.mediaPlaceholder}>
            <p className={styles.mediaPlaceholderTitle}>
              Trabajo real de Enfri.Ar
            </p>

            <p className={styles.mediaPlaceholderText}>
              Este espacio quedará preparado para incorporar una fotografía real
              de instalación, reparación o mantenimiento sin modificar la estructura
              de la sección.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
