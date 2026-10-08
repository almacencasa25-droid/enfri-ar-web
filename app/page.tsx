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
        <section id="app-diagnostico" style={{ padding: "64px 20px", background: "#eaf7fc", textAlign: "center" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <p style={{ fontWeight: 700, color: "#087eaf", marginBottom: 8 }}>HERRAMIENTA PARA TÉCNICOS</p>
            <h2 style={{ fontSize: "clamp(1.7rem, 4vw, 2.5rem)", color: "#103c54", marginBottom: 16 }}>❄️ Enfri.Ar Diagnóstico</h2>
            <p style={{ fontSize: "1.1rem", lineHeight: 1.6, color: "#29475b", marginBottom: 24 }}>
              Aplicación para técnicos en aire acondicionado Split convencional e Inverter.
              Calculá sobrecalentamiento y subenfriamiento, consultá tus registros e instalala en el celular.
            </p>
            <a href="https://enfri-ar-diagnostico.vercel.app/instalar" target="_blank" rel="noopener noreferrer"
               style={{ display: "inline-block", padding: "16px 26px", background: "#087eaf", color: "#fff", borderRadius: 12, fontWeight: 800, textDecoration: "none" }}>
              📲 DESCARGAR / INSTALAR LA APP
            </a>
            <p style={{ fontSize: ".9rem", color: "#526b7a", marginTop: 14 }}>Acceso gratuito desde el navegador. Instalación disponible en dispositivos compatibles.</p>
          </div>
        </section>
        <RenacliSection />
      </main>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
