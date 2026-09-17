import Link from "next/link";

export const metadata = {
  title: "Presupuestos realizados",
};

export default function PresupuestosRealizadosPage() {
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
            padding: "24px",
            border: "1px solid rgba(38, 40, 42, 0.12)",
            borderRadius: "18px",
            background: "rgba(255, 253, 248, 0.92)",
            boxShadow: "0 14px 35px rgba(38, 40, 42, 0.08)",
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
            Presupuestos · Enfri.Ar
          </p>

          <h1
            style={{
              margin: 0,
              color: "var(--foreground)",
              fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
            }}
          >
            Presupuestos realizados
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "var(--muted)",
              lineHeight: 1.6,
            }}
          >
            La ruta ya está creada. En el próximo paso conectamos búsqueda,
            estados, modificación, duplicado, anulación y documentos.
          </p>
        </header>

        <div
          style={{
            marginTop: "20px",
          }}
        >
          <Link
            href="/admin/presupuestos"
            style={{
              color: "var(--foreground)",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            ← Volver a Presupuestos y trabajos
          </Link>
        </div>
      </div>
    </main>
  );
}
