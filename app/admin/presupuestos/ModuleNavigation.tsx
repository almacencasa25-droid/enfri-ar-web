"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    label: "Inicio",
    href: "/admin/presupuestos",
  },
  {
    label: "Nuevo presupuesto",
    href: "/admin/presupuestos/nuevo",
  },
  {
    label: "Presupuestos",
    href: "/admin/presupuestos/listado",
  },
  {
    label: "Ficha de revisión",
    href: "/admin/presupuestos/ficha-revision",
  },
  {
    label: "Clientes",
    href: "/admin/presupuestos/clientes",
  },
  {
    label: "Trabajos",
    href: "/admin/presupuestos/trabajos",
  },
  {
    label: "Técnicos",
    href: "/admin/presupuestos/equipo-tecnico",
  },
  {
    label: "Documentos",
    href: "/admin/presupuestos/documentos",
  },
  {
    label: "Tarifario Enfri.Ar",
    href: "/api/tarifario?tipo=interno",
  },
  {
    label: "Informes / detalles",
    href: "/admin/presupuestos/informes",
  },
];

function isActivePath(
  pathname: string,
  href: string
) {
  if (
    href ===
    "/admin/presupuestos"
  ) {
    return (
      pathname === href
    );
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}

export default function ModuleNavigation() {
  const pathname =
    usePathname();

  return (
    <nav
      aria-label="Navegación del módulo de presupuestos"
      style={{
        marginTop: "14px",
        padding: "10px",
        border:
          "1px solid #b6c6d0",
        borderRadius:
          "14px",
        background:
          "#f0f5f8",
        boxShadow:
          "0 4px 14px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        {menuItems.map(
          (item) => {
            const active =
              isActivePath(
                pathname,
                item.href
              );

            return (
              <Link
                key={
                  item.href
                }
                href={
                  item.href
                }
                download={item.href.startsWith("/api/tarifario") ? "EnfriAr_Tarifario_Interno_2026.pdf" : undefined}
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                style={{
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  minHeight:
                    "38px",
                  padding:
                    "8px 13px",
                  borderRadius:
                    "9px",
                  border:
                    active
                      ? "2px solid #1947bb"
                      : "2px solid #758e9e",
                  background:
                    active
                      ? "#1d4ed8"
                      : "#e2edf4",
                  color:
                    active
                      ? "#ffffff"
                      : "#17384b",
                  fontSize:
                    "14px",
                  fontWeight:
                    active
                      ? 700
                      : 600,
                  textDecoration:
                    "none",
                  transition:
                    "background-color 0.15s ease, border-color 0.15s ease",
                }}
              >
                {
                  item.label
                }
              </Link>
            );
          }
        )}
      </div>
    </nav>
  );
}
