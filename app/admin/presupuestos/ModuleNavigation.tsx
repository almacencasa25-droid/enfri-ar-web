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
          "1px solid #d9dee7",
        borderRadius:
          "14px",
        background:
          "#ffffff",
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
                      ? "1px solid #1d4ed8"
                      : "1px solid #d9dee7",
                  background:
                    active
                      ? "#1d4ed8"
                      : "#f8fafc",
                  color:
                    active
                      ? "#ffffff"
                      : "#1f2937",
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
