"use client";

import {
  FormEvent,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
  actualizarTecnicoAction,
  cambiarEstadoTecnicoAction,
  crearTecnicoAction,
  eliminarTecnicoDefinitivamenteAction,
} from "./actions";

type Tecnico = {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  telefono: string;
  email: string | null;
  direccion: string;
  localidad: string | null;
  numero_matricula: string;
  vencimiento_matricula: string | null;
  especialidad: string | null;
  observaciones: string | null;
  foto_storage_path: string | null;
  estado: string;
};

type Props = {
  tecnico?: Tecnico;
};

export default function TecnicoEditor({
  tecnico,
}: Props) {
  const router = useRouter();

  const [editando, setEditando] = useState(
    !tecnico
  );

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mensaje) return;
    const timeout = window.setTimeout(() => setMensaje(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [mensaje]);

  const [isPending, startTransition] =
    useTransition();

  const esNuevo = !tecnico;
  const aviso = mensaje ? (
    <span role="status" aria-live="polite" style={successStyle}>{mensaje}</span>
  ) : null;

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
        ? await crearTecnicoAction(formData)
        : await actualizarTecnicoAction(
            formData
          );

      if (!resultado.ok) {
        setError(
          resultado.error ||
            "No se pudo guardar el técnico."
        );
        return;
      }

      if (esNuevo) {
        form.reset();
        setMensaje("Técnico guardado.");
      } else {
        setMensaje("Cambios guardados.");
        setEditando(false);
      }

      router.refresh();
    });
  }

  function cambiarEstado(
    estado: string
  ) {
    if (!tecnico) {
      return;
    }

    limpiarMensajes();

    const formData = new FormData();

    formData.set("id", tecnico.id);
    formData.set("estado", estado);

    startTransition(async () => {
      const resultado =
        await cambiarEstadoTecnicoAction(
          formData
        );

      if (!resultado.ok) {
        setError(
          resultado.error ||
            "No se pudo cambiar el estado."
        );
        return;
      }

      setMensaje("Estado actualizado.");

      router.refresh();
    });
  }

  function eliminarDefinitivamente() {
    if (!tecnico) {
      return;
    }

    const primeraConfirmacion =
      window.confirm(
        "¿Seguro que querés eliminar definitivamente este técnico?"
      );

    if (!primeraConfirmacion) {
      return;
    }

    const segundaConfirmacion =
      window.confirm(
        "SEGUNDA CONFIRMACIÓN: esta eliminación no se puede deshacer. Los documentos históricos conservarán los datos del técnico. ¿Continuar?"
      );

    if (!segundaConfirmacion) {
      return;
    }

    limpiarMensajes();

    const formData = new FormData();

    formData.set("id", tecnico.id);
    formData.set(
      "confirmacion",
      "ELIMINAR"
    );

    startTransition(async () => {
      const resultado =
        await eliminarTecnicoDefinitivamenteAction(
          formData
        );

      if (!resultado.ok) {
        setError(
          resultado.error ||
            "No se pudo eliminar el técnico."
        );
        return;
      }

      router.refresh();
    });
  }

  if (tecnico && !editando) {
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "14px",
          alignItems: "center",
        }}
      >
        {aviso ? <div style={{flexBasis:"100%",height:0,position:"relative",pointerEvents:"none"}}><div style={{position:"absolute",bottom:"100%",right:0,zIndex:5,padding:"6px 12px",borderRadius:8,background:"#dcfce7",border:"1px solid #86b79a",boxShadow:"0 4px 10px #173d591a",whiteSpace:"nowrap"}}>{aviso}</div></div> : null}
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            limpiarMensajes();
            setEditando(true);
          }}
          style={buttonStyle}
        >
          Modificar
        </button>

        {tecnico.estado !==
        "disponible" ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              cambiarEstado("disponible")
            }
            style={buttonStyle}
          >
            Disponible
          </button>
        ) : null}

        {tecnico.estado !==
        "no_disponible" ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              cambiarEstado(
                "no_disponible"
              )
            }
            style={buttonStyle}
          >
            No disponible
          </button>
        ) : null}

        {tecnico.estado !== "inactivo" ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              cambiarEstado("inactivo")
            }
            style={buttonStyle}
          >
            Inactivo
          </button>
        ) : null}

        <button
          type="button"
          disabled={isPending}
          onClick={eliminarDefinitivamente}
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
      {tecnico ? (
        <input
          type="hidden"
          name="id"
          value={tecnico.id}
        />
      ) : null}

      <div style={gridStyle}>
        <label style={labelStyle}>
          Nombre *
          <input
            name="nombre"
            required
            defaultValue={
              tecnico?.nombre || ""
            }
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Apellido *
          <input
            name="apellido"
            required
            defaultValue={
              tecnico?.apellido || ""
            }
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          DNI
          <input
            name="dni"
            inputMode="numeric"
            defaultValue={
              tecnico?.dni || ""
            }
            style={inputStyle}
          />
        </label>
      </div>

      <div style={gridStyle}>
        <label style={labelStyle}>
          Teléfono *
          <input
            name="telefono"
            required
            inputMode="tel"
            defaultValue={
              tecnico?.telefono || ""
            }
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Correo electrónico
          <input
            name="email"
            type="email"
            defaultValue={
              tecnico?.email || ""
            }
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Localidad
          <input
            name="localidad"
            defaultValue={
              tecnico?.localidad || ""
            }
            style={inputStyle}
          />
        </label>
      </div>

      <label style={labelStyle}>
        Dirección *
        <input
          name="direccion"
          required
          defaultValue={
            tecnico?.direccion || ""
          }
          style={inputStyle}
        />
      </label>

      <div style={gridStyle}>
        <label style={labelStyle}>
          Número de matrícula *
          <input
            name="numero_matricula"
            required
            defaultValue={
              tecnico?.numero_matricula ||
              ""
            }
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Vencimiento matrícula
          <input
            name="vencimiento_matricula"
            type="date"
            defaultValue={
              tecnico?.vencimiento_matricula ||
              ""
            }
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Especialidad
          <input
            name="especialidad"
            defaultValue={
              tecnico?.especialidad || ""
            }
            placeholder="Ej.: Refrigeración"
            style={inputStyle}
          />
        </label>
      </div>

      <div style={gridStyle}>
        <label style={labelStyle}>
          Estado
          <select
            name="estado"
            defaultValue={
              tecnico?.estado ||
              "disponible"
            }
            style={inputStyle}
          >
            <option value="disponible">
              Disponible
            </option>

            <option value="no_disponible">
              No disponible
            </option>

            <option value="inactivo">
              Inactivo
            </option>
          </select>
        </label>

        <label style={labelStyle}>
          Foto del técnico
          <input
            name="foto"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={inputStyle}
          />

          {tecnico?.foto_storage_path ? (
            <span
              style={{
                color: "#236b43",
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              Foto cargada. Elegí otra
              solamente para reemplazarla.
            </span>
          ) : null}
        </label>
      </div>

      <label style={labelStyle}>
        Observaciones internas
        <textarea
          name="observaciones"
          rows={3}
          defaultValue={
            tecnico?.observaciones || ""
          }
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
        {aviso ? <div style={{flexBasis:"100%",height:0,position:"relative",pointerEvents:"none"}}><div style={{position:"absolute",bottom:"100%",right:0,zIndex:5,padding:"6px 12px",borderRadius:8,background:"#dcfce7",border:"1px solid #86b79a"}}>{aviso}</div></div> : null}
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
              ? "Guardar técnico"
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

        

        {error ? (
          <span style={errorStyle}>
            {error}
          </span>
        ) : null}
      </div>
    </form>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "12px",
};

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
    "2px solid #7593a5",
  borderRadius: "10px",
  background: "#e7f2f7",
  color: "#17384b",
  font: "inherit",
};

const buttonStyle = {
  minHeight: "40px",
  padding: "8px 13px",
  border:
    "2px solid #718b9b",
  borderRadius: "9px",
  background: "#dcebf3",
  color: "#17384b",
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
