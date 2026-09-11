import Image from "next/image";

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
          aria-label="Aire acondicionado Split instalado en ambiente residencial"
        >
          <Image
            src="/hero-enfri-ar.png"
            alt="Aire acondicionado Split instalado en un ambiente residencial"
            width={1200}
            height={1200}
            priority
            sizes="(max-width: 759px) 100vw, 50vw"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>
    </section>
  );
}
