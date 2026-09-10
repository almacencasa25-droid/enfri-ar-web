"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";

import {
  updateSiteSettings,
  type SiteSettingsState,
} from "@/app/admin/configuracion/actions";

import type { SiteConfig } from "@/lib/site-config";

import styles from "./configuracion.module.css";

const initialState: SiteSettingsState = {
  success: false,
  message: "",
};

type ConfigurationFormProps = {
  config: SiteConfig;
};

export function ConfigurationForm({
  config,
}: ConfigurationFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateSiteSettings,
    initialState
  );

  return (
    <form
      action={formAction}
      className={styles.form}
      noValidate
    >
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          WhatsApp
        </h2>

        <p className={styles.sectionDescription}>
          Estos datos controlan el botón flotante de WhatsApp
          del sitio público.
        </p>

        <div className={styles.grid}>
          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="whatsappNumber"
            >
              Número de WhatsApp
            </label>

            <input
              className={styles.input}
              id="whatsappNumber"
              name="whatsappNumber"
              type="text"
              defaultValue={config.whatsappNumber}
              placeholder="+54 9 11 ..."
              aria-invalid={Boolean(
                state.errors?.whatsappNumber
              )}
            />

            {state.errors?.whatsappNumber?.[0] ? (
              <p className={styles.error}>
                {state.errors.whatsappNumber[0]}
              </p>
            ) : null}
          </div>

          <div className={`${styles.field} ${styles.full}`}>
            <label
              className={styles.label}
              htmlFor="whatsappMessage"
            >
              Mensaje automático
            </label>

            <textarea
              className={styles.textarea}
              id="whatsappMessage"
              name="whatsappMessage"
              defaultValue={config.whatsappMessage}
            />

            {state.errors?.whatsappMessage?.[0] ? (
              <p className={styles.error}>
                {state.errors.whatsappMessage[0]}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Datos de contacto
        </h2>

        <p className={styles.sectionDescription}>
          Se mostrarán automáticamente donde corresponda en
          el sitio público.
        </p>

        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">
              Teléfono
            </label>

            <input
              className={styles.input}
              id="phone"
              name="phone"
              type="text"
              defaultValue={config.phone}
            />

            {state.errors?.phone?.[0] ? (
              <p className={styles.error}>
                {state.errors.phone[0]}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Correo electrónico
            </label>

            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              defaultValue={config.email}
            />

            {state.errors?.email?.[0] ? (
              <p className={styles.error}>
                {state.errors.email[0]}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="website">
              Página web
            </label>

            <input
              className={styles.input}
              id="website"
              name="website"
              type="url"
              defaultValue={config.website}
              placeholder="https://..."
            />

            {state.errors?.website?.[0] ? (
              <p className={styles.error}>
                {state.errors.website[0]}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="address">
              Dirección
            </label>

            <input
              className={styles.input}
              id="address"
              name="address"
              type="text"
              defaultValue={config.address ?? ""}
              placeholder="Opcional"
            />

            {state.errors?.address?.[0] ? (
              <p className={styles.error}>
                {state.errors.address[0]}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Sección RENACLI
        </h2>

        <p className={styles.sectionDescription}>
          Configuración del bloque informativo de matriculación
          que aparece al final del sitio.
        </p>

        <div className={styles.grid}>
          <div className={`${styles.field} ${styles.full}`}>
            <label
              className={styles.label}
              htmlFor="renacliSectionTitle"
            >
              Título
            </label>

            <input
              className={styles.input}
              id="renacliSectionTitle"
              name="renacliSectionTitle"
              type="text"
              defaultValue={config.renacli.sectionTitle}
            />

            {state.errors?.renacliSectionTitle?.[0] ? (
              <p className={styles.error}>
                {state.errors.renacliSectionTitle[0]}
              </p>
            ) : null}
          </div>

          <div className={`${styles.field} ${styles.full}`}>
            <label
              className={styles.label}
              htmlFor="renacliSectionDescription"
            >
              Descripción
            </label>

            <textarea
              className={styles.textarea}
              id="renacliSectionDescription"
              name="renacliSectionDescription"
              defaultValue={config.renacli.sectionDescription}
            />

            {state.errors?.renacliSectionDescription?.[0] ? (
              <p className={styles.error}>
                {state.errors.renacliSectionDescription[0]}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="renacliWebsite"
            >
              Web de RENACLI
            </label>

            <input
              className={styles.input}
              id="renacliWebsite"
              name="renacliWebsite"
              type="url"
              defaultValue={config.renacli.website}
            />

            {state.errors?.renacliWebsite?.[0] ? (
              <p className={styles.error}>
                {state.errors.renacliWebsite[0]}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="renacliButtonLabel"
            >
              Texto del botón
            </label>

            <input
              className={styles.input}
              id="renacliButtonLabel"
              name="renacliButtonLabel"
              type="text"
              defaultValue={config.renacli.buttonLabel}
            />

            {state.errors?.renacliButtonLabel?.[0] ? (
              <p className={styles.error}>
                {state.errors.renacliButtonLabel[0]}
              </p>
            ) : null}
          </div>
        </div>
      </section>

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

      <div className={styles.actions}>
        <button
          className={styles.button}
          type="submit"
          disabled={isPending}
        >
          <Save size={17} aria-hidden="true" />
          {isPending
            ? "Guardando..."
            : "Guardar configuración"}
        </button>
      </div>
    </form>
  );
}
