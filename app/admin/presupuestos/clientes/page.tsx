import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import ClienteEditor from "./ClienteEditor";

export const metadata = {
  title: "Clientes",
};

export default async function ClientesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: clientes, error } = await supabase
    .from("clientes")
    .select(`
      id,
      nombre,
      apellido,
      razon_social,
      dni,
      cuit,
      telefono,
      email,
      direccion,
      localidad,
      observaciones,
      activo
    `)
    .order("activo", {
      ascending: false,
    })
    .order("apellido", {
      ascending: true,
      nullsFirst: false,
    })
    .order("nombre", {
      ascending: true,
      nullsFirst: false,
    });

  const cardStyle = {
    border: "1px solid rgba(38, 40, 42, 0.12)",
    borderRadius: "18px",
    background: "rgba(255, 253, 248, 0.92)",
    boxShadow: "0 14px 35px rgba(38, 40, 42, 0.08)",
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
            Clientes
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "var(--muted)",
              lineHeight: 1.6,
            }}
          >
            Administrá los clientes que después podrán seleccionarse al crear
            presupuestos y documentación.
          </p>
        </header>

        <section
          style={{
            ...cardStyle,
            marginTop: "20px",
            padding: "22px",
          }}
        >
          <h2
            style={{
              margin: "0 0 6px",
              color: "var(--foreground)",
              fontSize: "1.25rem",
            }}
          >
            Agregar nuevo cliente
          </h2>

          <p
            style={{
              margin: "0 0 18px",
              color: "var(--muted)",
              lineHeight: 1.5,
            }}
          >
            Podés registrar una persona, comercio o empresa. La dirección es
            obligatoria.
          </p>

          <ClienteEditor />
        </section>

        {error ? (
          <div
            style={{
              marginTop: "20px",
              padding: "18px",
              borderRadius: "14px",
              background: "rgba(180, 40, 40, 0.08)",
              color: "#8b1f1f",
              fontWeight: 700,
            }}
          >
            No se pudieron cargar los clientes.
          </div>
        ) : null}

        <section
          style={{
            ...cardStyle,
            marginTop: "20px",
            padding: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "var(--foreground)",
                fontSize: "1.25rem",
              }}
            >
              Clientes registrados
            </h2>

            <span
              style={{
                color: "var(--muted)",
                fontSize: "0.88rem",
                fontWeight: 700,
              }}
            >
              {clientes?.length ?? 0} registrados
            </span>
          </div>

          {!clientes || clientes.length === 0 ? (
            <p
              style={{
                margin: 0,
                color: "var(--muted)",
              }}
            >
              Todavía no hay clientes cargados.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {clientes.map((cliente) => {
                const nombreMostrar =
                  cliente.razon_social ||
                  [cliente.nombre, cliente.apellido]
                    .filter(Boolean)
                    .join(" ");

                return (
                  <article
                    key={cliente.id}
                    style={{
                      padding: "16px",
                      border: "1px solid rgba(38, 40, 42, 0.1)",
                      borderRadius: "13px",
                      background: cliente.activo
                        ? "rgba(255, 255, 255, 0.7)"
                        : "rgba(38, 40, 42, 0.035)",
                      opacity: cliente.activo ? 1 : 0.72,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          minWidth: 0,
                          flex: "1 1 320px",
                        }}
                      >
                        <h3
                          style={{
                            margin: "0 0 7px",
                            color: "var(--foreground)",
                            fontSize: "1rem",
                          }}
                        >
                          {nombreMostrar || "Cliente sin nombre"}
                        </h3>

                        <div
                          style={{
                            display: "grid",
                            gap: "4px",
                            color: "var(--muted)",
                            fontSize: "0.88rem",
                            lineHeight: 1.45,
                          }}
                        >
                          {cliente.dni ? (
                            <span>DNI: {cliente.dni}</span>
                          ) : null}

                          {cliente.cuit ? (
                            <span>CUIT: {cliente.cuit}</span>
                          ) : null}

                          {cliente.telefono ? (
                            <span>Tel.: {cliente.telefono}</span>
                          ) : null}

                          {cliente.email ? (
                            <span>{cliente.email}</span>
                          ) : null}

                          <span>
                            {cliente.direccion}
                            {cliente.localidad
                              ? ` · ${cliente.localidad}`
                              : ""}
                          </span>
                        </div>
                      </div>

                      <strong
                        style={{
                          color: cliente.activo
                            ? "#236b43"
                            : "#8a4f1d",
                          whiteSpace: "nowrap",
                          fontSize: "0.86rem",
                        }}
                      >
                        {cliente.activo ? "Activo" : "Inactivo"}
                      </strong>
                    </div>

                    {cliente.observaciones ? (
                      <p
                        style={{
                          margin: "12px 0 0",
                          paddingTop: "12px",
                          borderTop:
                            "1px solid rgba(38, 40, 42, 0.08)",
                          color: "var(--muted)",
                          fontSize: "0.84rem",
                          lineHeight: 1.5,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {cliente.observaciones}
                      </p>
                    ) : null}

                    <ClienteEditor cliente={cliente} />
                  </article>
                );
              })}
            </div>
          )}
        </section>

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
