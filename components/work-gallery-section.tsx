import Image from "next/image";

import { getPublishedWorkGallery } from "@/lib/work-gallery";

import styles from "./work-gallery-section.module.css";

export async function WorkGallerySection() {
  const works = await getPublishedWorkGallery();

  return (
    <section id="trabajos" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>
            Nuestros trabajos
          </p>

          <h2 className={styles.title}>
            Trabajos reales realizados por Enfri.Ar
          </h2>

          <p className={styles.description}>
            Instalaciones, mantenimientos y reparaciones
            realizadas por Enfri.Ar Refrigeración.
          </p>
        </div>

        {works.length > 0 ? (
          <div className={styles.grid}>
            {works.map((work) => (
              <article
                className={styles.card}
                key={work.id}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "4 / 3",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={work.image_url}
                    alt={work.alt_text}
                    fill
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    style={{
                      objectFit: "cover",
                    }}
                  />
                </div>

                <div
                  style={{
                    padding: "16px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      color: "var(--foreground)",
                      fontSize: "1rem",
                    }}
                  >
                    {work.title}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            <article className={styles.card}>
              <div className={styles.placeholder}>
                <p className={styles.placeholderTitle}>
                  Próximamente
                </p>

                <p className={styles.placeholderText}>
                  Estamos preparando fotografías reales de
                  nuestros trabajos.
                </p>
              </div>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}
