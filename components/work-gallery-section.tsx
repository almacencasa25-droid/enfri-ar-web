import { WorkGalleryBrowser } from "@/components/work-gallery-browser";
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
            Explorá nuestras instalaciones, reparaciones,
            mantenimientos y capacitaciones.
          </p>
        </div>

        <WorkGalleryBrowser works={works} />
      </div>
    </section>
  );
}
