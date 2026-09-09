import styles from "./work-gallery-section.module.css";

export function WorkGallerySection() {
  return (
    <section id="trabajos" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Nuestros trabajos</p>

          <h2 className={styles.title}>
            Trabajos reales realizados por Enfri.Ar
          </h2>

          <p className={styles.description}>
            Esta sección estará destinada a mostrar instalaciones,
            mantenimientos y reparaciones realizadas por Enfri.Ar Refrigeración
            utilizando fotografías reales de nuestros trabajos.
          </p>
        </div>

        <div className={styles.grid}>
          <article className={styles.card}>
            <div className={styles.placeholder}>
              <p className={styles.placeholderTitle}>
                Instalaciones
              </p>

              <p className={styles.placeholderText}>
                Aquí incorporaremos fotografías reales de instalaciones de
                equipos Split y Piso-Techo.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.placeholder}>
              <p className={styles.placeholderTitle}>
                Mantenimiento y limpieza
              </p>

              <p className={styles.placeholderText}>
                Espacio preparado para mostrar trabajos de mantenimiento,
                limpieza y puesta a punto.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.placeholder}>
              <p className={styles.placeholderTitle}>
                Reparaciones
              </p>

              <p className={styles.placeholderText}>
                Aquí podremos mostrar diagnósticos y reparaciones realizadas por
                Enfri.Ar Refrigeración.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
