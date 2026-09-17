import Link from "next/link";
import {
  Calculator,
  ClipboardList,
  FileText,
  HardHat,
  Users,
  Wrench,
} from "lucide-react";

const cardStyle = {
  border: "1px solid rgba(38, 40, 42, 0.12)",
  borderRadius: "18px",
  background: "rgba(255, 253, 248, 0.92)",
  boxShadow: "0 14px 35px rgba(38, 40, 42, 0.08)",
  backdropFilter: "blur(12px)",
};

const linkStyle = {
  minHeight: "42px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: "16px",
  padding: "9px 14px",
  borderRadius: "10px",
  background: "var(--foreground)",
  color: "#ffffff",
  fontSize: "0.88rem",
  fontWeight: 800,
  textDecoration: "none",
};

export default function PresupuestosPage() {
  const opciones = [
    {
      titulo: "Crear presupuesto",
      descripcion:
        "Crear un nuevo presupuesto con cliente, trabajos, cantidades, precios y condiciones.",
      href: "/admin/presupuestos/nuevo",
      icono: Calculator,
    },
    {
      titulo: "Presupuestos realizados",
      descripcion:
        "Buscar, revisar, modificar, duplicar, anular y consultar presupuestos anteriores.",
      href: "/admin/presupuestos/listado",
      icono: ClipboardList,
    },
    {
      titulo: "Clientes",
      descripcion:
        "Administrar clientes y consultar sus datos e historial de presupuestos.",
      href: "/admin/presupuestos/clientes",
      icono: Users,
    },
    {
      titulo: "Trabajos y precios",
      descripcion:
        "Administrar trabajos precargados, detalles, categorías y precios unitarios.",
      href: "/admin/presupuestos/trabajos",
      icono: Wrench,
    },
    {
      titulo: "Técnicos",
      descripcion:
        "Administrar técnicos, matrícula, vencimiento, especialidad, foto y credencial.",
      href: "/admin/presupuestos/equipo-tecnico",
      icono: HardHat,
    },
    {
      titulo: "Documentos",
      descripcion:
        "Acceso a órdenes de trabajo, conformidades y documentos vinculados.",
      href: "/admin/presupuestos/documentos",
      icono: FileText,
    },
  ];

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
            marginBottom: "24px",
          }}
        >
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
            Presupuestos y trabajos
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "var(--muted)",
              lineHeight: 1.6,
            }}
          >
            Módulo administrativo independiente para presupuestos, clientes,
            trabajos, técnicos y documentación.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
          }}
        >
          {opciones.map((opcion) => {
            const Icono = opcion.icono;

            return (
              <article
                key={opcion.href}
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
                  <Icono size={22} aria-hidden="true" />
                </div>

                <h2
                  style={{
                    margin: "0 0 8px",
                    color: "var(--foreground)",
                    fontSize: "1.12rem",
                  }}
                >
                  {opcion.titulo}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "var(--muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {opcion.descripcion}
                </p>

                <Link href={opcion.href} style={linkStyle}>
                  Abrir
                </Link>
              </article>
            );
          })}
        </section>

        <div
          style={{
            marginTop: "20px",
          }}
        >
          <Link
            href="/admin"
            style={{
              color: "var(--foreground)",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            ← Volver al administrador
          </Link>
        </div>
      </div>
    </main>
  );
}
