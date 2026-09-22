import type {
  Metadata,
} from "next";

import InformeDetalleForm from "./InformeDetalleForm";

export const metadata: Metadata = {
  title:
    "Informes y detalles",
};

export default function InformesDetallesPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding:
          "28px 18px 48px",
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
            marginBottom:
              "20px",
          }}
        >
          <p
            style={{
              margin:
                "0 0 6px",
              color:
                "var(--brand-blue)",
              fontSize:
                "0.78rem",
              fontWeight: 800,
              letterSpacing:
                "0.12em",
              textTransform:
                "uppercase",
            }}
          >
            Enfri.Ar Refrigeración
          </p>

          <h1
            style={{
              margin: 0,
              color:
                "var(--foreground)",
              fontSize:
                "clamp(1.7rem, 5vw, 2.4rem)",
            }}
          >
            Informes y detalles de trabajo
          </h1>

          <p
            style={{
              margin:
                "10px 0 0",
              color:
                "var(--muted)",
              lineHeight: 1.6,
            }}
          >
            Registro de detalles de trabajo, notas mensuales e informes cuatrimestrales. El presupuesto es opcional y puede vincularse buscando solamente por su número.
          </p>
        </header>

        <InformeDetalleForm />
      </div>
    </main>
  );
}
