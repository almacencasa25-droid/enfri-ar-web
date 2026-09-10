import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  ExternalLink,
  Images,
  LogOut,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { logoutAdmin } from "@/app/admin/actions";
import { requireAdminUser } from "@/lib/auth/admin";

export const metadata = {
  title: "Panel Administrador",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const adminUser = await requireAdminUser();

  const cardStyle = {
    border: "1px solid rgba(38, 40, 42, 0.12)",
    borderRadius: "18px",
    background: "rgba(255, 253, 248, 0.9)",
    boxShadow: "0 14px 35px rgba(38, 40, 42, 0.08)",
    backdropFilter: "blur(12px)",
  };

  const actionLinkStyle = {
    minHeight: "42px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    marginTop: "18px",
    padding: "9px 14px",
    borderRadius: "10px",
    background: "var(--foreground)",
    color: "#ffffff",
    fontSize: "0.88rem",
    fontWeight: 800,
    textDecoration: "none",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 18px 48px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            ...cardStyle,
            padding: "24px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "18px",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 6px",
                  color: "var(--brand-blue)",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Enfri.Ar Refrigeración
              </p>

              <h1
                style={{
                  margin: 0,
                  color: "var(--foreground)",
                  fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
                  lineHeight: 1.1,
                }}
              >
                Panel Administrador
              </h1>

              <p
                style={{
                  margin: "10px 0 0",
                  color: "var(--muted)",
                  lineHeight: 1.55,
                }}
              >
                Administración interna del sitio web de Enfri.Ar.
              </p>
            </div>

            <form action={logoutAdmin}>
              <button
                type="submit"
                style={{
                  minHeight: "44px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  border: "1px solid rgba(38, 40, 42, 0.16)",
                  borderRadius: "11px",
                  background: "var(--foreground)",
                  color: "#ffffff",
                  font: "inherit",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <LogOut size={17} aria-hidden="true" />
                Cerrar sesión
              </button>
            </form>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "20px",
              paddingTop: "18px",
              borderTop: "1px solid rgba(38, 40, 42, 0.1)",
              color: "var(--muted)",
              fontSize: "0.9rem",
              lineHeight: 1.5,
            }}
          >
            <ShieldCheck
              size={18}
              aria-hidden="true"
              style={{
                flexShrink: 0,
                color: "var(--brand-blue-light)",
              }}
            />

            <span>
              Sesión administrativa verificada
              {adminUser.email ? (
                <>
                  {" "}
                  · <strong>{adminUser.email}</strong>
                </>
              ) : null}
            </span>
          </div>
        </header>

        <section
          aria-labelledby="admin-tools-title"
          style={{
            marginTop: "24px",
          }}
        >
          <div
            style={{
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                margin: "0 0 5px",
                color: "var(--brand-blue)",
                fontSize: "0.76rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Administración
            </p>

            <h2
              id="admin-tools-title"
              style={{
                margin: 0,
                color: "var(--foreground)",
                fontSize: "clamp(1.35rem, 4vw, 1.8rem)",
              }}
            >
              Herramientas del sitio
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
            }}
          >
            <article
              style={{
                ...cardStyle,
                padding: "22px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: "16px",
                  borderRadius: "12px",
                  background: "rgba(47, 143, 134, 0.11)",
                  color: "var(--brand-blue-light)",
                }}
              >
                <ClipboardList size={22} aria-hidden="true" />
              </div>

              <h3
                style={{
                  margin: "0 0 8px",
                  color: "var(--foreground)",
                  fontSize: "1.12rem",
                }}
              >
                Consultas recibidas
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "var(--muted)",
                  lineHeight: 1.6,
                }}
              >
                Revisá las consultas enviadas desde el formulario
                público y administrá el estado de cada solicitud.
              </p>

              <Link
                href="/admin/consultas"
                style={actionLinkStyle}
              >
                Abrir consultas
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </article>

            <article
              style={{
                ...cardStyle,
                padding: "22px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: "16px",
                  borderRadius: "12px",
                  background: "rgba(216, 148, 40, 0.12)",
                  color: "var(--brand-orange)",
                }}
              >
                <Settings size={22} aria-hidden="true" />
              </div>

              <h3
                style={{
                  margin: "0 0 8px",
                  color: "var(--foreground)",
                  fontSize: "1.12rem",
                }}
              >
                Configuración del sitio
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "var(--muted)",
                  lineHeight: 1.6,
                }}
              >
                Modificá WhatsApp, teléfono, correo, web,
                dirección y otros datos públicos sin tocar código.
              </p>

              <Link
                href="/admin/configuracion"
                style={actionLinkStyle}
              >
                Abrir configuración
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </article>

            <article
              style={{
                ...cardStyle,
                padding: "22px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: "16px",
                  borderRadius: "12px",
                  background: "rgba(51, 105, 167, 0.11)",
                  color: "#285887",
                }}
              >
                <Images size={22} aria-hidden="true" />
              </div>

              <h3
                style={{
                  margin: "0 0 8px",
                  color: "var(--foreground)",
                  fontSize: "1.12rem",
                }}
              >
                Galería de trabajos
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "var(--muted)",
                  lineHeight: 1.6,
                }}
              >
                Subí fotos reales de trabajos, cambiá su orden,
                ocultalas o eliminálas desde el Administrador.
              </p>

              <Link
                href="/admin/galeria"
                style={actionLinkStyle}
              >
                Abrir galería
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </article>
          </div>
        </section>

        <footer
          style={{
            ...cardStyle,
            marginTop: "20px",
            padding: "18px 22px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "var(--muted)",
              fontSize: "0.9rem",
            }}
          >
            Área privada · Enfri.Ar Refrigeración
          </p>

          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              color: "var(--foreground)",
              fontSize: "0.9rem",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Ver sitio público
            <ExternalLink size={15} aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </main>
  );
}
