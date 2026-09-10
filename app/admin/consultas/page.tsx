import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { updateContactRequestStatus } from "@/app/admin/consultas/actions";
import {
  getContactRequests,
  type ContactRequest,
  type ContactRequestStatus,
} from "@/lib/admin/contact-requests";

import styles from "./consultas.module.css";

export const metadata = {
  title: "Consultas recibidas",
  robots: {
    index: false,
    follow: false,
  },
};

const statusLabels: Record<ContactRequestStatus, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  respondida: "Respondida",
  cerrada: "Cerrada",
};

const serviceLabels: Record<string, string> = {
  instalacion_split: "Instalación de Split",
  piso_techo: "Equipo Piso-Techo",
  reparacion_diagnostico: "Reparación / Diagnóstico",
  mantenimiento_limpieza: "Mantenimiento / Limpieza",
  otro: "Otro",
};

const groupDescriptions: Record<ContactRequestStatus, string> = {
  pendiente: "Consultas nuevas que todavía no fueron revisadas.",
  en_revision: "Consultas que actualmente estás revisando.",
  respondida: "Consultas que ya fueron atendidas o respondidas.",
  cerrada: "Consultas finalizadas que quedan guardadas como historial.",
};

function getStatusClass(status: ContactRequestStatus) {
  switch (status) {
    case "pendiente":
      return styles.statusPendiente;

    case "en_revision":
      return styles.statusRevision;

    case "respondida":
      return styles.statusRespondida;

    case "cerrada":
      return styles.statusCerrada;

    default:
      return "";
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
}

function ContactRequestCard({
  request,
}: {
  request: ContactRequest;
}) {
  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <div className={styles.person}>
          <h3 className={styles.personName}>
            {request.full_name}
          </h3>

          <p className={styles.date}>
            Recibida el {formatDate(request.created_at)}
          </p>
        </div>

        <span
          className={`${styles.status} ${getStatusClass(
            request.status
          )}`}
        >
          {statusLabels[request.status]}
        </span>
      </header>

      <div className={styles.cardBody}>
        <div className={styles.details}>
          <div className={styles.detail}>
            <span className={styles.detailLabel}>
              Teléfono
            </span>

            <p className={styles.detailValue}>
              <a
                className={styles.detailLink}
                href={`tel:${request.phone}`}
              >
                {request.phone}
              </a>
            </p>
          </div>

          <div className={styles.detail}>
            <span className={styles.detailLabel}>
              Correo electrónico
            </span>

            <p className={styles.detailValue}>
              {request.email ? (
                <a
                  className={styles.detailLink}
                  href={`mailto:${request.email}`}
                >
                  {request.email}
                </a>
              ) : (
                "No informado"
              )}
            </p>
          </div>

          <div className={styles.detail}>
            <span className={styles.detailLabel}>
              Localidad
            </span>

            <p className={styles.detailValue}>
              {request.locality}
            </p>
          </div>

          <div className={styles.detail}>
            <span className={styles.detailLabel}>
              Tipo de servicio
            </span>

            <p className={styles.detailValue}>
              {serviceLabels[request.service_type] ??
                request.service_type}
            </p>
          </div>
        </div>

        <div className={styles.messageBox}>
          <p className={styles.messageLabel}>
            Consulta
          </p>

          <p className={styles.message}>
            {request.message}
          </p>
        </div>

        <div className={styles.actions}>
          <form
            action={updateContactRequestStatus}
            className={styles.statusForm}
          >
            <input
              type="hidden"
              name="id"
              value={request.id}
            />

            <div className={styles.selectGroup}>
              <label
                className={styles.selectLabel}
                htmlFor={`status-${request.id}`}
              >
                Estado
              </label>

              <select
                key={`${request.id}-${request.status}`}
                className={styles.select}
                id={`status-${request.id}`}
                name="status"
                defaultValue={request.status}
              >
                <option value="pendiente">
                  Pendiente
                </option>

                <option value="en_revision">
                  En revisión
                </option>

                <option value="respondida">
                  Respondida
                </option>

                <option value="cerrada">
                  Cerrada
                </option>
              </select>
            </div>

            <button
              type="submit"
              className={styles.button}
            >
              Guardar estado
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}

export default async function AdminConsultasPage() {
  const requests = await getContactRequests();

  const groupedRequests: Record<
    ContactRequestStatus,
    ContactRequest[]
  > = {
    pendiente: requests.filter(
      (request) => request.status === "pendiente"
    ),

    en_revision: requests.filter(
      (request) => request.status === "en_revision"
    ),

    respondida: requests.filter(
      (request) => request.status === "respondida"
    ),

    cerrada: requests.filter(
      (request) => request.status === "cerrada"
    ),
  };

  const totals = {
    pendiente: groupedRequests.pendiente.length,
    en_revision: groupedRequests.en_revision.length,
    respondida: groupedRequests.respondida.length,
    cerrada: groupedRequests.cerrada.length,
  };

  const groups: {
    status: ContactRequestStatus;
    defaultOpen: boolean;
  }[] = [
    {
      status: "pendiente",
      defaultOpen: true,
    },
    {
      status: "en_revision",
      defaultOpen: true,
    },
    {
      status: "respondida",
      defaultOpen: false,
    },
    {
      status: "cerrada",
      defaultOpen: false,
    },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <p className={styles.eyebrow}>
                Enfri.Ar Refrigeración
              </p>

              <h1 className={styles.title}>
                Consultas recibidas
              </h1>

              <p className={styles.description}>
                Las consultas están organizadas por estado.
                Podés desplegar solamente el grupo que necesites
                y cada sección mantiene su propio desplazamiento
                interno.
              </p>
            </div>

            <Link
              href="/admin"
              className={styles.backLink}
            >
              <ArrowLeft size={17} aria-hidden="true" />
              Volver al panel
            </Link>
          </div>
        </header>

        <section
          className={styles.summary}
          aria-label="Resumen de consultas"
        >
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>
              Pendientes
            </p>

            <p className={styles.summaryValue}>
              {totals.pendiente}
            </p>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>
              En revisión
            </p>

            <p className={styles.summaryValue}>
              {totals.en_revision}
            </p>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>
              Respondidas
            </p>

            <p className={styles.summaryValue}>
              {totals.respondida}
            </p>
          </article>

          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>
              Cerradas
            </p>

            <p className={styles.summaryValue}>
              {totals.cerrada}
            </p>
          </article>
        </section>

        {requests.length === 0 ? (
          <section className={styles.empty}>
            <h2 className={styles.emptyTitle}>
              Todavía no hay consultas
            </h2>

            <p className={styles.emptyText}>
              Las nuevas solicitudes enviadas desde el formulario
              público aparecerán automáticamente en esta sección.
            </p>
          </section>
        ) : (
          <section
            className={styles.groups}
            aria-label="Consultas agrupadas por estado"
          >
            {groups.map((group) => {
              const groupRequests =
                groupedRequests[group.status];

              return (
                <details
                  className={styles.group}
                  key={group.status}
                  open={group.defaultOpen}
                >
                  <summary className={styles.groupSummary}>
                    <div className={styles.groupTitleArea}>
                      <div className={styles.groupTitleRow}>
                        <span className={styles.groupTitle}>
                          {statusLabels[group.status]}
                        </span>

                        <span className={styles.groupCount}>
                          {groupRequests.length}
                        </span>
                      </div>

                      <p className={styles.groupDescription}>
                        {groupDescriptions[group.status]}
                      </p>
                    </div>
                  </summary>

                  <div className={styles.groupContent}>
                    {groupRequests.length === 0 ? (
                      <p className={styles.groupEmpty}>
                        No hay consultas en este estado.
                      </p>
                    ) : (
                      <div className={styles.groupScroll}>
                        <div className={styles.list}>
                          {groupRequests.map((request) => (
                            <ContactRequestCard
                              key={request.id}
                              request={request}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
