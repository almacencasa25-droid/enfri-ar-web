import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Información sobre el tratamiento de datos enviados a través del sitio web de Enfri.Ar Refrigeración.",

  alternates: {
    canonical: "/privacidad",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 18px",
      }}
    >
      <article
        style={{
          width: "100%",
          maxWidth: "850px",
          margin: "0 auto",
          padding: "28px",
          border: "1px solid rgba(38, 40, 42, 0.12)",
          borderRadius: "20px",
          background: "rgba(255, 253, 248, 0.94)",
          boxShadow: "0 14px 35px rgba(38, 40, 42, 0.08)",
          lineHeight: 1.7,
        }}
      >
        <p
          style={{
            margin: "0 0 7px",
            color: "var(--brand-blue)",
            fontSize: "0.78rem",
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Enfri.Ar Refrigeración
        </p>

        <h1
          style={{
            margin: "0 0 24px",
            color: "var(--foreground)",
          }}
        >
          Política de privacidad
        </h1>

        <h2>Datos que recopilamos</h2>

        <p>
          Cuando una persona utiliza el formulario de contacto,
          Enfri.Ar puede recibir los siguientes datos:
        </p>

        <ul>
          <li>Nombre y apellido.</li>
          <li>Teléfono.</li>
          <li>Correo electrónico, cuando se informa.</li>
          <li>Localidad.</li>
          <li>Tipo de servicio solicitado.</li>
          <li>Contenido de la consulta enviada.</li>
        </ul>

        <h2>Finalidad</h2>

        <p>
          Los datos enviados mediante el formulario se utilizan
          para recibir, analizar, responder y gestionar la consulta
          o solicitud de servicio realizada por la persona.
        </p>

        <h2>Almacenamiento y acceso</h2>

        <p>
          Las consultas quedan almacenadas en los sistemas
          utilizados por Enfri.Ar para administrar el sitio web.
          El acceso a esas consultas está restringido al área
          administrativa autorizada.
        </p>

        <h2>Uso de la información</h2>

        <p>
          Enfri.Ar no solicita mediante este formulario datos
          personales que no sean necesarios para gestionar la
          consulta. La información enviada no debe utilizarse para
          una finalidad distinta de la gestión de esa solicitud
          sin informar previamente a la persona.
        </p>

        <h2>Conservación</h2>

        <p>
          Las consultas pueden conservarse mientras sean necesarias
          para su seguimiento, atención o registro administrativo,
          y posteriormente pueden ser cerradas o eliminadas según
          corresponda.
        </p>

        <h2>Consultas sobre los datos enviados</h2>

        <p>
          Si una persona necesita consultar, corregir o solicitar
          la eliminación de información que haya enviado a
          Enfri.Ar, puede comunicarse mediante los canales de
          contacto publicados en este sitio.
        </p>

        <h2>Actualizaciones</h2>

        <p>
          Esta política puede actualizarse si cambian los datos
          recopilados, las funciones del sitio o la forma en que
          se gestionan las consultas.
        </p>

        <div
          style={{
            marginTop: "30px",
            paddingTop: "20px",
            borderTop: "1px solid rgba(38, 40, 42, 0.1)",
          }}
        >
          <Link
            href="/"
            style={{
              fontWeight: 800,
              color: "var(--foreground)",
            }}
          >
            ← Volver a Enfri.Ar
          </Link>
        </div>
      </article>
    </main>
  );
}
