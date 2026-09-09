import {
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import { getSiteConfig } from "@/lib/site-data";
import { createWhatsAppLink } from "@/lib/whatsapp";

import styles from "./contact-section.module.css";

export async function ContactSection() {
  const config = await getSiteConfig();

  const whatsappLink = createWhatsAppLink({
    number: config.whatsappNumber,
    message: config.whatsappMessage,
  });

  const contactItems = [
    config.phone
      ? {
          key: "phone",
          label: "Teléfono",
          value: config.phone,
          href: `tel:${config.phone.replace(/\s/g, "")}`,
          icon: Phone,
        }
      : null,

    config.whatsappNumber && whatsappLink
      ? {
          key: "whatsapp",
          label: "WhatsApp",
          value: config.whatsappNumber,
          href: whatsappLink,
          icon: MessageCircle,
          external: true,
        }
      : null,

    config.email
      ? {
          key: "email",
          label: "Correo electrónico",
          value: config.email,
          href: `mailto:${config.email}`,
          icon: Mail,
        }
      : null,

    config.website
      ? {
          key: "website",
          label: "Página web",
          value: config.website,
          href: config.website.startsWith("http")
            ? config.website
            : `https://${config.website}`,
          icon: Globe2,
          external: true,
        }
      : null,

    config.address
      ? {
          key: "address",
          label: "Dirección",
          value: config.address,
          href: null,
          icon: MapPin,
        }
      : null,
  ].filter(Boolean);

  return (
    <section id="contacto" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Contacto</p>

          <h2 className={styles.title}>
            Comunicate con Enfri.Ar
          </h2>

          <p className={styles.description}>
            Consultanos por instalaciones, reparaciones, mantenimiento,
            limpieza o diagnóstico de equipos de aire acondicionado.
          </p>
        </div>

        {contactItems.length > 0 ? (
          <div className={styles.contactGrid}>
            {contactItems.map((item) => {
              if (!item) {
                return null;
              }

              const Icon = item.icon;

              return (
                <article key={item.key} className={styles.contactCard}>
                  <div className={styles.iconWrapper}>
                    <Icon size={22} aria-hidden="true" />
                  </div>

                  <div className={styles.contactContent}>
                    <p className={styles.contactLabel}>
                      {item.label}
                    </p>

                    {item.href ? (
                      <a
                        href={item.href}
                        className={`${styles.contactValue} ${styles.contactLink}`}
                        {...(item.external
                          ? {
                              target: "_blank",
                              rel: "noopener noreferrer",
                            }
                          : {})}
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className={styles.contactValue}>
                        {item.value}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            Los datos de contacto estarán disponibles próximamente.
          </div>
        )}
      </div>
    </section>
  );
}
