"use client";

import { useRouter } from "next/navigation";
import {
  FormEvent,
  useState,
  useTransition,
} from "react";

import {
  actualizarTrabajoAction,
  cambiarEstadoTrabajoAction,
  crearTrabajoAction,
  eliminarTrabajoDefinitivamenteAction,
} from "./actions";

type Trabajo = {
  id: string;
  nombre_corto: string;
  detalle: string;
  categoria: string | null;
  tipo: string;
  precio_unitario: number | string;
  activo: boolean;
};

type Props = {
  trabajo?: Trabajo;
};

function precioInicial(
  precio: number | string | undefined
) {
  if (precio === undefined) {
    return "";
  }

  return String(precio);
}

export default function TrabajoEditor({
  trabajo,
}: Props) {
  const router = useRouter();

  const [editando, setEditando] = useState(
    !trabajo
  );

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [isPending, startTransition] =
    useTransition();

  const esNuevo = !trabajo;

  function limpiarMensajes() {
    setMensaje("");
    setError("");
  }

  function enviarFormulario(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    limpiarMensajes();

    const formData = new FormData(
      event.currentTarget
    );

    startTransition(async () => {
      const resultado = esNuevo
        ? await crearTrabajoAction(formData)
        : await actualizarTrabajoAction(
            formData
          );

      if (!resultado.ok) {
        setError(
          resultado.error ||
            "No se pudo guardar."
        );
        return;
      }

      if (esNuevo) {
        (
          event.currentTarget as HTMLFormElement
        ).reset();

        setMensaje("Trabajo guardado.");
      } else {
        setMensaje("Cambios guardados.");
        setEditando(false);
      }

      router.refresh();
    });
  }

  function cambiarEstado() {
    if (!trabajo) {
      return;
    }

    limpiarMensajes();

    const formData = new FormData();

    formData.set("id", trabajo.id);

    formData.set(
      "activo",
      trabajo.activo ? "false" : "true"
    );

    startTransition(async () => {
      const resultado =
        await cambiarEstadoTrabajoAction(
          formData
        );

      if (!resultado.ok) {
        setError(
          resultado.error ||
            "No se pudo cambiar el estado."
        );
        return;
      }

      setMensaje(
        trabajo.activo
          ? "Trabajo desactivado."
          : "Trabajo activado."
      );

      router.refresh();
    });
  }

  function eliminarDefinitivamente() {
    if (!trabajo) {
      return;
    }

    const primeraConfirmacion =
      window.confirm(
        "¿Seguro que querés eliminar definitivamente este trabajo?"
      );

    if (!primeraConfirmacion) {
      return;
    }

    const segundaConfirmacion =
      window.confirm(
        "SEGUNDA CONFIRMACIÓN: esta eliminación no se puede deshacer. ¿Continuar?"
      );

    if (!segundaConfirmacion) {
      return;
    }

    limpiarMensajes();

    const formData = new FormData();

    formData.set("id", trabajo.id);
    formData.set(
      "confirmacion",
      "ELIMINAR"
    );

    startTransition(async () => {
      const resultado =
        await eliminarTrabajoDefinitivamenteAction(
          formData
        );

      if (!resultado.ok) {
        setError(
          resultado.error ||
            "No se pudo eliminar."
        );
        return;
      }

      router.refresh();
    });
  }

  if (trabajo && !editando) {
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "14px",
        }}
      >
        <button
          type="button"
          onClick={() => {
            limpiarMensajes();
            setEditando(true);
          }}
          disabled={isPending}
          style={buttonStyle}
        >
          Modificar
        </button>

        <button
          type="button"
          onClick={cambiarEstado}
          disabled={isPending}
          style={buttonStyle}
        >
          {trabajo.activo
            ? "Desactivar"
            : "Activar"}
        </button>

        <button
          type="button"
          onClick={eliminarDefinitivamente}
          disabled={isPending}
          style={{
            ...buttonStyle,
            border:
              "1px solid rgba(160, 35, 35, 0.35)",
            color: "#8f2222",
            background:
              "rgba(180, 40, 40, 0.06)",
          }}
        >
          Eliminar
        </button>

        {mensaje ? (
          <span style={successStyle}>
            {mensaje}
          </span>
        ) : null}

        {error ? (
          <span style={errorStyle}>
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={enviarFormulario}
      style={{
        display: "grid",
        gap: "14px",
      }}
    >
      {trabajo ? (
        <input
          type="hidden"
          name="id"
          value={trabajo.id}
        />
      ) : null}

      <label style={labelStyle}>
        Nombre corto
        <input
          name="nombre_corto"
          required
          defaultValue={
            trabajo?.nombre_corto || ""
          }
          placeholder="Ej.: Limpieza Split"
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        Detalle completo
        <textarea
          name="detalle"
          required
          defaultValue={
            trabajo?.detalle || ""
          }
          rows={4}
          placeholder="Detalle del trabajo que aparecerá al seleccionarlo."
          style={{
            ...inputStyle,
            resize: "vertical",
          }}
        />
      </label>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "12px",
        }}
      >
        <label style={labelStyle}>
          Categoría
          <input
            name="categoria"
            defaultValue={
              trabajo?.categoria || ""
            }
            placeholder="Ej.: Mantenimiento"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Tipo
          <select
            name="tipo"
            defaultValue={
              trabajo?.tipo ||
              "mano_obra"
            }
            style={inputStyle}
          >
            <option value="mano_obra">
              Mano de obra
            </option>

            <option value="material">
              Material
            </option>

            <option value="otro">
              Otro
            </option>
          </select>
        </label>

        <label style={labelStyle}>
          Precio unitario
          <input
            name="precio_unitario"
            required
            inputMode="decimal"
            defaultValue={precioInicial(
              trabajo?.precio_unitario
            )}
            placeholder="0"
            style={inputStyle}
          />
        </label>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <button
          type="submit"
          disabled={isPending}
          style={{
            ...buttonStyle,
            background:
              "var(--foreground)",
            color: "#ffffff",
          }}
        >
          {isPending
            ? "Guardando..."
            : esNuevo
              ? "Guardar trabajo"
              : "Guardar cambios"}
        </button>

        {!esNuevo ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              limpiarMensajes();
              setEditando(false);
            }}
            style={buttonStyle}
          >
            Cancelar
          </button>
        ) : null}

        {mensaje ? (
          <span style={successStyle}>
            {mensaje}
          </span>
        ) : null}

        {error ? (
          <span style={errorStyle}>
            {error}
          </span>
        ) : null}
      </div>
    </form>
  );
}

const labelStyle = {
  display: "grid",
  gap: "6px",
  color: "var(--foreground)",
  fontSize: "0.88rem",
  fontWeight: 800,
};

const inputStyle = {
  width: "100%",
  minHeight: "44px",
  boxSizing: "border-box" as const,
  padding: "10px 12px",
  border:
    "1px solid rgba(38, 40, 42, 0.18)",
  borderRadius: "10px",
  background: "#ffffff",
  color: "var(--foreground)",
  font: "inherit",
};

const buttonStyle = {
  minHeight: "40px",
  padding: "8px 13px",
  border:
    "1px solid rgba(38, 40, 42, 0.16)",
  borderRadius: "9px",
  background: "#ffffff",
  color: "var(--foreground)",
  font: "inherit",
  fontSize: "0.84rem",
  fontWeight: 800,
  cursor: "pointer",
};

const successStyle = {
  color: "#236b43",
  fontSize: "0.84rem",
  fontWeight: 800,
};

const errorStyle = {
  color: "#982828",
  fontSize: "0.84rem",
  fontWeight: 800,
};
