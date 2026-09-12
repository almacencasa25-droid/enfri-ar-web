"use client";

import {
  startTransition,
  type FormEvent,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
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

const MAX_IMAGE_DIMENSION = 1800;
const TARGET_IMAGE_BYTES = 750 * 1024;

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function loadImage(file: File) {
  return new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(
          new Error(
            "No se pudo leer la imagen seleccionada."
          )
        );
      };

      image.src = objectUrl;
    }
  );
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              "No se pudo optimizar la imagen."
            )
          );

          return;
        }

        resolve(blob);
      },
      "image/webp",
      quality
    );
  });
}

async function optimizeImage(file: File) {
  if (!allowedImageTypes.includes(file.type)) {
    throw new Error(
      "La foto debe ser JPG, PNG o WebP."
    );
  }

  const image = await loadImage(file);

  let width = image.naturalWidth;
  let height = image.naturalHeight;

  const largestSide = Math.max(width, height);

  if (largestSide > MAX_IMAGE_DIMENSION) {
    const scale =
      MAX_IMAGE_DIMENSION / largestSide;

    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");

  const renderImage = (
    newWidth: number,
    newHeight: number
  ) => {
    canvas.width = newWidth;
    canvas.height = newHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "No se pudo preparar la imagen."
      );
    }

    context.clearRect(
      0,
      0,
      newWidth,
      newHeight
    );

    context.drawImage(
      image,
      0,
      0,
      newWidth,
      newHeight
    );
  };

  renderImage(width, height);

  let quality = 0.84;

  let blob = await canvasToBlob(
    canvas,
    quality
  );

  while (
    blob.size > TARGET_IMAGE_BYTES &&
    quality > 0.52
  ) {
    quality -= 0.08;

    blob = await canvasToBlob(
      canvas,
      quality
    );
  }

  while (
    blob.size > TARGET_IMAGE_BYTES &&
    width > 900 &&
    height > 900
  ) {
    width = Math.round(width * 0.85);
    height = Math.round(height * 0.85);

    renderImage(width, height);

    blob = await canvasToBlob(
      canvas,
      0.72
    );
  }

  if (blob.size > 1024 * 1024) {
    throw new Error(
      "No se pudo reducir suficientemente esta foto. Probá con otra imagen."
    );
  }

  const originalName =
    file.name.replace(/\.[^/.]+$/, "");

  return new File(
    [blob],
    `${originalName}.webp`,
    {
      type: blob.type || "image/webp",
      lastModified: Date.now(),
    }
  );
}

export function GalleryForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [localError, setLocalError] =
    useState("");

  const [isOptimizing, setIsOptimizing] =
    useState(false);

  const [state, formAction, isPending] =
    useActionState(
      createGalleryItem,
      initialState
    );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setLocalError("");
    }
  }, [state.success]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setLocalError("");

    const formData = new FormData(
      event.currentTarget
    );

    const image = formData.get("image");

    if (
      !(image instanceof File) ||
      image.size === 0
    ) {
      setLocalError(
        "Seleccioná una foto del trabajo."
      );

      return;
    }

    try {
      setIsOptimizing(true);

      const optimizedImage =
        await optimizeImage(image);

      formData.set(
        "image",
        optimizedImage,
        optimizedImage.name
      );

      setIsOptimizing(false);

      startTransition(() => {
        formAction(formData);
      });
    } catch (error) {
      setIsOptimizing(false);

      setLocalError(
        error instanceof Error
          ? error.message
          : "No se pudo preparar la foto."
      );
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={styles.form}
      noValidate
    >
      <div className={styles.grid}>
        <div
          className={`${styles.field} ${styles.full}`}
        >
          <label
            className={styles.label}
            htmlFor="image"
          >
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
          <label
            className={styles.label}
            htmlFor="title"
          >
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
          <label
            className={styles.label}
            htmlFor="category"
          >
            Galería
          </label>

          <select
            className={styles.input}
            id="category"
            name="category"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Seleccioná una galería
            </option>

            <option value="instalaciones">
              Instalaciones
            </option>

            <option value="reparaciones_diagnostico">
              Reparaciones y diagnóstico
            </option>

            <option value="mantenimiento_limpieza">
              Mantenimiento y limpieza
            </option>

            <option value="capacitaciones">
              Capacitaciones
            </option>
          </select>

          {state.errors?.category?.[0] ? (
            <p className={styles.message}>
              {state.errors.category[0]}
            </p>
          ) : null}
        </div>

        <div
          className={`${styles.field} ${styles.full}`}
        >
          <label
            className={styles.label}
            htmlFor="altText"
          >
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

      <p className={styles.message}>
        La posición se asigna automáticamente al agregar la foto.
      </p>

      {localError ? (
        <p
          className={`${styles.message} ${styles.failure}`}
          role="alert"
        >
          {localError}
        </p>
      ) : null}

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
        disabled={isPending || isOptimizing}
      >
        <ImagePlus
          size={18}
          aria-hidden="true"
        />

        {isOptimizing
          ? "Optimizando foto..."
          : isPending
            ? "Subiendo..."
            : "Agregar trabajo"}
      </button>
    </form>
  );
}
