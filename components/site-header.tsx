"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  MoreVertical,
  X,
} from "lucide-react";
import { useState } from "react";

import { navigationItems } from "@/lib/site-content";

import styles from "./site-header.module.css";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [
    isAdminMenuOpen,
    setIsAdminMenuOpen,
  ] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
    setIsAdminMenuOpen(false);
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
              onClick={() =>
                setIsAdminMenuOpen(false)
              }
            >
              {item.label}
            </Link>
          ))}

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              aria-label="Más opciones"
              aria-expanded={isAdminMenuOpen}
              onClick={() =>
                setIsAdminMenuOpen(
                  (current) => !current
                )
              }
              style={{
                width: "40px",
                height: "40px",
                display: "grid",
                placeItems: "center",
                padding: 0,
                border:
                  "1px solid rgba(38, 40, 42, 0.14)",
                borderRadius: "10px",
                background:
                  "rgba(255,255,255,0.72)",
                color:
                  "var(--foreground)",
                cursor: "pointer",
              }}
            >
              <MoreVertical
                size={22}
                aria-hidden="true"
              />
            </button>

            {isAdminMenuOpen ? (
              <div
                style={{
                  position: "absolute",
                  zIndex: 80,
                  top: "calc(100% + 8px)",
                  right: 0,
                  minWidth: "170px",
                  padding: "7px",
                  border:
                    "1px solid rgba(38, 40, 42, 0.14)",
                  borderRadius: "11px",
                  background: "#ffffff",
                  boxShadow:
                    "0 12px 30px rgba(0,0,0,0.12)",
                }}
              >
                <Link
                  href="/admin"
                  onClick={() =>
                    setIsAdminMenuOpen(false)
                  }
                  style={{
                    display: "block",
                    padding: "9px 10px",
                    borderRadius: "7px",
                    color:
                      "var(--foreground)",
                    fontSize: "0.84rem",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  Administrador
                </Link>
              </div>
            ) : null}
          </div>
        </nav>

        <button
          type="button"
          className={styles.mobileMenuButton}
          aria-label={
            isMenuOpen
              ? "Cerrar menú"
              : "Abrir menú"
          }
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => {
            setIsAdminMenuOpen(false);

            setIsMenuOpen(
              (current) => !current
            );
          }}
        >
          {isMenuOpen ? (
            <X
              size={28}
              aria-hidden="true"
            />
          ) : (
            <Menu
              size={28}
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <nav
          id="mobile-navigation"
          className={styles.mobileNavigation}
          aria-label="Navegación móvil"
        >
          <div
            className={
              styles.mobileNavigationInner
            }
          >
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  styles.navigationLink
                }
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
