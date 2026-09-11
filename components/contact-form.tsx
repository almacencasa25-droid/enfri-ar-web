"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

import {
  submitContactRequest,
  type ContactFormState,
} from "@/app/actions/submit-contact";

import styles from "./contact-form.module.css";

const initialState: ContactFormState = {
  success: false,
  message: "",
  errors: {},
};

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactRequest,
    initialState
  );

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  const getError = (field: string) => {
    return state.errors?.[field]?.[0];
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      className={styles.form}
      noValidate
    >
      <div className={styles.row}>
        <div className={styles.field}>
          <label
            htmlFor="fullName"
            className={styles.label}
          >
            Nombre y apellido
          </label>

          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            maxLength={120}
            required
            className={styles.input}
            aria-invalid={Boolean(getError("fullName"))}
            aria-describedby={
              getError("fullName")
                ? "fullName-error"
                : undefined
            }
          />

          {getError("fullName") && (
            <p
              id="fullName-error"
              className={styles.errorText}
            >
              {getError("fullName")}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label
            htmlFor="phone"
            className={styles.label}
          >
            Teléfono
          </label>

          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={40}
            required
            className={styles.input}
            aria-invalid={Boolean(getError("phone"))}
            aria-describedby={
              getError("phone")
                ? "phone-error"
                : undefined
            }
          />

          {getError("phone") && (
            <p
              id="phone-error"
              className={styles.errorText}
            >
              {getError("phone")}
            </p>
          )}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label
            htmlFor="email"
            className={styles.label}
          >
            Correo electrónico{" "}
            <span className={styles.optional}>
              (opcional)
            </span>
          </label>

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            className={styles.input}
            aria-invalid={Boolean(getError("email"))}
            aria-describedby={
              getError("email")
                ? "email-error"
                : undefined
            }
          />

          {getError("email") && (
            <p
              id="email-error"
              className={styles.errorText}
            >
              {getError("email")}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label
            htmlFor="locality"
            className={styles.label}
          >
            Localidad
          </label>

          <input
            id="locality"
            name="locality"
            type="text"
            autoComplete="address-level2"
            maxLength={120}
            required
            className={styles.input}
            aria-invalid={Boolean(getError("locality"))}
            aria-describedby={
              getError("locality")
                ? "locality-error"
                : undefined
            }
          />

          {getError("locality") && (
            <p
              id="locality-error"
              className={styles.errorText}
            >
              {getError("locality")}
            </p>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label
          htmlFor="serviceType"
          className={styles.label}
        >
          Tipo de servicio
        </label>

        <select
          id="serviceType"
          name="serviceType"
          defaultValue=""
          required
          className={styles.select}
          aria-invalid={Boolean(getError("serviceType"))}
          aria-describedby={
            getError("serviceType")
              ? "serviceType-error"
              : undefined
          }
        >
          <option value="" disabled>
            Seleccioná una opción
          </option>

          <option value="instalacion_split">
            Instalación de equipo Split
          </option>

          <option value="piso_techo">
            Equipo Piso-Techo
          </option>

          <option value="reparacion_diagnostico">
            Reparación o diagnóstico
          </option>

          <option value="mantenimiento_limpieza">
            Mantenimiento o limpieza
          </option>

          <option value="otro">
            Otro
          </option>
        </select>

        {getError("serviceType") && (
          <p
            id="serviceType-error"
            className={styles.errorText}
          >
            {getError("serviceType")}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label
          htmlFor="message"
          className={styles.label}
        >
          Contanos qué necesitás
        </label>

        <textarea
          id="message"
          name="message"
          rows={6}
          minLength={10}
          maxLength={3000}
          required
          className={styles.textarea}
          placeholder="Por ejemplo: tipo de equipo, falla que presenta, instalación que necesitás o cualquier información que nos ayude a entender la consulta."
          aria-invalid={Boolean(getError("message"))}
          aria-describedby={
            getError("message")
              ? "message-error"
              : undefined
          }
        />

        {getError("message") && (
          <p
            id="message-error"
            className={styles.errorText}
          >
            {getError("message")}
          </p>
        )}
      </div>

      <div className={styles.checkboxRow}>
        <input
          id="privacyAccepted"
          name="privacyAccepted"
          type="checkbox"
          required
          className={styles.checkbox}
          aria-invalid={Boolean(
            getError("privacyAccepted")
          )}
          aria-describedby={
            getError("privacyAccepted")
              ? "privacyAccepted-error"
              : undefined
          }
        />

        <label
          htmlFor="privacyAccepted"
          className={styles.checkboxLabel}
        >
          Acepto que Enfri.Ar utilice los datos enviados
          únicamente para responder y gestionar esta consulta.{" "}
          <Link
            href="/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontWeight: 800,
              textDecoration: "underline",
            }}
          >
            Ver Política de privacidad
          </Link>
        </label>
      </div>

      {getError("privacyAccepted") && (
        <p
          id="privacyAccepted-error"
          className={styles.errorText}
        >
          Debés aceptar el uso de los datos para enviar la
          consulta.
        </p>
      )}

      <div
        className={styles.honeypot}
        aria-hidden="true"
      >
        <label htmlFor="company">
          Empresa
        </label>

        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state.message && (
        <p
          className={
            state.success
              ? styles.statusSuccess
              : styles.statusError
          }
          role="status"
          aria-live="polite"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isPending}
      >
        <Send size={19} aria-hidden="true" />

        {isPending
          ? "Enviando..."
          : "Enviar consulta"}
      </button>
    </form>
  );
}
