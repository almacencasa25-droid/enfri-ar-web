import Link from "next/link";
import { ArrowLeft, CheckCircle2, Save } from "lucide-react";

import {
  updateGalleryItem,
} from "@/app/admin/galeria/actions";
import { GalleryDeleteForm } from "@/app/admin/galeria/gallery-delete-form";
import { GalleryForm } from "@/app/admin/galeria/galeria-form";
import { requireAdminUser } from "@/lib/auth/admin";
import { getAdminWorkGallery } from "@/lib/work-gallery";

import styles from "./galeria.module.css";

export const metadata = {
  title: "Galería de trabajos",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminGaleriaPageProps = {
  searchParams: Promise<{
    guardado?: string;
  }>;
};

export default async function AdminGaleriaPage({
  searchParams,
}: AdminGaleriaPageProps) {
  await requireAdminUser();

  const params = await searchParams;
  const items = await getAdminWorkGallery();

  const savedSuccessfully = params.guardado === "1";

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
                Galería de trabajos
              </h1>

              <p className={styles.description}>
                Subí trabajos reales, cambiales el orden,
                ocultalos temporalmente o eliminálos.
              </p>
            </div>

            <Link href="/admin" className={styles.backLink}>
              <ArrowLeft size={17} aria-hidden="true" />
              Volver al panel
            </Link>
          </div>
        </header>

        {savedSuccessfully ? (
          <div
            className={`${styles.message} ${styles.success}`}
            role="status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            <CheckCircle2 size={19} aria-hidden="true" />
            Cambios guardados correctamente.
          </div>
        ) : null}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Agregar trabajo
          </h2>

          <p className={styles.sectionDescription}>
            Las fotos admitidas son JPG, PNG y WebP de hasta 5 MB.
          </p>

          <GalleryForm />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Trabajos cargados
          </h2>

          <p className={styles.sectionDescription}>
            Actualmente hay {items.length} trabajo
            {items.length === 1 ? "" : "s"} cargado
            {items.length === 1 ? "" : "s"}.
          </p>

          {items.length === 0 ? (
            <p className={styles.empty}>
              Todavía no cargaste trabajos.
            </p>
          ) : (
            <div className={styles.list}>
              {items.map((item) => (
                <article
                  className={styles.card}
                  key={item.id}
                >
                  <div className={styles.imageWrap}>
                    <img
                      className={styles.image}
                      src={item.image_url}
                      alt={item.alt_text}
                      loading="lazy"
                    />
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>
                      {item.title}
                    </h3>

                    <p className={styles.meta}>
                      {item.is_active
                        ? "Visible en la web"
                        : "Oculto en la web"}
                    </p>

                    <form
                      action={updateGalleryItem}
                      className={styles.cardForm}
                    >
                      <input
                        type="hidden"
                        name="id"
                        value={item.id}
                      />

                      <div className={styles.grid}>
                        <div className={styles.field}>
                          <label
                            className={styles.label}
                            htmlFor={`title-${item.id}`}
                          >
                            Título
                          </label>

                          <input
                            className={styles.input}
                            id={`title-${item.id}`}
                            name="title"
                            type="text"
                            defaultValue={item.title}
                            maxLength={120}
                            required
                          />
                        </div>

                        <div className={styles.field}>
                          <label
                            className={styles.label}
                            htmlFor={`order-${item.id}`}
                          >
                            Orden
                          </label>

                          <input
                            className={styles.input}
                            id={`order-${item.id}`}
                            name="sortOrder"
                            type="number"
                            min="0"
                            max="10000"
                            defaultValue={item.sort_order}
                            required
                          />
                        </div>

                        <div
                          className={`${styles.field} ${styles.full}`}
                        >
                          <label
                            className={styles.label}
                            htmlFor={`alt-${item.id}`}
                          >
                            Descripción de la foto
                          </label>

                          <textarea
                            className={styles.textarea}
                            id={`alt-${item.id}`}
                            name="altText"
                            defaultValue={item.alt_text}
                            maxLength={250}
                            required
                          />
                        </div>
                      </div>

                      <label className={styles.checkboxRow}>
                        <input
                          name="isActive"
                          type="checkbox"
                          defaultChecked={item.is_active}
                        />
                        Mostrar este trabajo en la web
                      </label>

                      <div className={styles.actions}>
                        <button
                          className={styles.button}
                          type="submit"
                        >
                          <Save size={17} aria-hidden="true" />
                          Guardar cambios
                        </button>
                      </div>
                    </form>

                    <GalleryDeleteForm
                      id={item.id}
                      title={item.title}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
