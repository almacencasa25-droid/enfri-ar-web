"use client";

import Image from "next/image";
import { useState } from "react";

import { WorkGalleryLightbox } from "@/components/work-gallery-lightbox";

import type {
  WorkGalleryCategory,
  WorkGalleryItem,
} from "@/lib/work-gallery";

import lightboxStyles from "./work-gallery-lightbox.module.css";
import styles from "./work-gallery-section.module.css";

type GalleryDefinition = {
  category: WorkGalleryCategory;
  title: string;
};

const galleries: GalleryDefinition[] = [
  {
    category: "instalaciones",
    title: "Instalaciones",
  },
  {
    category: "reparaciones_diagnostico",
    title: "Reparaciones y diagnóstico",
  },
  {
    category: "mantenimiento_limpieza",
    title: "Mantenimiento y limpieza",
  },
  {
    category: "capacitaciones",
    title: "Capacitaciones",
  },
];

type WorkGalleryBrowserProps = {
  works: WorkGalleryItem[];
};

export function WorkGalleryBrowser({
  works,
}: WorkGalleryBrowserProps) {
  const [activeCategory, setActiveCategory] =
    useState<WorkGalleryCategory | null>(null);

  const [lightboxIndex, setLightboxIndex] =
    useState<number | null>(null);

  const activeGallery = galleries.find(
    (gallery) =>
      gallery.category === activeCategory
  );

  if (activeGallery) {
    const galleryWorks = works
      .filter(
        (work) =>
          work.category === activeGallery.category
      )
      .sort(
        (a, b) =>
          a.sort_order - b.sort_order
      );

    return (
      <>
        <div className={styles.galleryPanel}>
          <div className={styles.galleryToolbar}>
            <h3 className={styles.galleryTitle}>
              {activeGallery.title}
            </h3>

            <button
              type="button"
              className={styles.backButton}
              onClick={() => {
                setLightboxIndex(null);
                setActiveCategory(null);
              }}
            >
              ← Volver a galerías
            </button>
          </div>

          {galleryWorks.length > 0 ? (
            <div className={styles.galleryScroll}>
              <div className={styles.galleryGrid}>
                {galleryWorks.map(
                  (work, index) => (
                    <article
                      className={styles.photoCard}
                      key={work.id}
                    >
                      <button
                        type="button"
                        className={
                          lightboxStyles.photoButton
                        }
                        onClick={() =>
                          setLightboxIndex(index)
                        }
                        aria-label={`Ampliar foto: ${work.title}`}
                      >
                        <div
                          className={
                            styles.photoImageWrap
                          }
                        >
                          <Image
                            src={work.image_url}
                            alt={work.alt_text}
                            fill
                            sizes="(max-width: 639px) 100vw, (max-width: 959px) 50vw, 33vw"
                            className={
                              styles.photoImage
                            }
                          />
                        </div>
                      </button>

                      <div
                        className={styles.photoBody}
                      >
                        <h4
                          className={
                            styles.photoTitle
                          }
                        >
                          {work.title}
                        </h4>
                      </div>
                    </article>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className={styles.placeholder}>
              <p
                className={
                  styles.placeholderTitle
                }
              >
                Próximamente
              </p>

              <p
                className={
                  styles.placeholderText
                }
              >
                Todavía no hay fotografías cargadas
                en esta galería.
              </p>
            </div>
          )}
        </div>

        {lightboxIndex !== null ? (
          <WorkGalleryLightbox
            items={galleryWorks}
            currentIndex={lightboxIndex}
            onClose={() =>
              setLightboxIndex(null)
            }
            onChange={setLightboxIndex}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className={styles.folderGrid}>
      {galleries.map((gallery) => {
        const galleryWorks = works
          .filter(
            (work) =>
              work.category === gallery.category
          )
          .sort(
            (a, b) =>
              a.sort_order - b.sort_order
          );

        const cover =
          galleryWorks.find(
            (work) => work.sort_order === 1
          ) ?? null;

        return (
          <button
            type="button"
            className={styles.folderButton}
            key={gallery.category}
            onClick={() => {
              setLightboxIndex(null);
              setActiveCategory(gallery.category);
            }}
            aria-label={`Abrir galería ${gallery.title}`}
          >
            {cover ? (
              <div
                className={
                  styles.folderImageWrap
                }
              >
                <Image
                  src={cover.image_url}
                  alt={cover.alt_text}
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 959px) 50vw, 25vw"
                  className={
                    styles.folderImage
                  }
                />
              </div>
            ) : (
              <div
                className={styles.folderEmpty}
              >
                Sin fotos cargadas
              </div>
            )}

            <div
              className={styles.folderOverlay}
            >
              <h3
                className={styles.folderTitle}
              >
                {gallery.title}
              </h3>

              <span
                className={styles.folderCount}
              >
                {galleryWorks.length} foto
                {galleryWorks.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
