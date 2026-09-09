import { getServices } from "@/lib/site-data";

import styles from "./services-section.module.css";

export async function ServicesSection() {
  const services = await getServices();

  return (
    <section id="servicios" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Servicios</p>

          <h2 className={styles.title}>
            Soluciones profesionales en climatización
          </h2>

          <p className={styles.description}>
            Trabajamos principalmente con instalación, diagnóstico, reparación,
            mantenimiento y limpieza de equipos de aire acondicionado.
          </p>
        </div>

        <div className={styles.grid}>
          {services.map((service, index) => (
            <article key={service.id} className={styles.card}>
              <span className={styles.cardNumber} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>

              <h3 className={styles.cardTitle}>{service.title}</h3>

              <p className={styles.cardDescription}>
                {service.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
