"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  buscarPresupuestoParaInformeAction,
  crearInformeDetalleAction,
  generarInformeDetallePdfAction,
  type PresupuestoInformeEncontrado,
} from "./actions";

type TipoDocumento =
  | "detalle_trabajo"
  | "informe_mensual"
  | "informe_cuatrimestral";

const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function fechaHoyLocal() {
  const ahora =
    new Date();

  const anio =
    ahora.getFullYear();

  const mes =
    String(
      ahora.getMonth() + 1
    ).padStart(2, "0");

  const dia =
    String(
      ahora.getDate()
    ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function fechaEmisionParaMes(
  mesInformado: number,
  anioInformado: number
) {
  const fecha =
    new Date(
      anioInformado,
      mesInformado,
      22
    );

  const diaSemana =
    fecha.getDay();

  if (diaSemana === 6) {
    fecha.setDate(
      fecha.getDate() + 2
    );
  } else if (
    diaSemana === 0
  ) {
    fecha.setDate(
      fecha.getDate() + 1
    );
  }

  const anio =
    fecha.getFullYear();

  const mes =
    String(
      fecha.getMonth() + 1
    ).padStart(2, "0");

  const dia =
    String(
      fecha.getDate()
    ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function nombreCliente(
  presupuesto:
    PresupuestoInformeEncontrado
) {
  return (
    presupuesto
      .cliente_razon_social ||
    [
      presupuesto
        .cliente_nombre,
      presupuesto
        .cliente_apellido,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Cliente sin nombre"
  );
}

function armarDetalleDesdePresupuesto(
  presupuesto:
    PresupuestoInformeEncontrado
) {
  if (
    presupuesto.items.length ===
    0
  ) {
    return (
      presupuesto.detalle_corto ||
      ""
    );
  }

  let equipoAnterior:
    number | null = null;

  const lineas: string[] =
    [];

  for (
    const item
    of presupuesto.items
  ) {
    if (
      item.equipo_orden &&
      item.equipo_orden !==
        equipoAnterior
    ) {
      const datosEquipo = [
        item.equipo_tipo,
        item.equipo_marca,
        item.equipo_modelo,
        item.equipo_capacidad,
      ]
        .filter(Boolean)
        .join(" · ");

      lineas.push(
        `Equipo ${item.equipo_orden}${
          datosEquipo
            ? ` - ${datosEquipo}`
            : ""
        }`
      );

      if (
        item.equipo_ubicacion
      ) {
        lineas.push(
          `Ubicación: ${item.equipo_ubicacion}`
        );
      }

      equipoAnterior =
        item.equipo_orden;
    }

    const cantidad =
      item.cantidad > 1
        ? ` (${item.cantidad} unidades)`
        : "";

    lineas.push(
      `- ${item.nombre_corto}${cantidad}: ${item.detalle}`
    );
  }

  return lineas.join(
    "\n"
  );
}

export default function InformeDetalleForm() {
  const [
    guardando,
    startTransition,
  ] = useTransition();

  const [
    buscando,
    startBuscarTransition,
  ] = useTransition();

  const [
    generando,
    startGenerarTransition,
  ] = useTransition();

  const [
    tipoDocumento,
    setTipoDocumento,
  ] =
    useState<TipoDocumento>(
      "detalle_trabajo"
    );

  const [
    numeroPresupuesto,
    setNumeroPresupuesto,
  ] = useState("");

  const [
    presupuesto,
    setPresupuesto,
  ] =
    useState<PresupuestoInformeEncontrado | null>(
      null
    );

  const [
    fechaEmision,
    setFechaEmision,
  ] =
    useState(
      fechaHoyLocal()
    );

  const [
    ordenCompra,
    setOrdenCompra,
  ] = useState("");

  const [
    numeroFactura,
    setNumeroFactura,
  ] = useState("");

  const [
    estadoCobro,
    setEstadoCobro,
  ] = useState<
    | "pendiente"
    | "abonada"
    | "no_corresponde"
  >("pendiente");

  const ahora =
    new Date();

  const [
    mesInformado,
    setMesInformado,
  ] = useState(
    Math.max(
      1,
      ahora.getMonth()
    )
  );

  const [
    anioInformado,
    setAnioInformado,
  ] = useState(
    ahora.getFullYear()
  );

  const [
    cuatrimestre,
    setCuatrimestre,
  ] = useState(1);

  const [
    clienteRazonSocial,
    setClienteRazonSocial,
  ] = useState("");

  const [
    clienteDireccion,
    setClienteDireccion,
  ] = useState("");

  const [
    clienteLocalidad,
    setClienteLocalidad,
  ] = useState("");

  const [
    destino,
    setDestino,
  ] = useState("");

  const [
    inventario,
    setInventario,
  ] = useState("");

  const [
    detalle,
    setDetalle,
  ] = useState("");

  const [
    observaciones,
    setObservaciones,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const clienteVisible =
    useMemo(() => {
      if (presupuesto) {
        return nombreCliente(
          presupuesto
        );
      }

      return (
        clienteRazonSocial ||
        "Sin presupuesto relacionado"
      );
    }, [
      presupuesto,
      clienteRazonSocial,
    ]);

  function limpiarRelacionPresupuesto() {
    setPresupuesto(null);
    setNumeroPresupuesto("");
  }

  function buscarPresupuesto() {
    setError("");
    setMensaje("");

    const valor =
      numeroPresupuesto.trim();

    if (!valor) {
      setError(
        "Ingresá el número de presupuesto que querés buscar."
      );
      return;
    }

    startBuscarTransition(
      async () => {
        const resultado =
          await buscarPresupuestoParaInformeAction(
            valor
          );

        if (
          !resultado.ok
        ) {
          setPresupuesto(
            null
          );
          setError(
            resultado.error
          );
          return;
        }

        const encontrado =
          resultado.data;

        setPresupuesto(
          encontrado
        );

        setNumeroPresupuesto(
          String(
            encontrado.numero
          )
        );

        setClienteRazonSocial(
          nombreCliente(
            encontrado
          )
        );

        setClienteDireccion(
          encontrado
            .cliente_direccion ||
            ""
        );

        setClienteLocalidad(
          encontrado
            .cliente_localidad ||
            ""
        );

        setDestino(
          [
            encontrado
              .cliente_direccion,
            encontrado
              .cliente_localidad,
          ]
            .filter(Boolean)
            .join(" - ")
        );

        setDetalle(
          armarDetalleDesdePresupuesto(
            encontrado
          )
        );

        setMensaje(
          `Presupuesto N.º ${encontrado.numero} relacionado correctamente.`
        );
      }
    );
  }

  function cambiarTipo(
    valor: TipoDocumento
  ) {
    setTipoDocumento(
      valor
    );

    if (
      valor ===
      "informe_mensual"
    ) {
      setFechaEmision(
        fechaEmisionParaMes(
          mesInformado,
          anioInformado
        )
      );
    }
  }

  function actualizarMes(
    mes: number
  ) {
    setMesInformado(
      mes
    );

    if (
      tipoDocumento ===
      "informe_mensual"
    ) {
      setFechaEmision(
        fechaEmisionParaMes(
          mes,
          anioInformado
        )
      );
    }
  }

  function actualizarAnio(
    anio: number
  ) {
    setAnioInformado(
      anio
    );

    if (
      tipoDocumento ===
      "informe_mensual"
    ) {
      setFechaEmision(
        fechaEmisionParaMes(
          mesInformado,
          anio
        )
      );
    }
  }

  function datosParaGuardar() {
    return {
      tipoDocumento,
      presupuestoId:
        presupuesto?.id ||
        null,
      numeroPresupuesto:
        presupuesto?.numero ||
        null,
      ordenCompra:
        ordenCompra ||
        null,
      numeroFactura:
        numeroFactura ||
        null,
      estadoCobro,
      fechaEmision,
      mesInformado:
        tipoDocumento ===
        "informe_mensual"
          ? mesInformado
          : null,
      anioInformado:
        tipoDocumento ===
        "detalle_trabajo"
          ? null
          : anioInformado,
      cuatrimestre:
        tipoDocumento ===
        "informe_cuatrimestral"
          ? cuatrimestre
          : null,
      clienteRazonSocial:
        clienteRazonSocial ||
        null,
      clienteDireccion:
        clienteDireccion ||
        null,
      clienteLocalidad:
        clienteLocalidad ||
        null,
      destino:
        destino ||
        null,
      inventario:
        inventario ||
        null,
      detalle,
      observaciones:
        observaciones ||
        null,
    };
  }

  function guardarYGenerarPdf() {
    setError("");
    setMensaje("");

    if (
      tipoDocumento ===
      "informe_cuatrimestral"
    ) {
      setError(
        "El cuatrimestral todavía no tiene plantilla PDF definida."
      );
      return;
    }

    if (!ordenCompra.trim()) {
      setError(
        "Ingresá el número de Orden de Compra antes de generar el PDF."
      );
      return;
    }

    if (!numeroFactura.trim()) {
      setError(
        "Ingresá el número de factura antes de generar el PDF."
      );
      return;
    }

    if (!detalle.trim()) {
      setError(
        "Ingresá el detalle del trabajo o del informe."
      );
      return;
    }

    startGenerarTransition(
      async () => {
        const guardado =
          await crearInformeDetalleAction(
            datosParaGuardar()
          );

        if (!guardado.ok) {
          setError(
            guardado.error
          );
          return;
        }

        const generado =
          await generarInformeDetallePdfAction(
            guardado.data.id
          );

        if (!generado.ok) {
          setError(
            generado.error
          );
          return;
        }

        setMensaje(
          "Registro guardado y PDF generado correctamente."
        );

        window.open(
          generado.url,
          "_blank",
          "noopener,noreferrer"
        );
      }
    );
  }

  function guardar() {
    setError("");
    setMensaje("");

    if (!detalle.trim()) {
      setError(
        "Ingresá el detalle del trabajo o del informe."
      );
      return;
    }

    startTransition(
      async () => {
        const resultado =
          await crearInformeDetalleAction(
            datosParaGuardar()
          );

        if (!resultado.ok) {
          setError(
            resultado.error
          );
          return;
        }

        setMensaje(
          "Registro guardado correctamente."
        );

        setOrdenCompra("");
        setNumeroFactura("");
        setEstadoCobro(
          "pendiente"
        );
        setInventario("");
        setObservaciones("");
      }
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "18px",
      }}
    >
      <section
        style={boxStyle}
      >
        <h2 style={tituloStyle}>
          Tipo de documento
        </h2>

        <label style={labelStyle}>
          Documento
          <select
            value={
              tipoDocumento
            }
            onChange={(
              event
            ) =>
              cambiarTipo(
                event.target
                  .value as TipoDocumento
              )
            }
            style={inputStyle}
          >
            <option value="detalle_trabajo">
              Detalle de trabajo / constancia de servicio
            </option>

            <option value="informe_mensual">
              Informe mensual de curso
            </option>

            <option value="informe_cuatrimestral">
              Informe cuatrimestral
            </option>
          </select>
        </label>
      </section>

      <section
        style={boxStyle}
      >
        <h2 style={tituloStyle}>
          Presupuesto relacionado
        </h2>

        <p style={ayudaStyle}>
          Es opcional. Para un trabajo independiente escribí solamente el número del presupuesto y buscá.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(180px, 1fr) auto",
            gap: "10px",
            alignItems: "end",
          }}
        >
          <label style={labelStyle}>
            N.º de presupuesto
            <input
              inputMode="numeric"
              value={
                numeroPresupuesto
              }
              onChange={(
                event
              ) => {
                setNumeroPresupuesto(
                  event.target
                    .value
                );
                setPresupuesto(
                  null
                );
              }}
              placeholder="Ej.: 1051"
              style={inputStyle}
            />
          </label>

          <button
            type="button"
            onClick={
              buscarPresupuesto
            }
            disabled={buscando}
            style={buttonStyle}
          >
            {buscando
              ? "Buscando..."
              : "Buscar"}
          </button>
        </div>

        {presupuesto ? (
          <div
            style={
              presupuestoStyle
            }
          >
            <div>
              <strong>
                Presupuesto N.º{" "}
                {
                  presupuesto.numero
                }
              </strong>
              <p style={ayudaStyle}>
                {clienteVisible}
              </p>
              <p style={ayudaStyle}>
                {
                  presupuesto.cliente_direccion
                }
                {presupuesto.cliente_localidad
                  ? ` · ${presupuesto.cliente_localidad}`
                  : ""}
              </p>
              <p style={ayudaStyle}>
                {
                  presupuesto.items
                    .length
                }{" "}
                trabajo
                {presupuesto.items
                  .length === 1
                  ? ""
                  : "s"}{" "}
                relacionado
                {presupuesto.items
                  .length === 1
                  ? ""
                  : "s"}.
              </p>
            </div>

            <button
              type="button"
              onClick={
                limpiarRelacionPresupuesto
              }
              style={
                secondaryButtonStyle
              }
            >
              Quitar relación
            </button>
          </div>
        ) : null}
      </section>

      <section
        style={boxStyle}
      >
        <h2 style={tituloStyle}>
          Facturación y orden
        </h2>

        <div style={gridStyle}>
          <label style={labelStyle}>
            N.º de Orden de Compra
            <input
              value={
                ordenCompra
              }
              onChange={(
                event
              ) =>
                setOrdenCompra(
                  event.target
                    .value
                )
              }
              placeholder="Ej.: 121"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            N.º de factura
            <input
              value={
                numeroFactura
              }
              onChange={(
                event
              ) =>
                setNumeroFactura(
                  event.target
                    .value
                )
              }
              placeholder="Número de factura"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Estado de factura
            <select
              value={
                estadoCobro
              }
              onChange={(
                event
              ) =>
                setEstadoCobro(
                  event.target
                    .value as
                    | "pendiente"
                    | "abonada"
                    | "no_corresponde"
                )
              }
              style={inputStyle}
            >
              <option value="pendiente">
                Pendiente
              </option>
              <option value="abonada">
                Abonada
              </option>
              <option value="no_corresponde">
                No corresponde
              </option>
            </select>
          </label>

          <label style={labelStyle}>
            Fecha de emisión
            <input
              type="date"
              value={
                fechaEmision
              }
              onChange={(
                event
              ) =>
                setFechaEmision(
                  event.target
                    .value
                )
              }
              style={inputStyle}
            />
          </label>
        </div>
      </section>

      {tipoDocumento ===
      "informe_mensual" ? (
        <section
          style={boxStyle}
        >
          <h2
            style={tituloStyle}
          >
            Período mensual
          </h2>

          <p style={ayudaStyle}>
            La fecha se propone para el día 22 del mes siguiente. Si cae sábado o domingo, pasa al lunes siguiente.
          </p>

          <div style={gridStyle}>
            <label style={labelStyle}>
              Mes informado
              <select
                value={
                  mesInformado
                }
                onChange={(
                  event
                ) =>
                  actualizarMes(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
                style={inputStyle}
              >
                {meses.map(
                  (
                    mes,
                    indice
                  ) => (
                    <option
                      key={
                        mes
                      }
                      value={
                        indice +
                        1
                      }
                    >
                      {mes}
                    </option>
                  )
                )}
              </select>
            </label>

            <label style={labelStyle}>
              Año informado
              <input
                type="number"
                min="2000"
                max="2200"
                value={
                  anioInformado
                }
                onChange={(
                  event
                ) =>
                  actualizarAnio(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
                style={inputStyle}
              />
            </label>
          </div>
        </section>
      ) : null}

      {tipoDocumento ===
      "informe_cuatrimestral" ? (
        <section
          style={boxStyle}
        >
          <h2
            style={tituloStyle}
          >
            Período cuatrimestral
          </h2>

          <div style={gridStyle}>
            <label style={labelStyle}>
              Cuatrimestre
              <select
                value={
                  cuatrimestre
                }
                onChange={(
                  event
                ) =>
                  setCuatrimestre(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
                style={inputStyle}
              >
                <option value={1}>
                  Primer cuatrimestre
                </option>
                <option value={2}>
                  Segundo cuatrimestre
                </option>
                <option value={3}>
                  Tercer cuatrimestre
                </option>
              </select>
            </label>

            <label style={labelStyle}>
              Año
              <input
                type="number"
                min="2000"
                max="2200"
                value={
                  anioInformado
                }
                onChange={(
                  event
                ) =>
                  setAnioInformado(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
                style={inputStyle}
              />
            </label>
          </div>
        </section>
      ) : null}

      <section
        style={boxStyle}
      >
        <h2 style={tituloStyle}>
          Datos del informe
        </h2>

        {!presupuesto ? (
          <div style={gridStyle}>
            <label style={labelStyle}>
              Cliente / organismo
              <input
                value={
                  clienteRazonSocial
                }
                onChange={(
                  event
                ) =>
                  setClienteRazonSocial(
                    event.target
                      .value
                  )
                }
                placeholder="Ej.: IMDEL"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Dirección
              <input
                value={
                  clienteDireccion
                }
                onChange={(
                  event
                ) =>
                  setClienteDireccion(
                    event.target
                      .value
                  )
                }
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Localidad
              <input
                value={
                  clienteLocalidad
                }
                onChange={(
                  event
                ) =>
                  setClienteLocalidad(
                    event.target
                      .value
                  )
                }
                style={inputStyle}
              />
            </label>
          </div>
        ) : null}

        <div style={gridStyle}>
          <label style={labelStyle}>
            Destino / lugar del trabajo
            <input
              value={destino}
              onChange={(
                event
              ) =>
                setDestino(
                  event.target
                    .value
                )
              }
              placeholder="Ej.: Escuela Agraria, sector..."
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            N.º de inventario
            <input
              value={
                inventario
              }
              onChange={(
                event
              ) =>
                setInventario(
                  event.target
                    .value
                )
              }
              placeholder="Opcional"
              style={inputStyle}
            />
          </label>
        </div>

        <label style={labelStyle}>
          Detalle
          <textarea
            rows={12}
            value={detalle}
            onChange={(
              event
            ) =>
              setDetalle(
                event.target
                  .value
              )
            }
            placeholder="Detalle del trabajo realizado o contenidos del período."
            style={{
              ...inputStyle,
              minHeight:
                "250px",
              resize:
                "vertical",
            }}
          />
        </label>

        <label style={labelStyle}>
          Observaciones
          <textarea
            rows={4}
            value={
              observaciones
            }
            onChange={(
              event
            ) =>
              setObservaciones(
                event.target
                  .value
              )
            }
            style={{
              ...inputStyle,
              resize:
                "vertical",
            }}
          />
        </label>
      </section>

      {error ? (
        <div style={errorStyle}>
          {error}
        </div>
      ) : null}

      {mensaje ? (
        <div
          style={
            successStyle
          }
        >
          {mensaje}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        <button
          type="button"
          onClick={guardar}
          disabled={
            guardando ||
            generando
          }
          style={{
            ...guardarButtonStyle,
            opacity:
              guardando ||
              generando
                ? 0.65
                : 1,
          }}
        >
          {guardando
            ? "Guardando..."
            : "Guardar registro"}
        </button>

        <button
          type="button"
          onClick={
            guardarYGenerarPdf
          }
          disabled={
            generando ||
            guardando ||
            tipoDocumento ===
              "informe_cuatrimestral"
          }
          style={{
            ...guardarButtonStyle,
            background:
              "#285887",
            opacity:
              generando ||
              guardando ||
              tipoDocumento ===
                "informe_cuatrimestral"
                ? 0.55
                : 1,
          }}
        >
          {generando
            ? "Generando PDF..."
            : tipoDocumento ===
                "informe_cuatrimestral"
              ? "PDF pendiente de modelo"
              : "Guardar y generar PDF"}
        </button>
      </div>
    </div>
  );
}

const boxStyle = {
  display: "grid",
  gap: "14px",
  padding: "20px",
  border:
    "1px solid rgba(38, 40, 42, 0.12)",
  borderRadius: "16px",
  background:
    "rgba(255, 253, 248, 0.92)",
};

const tituloStyle = {
  margin: 0,
  color:
    "var(--foreground)",
  fontSize: "1.15rem",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "12px",
};

const labelStyle = {
  display: "grid",
  gap: "6px",
  color:
    "var(--foreground)",
  fontSize: "0.86rem",
  fontWeight: 800,
};

const inputStyle = {
  width: "100%",
  minHeight: "44px",
  boxSizing:
    "border-box" as const,
  padding: "10px 12px",
  border:
    "1px solid rgba(74, 113, 145, 0.42)",
  borderRadius: "10px",
  background: "#eef5fa",
  boxShadow:
    "inset 0 1px 2px rgba(25, 58, 85, 0.08)",
  color:
    "var(--foreground)",
  font: "inherit",
};

const ayudaStyle = {
  margin: 0,
  color: "var(--muted)",
  fontSize: "0.84rem",
  lineHeight: 1.5,
};

const presupuestoStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  gap: "14px",
  alignItems:
    "flex-start",
  padding: "14px",
  border:
    "1px solid rgba(35, 107, 67, 0.2)",
  borderRadius: "12px",
  background:
    "rgba(35, 107, 67, 0.06)",
};

const buttonStyle = {
  minHeight: "44px",
  padding: "9px 16px",
  border: 0,
  borderRadius: "10px",
  background:
    "var(--foreground)",
  color: "#ffffff",
  font: "inherit",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  minHeight: "38px",
  padding: "8px 12px",
  border:
    "1px solid rgba(38, 40, 42, 0.18)",
  borderRadius: "9px",
  background: "#ffffff",
  color:
    "var(--foreground)",
  font: "inherit",
  fontWeight: 800,
  cursor: "pointer",
};

const errorStyle = {
  padding: "14px",
  borderRadius: "12px",
  background:
    "rgba(180, 40, 40, 0.08)",
  color: "#982828",
  fontWeight: 800,
};

const successStyle = {
  padding: "14px",
  borderRadius: "12px",
  background:
    "rgba(35, 107, 67, 0.08)",
  color: "#236b43",
  fontWeight: 800,
};

const guardarButtonStyle = {
  minHeight: "52px",
  padding: "12px 18px",
  border: 0,
  borderRadius: "12px",
  background:
    "var(--foreground)",
  color: "#ffffff",
  font: "inherit",
  fontSize: "1rem",
  fontWeight: 900,
  cursor: "pointer",
};
