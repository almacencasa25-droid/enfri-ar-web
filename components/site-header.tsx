"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { navigationItems } from "@/lib/site-content";

import styles from "./site-header.module.css";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link
          href="#inicio"
          className={styles.logoLink}
          aria-label="Ir al inicio de Enfri.Ar Refrigeración"
          onClick={closeMenu}
        >
          <Image
            src="/logo-enfri-ar.png"
            alt="Enfri.Ar Refrigeración"
            width={320}
            height={100}
            priority
            className={styles.logo}
          />
        </Link>

        <nav
          className={styles.desktopNavigation}
          aria-label="Navegación principal"
        >
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navigationLink}
            >
              {item.label}
            </Link>
          ))}

          <Link href="/admin" className={styles.adminLink}>
            Administrador
          </Link>
        </nav>

        <button
          type="button"
          className={styles.mobileMenuButton}
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? (
            <X size={28} aria-hidden="true" />
          ) : (
            <Menu size={28} aria-hidden="true" />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <nav
          id="mobile-navigation"
          className={styles.mobileNavigation}
          aria-label="Navegación móvil"
        >
          <div className={styles.mobileNavigationInner}>
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navigationLink}
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/admin"
              className={styles.adminLink}
              onClick={closeMenu}
            >
              Administrador
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
