import { CheckCircle2 } from "lucide-react";

import { getAboutContent } from "@/lib/site-data";

import styles from "./about-section.module.css";

export async function AboutSection() {
  const about = await getAboutContent();

  return (
    <section id="nosotros" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>Nosotros</p>

          <h2 className={styles.title}>
            {about.title}
          </h2>

          <p className={styles.description}>
            {about.description}
          </p>

          <ul className={styles.points}>
            {about.points.map((point) => (
              <li key={point} className={styles.point}>
                <CheckCircle2
                  size={22}
                  className={styles.icon}
                  aria-hidden="true"
                />

                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className={styles.highlight}>
          <h3 className={styles.highlightTitle}>
            Trabajo técnico, claro y responsable
          </h3>

          <p className={styles.highlightText}>
            Cada servicio se aborda buscando una solución adecuada para el
            equipo y explicando al cliente de forma clara qué trabajo se
            recomienda realizar.
          </p>
        </aside>
      </div>
    </section>
  );
}
