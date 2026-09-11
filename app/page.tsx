import { AboutSection } from "@/components/about-section";
import { ContactSection } from "@/components/contact-section";
import { HeroSection } from "@/components/hero-section";
import { RenacliSection } from "@/components/renacli-section";
import { ServicesSection } from "@/components/services-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { WorkGallerySection } from "@/components/work-gallery-section";

import { getSiteConfig } from "@/lib/site-data";

export default async function HomePage() {
  const config = await getSiteConfig();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.companyName,
    url: "https://www.enfriar.com.ar",
    logo: "https://www.enfriar.com.ar/logo-enfri-ar.png",
    description:
      "Instalación, reparación, diagnóstico, mantenimiento y limpieza profesional de equipos de aire acondicionado Split y Piso-Techo.",
    ...(config.phone
      ? {
          telephone: config.phone,
        }
      : {}),
    ...(config.email
      ? {
          email: config.email,
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />

      <SiteHeader />

      <main>
        <HeroSection />
        <ServicesSection />
        <WorkGallerySection />
        <AboutSection />
        <ContactSection />
        <RenacliSection />
      </main>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
