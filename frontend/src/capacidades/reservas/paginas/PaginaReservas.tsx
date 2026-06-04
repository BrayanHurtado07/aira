import React, { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import {
  Plus, CheckCircle2, Check, XCircle, User, MessageSquare,
  Globe, Users, Clock, Calendar, Pencil, Save,
} from 'lucide-react'
import { springSuave, delayItem } from '@/plataforma/diseno/motion'

// ── Botones de acción inline (reemplazan el menú de 3 puntos) ────────────────

function BotonesAccion({
  reserva,
  ejecutando,
  onEditar,
  onConfirmar,
  onCompletar,
  onCancelar,
}: {
  reserva: Reserva
  ejecutando: boolean
  onEditar: () => void
  onConfirmar: () => void
  onCompletar: () => void
  onCancelar: () => void
}) {
  const puedeEditar   = reserva.estado === 'PENDIENTE' || reserva.estado === 'CONFIRMADA'
  const puedeConfirmar = reserva.estado === 'PENDIENTE'
  const puedeCompletar = reserva.estado === 'CONFIRMADA'
  const puedeCancelar  = !['CANCELADA', 'COMPLETADA', 'NO_ASISTIO'].includes(reserva.estado)

  return (
    <div className="reserva-acciones-fila">
      <button
        className="reserva-accion-btn reserva-accion-btn--editar"
        onClick={onEditar}
        disabled={!puedeEditar}
        data-tooltip="Editar reserva"
        type="button"
        aria-label="Editar reserva"
      >
        <Pencil size={13} />
      </button>

      {puedeConfirmar && (
        <button
          className="reserva-accion-btn reserva-accion-btn--confirmar"
          onClick={onConfirmar}
          disabled={ejecutando}
          data-tooltip="Confirmar"
          data-tooltip-variante="confirmar"
          type="button"
          aria-label="Confirmar reserva"
        >
          <CheckCircle2 size={13} />
        </button>
      )}

      {puedeCompletar && (
        <button
          className="reserva-accion-btn reserva-accion-btn--completar"
          onClick={onCompletar}
          disabled={ejecutando}
          data-tooltip="Completar"
          data-tooltip-variante="completar"
          type="button"
          aria-label="Completar reserva"
        >
          <Check size={13} />
        </button>
      )}

      {puedeCancelar && (
        <button
          className="reserva-accion-btn reserva-accion-btn--cancelar"
          onClick={onCancelar}
          disabled={ejecutando}
          data-tooltip="Cancelar reserva"
          data-tooltip-variante="cancelar"
          type="button"
          aria-label="Cancelar reserva"
        >
          <XCircle size={13} />
        </button>
      )}
    </div>
  )
}

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

  // ── Columnas ────────────────────────────────────────────────────────────────

  const columnas: ColumnaTabla<Reserva>[] = useMemo(() => [
    {
      clave:    'cliente',
      etiqueta: 'Cliente',
      render: (r) => {
        const cliente = mapaClientes[r.cliente_id]
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="tabla-celda-avatar" style={{ flexShrink: 0 }}>
              {cliente ? iniciales(cliente.nombre) : <User size={12} />}
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--fuente-display-sc)',
                fontWeight: 700,
                fontSize: 'var(--tamano-sm)',
                letterSpacing: '0.02em',
                color: 'var(--color-texto)',
                lineHeight: 1.2,
              }}>
                {cliente?.nombre ?? 'Cliente'}
              </div>
              {cliente?.telefono && (
                <div style={{
                  fontFamily: 'var(--fuente-acento)',
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  color: 'var(--color-texto-suave)',
                  marginTop: '2px',
                }}>
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
      render: (r) => {
        const nombre = mapaBarberos[r.barbero_id]
        return nombre
          ? <span style={{ fontFamily: 'var(--fuente-display-sc)', fontWeight: 700, fontSize: 'var(--tamano-sm)', letterSpacing: '0.02em' }}>{nombre}</span>
          : <span style={{ color: 'var(--color-texto-muted)', fontStyle: 'italic' }}>—</span>
      },
    },
    {
      clave:    'fecha',
      etiqueta: 'Fecha y hora',
      render: (r) => {
        const fecha = new Date(r.fecha_hora_inicio)
        return (
          <div>
            <div style={{ fontFamily: 'var(--fuente-display-sc)', fontWeight: 700, fontSize: 'var(--tamano-sm)', letterSpacing: '0.02em' }}>
              {fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div className="celda-hora" style={{ fontFamily: 'var(--fuente-acento)', fontSize: '0.65rem', letterSpacing: '0.06em' }}>
              <Clock size={9} />
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

  return (
    <motion.div
      className="pagina-contenido"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
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
          {[
            { variante: 'advertencia', valor: stats.pendiente,  etiqueta: 'Pendientes'  },
            { variante: 'exito',       valor: stats.confirmada, etiqueta: 'Confirmadas' },
            { variante: 'primario',    valor: stats.completada, etiqueta: 'Completadas' },
            { variante: 'error',       valor: stats.cancelada,  etiqueta: 'Canceladas'  },
          ].map(({ variante, valor, etiqueta }, i) => (
            <motion.div
              key={etiqueta}
              className={`reserva-stat-chip reserva-stat-chip--${variante}`}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...springSuave, delay: delayItem(i) }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
            >
              <div>
                <div className="reserva-stat-valor">{valor}</div>
                <div className="reserva-stat-etiqueta">{etiqueta}</div>
              </div>
            </motion.div>
          ))}
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
              filtro === 'TODAS'      ? 'Sin reservas aún'
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
              <BotonesAccion
                reserva={reserva}
                ejecutando={ejecutando}
                onEditar={() => setReservaEditando(reserva)}
                onConfirmar={() => void ejecutarConfirmar(reserva.id)}
                onCompletar={() => void ejecutarCompletar(reserva.id)}
                onCancelar={() => setReservaCancelando(reserva.id)}
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
