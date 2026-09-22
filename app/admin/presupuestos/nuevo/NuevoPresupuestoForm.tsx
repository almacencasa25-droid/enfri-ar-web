"use client";

import {
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  buscarClientesPresupuestoAction,
  buscarTrabajosPresupuestoAction,
  crearPresupuestoAction,
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
  direccion: string | null;
  localidad: string | null;
  relevancia: number;
};

type Trabajo = {
  id: string;
  nombre_corto: string;
  detalle: string;
  categoria: string | null;
  tipo: string | null;
  precio_unitario: number;
  relevancia: number;
};

type Equipo = {
  key: string;
  tipo: string;
  marca: string;
  modelo: string;
  capacidad: string;
  ubicacion: string;
  refrigerante: string;
  serie: string;
  observaciones: string;
};

type Item = {
  key: string;
  equipoKey: string;
  trabajo_id: string | null;
  nombre_corto: string;
  detalle: string;
  tipo: string;
  cantidad: number | string;
  precio_unitario: number | string;
};

function fechaLocalHoy() {
  const hoy = new Date();

  const anio = hoy.getFullYear();
  const mes = String(
    hoy.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    hoy.getDate()
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function moneda(valor: number) {
  return new Intl.NumberFormat(
    "es-AR",
    {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }
  ).format(valor);
}

function nuevaKey() {
  return `${Date.now()}-${Math.random()}`;
}

function equipoVacio(
  key: string
): Equipo {
  return {
    key,
    tipo: "Split",
    marca: "",
    modelo: "",
    capacidad: "",
    ubicacion: "",
    refrigerante: "",
    serie: "",
    observaciones: "",
  };
}

export default function NuevoPresupuestoForm() {
  const router =
    useRouter();

  const [guardando, startTransition] =
    useTransition();

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    numeroFichaRevision,
    setNumeroFichaRevision,
  ] = useState("");

  const [fecha, setFecha] =
    useState(fechaLocalHoy());

  const [clienteId, setClienteId] =
    useState<string | null>(null);

  const [clienteBusqueda, setClienteBusqueda] =
    useState("");

  const [clientesEncontrados, setClientesEncontrados] =
    useState<Cliente[]>([]);

  const [buscandoClientes, setBuscandoClientes] =
    useState(false);

  const clienteBusquedaActual =
    useRef(0);

  const [clienteNombre, setClienteNombre] =
    useState("");

  const [clienteApellido, setClienteApellido] =
    useState("");

  const [
    clienteRazonSocial,
    setClienteRazonSocial,
  ] = useState("");

  const [clienteDni, setClienteDni] =
    useState("");

  const [clienteCuit, setClienteCuit] =
    useState("");

  const [clienteTelefono, setClienteTelefono] =
    useState("");

  const [clienteEmail, setClienteEmail] =
    useState("");

  const [
    clienteDireccion,
    setClienteDireccion,
  ] = useState("");

  const [
    clienteLocalidad,
    setClienteLocalidad,
  ] = useState("");

  const [trabajoBusqueda, setTrabajoBusqueda] =
    useState("");

  const [
    trabajosEncontrados,
    setTrabajosEncontrados,
  ] = useState<Trabajo[]>([]);

  const [buscandoTrabajos, setBuscandoTrabajos] =
    useState(false);

  const trabajoBusquedaActual =
    useRef(0);

  const [
    trabajoSeleccionado,
    setTrabajoSeleccionado,
  ] = useState<Trabajo | null>(null);

  const [equipos, setEquipos] =
    useState<Equipo[]>([
      equipoVacio("equipo-1"),
    ]);

  const [
    equipoActivoKey,
    setEquipoActivoKey,
  ] = useState("equipo-1");

  const [items, setItems] =
    useState<Item[]>([]);

  const equipoActivo =
    equipos.find(
      (equipo) =>
        equipo.key === equipoActivoKey
    ) || equipos[0];

  const itemsEquipoActivo =
    items.filter(
      (item) =>
        item.equipoKey ===
        equipoActivo?.key
    );

  const [detalleCorto, setDetalleCorto] =
    useState("");

  const [
    descuentoTipo,
    setDescuentoTipo,
  ] = useState("");

  const [
    descuentoValor,
    setDescuentoValor,
  ] = useState("");

  const [recargoTipo, setRecargoTipo] =
    useState("");

  const [recargoValor, setRecargoValor] =
    useState("");

  const [formaPago, setFormaPago] =
    useState("");

  const [
    condicionesPago,
    setCondicionesPago,
  ] = useState("");

  const [vigenciaDias, setVigenciaDias] =
    useState("15");

  const [
    observacionesCliente,
    setObservacionesCliente,
  ] = useState("");

  const [
    observacionesInternas,
    setObservacionesInternas,
  ] = useState("");

  const [
    fechaProgramada,
    setFechaProgramada,
  ] = useState("");

  const [
    horaProgramada,
    setHoraProgramada,
  ] = useState("");

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total +
        Number(item.cantidad || 0) *
          Number(
            item.precio_unitario || 0
          ),
      0
    );
  }, [items]);

  const descuento = useMemo(() => {
    if (!descuentoTipo) {
      return 0;
    }

    if (
      descuentoTipo === "porcentaje"
    ) {
      return (
        subtotal *
        (Number(descuentoValor || 0) /
          100)
      );
    }

    return Number(
      descuentoValor || 0
    );
  }, [
    descuentoTipo,
    descuentoValor,
    subtotal,
  ]);

  const baseConDescuento = Math.max(
    0,
    subtotal - descuento
  );

  const recargo = useMemo(() => {
    if (!recargoTipo) {
      return 0;
    }

    if (
      recargoTipo === "porcentaje"
    ) {
      return (
        baseConDescuento *
        (Number(recargoValor || 0) /
          100)
      );
    }

    return Number(
      recargoValor || 0
    );
  }, [
    recargoTipo,
    recargoValor,
    baseConDescuento,
  ]);

  const total = Math.max(
    0,
    baseConDescuento + recargo
  );

  async function buscarClientes(
    valor: string
  ) {
    setClienteBusqueda(valor);
    setClienteId(null);

    const numero =
      ++clienteBusquedaActual.current;

    if (valor.trim().length < 2) {
      setClientesEncontrados([]);
      setBuscandoClientes(false);
      return;
    }

    setBuscandoClientes(true);

    const resultado =
      await buscarClientesPresupuestoAction(
        valor
      );

    if (
      numero !==
      clienteBusquedaActual.current
    ) {
      return;
    }

    setBuscandoClientes(false);

    if (!resultado.ok) {
      setClientesEncontrados([]);
      return;
    }

    setClientesEncontrados(
      resultado.data || []
    );
  }

  function seleccionarCliente(
    cliente: Cliente
  ) {
    setClienteId(cliente.id);

    setClienteNombre(
      cliente.nombre || ""
    );

    setClienteApellido(
      cliente.apellido || ""
    );

    setClienteRazonSocial(
      cliente.razon_social || ""
    );

    setClienteDni(cliente.dni || "");
    setClienteCuit(cliente.cuit || "");

    setClienteTelefono(
      cliente.telefono || ""
    );

    setClienteEmail(
      cliente.email || ""
    );

    setClienteDireccion(
      cliente.direccion || ""
    );

    setClienteLocalidad(
      cliente.localidad || ""
    );

    const nombreVisible =
      cliente.razon_social ||
      [
        cliente.nombre,
        cliente.apellido,
      ]
        .filter(Boolean)
        .join(" ");

    setClienteBusqueda(
      nombreVisible || ""
    );

    setClientesEncontrados([]);
  }

  function limpiarClienteSeleccionado() {
    setClienteId(null);
  }

  async function buscarTrabajos(
    valor: string
  ) {
    setTrabajoBusqueda(valor);

    const numero =
      ++trabajoBusquedaActual.current;

    if (valor.trim().length < 2) {
      setTrabajosEncontrados([]);
      setBuscandoTrabajos(false);
      return;
    }

    setBuscandoTrabajos(true);

    const resultado =
      await buscarTrabajosPresupuestoAction(
        valor
      );

    if (
      numero !==
      trabajoBusquedaActual.current
    ) {
      return;
    }

    setBuscandoTrabajos(false);

    if (!resultado.ok) {
      setTrabajosEncontrados([]);
      return;
    }

    setTrabajosEncontrados(
      resultado.data || []
    );
  }

  function seleccionarTrabajo(
    trabajo: Trabajo
  ) {
    setTrabajoSeleccionado(trabajo);
    setTrabajoBusqueda(
      trabajo.nombre_corto
    );
    setTrabajosEncontrados([]);
  }

  function agregarTrabajoSeleccionado() {
    if (
      !trabajoSeleccionado ||
      !equipoActivo
    ) {
      return;
    }

    setItems((actuales) => [
      ...actuales,
      {
        key: nuevaKey(),
        equipoKey:
          equipoActivo.key,
        trabajo_id:
          trabajoSeleccionado.id,
        nombre_corto:
          trabajoSeleccionado.nombre_corto,
        detalle:
          trabajoSeleccionado.detalle,
        tipo:
          trabajoSeleccionado.tipo ||
          "mano_obra",
        cantidad: 1,
        precio_unitario: Number(
          trabajoSeleccionado.precio_unitario ||
            0
        ),
      },
    ]);

    setTrabajoSeleccionado(null);
    setTrabajoBusqueda("");
    setTrabajosEncontrados([]);
  }

  function agregarEquipo() {
    const nuevo =
      equipoVacio(nuevaKey());

    setEquipos((actuales) => [
      ...actuales,
      nuevo,
    ]);

    setEquipoActivoKey(nuevo.key);
    setTrabajoSeleccionado(null);
    setTrabajoBusqueda("");
    setTrabajosEncontrados([]);
  }

  function actualizarEquipo(
    key: string,
    cambios: Partial<Equipo>
  ) {
    setEquipos((actuales) =>
      actuales.map((equipo) =>
        equipo.key === key
          ? {
              ...equipo,
              ...cambios,
            }
          : equipo
      )
    );
  }

  function eliminarEquipo(
    key: string
  ) {
    if (equipos.length <= 1) {
      return;
    }

    const restantes =
      equipos.filter(
        (equipo) =>
          equipo.key !== key
      );

    setEquipos(restantes);

    setItems((actuales) =>
      actuales.filter(
        (item) =>
          item.equipoKey !== key
      )
    );

    if (equipoActivoKey === key) {
      setEquipoActivoKey(
        restantes[0].key
      );
    }

    setTrabajoSeleccionado(null);
    setTrabajoBusqueda("");
    setTrabajosEncontrados([]);
  }

  function modificarItem(
    key: string,
    cambios: Partial<Item>
  ) {
    setItems((actuales) =>
      actuales.map((item) =>
        item.key === key
          ? {
              ...item,
              ...cambios,
            }
          : item
      )
    );
  }

  function eliminarItem(key: string) {
    setItems((actuales) =>
      actuales.filter(
        (item) => item.key !== key
      )
    );
  }

  function limpiarFormulario() {
    setNumeroFichaRevision("");
    setFecha(fechaLocalHoy());

    setClienteId(null);
    setClienteBusqueda("");
    setClientesEncontrados([]);

    setClienteNombre("");
    setClienteApellido("");
    setClienteRazonSocial("");
    setClienteDni("");
    setClienteCuit("");
    setClienteTelefono("");
    setClienteEmail("");
    setClienteDireccion("");
    setClienteLocalidad("");

    setTrabajoBusqueda("");
    setTrabajosEncontrados([]);
    setTrabajoSeleccionado(null);

    setEquipos([
      equipoVacio("equipo-1"),
    ]);
    setEquipoActivoKey("equipo-1");

    setItems([]);

    setDetalleCorto("");

    setDescuentoTipo("");
    setDescuentoValor("");

    setRecargoTipo("");
    setRecargoValor("");

    setFormaPago("");
    setCondicionesPago("");

    setVigenciaDias("15");

    setObservacionesCliente("");
    setObservacionesInternas("");

    setFechaProgramada("");
    setHoraProgramada("");
  }

  function guardarPresupuesto() {
    setMensaje("");
    setError("");

    startTransition(async () => {
      const resultado =
        await crearPresupuestoAction({
          numeroFichaRevision:
            numeroFichaRevision.trim() ||
            null,

          fecha,

          clienteId,

          clienteNombre,
          clienteApellido,
          clienteRazonSocial,
          clienteDni,
          clienteCuit,
          clienteTelefono,
          clienteEmail,
          clienteDireccion,
          clienteLocalidad,

          detalleCorto,

          descuentoTipo:
            descuentoTipo || null,

          descuentoValor:
            Number(
              descuentoValor || 0
            ),

          recargoTipo:
            recargoTipo || null,

          recargoValor:
            Number(
              recargoValor || 0
            ),

          formaPago,
          condicionesPago,

          vigenciaDias:
            vigenciaDias.trim()
              ? Number(vigenciaDias)
              : null,

          observacionesCliente,
          observacionesInternas,

          fechaProgramada:
            fechaProgramada || null,

          horaProgramada:
            horaProgramada || null,

          items: items.map(
            (item) => {
              const equipo =
                equipos.find(
                  (actual) =>
                    actual.key ===
                    item.equipoKey
                );

              const equipoOrden =
                equipos.findIndex(
                  (actual) =>
                    actual.key ===
                    item.equipoKey
                ) + 1;

              return {
                trabajo_id:
                  item.trabajo_id,
                nombre_corto:
                  item.nombre_corto,
                detalle:
                  item.detalle,
                tipo: item.tipo,
                cantidad:
                  Number(item.cantidad),
                precio_unitario:
                  Number(
                    item.precio_unitario
                  ),

                equipo_orden:
                  equipoOrden > 0
                    ? equipoOrden
                    : null,
                equipo_tipo:
                  equipo?.tipo || null,
                equipo_marca:
                  equipo?.marca || null,
                equipo_modelo:
                  equipo?.modelo || null,
                equipo_capacidad:
                  equipo?.capacidad || null,
                equipo_ubicacion:
                  equipo?.ubicacion || null,
                equipo_refrigerante:
                  equipo?.refrigerante ||
                  null,
                equipo_serie:
                  equipo?.serie || null,
                equipo_observaciones:
                  equipo?.observaciones ||
                  null,
              };
            }
          ),
        });

      if (!resultado.ok) {
        setError(
          resultado.error ||
            "No se pudo guardar el presupuesto."
        );
        return;
      }

      setMensaje(
        "Presupuesto creado correctamente."
      );

      const presupuestoId =
        resultado.data?.id;

      if (!presupuestoId) {
        setError(
          "El presupuesto fue creado, pero no se recibió su identificación para volver al listado."
        );

        return;
      }

      router.push(
        `/admin/presupuestos/listado?abrir=${encodeURIComponent(
          presupuestoId
        )}`
      );
    });
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "20px",
      }}
    >
      <section style={boxStyle}>
        <h2 style={tituloStyle}>
          Datos del presupuesto
        </h2>

        <div style={gridStyle}>
          <label style={labelStyle}>
            Fecha *
            <input
              type="date"
              value={fecha}
              onChange={(event) =>
                setFecha(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            N.º de ficha de revisión
            <input
              value={numeroFichaRevision}
              onChange={(event) =>
                setNumeroFichaRevision(
                  event.target.value
                )
              }
              maxLength={60}
              placeholder="Opcional · solo se imprime en este PDF"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Vigencia en días
            <input
              type="number"
              min="0"
              value={vigenciaDias}
              onChange={(event) =>
                setVigenciaDias(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>
        </div>

        <label style={labelStyle}>
          Resumen / detalle corto
          <input
            value={detalleCorto}
            onChange={(event) =>
              setDetalleCorto(
                event.target.value
              )
            }
            placeholder="Ej.: mantenimiento de equipos"
            style={inputStyle}
          />
        </label>
      </section>

      <section style={boxStyle}>
        <h2 style={tituloStyle}>
          Cliente
        </h2>

        <label style={labelStyle}>
          Buscar cliente existente
          <input
            value={clienteBusqueda}
            onChange={(event) =>
              void buscarClientes(
                event.target.value
              )
            }
            placeholder="Nombre, apellido, razón social, DNI o CUIT"
            style={inputStyle}
          />
        </label>

        {buscandoClientes ? (
          <p style={ayudaStyle}>
            Buscando...
          </p>
        ) : null}

        {clientesEncontrados.length >
        0 ? (
          <div style={resultadoStyle}>
            {clientesEncontrados.map(
              (cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() =>
                    seleccionarCliente(
                      cliente
                    )
                  }
                  style={resultadoBotonStyle}
                >
                  <strong>
                    {cliente.razon_social ||
                      [
                        cliente.nombre,
                        cliente.apellido,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                  </strong>

                  <span>
                    {cliente.dni
                      ? `DNI ${cliente.dni}`
                      : ""}

                    {cliente.cuit
                      ? ` CUIT ${cliente.cuit}`
                      : ""}
                  </span>

                  <span>
                    {cliente.direccion}
                    {cliente.localidad
                      ? ` · ${cliente.localidad}`
                      : ""}
                  </span>
                </button>
              )
            )}
          </div>
        ) : null}

        {clienteId ? (
          <p style={seleccionStyle}>
            Cliente existente seleccionado.
            Si modificás sus datos acá, se
            conservarán como snapshot del
            presupuesto.
          </p>
        ) : (
          <p style={ayudaStyle}>
            Si el cliente no existe, completá
            sus datos y se guardará al crear el
            presupuesto.
          </p>
        )}

        <div style={gridStyle}>
          <label style={labelStyle}>
            Nombre
            <input
              value={clienteNombre}
              onChange={(event) => {
                setClienteNombre(
                  event.target.value
                );
                limpiarClienteSeleccionado();
              }}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Apellido
            <input
              value={clienteApellido}
              onChange={(event) => {
                setClienteApellido(
                  event.target.value
                );
                limpiarClienteSeleccionado();
              }}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Razón social
            <input
              value={clienteRazonSocial}
              onChange={(event) => {
                setClienteRazonSocial(
                  event.target.value
                );
                limpiarClienteSeleccionado();
              }}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            DNI
            <input
              value={clienteDni}
              onChange={(event) => {
                setClienteDni(
                  event.target.value
                );
                limpiarClienteSeleccionado();
              }}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            CUIT
            <input
              value={clienteCuit}
              onChange={(event) => {
                setClienteCuit(
                  event.target.value
                );
                limpiarClienteSeleccionado();
              }}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Teléfono
            <input
              value={clienteTelefono}
              onChange={(event) => {
                setClienteTelefono(
                  event.target.value
                );
                limpiarClienteSeleccionado();
              }}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Correo
            <input
              type="email"
              value={clienteEmail}
              onChange={(event) => {
                setClienteEmail(
                  event.target.value
                );
                limpiarClienteSeleccionado();
              }}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Localidad
            <input
              value={clienteLocalidad}
              onChange={(event) => {
                setClienteLocalidad(
                  event.target.value
                );
                limpiarClienteSeleccionado();
              }}
              style={inputStyle}
            />
          </label>
        </div>

        <label style={labelStyle}>
          Dirección *
          <input
            value={clienteDireccion}
            onChange={(event) => {
              setClienteDireccion(
                event.target.value
              );
              limpiarClienteSeleccionado();
            }}
            style={inputStyle}
          />
        </label>
      </section>

      <section style={boxStyle}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div>
            <h2 style={tituloStyle}>
              Equipos y trabajos
            </h2>

            <p style={ayudaStyle}>
              Identificá el equipo y agregá
              únicamente los trabajos que
              correspondan a ese equipo.
            </p>
          </div>

          <button
            type="button"
            onClick={agregarEquipo}
            style={buttonStyle}
          >
            + Agregar equipo
          </button>
        </div>

        <div style={equipoTabsStyle}>
          {equipos.map(
            (equipo, indice) => {
              const activo =
                equipo.key ===
                equipoActivo?.key;

              const etiqueta = [
                `Equipo ${indice + 1}`,
                equipo.marca,
                equipo.ubicacion,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <button
                  key={equipo.key}
                  type="button"
                  onClick={() => {
                    setEquipoActivoKey(
                      equipo.key
                    );
                    setTrabajoSeleccionado(
                      null
                    );
                    setTrabajoBusqueda("");
                    setTrabajosEncontrados(
                      []
                    );
                  }}
                  style={{
                    ...equipoTabStyle,
                    background: activo
                      ? "var(--foreground)"
                      : "#ffffff",
                    color: activo
                      ? "#ffffff"
                      : "var(--foreground)",
                  }}
                >
                  {etiqueta}
                </button>
              );
            }
          )}
        </div>

        {equipoActivo ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <strong>
                Datos del equipo{" "}
                {equipos.findIndex(
                  (equipo) =>
                    equipo.key ===
                    equipoActivo.key
                ) + 1}
              </strong>

              {equipos.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    eliminarEquipo(
                      equipoActivo.key
                    )
                  }
                  style={deleteButtonStyle}
                >
                  Eliminar equipo
                </button>
              ) : null}
            </div>

            <div style={gridStyle}>
              <label style={labelStyle}>
                Tipo de equipo
                <select
                  value={equipoActivo.tipo}
                  onChange={(event) =>
                    actualizarEquipo(
                      equipoActivo.key,
                      {
                        tipo:
                          event.target
                            .value,
                      }
                    )
                  }
                  style={inputStyle}
                >
                  <option value="Split">
                    Split
                  </option>
                  <option value="Piso techo">
                    Piso techo
                  </option>
                  <option value="Cassette">
                    Cassette
                  </option>
                  <option value="Ventana">
                    Ventana
                  </option>
                  <option value="Otro">
                    Otro
                  </option>
                </select>
              </label>

              <label style={labelStyle}>
                Marca
                <input
                  value={equipoActivo.marca}
                  onChange={(event) =>
                    actualizarEquipo(
                      equipoActivo.key,
                      {
                        marca:
                          event.target
                            .value,
                      }
                    )
                  }
                  placeholder="Ej.: BGH"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Modelo
                <input
                  value={equipoActivo.modelo}
                  onChange={(event) =>
                    actualizarEquipo(
                      equipoActivo.key,
                      {
                        modelo:
                          event.target
                            .value,
                      }
                    )
                  }
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Capacidad
                <input
                  value={
                    equipoActivo.capacidad
                  }
                  onChange={(event) =>
                    actualizarEquipo(
                      equipoActivo.key,
                      {
                        capacidad:
                          event.target
                            .value,
                      }
                    )
                  }
                  placeholder="Ej.: 4500 fg"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Ubicación / sector
                <input
                  value={
                    equipoActivo.ubicacion
                  }
                  onChange={(event) =>
                    actualizarEquipo(
                      equipoActivo.key,
                      {
                        ubicacion:
                          event.target
                            .value,
                      }
                    )
                  }
                  placeholder="Ej.: Office enfermería"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Refrigerante
                <input
                  value={
                    equipoActivo.refrigerante
                  }
                  onChange={(event) =>
                    actualizarEquipo(
                      equipoActivo.key,
                      {
                        refrigerante:
                          event.target
                            .value,
                      }
                    )
                  }
                  placeholder="Ej.: R410A"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                N.º de serie
                <input
                  value={equipoActivo.serie}
                  onChange={(event) =>
                    actualizarEquipo(
                      equipoActivo.key,
                      {
                        serie:
                          event.target
                            .value,
                      }
                    )
                  }
                  style={inputStyle}
                />
              </label>
            </div>

            <label style={labelStyle}>
              Observaciones del equipo
              <input
                value={
                  equipoActivo.observaciones
                }
                onChange={(event) =>
                  actualizarEquipo(
                    equipoActivo.key,
                    {
                      observaciones:
                        event.target.value,
                    }
                  )
                }
                placeholder="Ej.: sin etiqueta, acceso en altura..."
                style={inputStyle}
              />
            </label>

            <div style={separadorStyle} />

            <label style={labelStyle}>
              Buscar trabajo
              <input
                value={trabajoBusqueda}
                onChange={(event) => {
                  setTrabajoSeleccionado(
                    null
                  );
                  void buscarTrabajos(
                    event.target.value
                  );
                }}
                placeholder="Ej.: limpieza, fuga, instalación..."
                style={inputStyle}
              />
            </label>

            {buscandoTrabajos ? (
              <p style={ayudaStyle}>
                Buscando...
              </p>
            ) : null}

            {trabajosEncontrados.length >
            0 ? (
              <div style={resultadoStyle}>
                {trabajosEncontrados.map(
                  (trabajo) => (
                    <button
                      key={trabajo.id}
                      type="button"
                      onClick={() =>
                        seleccionarTrabajo(
                          trabajo
                        )
                      }
                      style={
                        resultadoBotonStyle
                      }
                    >
                      <strong>
                        {
                          trabajo.nombre_corto
                        }
                      </strong>

                      <span>
                        {trabajo.categoria ||
                          "Sin categoría"}{" "}
                        ·{" "}
                        {moneda(
                          Number(
                            trabajo.precio_unitario ||
                              0
                          )
                        )}
                      </span>
                    </button>
                  )
                )}
              </div>
            ) : null}

            {trabajoSeleccionado ? (
              <div style={previewTrabajoStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "12px",
                    alignItems:
                      "flex-start",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gap: "6px",
                    }}
                  >
                    <strong>
                      {
                        trabajoSeleccionado.nombre_corto
                      }
                    </strong>

                    <span
                      style={{
                        fontSize:
                          "0.84rem",
                        lineHeight: 1.45,
                      }}
                    >
                      {
                        trabajoSeleccionado.detalle
                      }
                    </span>

                    <strong>
                      {moneda(
                        Number(
                          trabajoSeleccionado.precio_unitario ||
                            0
                        )
                      )}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={
                      agregarTrabajoSeleccionado
                    }
                    style={buttonStyle}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            ) : null}

            <div>
              <strong>
                Trabajos del equipo
              </strong>

              <p style={ayudaStyle}>
                {itemsEquipoActivo.length}{" "}
                trabajo
                {itemsEquipoActivo.length ===
                1
                  ? ""
                  : "s"}{" "}
                agregado
                {itemsEquipoActivo.length ===
                1
                  ? ""
                  : "s"}.
              </p>
            </div>

            <div style={trabajosScrollStyle}>
              {itemsEquipoActivo.length ===
              0 ? (
                <p style={ayudaStyle}>
                  Todavía no agregaste
                  trabajos a este equipo.
                </p>
              ) : (
                itemsEquipoActivo.map(
                  (item) => {
                    const itemSubtotal =
                      Number(
                        item.cantidad || 0
                      ) *
                      Number(
                        item.precio_unitario ||
                          0
                      );

                    return (
                      <div
                        key={item.key}
                        style={
                          itemCompactoStyle
                        }
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            gap: "10px",
                            alignItems:
                              "flex-start",
                          }}
                        >
                          <strong>
                            {
                              item.nombre_corto
                            }
                          </strong>

                          <button
                            type="button"
                            onClick={() =>
                              eliminarItem(
                                item.key
                              )
                            }
                            style={
                              deleteButtonStyle
                            }
                          >
                            Eliminar
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={item.detalle}
                          onChange={(event) =>
                            modificarItem(
                              item.key,
                              {
                                detalle:
                                  event.target
                                    .value,
                              }
                            )
                          }
                          style={{
                            ...inputStyle,
                            minHeight: "70px",
                            resize: "vertical",
                          }}
                        />

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "minmax(90px, 0.7fr) minmax(140px, 1fr) minmax(120px, auto)",
                            gap: "10px",
                            alignItems: "end",
                          }}
                        >
                          <label
                            style={
                              labelStyle
                            }
                          >
                            Cant.
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={
                                item.cantidad
                              }
                              onChange={(
                                event
                              ) =>
                                modificarItem(
                                  item.key,
                                  {
                                    cantidad:
                                      event.target
                                        .value,
                                  }
                                )
                              }
                              style={
                                inputStyle
                              }
                            />
                          </label>

                          <label
                            style={
                              labelStyle
                            }
                          >
                            Precio
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.precio_unitario
                              }
                              onChange={(
                                event
                              ) =>
                                modificarItem(
                                  item.key,
                                  {
                                    precio_unitario:
                                      event.target
                                        .value,
                                  }
                                )
                              }
                              style={
                                inputStyle
                              }
                            />
                          </label>

                          <strong
                            style={{
                              textAlign:
                                "right",
                              paddingBottom:
                                "12px",
                            }}
                          >
                            {moneda(
                              itemSubtotal
                            )}
                          </strong>
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>
          </>
        ) : null}
      </section>

      <section style={boxStyle}>
        <h2 style={tituloStyle}>
          Totales
        </h2>

        <div style={gridStyle}>
          <label style={labelStyle}>
            Tipo de descuento
            <select
              value={descuentoTipo}
              onChange={(event) =>
                setDescuentoTipo(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="">
                Sin descuento
              </option>

              <option value="porcentaje">
                Porcentaje
              </option>

              <option value="importe">
                Importe fijo
              </option>
            </select>
          </label>

          <label style={labelStyle}>
            Valor descuento
            <input
              type="number"
              min="0"
              step="0.01"
              disabled={!descuentoTipo}
              value={descuentoValor}
              onChange={(event) =>
                setDescuentoValor(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Tipo de recargo
            <select
              value={recargoTipo}
              onChange={(event) =>
                setRecargoTipo(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="">
                Sin recargo
              </option>

              <option value="porcentaje">
                Porcentaje
              </option>

              <option value="importe">
                Importe fijo
              </option>
            </select>
          </label>

          <label style={labelStyle}>
            Valor recargo
            <input
              type="number"
              min="0"
              step="0.01"
              disabled={!recargoTipo}
              value={recargoValor}
              onChange={(event) =>
                setRecargoValor(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>
        </div>

        <div style={totalesStyle}>
          <span>
            Subtotal
            <strong>
              {moneda(subtotal)}
            </strong>
          </span>

          <span>
            Descuento
            <strong>
              - {moneda(descuento)}
            </strong>
          </span>

          <span>
            Recargo
            <strong>
              + {moneda(recargo)}
            </strong>
          </span>

          <span
            style={{
              fontSize: "1.1rem",
            }}
          >
            TOTAL
            <strong>
              {moneda(total)}
            </strong>
          </span>
        </div>
      </section>

      <section style={boxStyle}>
        <h2 style={tituloStyle}>
          Pago y condiciones
        </h2>

        <div style={gridStyle}>
          <label style={labelStyle}>
            Forma de pago
            <input
              value={formaPago}
              onChange={(event) =>
                setFormaPago(
                  event.target.value
                )
              }
              placeholder="Ej.: transferencia"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Condiciones de pago
            <input
              value={condicionesPago}
              onChange={(event) =>
                setCondicionesPago(
                  event.target.value
                )
              }
              placeholder="Ej.: 50% anticipo"
              style={inputStyle}
            />
          </label>
        </div>
      </section>

      <section style={boxStyle}>
        <h2 style={tituloStyle}>
          Programación del trabajo
        </h2>

        <div style={gridStyle}>
          <label style={labelStyle}>
            Fecha programada
            <input
              type="date"
              value={fechaProgramada}
              onChange={(event) =>
                setFechaProgramada(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Hora programada
            <input
              type="time"
              value={horaProgramada}
              onChange={(event) =>
                setHoraProgramada(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>
        </div>
      </section>

      <section style={boxStyle}>
        <h2 style={tituloStyle}>
          Observaciones
        </h2>

        <label style={labelStyle}>
          Observaciones visibles para el cliente
          <textarea
            rows={4}
            value={observacionesCliente}
            onChange={(event) =>
              setObservacionesCliente(
                event.target.value
              )
            }
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />
        </label>

        <label style={labelStyle}>
          Observaciones internas
          <textarea
            rows={4}
            value={observacionesInternas}
            onChange={(event) =>
              setObservacionesInternas(
                event.target.value
              )
            }
            style={{
              ...inputStyle,
              resize: "vertical",
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
        <div style={successStyle}>
          {mensaje}
        </div>
      ) : null}

      <button
        type="button"
        disabled={guardando}
        onClick={guardarPresupuesto}
        style={{
          ...guardarButtonStyle,
          opacity: guardando
            ? 0.65
            : 1,
          cursor: guardando
            ? "wait"
            : "pointer",
        }}
      >
        {guardando
          ? "Guardando presupuesto..."
          : "Guardar presupuesto"}
      </button>
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
  color: "var(--foreground)",
  fontSize: "1.15rem",
};

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
  fontSize: "0.86rem",
  fontWeight: 800,
};

const inputStyle = {
  width: "100%",
  minHeight: "44px",
  boxSizing: "border-box" as const,
  padding: "10px 12px",
  border:
    "1px solid rgba(74, 113, 145, 0.42)",
  borderRadius: "10px",
  background: "#eef5fa",
  boxShadow:
    "inset 0 1px 2px rgba(25, 58, 85, 0.08)",
  color: "var(--foreground)",
  font: "inherit",
};

const ayudaStyle = {
  margin: 0,
  color: "var(--muted)",
  fontSize: "0.82rem",
};

const seleccionStyle = {
  margin: 0,
  color: "#236b43",
  fontSize: "0.82rem",
  fontWeight: 800,
};

const resultadoStyle = {
  display: "grid",
  maxHeight: "260px",
  overflowY: "auto" as const,
  gap: "6px",
  padding: "8px",
  border:
    "1px solid rgba(38, 40, 42, 0.12)",
  borderRadius: "12px",
  background: "#ffffff",
};

const resultadoBotonStyle = {
  display: "grid",
  gap: "3px",
  width: "100%",
  padding: "10px 12px",
  border:
    "1px solid rgba(38, 40, 42, 0.08)",
  borderRadius: "9px",
  background: "#ffffff",
  color: "var(--foreground)",
  textAlign: "left" as const,
  cursor: "pointer",
  font: "inherit",
  fontSize: "0.82rem",
};

const equipoTabsStyle = {
  display: "flex",
  gap: "8px",
  overflowX: "auto" as const,
  paddingBottom: "4px",
};

const equipoTabStyle = {
  flex: "0 0 auto",
  minHeight: "38px",
  padding: "8px 12px",
  border:
    "1px solid rgba(38, 40, 42, 0.16)",
  borderRadius: "999px",
  font: "inherit",
  fontSize: "0.82rem",
  fontWeight: 800,
  cursor: "pointer",
};

const separadorStyle = {
  height: "1px",
  background:
    "rgba(38, 40, 42, 0.1)",
};

const previewTrabajoStyle = {
  padding: "14px",
  border:
    "1px solid rgba(38, 40, 42, 0.12)",
  borderRadius: "12px",
  background:
    "rgba(255,255,255,0.82)",
};

const trabajosScrollStyle = {
  display: "grid",
  gap: "10px",
  maxHeight: "430px",
  overflowY: "auto" as const,
  padding: "10px",
  border:
    "1px solid rgba(38, 40, 42, 0.12)",
  borderRadius: "12px",
  background: "#ffffff",
};

const itemCompactoStyle = {
  display: "grid",
  gap: "10px",
  padding: "12px",
  border:
    "1px solid rgba(38, 40, 42, 0.1)",
  borderRadius: "10px",
  background:
    "rgba(255,255,255,0.82)",
};

const buttonStyle = {
  minHeight: "44px",
  padding: "9px 14px",
  border:
    "1px solid rgba(38, 40, 42, 0.16)",
  borderRadius: "10px",
  background: "var(--foreground)",
  color: "#ffffff",
  font: "inherit",
  fontWeight: 800,
  cursor: "pointer",
};

const deleteButtonStyle = {
  minHeight: "34px",
  padding: "6px 10px",
  border:
    "1px solid rgba(160, 35, 35, 0.25)",
  borderRadius: "8px",
  background:
    "rgba(180, 40, 40, 0.06)",
  color: "#8f2222",
  font: "inherit",
  fontSize: "0.78rem",
  fontWeight: 800,
  cursor: "pointer",
};

const totalesStyle = {
  display: "grid",
  gap: "8px",
  padding: "14px",
  borderRadius: "12px",
  background:
    "rgba(38, 40, 42, 0.045)",
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
  background: "var(--foreground)",
  color: "#ffffff",
  font: "inherit",
  fontSize: "1rem",
  fontWeight: 900,
};
