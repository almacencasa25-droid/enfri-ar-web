import Link from "next/link";
import {
  BookOpenCheck,
  Building2,
  CalendarRange,
  ChevronLeft,
  CircleDot,
  ClipboardCheck,
  GraduationCap,
  Users,
} from "lucide-react";

import { requireAdminUser } from "@/lib/auth/admin";

import styles from "./cursos.module.css";

const opciones = [
  {
    titulo: "Sedes y períodos",
    descripcion:
      "Administrar Merlo, Agraria, años y primer o segundo cuatrimestre.",
    icono: Building2,
    estado: "Preparado",
  },
  {
    titulo: "Cursos y comisiones",
    descripcion:
      "Separar cursos de Split, Inverter y futuras capacitaciones.",
    icono: CalendarRange,
    estado: "Preparado",
  },
  {
    titulo: "Alumnos",
    descripcion:
      "Inscribir alumnos, asignarlos a una comisión y conservar su historial.",
    icono: Users,
    estado: "Preparado",
  },
  {
    titulo: "Evaluaciones",
    descripcion:
      "Crear preguntas automáticas y marcar ejercicios prácticos para revisión manual.",
    icono: BookOpenCheck,
    estado: "Preparado",
  },
  {
    titulo: "Resultados",
    descripcion:
      "Consultar aprobados, desaprobados, pendientes y alumnos que no rindieron.",
    icono: ClipboardCheck,
    estado: "Preparado",
  },
];

const estados = [
  { clase: styles.aprobado, etiqueta: "Aprobado", detalle: "Corrección final completa" },
  { clase: styles.pendiente, etiqueta: "Pendiente", detalle: "Revisión o práctico pendiente" },
  { clase: styles.desaprobado, etiqueta: "Desaprobado", detalle: "No alcanzó el mínimo" },
  { clase: styles.ausente, etiqueta: "Sin realizar", detalle: "Todavía no entregó" },
];

export default async function CursosPage() {
  await requireAdminUser();

  return (
    <main className={styles.main}>
      <div className={styles.contenedor}>
        <header className={styles.encabezado}>
          <div className={styles.tituloIcono}>
            <GraduationCap size={28} aria-hidden="true" />
          </div>
          <div>
            <p className={styles.marca}>Enfri.Ar Formación</p>
            <h1>Cursos y evaluaciones</h1>
            <p className={styles.bajada}>
              Administración privada de cursadas, evaluaciones automáticas,
              trabajos prácticos y resultados por sede y cuatrimestre.
            </p>
          </div>
        </header>

        <section className={styles.aviso} aria-label="Estado de preparación">
          <CircleDot size={19} aria-hidden="true" />
          <div>
            <strong>Primera etapa en preparación</strong>
            <p>
              La estructura del módulo está separada de presupuestos y clientes.
              La carga de alumnos y evaluaciones se habilitará después de aplicar
              la base de datos protegida.
            </p>
          </div>
        </section>

        <section className={styles.grilla} aria-label="Funciones del módulo">
          {opciones.map((opcion) => {
            const Icono = opcion.icono;
            return (
              <article className={styles.tarjeta} key={opcion.titulo}>
                <div className={styles.icono}>
                  <Icono size={22} aria-hidden="true" />
                </div>
                <div className={styles.tarjetaTitulo}>
                  <h2>{opcion.titulo}</h2>
                  <span>{opcion.estado}</span>
                </div>
                <p>{opcion.descripcion}</p>
              </article>
            );
          })}
        </section>

        <section className={styles.leyenda} aria-labelledby="estados-title">
          <h2 id="estados-title">Estados de los alumnos</h2>
          <div className={styles.estados}>
            {estados.map((estado) => (
              <div className={styles.estado} key={estado.etiqueta}>
                <span className={estado.clase} aria-hidden="true" />
                <div>
                  <strong>{estado.etiqueta}</strong>
                  <small>{estado.detalle}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Link className={styles.volver} href="/admin">
          <ChevronLeft size={17} aria-hidden="true" />
          Volver al administrador
        </Link>
      </div>
    </main>
  );
}
