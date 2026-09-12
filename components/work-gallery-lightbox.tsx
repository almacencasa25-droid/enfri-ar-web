"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import type { WorkGalleryItem } from "@/lib/work-gallery";

import styles from "./work-gallery-lightbox.module.css";

type WorkGalleryLightboxProps = {
  items: WorkGalleryItem[];
  currentIndex: number;
  onClose: () => void;
  onChange: (index: number) => void;
};

const SWIPE_DISTANCE = 50;

export function WorkGalleryLightbox({
  items,
  currentIndex,
  onClose,
  onChange,
}: WorkGalleryLightboxProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);

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

  const handleTouchStart = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    const touch = event.touches[0];

    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;

    touchCurrentX.current = touch.clientX;
    touchCurrentY.current = touch.clientY;
  };

  const handleTouchMove = (
    event: React.TouchEvent<HTMLDivElement>
  ) => {
    const touch = event.touches[0];

    touchCurrentX.current = touch.clientX;
    touchCurrentY.current = touch.clientY;
  };

  const handleTouchEnd = () => {
    if (
      touchStartX.current === null ||
      touchStartY.current === null ||
      touchCurrentX.current === null ||
      touchCurrentY.current === null
    ) {
      return;
    }

    const differenceX =
      touchCurrentX.current -
      touchStartX.current;

    const differenceY =
      touchCurrentY.current -
      touchStartY.current;

    const isHorizontalSwipe =
      Math.abs(differenceX) >
      Math.abs(differenceY);

    if (
      items.length > 1 &&
      isHorizontalSwipe &&
      Math.abs(differenceX) >= SWIPE_DISTANCE
    ) {
      if (differenceX < 0) {
        goNext();
      } else {
        goPrevious();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchCurrentX.current = null;
    touchCurrentY.current = null;
  };

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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
