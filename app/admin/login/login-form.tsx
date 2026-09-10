"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";

import {
  loginAdmin,
  type AdminLoginState,
} from "@/app/admin/login/actions";

import styles from "./login.module.css";

const initialState: AdminLoginState = {
  success: false,
  message: "",
};

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAdmin,
    initialState
  );

  return (
    <form action={formAction} className={styles.form} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          Correo electrónico
        </label>

        <input
          className={styles.input}
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          placeholder="tu@email.com"
          required
          aria-invalid={Boolean(state.errors?.email)}
          aria-describedby={
            state.errors?.email ? "email-error" : undefined
          }
        />

        {state.errors?.email?.[0] ? (
          <p className={styles.error} id="email-error">
            {state.errors.email[0]}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Contraseña
        </label>

        <input
          className={styles.input}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Ingresá tu contraseña"
          required
          aria-invalid={Boolean(state.errors?.password)}
          aria-describedby={
            state.errors?.password
              ? "password-error"
              : undefined
          }
        />

        {state.errors?.password?.[0] ? (
          <p className={styles.error} id="password-error">
            {state.errors.password[0]}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p className={styles.message} role="status">
          {state.message}
        </p>
      ) : null}

      <button
        className={styles.button}
        type="submit"
        disabled={isPending}
      >
        <LogIn size={18} aria-hidden="true" />

        {isPending
          ? "Ingresando..."
          : "Ingresar como administrador"}
      </button>
    </form>
  );
}
