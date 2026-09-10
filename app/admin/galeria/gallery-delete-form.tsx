"use client";

import { Trash2 } from "lucide-react";

import { deleteGalleryItem } from "@/app/admin/galeria/actions";

import styles from "./galeria.module.css";

type GalleryDeleteFormProps = {
  id: string;
  title: string;
};

export function GalleryDeleteForm({
  id,
  title,
}: GalleryDeleteFormProps) {
  return (
    <form
      action={deleteGalleryItem}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `¿Seguro que querés eliminar "${title}"? La foto también se borrará definitivamente.`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />

      <button
        className={styles.deleteButton}
        type="submit"
      >
        <Trash2 size={17} aria-hidden="true" />
        Eliminar
      </button>
    </form>
  );
}
