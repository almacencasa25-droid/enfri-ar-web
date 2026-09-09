import { MessageCircle } from "lucide-react";

import { getSiteConfig } from "@/lib/site-data";
import { createWhatsAppLink } from "@/lib/whatsapp";

import styles from "./whatsapp-float.module.css";

export async function WhatsAppFloat() {
  const config = await getSiteConfig();

  const whatsappLink = createWhatsAppLink({
    number: config.whatsappNumber,
    message: config.whatsappMessage,
  });

  if (!whatsappLink) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <a
        href={whatsappLink}
        className={styles.button}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar a Enfri.Ar por WhatsApp"
      >
        <MessageCircle size={28} aria-hidden="true" />
      </a>

      <span className={styles.label}>
        Escribinos por WhatsApp
      </span>
    </div>
  );
}
