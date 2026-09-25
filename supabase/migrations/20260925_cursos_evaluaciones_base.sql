-- Enfri.Ar Formación - estructura inicial del módulo privado.
-- No publica respuestas correctas ni datos personales mediante tablas públicas.

create extension if not exists pgcrypto;

create table if not exists public.formacion_sedes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.formacion_cursos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.formacion_comisiones (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.formacion_sedes(id) on delete restrict,
  curso_id uuid not null references public.formacion_cursos(id) on delete restrict,
  anio integer not null check (anio between 2020 and 2100),
  cuatrimestre smallint not null check (cuatrimestre in (1, 2)),
  nombre text,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  unique (sede_id, curso_id, anio, cuatrimestre)
);

create table if not exists public.formacion_alumnos (
  id uuid primary key default gen_random_uuid(),
  dni text not null unique check (length(trim(dni)) between 7 and 12),
  apellido text not null,
  nombre text not null,
  email text,
  telefono text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.formacion_inscripciones (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.formacion_alumnos(id) on delete restrict,
  comision_id uuid not null references public.formacion_comisiones(id) on delete restrict,
  estado text not null default 'cursando' check (estado in ('cursando', 'finalizado', 'baja')),
  created_at timestamptz not null default now(),
  unique (alumno_id, comision_id)
);

create table if not exists public.formacion_evaluaciones (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references public.formacion_cursos(id) on delete restrict,
  titulo text not null,
  descripcion text,
  puntaje_aprobacion numeric(5,2) not null default 70 check (puntaje_aprobacion between 0 and 100),
  duracion_minutos integer check (duracion_minutos is null or duracion_minutos between 5 and 480),
  intentos_permitidos integer not null default 1 check (intentos_permitidos between 1 and 10),
  mezclar_preguntas boolean not null default true,
  mezclar_opciones boolean not null default true,
  activa boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.formacion_preguntas (
  id uuid primary key default gen_random_uuid(),
  evaluacion_id uuid not null references public.formacion_evaluaciones(id) on delete cascade,
  orden integer not null check (orden > 0),
  enunciado text not null,
  tipo text not null check (tipo in ('opcion_unica', 'opcion_multiple', 'numero', 'texto', 'practica')),
  puntaje numeric(7,2) not null default 1 check (puntaje > 0),
  requiere_revision_manual boolean not null default false,
  explicacion_docente text,
  created_at timestamptz not null default now(),
  unique (evaluacion_id, orden)
);

create table if not exists public.formacion_opciones (
  id uuid primary key default gen_random_uuid(),
  pregunta_id uuid not null references public.formacion_preguntas(id) on delete cascade,
  orden integer not null check (orden > 0),
  texto text not null,
  es_correcta boolean not null default false,
  unique (pregunta_id, orden)
);

create table if not exists public.formacion_asignaciones (
  id uuid primary key default gen_random_uuid(),
  evaluacion_id uuid not null references public.formacion_evaluaciones(id) on delete restrict,
  comision_id uuid not null references public.formacion_comisiones(id) on delete restrict,
  disponible_desde timestamptz,
  disponible_hasta timestamptz,
  publicada boolean not null default false,
  created_at timestamptz not null default now(),
  unique (evaluacion_id, comision_id),
  check (disponible_hasta is null or disponible_desde is null or disponible_hasta > disponible_desde)
);

create table if not exists public.formacion_intentos (
  id uuid primary key default gen_random_uuid(),
  asignacion_id uuid not null references public.formacion_asignaciones(id) on delete restrict,
  inscripcion_id uuid not null references public.formacion_inscripciones(id) on delete restrict,
  numero_intento integer not null default 1 check (numero_intento > 0),
  iniciado_at timestamptz not null default now(),
  entregado_at timestamptz,
  puntaje_automatico numeric(7,2),
  puntaje_manual numeric(7,2),
  porcentaje_final numeric(5,2) check (porcentaje_final is null or porcentaje_final between 0 and 100),
  estado text not null default 'en_curso' check (estado in ('en_curso', 'pendiente', 'aprobado', 'desaprobado', 'anulado')),
  observacion_docente text,
  revisado_por uuid references auth.users(id) on delete set null,
  revisado_at timestamptz,
  unique (asignacion_id, inscripcion_id, numero_intento)
);

create table if not exists public.formacion_respuestas (
  id uuid primary key default gen_random_uuid(),
  intento_id uuid not null references public.formacion_intentos(id) on delete cascade,
  pregunta_id uuid not null references public.formacion_preguntas(id) on delete restrict,
  opcion_id uuid references public.formacion_opciones(id) on delete restrict,
  respuesta_texto text,
  respuesta_numero numeric,
  correcta boolean,
  puntaje_obtenido numeric(7,2),
  observacion_docente text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (intento_id, pregunta_id)
);

create index if not exists formacion_comisiones_periodo_idx
  on public.formacion_comisiones (anio desc, cuatrimestre, sede_id);
create index if not exists formacion_intentos_estado_idx
  on public.formacion_intentos (estado, entregado_at desc);

alter table public.formacion_sedes enable row level security;
alter table public.formacion_cursos enable row level security;
alter table public.formacion_comisiones enable row level security;
alter table public.formacion_alumnos enable row level security;
alter table public.formacion_inscripciones enable row level security;
alter table public.formacion_evaluaciones enable row level security;
alter table public.formacion_preguntas enable row level security;
alter table public.formacion_opciones enable row level security;
alter table public.formacion_asignaciones enable row level security;
alter table public.formacion_intentos enable row level security;
alter table public.formacion_respuestas enable row level security;

do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'formacion_sedes', 'formacion_cursos', 'formacion_comisiones',
    'formacion_alumnos', 'formacion_inscripciones', 'formacion_evaluaciones',
    'formacion_preguntas', 'formacion_opciones', 'formacion_asignaciones',
    'formacion_intentos', 'formacion_respuestas'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', tabla || '_solo_admin', tabla);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.is_enfri_admin())) with check ((select public.is_enfri_admin()))',
      tabla || '_solo_admin', tabla
    );
  end loop;
end $$;

insert into public.formacion_sedes (nombre)
values ('Merlo'), ('Agraria')
on conflict (nombre) do nothing;

insert into public.formacion_cursos (nombre, descripcion)
values
  ('Aire acondicionado Split', 'Instalación, diagnóstico y mantenimiento de equipos Split.'),
  ('Tecnología Inverter', 'Diagnóstico y funcionamiento de equipos Inverter.')
on conflict (nombre) do nothing;
