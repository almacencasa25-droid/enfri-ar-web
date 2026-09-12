"use client";

import Image from "next/image";
import { useEffect } from "react";

import type { WorkGalleryItem } from "@/lib/work-gallery";

import styles from "./work-gallery-lightbox.module.css";

type WorkGalleryLightboxProps = {
  items: WorkGalleryItem[];
  currentIndex: number;
  onClose: () => void;
  onChange: (index: number) => void;
};

export function WorkGalleryLightbox({
  items,
  currentIndex,
  onClose,
  onChange,
}: WorkGalleryLightboxProps) {
  const currentItem = items[currentIndex];

  const goPrevious = () => {
    const nextIndex =
      currentIndex === 0
        ? items.length - 1
        : currentIndex - 1;

    onChange(nextIndex);
  };

  const goNext = () => {
    const nextIndex =
      currentIndex === items.length - 1
        ? 0
        : currentIndex + 1;

    onChange(nextIndex);
  };

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft") {
        goPrevious();
      }

      if (event.key === "ArrowRight") {
        goNext();
      }
    };

    document.body.style.overflow = "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow = "";

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  });

  if (!currentItem) {
    return null;
  }

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ampliada: ${currentItem.title}`}
      onClick={onClose}
    >
      <div
        className={styles.viewer}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className={styles.imageWrap}>
          <Image
            src={currentItem.image_url}
            alt={currentItem.alt_text}
            fill
            sizes="100vw"
            className={styles.image}
            priority
          />

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar imagen ampliada"
          >
            ×
          </button>

          {items.length > 1 ? (
            <>
              <button
                type="button"
                className={styles.previousButton}
                onClick={goPrevious}
                aria-label="Foto anterior"
              >
                ←
              </button>

              <button
                type="button"
                className={styles.nextButton}
                onClick={goNext}
                aria-label="Foto siguiente"
              >
                →
              </button>
            </>
          ) : null}

          <p className={styles.caption}>
            {currentItem.title} ·{" "}
            {currentIndex + 1} de {items.length}
          </p>
        </div>
      </div>
    </div>
  );
}
