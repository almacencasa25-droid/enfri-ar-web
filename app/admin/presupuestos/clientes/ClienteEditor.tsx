"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  actualizarClienteAction,
  cambiarEstadoClienteAction,
  crearClienteAction,
  eliminarClienteDefinitivamenteAction,
} from "./actions";

type Cliente = {
  id: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
  dni: string | null;
  cuit: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string;
  localidad: string | null;
  observaciones: string | null;
  activo: boolean;
};

type Props = {
  cliente?: Cliente;
};

export default function ClienteEditor({
  cliente,
}: Props) {
  const router = useRouter();

  const [editando, setEditando] = useState(
    !cliente
  );

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [isPending, startTransition] =
    useTransition();

  const esNuevo = !cliente;

  function limpiarMensajes() {
    setMensaje("");
    setError("");
  }

  function enviarFormulario(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    limpiarMensajes();

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const resultado = esNuevo
        ? await crearClienteAction(formData)
        : await actualizarClienteAction(
            formData
          );

      if (!resultado.ok) {
        setError(
          resultado.error ||
            "No se pudo guardar el cliente."
        );
        return;
      }

      if (esNuevo) {
        form.reset();
        setMensaje("Cliente guardado.");
      } else {
        setMensaje("Cambios guardados.");
        setEditando(false);
      }

      router.refresh();
    });
  }

  function cambiarEstado() {
    if (!cliente) {
      return;
    }

    limpiarMensajes();

    const formData = new FormData();

    formData.set("id", cliente.id);

    formData.set(
      "activo",
      cliente.activo ? "false" : "true"
    );

    startTransition(async () => {
      const resultado =
        await cambiarEstadoClienteAction(
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
        cliente.activo
          ? "Cliente desactivado."
          : "Cliente activado."
      );

      router.refresh();
    });
  }

  function eliminarDefinitivamente() {
    if (!cliente) {
      return;
    }

    const primeraConfirmacion =
      window.confirm(
        "¿Seguro que querés eliminar definitivamente este cliente?"
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

    formData.set("id", cliente.id);
    formData.set(
      "confirmacion",
      "ELIMINAR"
    );

    startTransition(async () => {
      const resultado =
        await eliminarClienteDefinitivamenteAction(
          formData
        );

      if (!resultado.ok) {
        setError(
          resultado.error ||
            "No se pudo eliminar el cliente."
        );
        return;
      }

      router.refresh();
    });
  }

  if (cliente && !editando) {
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
          {cliente.activo
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
      {cliente ? (
        <input
          type="hidden"
          name="id"
          value={cliente.id}
        />
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "12px",
        }}
      >
        <label style={labelStyle}>
          Nombre
          <input
            name="nombre"
            defaultValue={
              cliente?.nombre || ""
            }
            placeholder="Nombre"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Apellido
          <input
            name="apellido"
            defaultValue={
              cliente?.apellido || ""
            }
            placeholder="Apellido"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Razón social
          <input
            name="razon_social"
            defaultValue={
              cliente?.razon_social || ""
            }
            placeholder="Empresa o comercio"
            style={inputStyle}
          />
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "12px",
        }}
      >
        <label style={labelStyle}>
          DNI
          <input
            name="dni"
            inputMode="numeric"
            defaultValue={
              cliente?.dni || ""
            }
            placeholder="DNI"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          CUIT
          <input
            name="cuit"
            inputMode="numeric"
            defaultValue={
              cliente?.cuit || ""
            }
            placeholder="CUIT"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Teléfono
          <input
            name="telefono"
            inputMode="tel"
            defaultValue={
              cliente?.telefono || ""
            }
            placeholder="Teléfono"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Correo electrónico
          <input
            name="email"
            type="email"
            defaultValue={
              cliente?.email || ""
            }
            placeholder="correo@ejemplo.com"
            style={inputStyle}
          />
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 2fr) minmax(180px, 1fr)",
          gap: "12px",
        }}
      >
        <label style={labelStyle}>
          Dirección *
          <input
            name="direccion"
            required
            defaultValue={
              cliente?.direccion || ""
            }
            placeholder="Calle y número"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Localidad
          <input
            name="localidad"
            defaultValue={
              cliente?.localidad || ""
            }
            placeholder="Localidad"
            style={inputStyle}
          />
        </label>
      </div>

      <label style={labelStyle}>
        Observaciones internas
        <textarea
          name="observaciones"
          defaultValue={
            cliente?.observaciones || ""
          }
          rows={3}
          placeholder="Notas internas sobre el cliente."
          style={{
            ...inputStyle,
            resize: "vertical",
          }}
        />
      </label>

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
              ? "Guardar cliente"
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
