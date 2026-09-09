import { MessageCircle } from "lucide-react";

import { getSiteConfig } from "@/lib/site-data";
import { createWhatsAppLink } from "@/lib/whatsapp";

import styles from "./hero-section.module.css";

export async function HeroSection() {
  const config = await getSiteConfig();

  const whatsappLink = createWhatsAppLink({
    number: config.whatsappNumber,
    message: config.whatsappMessage,
  });

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

          <div className={styles.actions}>
            {whatsappLink ? (
              <a
                href={whatsappLink}
                className={styles.whatsappButton}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Solicitar servicio por WhatsApp"
              >
                <MessageCircle size={22} aria-hidden="true" />
                {config.whatsappLabel}
              </a>
            ) : (
              <span
                className={styles.disabledButton}
                aria-disabled="true"
                title="WhatsApp todavía no está configurado"
              >
                <MessageCircle size={22} aria-hidden="true" />
                {config.whatsappLabel}
              </span>
            )}
          </div>
        </div>

        <div className={styles.media} aria-label="Espacio para fotografía real de un trabajo de Enfri.Ar">
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
