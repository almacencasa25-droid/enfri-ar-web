import Link from "next/link";
import {
  BookOpenCheck,
  Building2,
  CalendarRange,
  ChevronLeft,
  CircleDot,
  ClipboardCheck,
  GraduationCap,
  LogOut,
  Users,
} from "lucide-react";

import { logoutCursos } from "@/app/admin/cursos/login/actions";
import { requireCursosAdminUser } from "@/lib/auth/cursos";
import { createCursosSupabaseServerClient } from "@/lib/supabase/cursos-server";

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
  const adminUser = await requireCursosAdminUser();
  const supabase = await createCursosSupabaseServerClient();

  const [sedes, cursos, alumnos, evaluaciones, pendientes] = await Promise.all([
    supabase.from("formacion_sedes").select("id", { count: "exact", head: true }),
    supabase.from("formacion_cursos").select("id", { count: "exact", head: true }),
    supabase.from("formacion_alumnos").select("id", { count: "exact", head: true }),
    supabase.from("formacion_evaluaciones").select("id", { count: "exact", head: true }),
    supabase.from("formacion_intentos").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
  ]);

  const resumen = [
    { etiqueta: "Sedes", valor: sedes.count ?? 0 },
    { etiqueta: "Cursos", valor: cursos.count ?? 0 },
    { etiqueta: "Alumnos", valor: alumnos.count ?? 0 },
    { etiqueta: "Evaluaciones", valor: evaluaciones.count ?? 0 },
    { etiqueta: "Por revisar", valor: pendientes.count ?? 0 },
  ];

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
          <div className={styles.sesion}>
            <small>{adminUser.email}</small>
            <form action={logoutCursos}>
              <button type="submit">
                <LogOut size={16} aria-hidden="true" />
                Salir
              </button>
            </form>
          </div>
        </header>

        <section className={styles.resumen} aria-label="Resumen del módulo">
          {resumen.map((item) => (
            <div key={item.etiqueta}>
              <strong>{item.valor}</strong>
              <span>{item.etiqueta}</span>
            </div>
          ))}
        </section>

        <section className={styles.aviso} aria-label="Estado de preparación">
          <CircleDot size={19} aria-hidden="true" />
          <div>
            <strong>Base independiente conectada</strong>
            <p>
              Cursos y Evaluaciones funciona separado de Renacli, presupuestos
              y clientes. La próxima etapa habilitará la carga y edición.
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
