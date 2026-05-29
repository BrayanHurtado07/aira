import React, { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Plus, CheckCircle2, Check, XCircle, User, MessageSquare,
  Globe, Users, Clock, Calendar, Pencil, Save,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useQueryClient, useMutation } from '@tanstack/react-query'

import { usarReservas }        from '@/capacidades/reservas/ganchos/usarReservas'
import { usarAccionesReserva } from '@/capacidades/reservas/ganchos/usarAccionesReserva'
import { usarClientes }        from '@/capacidades/reservas/ganchos/usarClientes'
import { usarBarberos }        from '@/capacidades/agenda/ganchos/usarBarberos'
import { usarServiciosBarbero } from '@/capacidades/agenda/ganchos/usarServiciosBarbero'

import { EncabezadoPagina }    from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta }      from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos }          from '@/compartido/interfaz/primitivas/TablaDatos'
import type { ColumnaTabla }   from '@/compartido/interfaz/primitivas/TablaDatos'
import { MenuAcciones }        from '@/compartido/interfaz/primitivas/MenuAcciones'
import { Pestanas }            from '@/compartido/interfaz/primitivas/Pestanas'
import type { Pestana }        from '@/compartido/interfaz/primitivas/Pestanas'
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion'
import { Boton }               from '@/compartido/interfaz/primitivas/Boton'
import { BannerAlerta }        from '@/compartido/interfaz/primitivas/BannerAlerta'
import { Modal }               from '@/compartido/interfaz/primitivas/Modal'
import { Campo }               from '@/compartido/interfaz/primitivas/Campo'
import { Selector }            from '@/compartido/interfaz/primitivas/Selector'
import { SelectorSlot }        from '@/compartido/interfaz/primitivas/SelectorSlot'

import { EstadoReserva }       from '@/capacidades/reservas/componentes/EstadoReserva'
import { BuscadorCliente }     from '@/capacidades/reservas/componentes/BuscadorCliente'
import { actualizarReserva }   from '@/capacidades/reservas/servicios/servicio-reservas'

import type {
  Reserva,
  EstadoReserva as TipoEstadoReserva,
  OrigenReserva,
  SolicitudActualizarReserva,
} from '@/capacidades/reservas/contratos/tipos'

// ── Helpers ───────────────────────────────────────────────────────────────────

function iniciales(nombre: string): string {
  return nombre.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

// ── Configuración de origen ───────────────────────────────────────────────────

const CONFIG_ORIGEN: Record<OrigenReserva, { icono: React.ReactNode; etiqueta: string; clase: string }> = {
  WHATSAPP: { icono: <MessageSquare size={13} />, etiqueta: 'WhatsApp',  clase: 'origen-chip--whatsapp' },
  WEB:      { icono: <Globe size={13} />,          etiqueta: 'Web',       clase: 'origen-chip--web'      },
  MANUAL:   { icono: <Users size={13} />,           etiqueta: 'Presencial', clase: 'origen-chip--manual' },
}

const ORIGENES: { valor: OrigenReserva; etiqueta: string }[] = [
  { valor: 'MANUAL',   etiqueta: 'Presencial' },
  { valor: 'WHATSAPP', etiqueta: 'WhatsApp'   },
  { valor: 'WEB',      etiqueta: 'Web'        },
]

type FiltroEstado = 'TODAS' | TipoEstadoReserva

// ── ModalEditarReserva ────────────────────────────────────────────────────────

interface PropsModalEditar {
  reserva: Reserva | null
  alCerrar: () => void
}

interface EstadoFormEditar {
  cliente_id:        string
  barbero_id:        string
  servicio_id:       string
  sucursal_id:       string
  fecha_hora_inicio: string
  origen:            OrigenReserva
}

function ModalEditarReserva({ reserva, alCerrar }: PropsModalEditar) {
  const clienteConsulta = useQueryClient()
  const { barberos, cargando: cargandoBarberos } = usarBarberos()

  const [form, setForm]     = useState<EstadoFormEditar>(() => ({
    cliente_id:        reserva?.cliente_id        ?? '',
    barbero_id:        reserva?.barbero_id        ?? '',
    servicio_id:       '',   // se rellena abajo vía useEffect
    sucursal_id:       reserva?.sucursal_id       ?? '',
    fecha_hora_inicio: reserva?.fecha_hora_inicio ? reserva.fecha_hora_inicio.slice(0, 16) : '',
    origen:            (reserva?.origen           ?? 'MANUAL') as OrigenReserva,
  }))
  const [errores, setErrores] = useState<Record<string, string>>({})

  // Inicializar campos cuando se abre con una reserva diferente
  React.useEffect(() => {
    if (!reserva) return
    setForm({
      cliente_id:        reserva.cliente_id,
      barbero_id:        reserva.barbero_id,
      servicio_id:       '',
      sucursal_id:       reserva.sucursal_id ?? '',
      fecha_hora_inicio: reserva.fecha_hora_inicio.slice(0, 16),
      origen:            reserva.origen as OrigenReserva,
    })
    setErrores({})
  }, [reserva?.id])

  const { servicios, cargando: cargandoServicios } = usarServiciosBarbero(
    form.barbero_id || undefined,
  )

  // Autoseleccionar el servicio actual cuando carguen los servicios
  React.useEffect(() => {
    if (!reserva || form.servicio_id) return
    // Buscar el servicio de la reserva (almacenado internamente)
    // Como la reserva solo expone servicio_id, lo establecemos directamente
    // una sola vez cuando se montan los servicios del barbero
    if (servicios.length > 0 && !form.servicio_id) {
      // Si existe en la lista lo preseleccionamos, si no dejamos vacío para que el usuario elija
      const existe = servicios.find((s) => s.id === (reserva as unknown as Record<string, unknown>).servicio_id)
      if (existe) {
        setForm((p) => ({ ...p, servicio_id: existe.id }))
      }
    }
  }, [servicios])

  const opcionesBarberos  = barberos.map((b) => ({
    valor: b.id,
    etiqueta: b.especialidad ? `${b.nombre} · ${b.especialidad}` : b.nombre,
  }))

  const opcionesServicios = servicios.map((s) => ({
    valor: s.id,
    etiqueta: `${s.nombre} · ${s.duracion_minutos} min`,
  }))

  const mutacion = useMutation({
    mutationFn: (solicitud: SolicitudActualizarReserva) =>
      actualizarReserva(reserva!.id, solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['reservas'] })
      toast.success('Reserva actualizada')
      alCerrar()
    },
    onError: () => toast.error('No se pudo actualizar la reserva'),
  })

  const validar = (): boolean => {
    const nuevos: Record<string, string> = {}
    if (!form.cliente_id)        nuevos.cliente_id        = 'Selecciona un cliente'
    if (!form.barbero_id)        nuevos.barbero_id        = 'Selecciona un barbero'
    if (!form.servicio_id)       nuevos.servicio_id       = 'Selecciona un servicio'
    if (!form.fecha_hora_inicio) nuevos.fecha_hora_inicio = 'Selecciona la fecha y hora'
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validar()) return
    mutacion.mutate({
      cliente_id:        form.cliente_id,
      barbero_id:        form.barbero_id,
      servicio_id:       form.servicio_id,
      fecha_hora_inicio: new Date(form.fecha_hora_inicio).toISOString(),
      origen:            form.origen,
    })
  }

  const alCambiarSucursal = useCallback((sucursalId: string) => {
    setForm((p) => ({ ...p, sucursal_id: sucursalId }))
  }, [])

  return (
    <Modal
      abierto={reserva !== null}
      alCerrar={alCerrar}
      titulo="Editar reserva"
      descripcion="Modifica los datos de la reserva. Solo disponible para reservas pendientes o confirmadas."
      ancho="md"
    >
      <form
        onSubmit={manejarEnvio}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}
      >
        {/* Cliente */}
        <BuscadorCliente
          valor={form.cliente_id}
          alCambiar={(id) => {
            setForm((p) => ({ ...p, cliente_id: id }))
            setErrores((p) => ({ ...p, cliente_id: '' }))
          }}
          error={errores.cliente_id}
        />

        {/* Barbero */}
        <Campo etiqueta="Barbero" requerido error={errores.barbero_id}>
          <Selector
            valor={form.barbero_id}
            alCambiar={(v) => {
              setForm((p) => ({ ...p, barbero_id: v, servicio_id: '', fecha_hora_inicio: '' }))
              setErrores((p) => ({ ...p, barbero_id: '' }))
            }}
            opciones={opcionesBarberos}
            placeholder={cargandoBarberos ? 'Cargando…' : 'Seleccionar barbero'}
            cargando={cargandoBarberos}
            error={!!errores.barbero_id}
          />
        </Campo>

        {/* Servicio */}
        <Campo etiqueta="Servicio" requerido error={errores.servicio_id}>
          <Selector
            valor={form.servicio_id}
            alCambiar={(v) => {
              setForm((p) => ({ ...p, servicio_id: v, fecha_hora_inicio: '' }))
              setErrores((p) => ({ ...p, servicio_id: '' }))
            }}
            opciones={opcionesServicios}
            placeholder={
              !form.barbero_id
                ? 'Selecciona un barbero primero'
                : cargandoServicios
                  ? 'Cargando servicios…'
                  : opcionesServicios.length === 0
                    ? 'Sin servicios asignados'
                    : 'Seleccionar servicio'
            }
            deshabilitado={!form.barbero_id}
            cargando={cargandoServicios}
            error={!!errores.servicio_id}
          />
        </Campo>

        {/* Fecha y hora */}
        <Campo etiqueta="Fecha y hora" requerido error={errores.fecha_hora_inicio}>
          <SelectorSlot
            barberoId={form.barbero_id}
            servicioId={form.servicio_id}
            valor={form.fecha_hora_inicio}
            alCambiar={(v) => {
              setForm((p) => ({ ...p, fecha_hora_inicio: v }))
              setErrores((p) => ({ ...p, fecha_hora_inicio: '' }))
            }}
            alCambiarSucursal={alCambiarSucursal}
            error={!!errores.fecha_hora_inicio}
          />
        </Campo>

        {/* Canal */}
        <Campo etiqueta="Canal de origen">
          <Selector
            valor={form.origen}
            alCambiar={(v) => setForm((p) => ({ ...p, origen: v as OrigenReserva }))}
            opciones={ORIGENES}
          />
        </Campo>

        {/* Error */}
        {mutacion.isError && (
          <BannerAlerta
            variante="error"
            mensaje="No se pudo actualizar la reserva. Inténtalo de nuevo."
          />
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: 'var(--espacio-sm)', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
          <Boton type="button" variante="secundario" onClick={alCerrar}>
            Cancelar
          </Boton>
          <Boton
            type="submit"
            variante="primario"
            cargando={mutacion.isPending}
            icono={<Save size={14} />}
          >
            Guardar cambios
          </Boton>
        </div>
      </form>
    </Modal>
  )
}

// ── PaginaReservas ────────────────────────────────────────────────────────────

export function PaginaReservas() {
  const { reservas, cargando, error }                    = usarReservas()
  const { confirmar, cancelar, completar, ejecutando }   = usarAccionesReserva()
  const { clientes }                                     = usarClientes()
  const { barberos }                                     = usarBarberos()

  const [filtro, setFiltro]                               = useState<FiltroEstado>('TODAS')
  const [reservaCancelando, setReservaCancelando]         = useState<string | null>(null)
  const [cancelando, setCancelando]                       = useState(false)
  const [reservaEditando, setReservaEditando]             = useState<Reserva | null>(null)

  // ── Mapas de nombres ────────────────────────────────────────────────────────

  const mapaClientes = useMemo(
    () => Object.fromEntries(clientes.map((c) => [c.id, c])),
    [clientes],
  )

  const mapaBarberos = useMemo(
    () => Object.fromEntries(barberos.map((b) => [b.id, b.nombre])),
    [barberos],
  )

  // ── Contadores ──────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total:      reservas.length,
    pendiente:  reservas.filter((r) => r.estado === 'PENDIENTE').length,
    confirmada: reservas.filter((r) => r.estado === 'CONFIRMADA').length,
    completada: reservas.filter((r) => r.estado === 'COMPLETADA').length,
    cancelada:  reservas.filter((r) => r.estado === 'CANCELADA').length,
  }), [reservas])

  // ── Reservas filtradas ──────────────────────────────────────────────────────

  const reservasFiltradas = useMemo(
    () => filtro === 'TODAS' ? reservas : reservas.filter((r) => r.estado === filtro),
    [reservas, filtro],
  )

  // ── Pestañas ────────────────────────────────────────────────────────────────

  const pestanas: Pestana[] = [
    { id: 'TODAS',      etiqueta: 'Todas',      contador: stats.total      },
    { id: 'PENDIENTE',  etiqueta: 'Pendientes',  contador: stats.pendiente  },
    { id: 'CONFIRMADA', etiqueta: 'Confirmadas', contador: stats.confirmada },
    { id: 'COMPLETADA', etiqueta: 'Completadas', contador: stats.completada },
    { id: 'CANCELADA',  etiqueta: 'Canceladas',  contador: stats.cancelada  },
  ]

  // ── Acciones de estado ──────────────────────────────────────────────────────

  const ejecutarConfirmar = async (id: string) => {
    try { await confirmar(id); toast.success('Reserva confirmada') }
    catch { toast.error('No se pudo confirmar la reserva') }
  }

  const ejecutarCompletar = async (id: string) => {
    try { await completar(id); toast.success('Reserva completada') }
    catch { toast.error('No se pudo completar la reserva') }
  }

  const ejecutarCancelar = async () => {
    if (!reservaCancelando) return
    setCancelando(true)
    try {
      await cancelar(reservaCancelando)
      toast.success('Reserva cancelada')
      setReservaCancelando(null)
    } catch {
      toast.error('No se pudo cancelar la reserva')
    } finally {
      setCancelando(false)
    }
  }

  const manejarAccion = (accionId: string, reserva: Reserva) => {
    switch (accionId) {
      case 'editar':    setReservaEditando(reserva);         break
      case 'confirmar': void ejecutarConfirmar(reserva.id);  break
      case 'completar': void ejecutarCompletar(reserva.id);  break
      case 'cancelar':  setReservaCancelando(reserva.id);    break
    }
  }

  // ── Columnas ────────────────────────────────────────────────────────────────

  const columnas: ColumnaTabla<Reserva>[] = useMemo(() => [
    {
      clave:    'cliente',
      etiqueta: 'Cliente',
      render: (r) => {
        const cliente = mapaClientes[r.cliente_id]
        return (
          <div className="tabla-datos-celda-identidad">
            <div className="tabla-celda-avatar">
              {cliente ? iniciales(cliente.nombre) : <User size={12} />}
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>
                {cliente?.nombre ?? 'Cliente'}
              </div>
              {cliente?.telefono && (
                <div style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)' }}>
                  {cliente.telefono}
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      clave:    'barbero',
      etiqueta: 'Barbero',
      render: (r) =>
        mapaBarberos[r.barbero_id] ?? (
          <span style={{ color: 'var(--color-texto-muted)', fontStyle: 'italic' }}>—</span>
        ),
    },
    {
      clave:    'fecha',
      etiqueta: 'Fecha y hora',
      render: (r) => {
        const fecha = new Date(r.fecha_hora_inicio)
        return (
          <div>
            <div style={{ fontWeight: 500 }}>
              {fecha.toLocaleDateString('es-PE', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </div>
            <div className="celda-hora">
              <Clock size={10} />
              {fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )
      },
    },
    {
      clave:    'origen',
      etiqueta: 'Origen',
      render: (r) => {
        const cfg = CONFIG_ORIGEN[r.origen] ?? { icono: null, etiqueta: r.origen, clase: '' }
        return (
          <span className={['origen-chip', cfg.clase].filter(Boolean).join(' ')}>
            {cfg.icono}
            {cfg.etiqueta}
          </span>
        )
      },
    },
    {
      clave:    'estado',
      etiqueta: 'Estado',
      render: (r) => <EstadoReserva estado={r.estado} />,
    },
  ], [mapaClientes, mapaBarberos])

  // ── Render ──────────────────────────────────────────────────────────────────

  const puedeEditar = (r: Reserva) =>
    r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA'

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="pagina-contenido"
    >
      {/* Encabezado */}
      <EncabezadoPagina
        titulo="Reservas"
        descripcion="Gestiona las citas de tus clientes"
        indicador={String(stats.total)}
        acciones={
          <Link to="/reservas/nueva" style={{ textDecoration: 'none' }}>
            <Boton variante="primario" icono={<Plus size={14} />}>
              Nueva reserva
            </Boton>
          </Link>
        }
      />

      {/* Chips de resumen */}
      {!cargando && !error && reservas.length > 0 && (
        <div className="reservas-stats-fila">
          <div className="reserva-stat-chip reserva-stat-chip--advertencia">
            <span className="reserva-stat-valor">{stats.pendiente}</span>
            <span className="reserva-stat-etiqueta">Pendientes</span>
          </div>
          <div className="reserva-stat-chip reserva-stat-chip--exito">
            <span className="reserva-stat-valor">{stats.confirmada}</span>
            <span className="reserva-stat-etiqueta">Confirmadas</span>
          </div>
          <div className="reserva-stat-chip reserva-stat-chip--primario">
            <span className="reserva-stat-valor">{stats.completada}</span>
            <span className="reserva-stat-etiqueta">Completadas</span>
          </div>
          <div className="reserva-stat-chip reserva-stat-chip--error">
            <span className="reserva-stat-valor">{stats.cancelada}</span>
            <span className="reserva-stat-etiqueta">Canceladas</span>
          </div>
        </div>
      )}

      {/* Error de carga */}
      {!cargando && error && (
        <BannerAlerta
          variante="error"
          titulo="Error al cargar reservas"
          mensaje={error}
        />
      )}

      {/* Tabla */}
      {!error && (
        <SeccionTarjeta sinPaddingCuerpo>
          <Pestanas
            pestanas={pestanas}
            activa={filtro}
            alCambiar={(id) => setFiltro(id as FiltroEstado)}
            variante="linea"
            className="reservas-pestanas"
          />

          <TablaDatos<Reserva>
            columnas={columnas}
            filas={reservasFiltradas}
            obtenerClave={(r) => r.id}
            cargando={cargando}
            filasCargando={6}
            vacioIcono={<Calendar size={24} />}
            vacioTitulo={
              filtro === 'TODAS' ? 'Sin reservas aún'
              : filtro === 'PENDIENTE'  ? 'Sin reservas pendientes'
              : filtro === 'CONFIRMADA' ? 'Sin reservas confirmadas'
              : filtro === 'COMPLETADA' ? 'Sin reservas completadas'
              : 'Sin reservas canceladas'
            }
            vacioMensaje={
              filtro === 'TODAS'
                ? 'Las reservas de tus clientes aparecerán aquí cuando las registres.'
                : 'No hay reservas con este estado en este momento.'
            }
            acciones={(reserva) => (
              <MenuAcciones
                acciones={[
                  {
                    id:           'editar',
                    etiqueta:     'Editar reserva',
                    icono:        <Pencil size={14} />,
                    deshabilitada: !puedeEditar(reserva),
                  },
                  {
                    id:           'confirmar',
                    etiqueta:     'Confirmar',
                    icono:        <CheckCircle2 size={14} />,
                    separador:    true,
                    deshabilitada: reserva.estado !== 'PENDIENTE' || ejecutando,
                  },
                  {
                    id:           'completar',
                    etiqueta:     'Completar',
                    icono:        <Check size={14} />,
                    deshabilitada: reserva.estado !== 'CONFIRMADA' || ejecutando,
                  },
                  {
                    id:           'cancelar',
                    etiqueta:     'Cancelar reserva',
                    icono:        <XCircle size={14} />,
                    variante:     'peligro',
                    separador:    true,
                    deshabilitada:
                      ['CANCELADA', 'COMPLETADA', 'NO_ASISTIO'].includes(reserva.estado) || ejecutando,
                  },
                ]}
                onAccion={(id) => manejarAccion(id, reserva)}
              />
            )}
          />
        </SeccionTarjeta>
      )}

      {/* Modal editar */}
      <ModalEditarReserva
        reserva={reservaEditando}
        alCerrar={() => setReservaEditando(null)}
      />

      {/* Diálogo cancelar */}
      <DialogoConfirmacion
        abierto={reservaCancelando !== null}
        titulo="¿Cancelar esta reserva?"
        descripcion="Esta acción no se puede deshacer. El cliente quedará registrado como cancelado."
        textoConfirmar="Sí, cancelar"
        textoCancelar="No, mantener"
        variante="peligro"
        cargando={cancelando}
        alConfirmar={ejecutarCancelar}
        alCancelar={() => setReservaCancelando(null)}
      />
    </motion.div>
  )
}
