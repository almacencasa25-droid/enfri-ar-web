"use client";

import { useActionState, useEffect, useRef } from "react";
import { ImagePlus } from "lucide-react";

import {
  createGalleryItem,
  type GalleryActionState,
} from "@/app/admin/galeria/actions";

import styles from "./galeria.module.css";

const initialState: GalleryActionState = {
  success: false,
  message: "",
};

export function GalleryForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    createGalleryItem,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={styles.form}
      noValidate
    >
      <div className={styles.grid}>
        <div className={`${styles.field} ${styles.full}`}>
          <label className={styles.label} htmlFor="image">
            Foto del trabajo
          </label>

          <input
            className={styles.file}
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="title">
            Título
          </label>

          <input
            className={styles.input}
            id="title"
            name="title"
            type="text"
            maxLength={120}
            placeholder="Ej: Instalación Split"
            required
          />

          {state.errors?.title?.[0] ? (
            <p className={styles.message}>
              {state.errors.title[0]}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="sortOrder">
            Orden
          </label>

          <input
            className={styles.input}
            id="sortOrder"
            name="sortOrder"
            type="number"
            min="0"
            max="10000"
            defaultValue="0"
            required
          />

          {state.errors?.sortOrder?.[0] ? (
            <p className={styles.message}>
              {state.errors.sortOrder[0]}
            </p>
          ) : null}
        </div>

        <div className={`${styles.field} ${styles.full}`}>
          <label className={styles.label} htmlFor="altText">
            Descripción de la foto
          </label>

          <textarea
            className={styles.textarea}
            id="altText"
            name="altText"
            maxLength={250}
            placeholder="Ej: Instalación de aire acondicionado Split realizada por Enfri.Ar."
            required
          />

          {state.errors?.altText?.[0] ? (
            <p className={styles.message}>
              {state.errors.altText[0]}
            </p>
          ) : null}
        </div>
      </div>

      {state.message ? (
        <p
          className={`${styles.message} ${
            state.success
              ? styles.success
              : styles.failure
          }`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <button
        className={styles.button}
        type="submit"
        disabled={isPending}
      >
        <ImagePlus size={18} aria-hidden="true" />

        {isPending
          ? "Subiendo..."
          : "Agregar trabajo"}
      </button>
    </form>
  );
}
