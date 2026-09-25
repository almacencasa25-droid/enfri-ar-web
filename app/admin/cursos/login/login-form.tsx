"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";

import { loginCursos, type CursosLoginState } from "./actions";
import styles from "./login.module.css";

const initialState: CursosLoginState = { success: false, message: "" };

export function CursosLoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginCursos,
    initialState
  );

  return (
    <form action={formAction} className={styles.form} noValidate>
      <label>
        Correo electrónico
        <input
          name="email"
          type="email"
          autoComplete="username"
          placeholder="enfri.ar.cursos@gmail.com"
          required
        />
      </label>
      {state.errors?.email?.[0] ? (
        <p className={styles.error}>{state.errors.email[0]}</p>
      ) : null}

      <label>
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Ingresá tu contraseña"
          required
        />
      </label>
      {state.errors?.password?.[0] ? (
        <p className={styles.error}>{state.errors.password[0]}</p>
      ) : null}

      {state.message ? (
        <p className={styles.message} role="status">{state.message}</p>
      ) : null}

      <button type="submit" disabled={isPending}>
        <LogIn size={18} aria-hidden="true" />
        {isPending ? "Ingresando..." : "Ingresar a Cursos"}
      </button>
    </form>
  );
}
