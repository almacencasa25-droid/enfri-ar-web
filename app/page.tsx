import { AboutSection } from "@/components/about-section";
import { ContactSection } from "@/components/contact-section";
import { HeroSection } from "@/components/hero-section";
import { RenacliSection } from "@/components/renacli-section";
import { ServicesSection } from "@/components/services-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { WorkGallerySection } from "@/components/work-gallery-section";

export default function HomePage() {
  return (
    <>
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
