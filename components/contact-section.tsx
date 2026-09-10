import { ContactForm } from "@/components/contact-form";

import styles from "./contact-section.module.css";

export function ContactSection() {
  return (
    <section id="contacto" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Contacto</p>

          <h2 className={styles.title}>
            Contanos qué necesitás
          </h2>

          <p className={styles.description}>
            Completá el formulario con los datos de tu consulta.
            Podemos ayudarte con instalaciones, reparaciones,
            diagnóstico, mantenimiento y limpieza de equipos de
            aire acondicionado.
          </p>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
