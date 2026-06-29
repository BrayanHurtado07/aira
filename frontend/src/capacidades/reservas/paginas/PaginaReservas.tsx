import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import {
  Plus, CheckCircle2, BadgeCheck, XCircle, UserX, MessageSquare,
  Globe, Users, Clock, Calendar, Pencil,
} from 'lucide-react'
import { springSuave, delayItem } from '@/plataforma/diseno/motion'

// ── Botones de acción inline (reemplazan el menú de 3 puntos) ────────────────

type PropsAccionReserva = {
  reserva: Reserva
  ejecutando: boolean
  conTexto?: boolean
  onEditar: () => void
  onConfirmar: () => void
  onCompletar: () => void
  onNoAsistio: () => void
  onCancelar: () => void
}

function reglasAccion(estado: Reserva['estado']) {
  return {
    puedeEditar:    estado === 'PENDIENTE' || estado === 'CONFIRMADA',
    puedeConfirmar: estado === 'PENDIENTE',
    puedeCompletar: estado === 'CONFIRMADA',
    puedeNoAsistio: estado === 'CONFIRMADA',
    puedeCancelar:  !['CANCELADA', 'COMPLETADA', 'NO_ASISTIO'].includes(estado),
  }
}

function BotonesAccion({ reserva, ejecutando, conTexto, onEditar, onConfirmar, onCompletar, onNoAsistio, onCancelar }: PropsAccionReserva) {
  const r = reglasAccion(reserva.estado)
  const T = (texto: string) => (conTexto ? <span>{texto}</span> : null)

  return (
    <div className="reserva-acciones-fila">
      <button
        className="reserva-accion-btn reserva-accion-btn--editar"
        onClick={onEditar}
        disabled={!r.puedeEditar}
        data-tooltip="Editar reserva"
        type="button"
        aria-label="Editar reserva"
      >
        <Pencil size={13} />{T('Editar')}
      </button>

      {r.puedeConfirmar && (
        <button
          className="reserva-accion-btn reserva-accion-btn--confirmar"
          onClick={onConfirmar}
          disabled={ejecutando}
          data-tooltip="Confirmar cita"
          data-tooltip-variante="confirmar"
          type="button"
          aria-label="Confirmar reserva"
        >
          <CheckCircle2 size={13} />{T('Confirmar')}
        </button>
      )}

      {r.puedeCompletar && (
        <button
          className="reserva-accion-btn reserva-accion-btn--completar"
          onClick={onCompletar}
          disabled={ejecutando}
          data-tooltip="Marcar como atendido"
          data-tooltip-variante="completar"
          type="button"
          aria-label="Marcar reserva como atendida"
        >
          <BadgeCheck size={13} />{T('Atendido')}
        </button>
      )}

      {r.puedeNoAsistio && (
        <button
          className="reserva-accion-btn reserva-accion-btn--no-asistio"
          onClick={onNoAsistio}
          disabled={ejecutando}
          data-tooltip="No asistió"
          type="button"
          aria-label="Marcar que el cliente no asistió"
        >
          <UserX size={13} />{T('No asistió')}
        </button>
      )}

      {r.puedeCancelar && (
        <button
          className="reserva-accion-btn reserva-accion-btn--cancelar"
          onClick={onCancelar}
          disabled={ejecutando}
          data-tooltip="Cancelar reserva"
          data-tooltip-variante="cancelar"
          type="button"
          aria-label="Cancelar reserva"
        >
          <XCircle size={13} />{T('Cancelar')}
        </button>
      )}
    </div>
  )
}

// ── TarjetaReserva — vista móvil de una reserva (compone primitivas) ───────────

type PropsTarjetaReserva = {
  reserva: Reserva
  cliente?: { nombre: string; telefono: string }
  barberoNombre?: string
  ejecutando: boolean
  onAbrir: () => void
  onEditar: () => void
  onConfirmar: () => void
  onCompletar: () => void
  onNoAsistio: () => void
  onCancelar: () => void
}

function TarjetaReserva({ reserva, cliente, barberoNombre, onAbrir, ...acciones }: PropsTarjetaReserva) {
  const fecha = new Date(reserva.fecha_hora_inicio)
  const rel = etiquetaRelativa(reserva.fecha_hora_inicio)
  return (
    <div className="reserva-tarjeta">
      <div className="reserva-tarjeta-cabecera" role="button" tabIndex={0} onClick={onAbrir}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAbrir() } }}>
        <CeldaCliente nombre={cliente?.nombre} telefono={cliente?.telefono} />
        <EstadoReserva estado={reserva.estado} />
      </div>
      <div className="reserva-tarjeta-cuerpo">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span className="reserva-tarjeta-hora">{fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="reserva-tarjeta-fecha">{fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</span>
          {rel && <span className={`celda-tiempo ${rel.clase}`}>{rel.texto}</span>}
        </div>
        <span className="reserva-tarjeta-barbero">{barberoNombre ?? '—'}</span>
      </div>
      <div className="reserva-tarjeta-acciones">
        <BotonesAccion reserva={reserva} conTexto {...acciones} />
      </div>
    </div>
  )
}

import { usarReservas }        from '@/capacidades/reservas/ganchos/usarReservas'
import { usarAccionesReserva } from '@/capacidades/reservas/ganchos/usarAccionesReserva'
import { usarClientes }        from '@/capacidades/reservas/ganchos/usarClientes'
import { usarBarberos }        from '@/capacidades/agenda/ganchos/usarBarberos'

import { EncabezadoPagina }    from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta }      from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos }          from '@/compartido/interfaz/primitivas/TablaDatos'
import type { ColumnaTabla }   from '@/compartido/interfaz/primitivas/TablaDatos'
import { Pestanas }            from '@/compartido/interfaz/primitivas/Pestanas'
import type { Pestana }        from '@/compartido/interfaz/primitivas/Pestanas'
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion'
import { Boton }               from '@/compartido/interfaz/primitivas/Boton'
import { BannerAlerta }        from '@/compartido/interfaz/primitivas/BannerAlerta'
import { CeldaCliente }        from '@/compartido/interfaz/primitivas/CeldaCliente'
import { Vacio }               from '@/compartido/interfaz/retroalimentacion/Vacio'

import { EstadoReserva }       from '@/capacidades/reservas/componentes/EstadoReserva'
import { ModalReserva }        from '@/capacidades/reservas/componentes/ModalReserva'

import type {
  Reserva,
  EstadoReserva as TipoEstadoReserva,
  OrigenReserva,
} from '@/capacidades/reservas/contratos/tipos'

// ── Configuración de origen ───────────────────────────────────────────────────

const CONFIG_ORIGEN: Record<OrigenReserva, { icono: React.ReactNode; etiqueta: string; clase: string }> = {
  WHATSAPP: { icono: <MessageSquare size={13} />, etiqueta: 'WhatsApp',  clase: 'origen-chip--whatsapp' },
  WEB:      { icono: <Globe size={13} />,          etiqueta: 'Web',       clase: 'origen-chip--web'      },
  MANUAL:   { icono: <Users size={13} />,           etiqueta: 'Presencial', clase: 'origen-chip--manual' },
}

type FiltroEstado = 'TODAS' | 'HOY' | TipoEstadoReserva

// ── Helpers de fecha ──────────────────────────────────────────────────────────

function mismaFecha(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function esHoy(iso: string): boolean {
  return mismaFecha(new Date(iso), new Date())
}

// Etiqueta relativa para la columna de fecha: HOY / MAÑANA / null (con clase de color).
function etiquetaRelativa(iso: string): { texto: string; clase: string } | null {
  const f = new Date(iso)
  const hoy = new Date()
  if (mismaFecha(f, hoy)) return { texto: 'HOY', clase: 'celda-tiempo--hoy' }
  const manana = new Date(hoy)
  manana.setDate(hoy.getDate() + 1)
  if (mismaFecha(f, manana)) return { texto: 'MAÑANA', clase: 'celda-tiempo--manana' }
  if (f.getTime() < hoy.getTime() && !mismaFecha(f, hoy)) return { texto: 'Pasada', clase: 'celda-tiempo--pasada' }
  return null
}


// ── PaginaReservas ────────────────────────────────────────────────────────────

export function PaginaReservas() {
  const navegar                                                       = useNavigate()
  const { reservas, cargando, error }                                 = usarReservas()
  const { confirmar, cancelar, completar, marcarNoAsistio, ejecutando } = usarAccionesReserva()
  const { clientes }                                                  = usarClientes()
  const { barberos }                                                  = usarBarberos()

  const [filtro, setFiltro]                               = useState<FiltroEstado>('HOY')
  const [reservaCancelando, setReservaCancelando]         = useState<string | null>(null)
  const [cancelando, setCancelando]                       = useState(false)
  const [reservaEditando, setReservaEditando]             = useState<Reserva | null>(null)
  const [crearAbierto, setCrearAbierto]                   = useState(false)

  // Permite abrir el modal de nueva reserva por deep-link (ej. el Tablero → /reservas?nueva=1)
  const [params, setParams] = useSearchParams()
  useEffect(() => {
    if (params.get('nueva') === '1') {
      setCrearAbierto(true)
      params.delete('nueva')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const cerrarModalReserva = () => { setCrearAbierto(false); setReservaEditando(null) }

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
    hoy:        reservas.filter((r) => esHoy(r.fecha_hora_inicio)).length,
    pendiente:  reservas.filter((r) => r.estado === 'PENDIENTE').length,
    confirmada: reservas.filter((r) => r.estado === 'CONFIRMADA').length,
    completada: reservas.filter((r) => r.estado === 'COMPLETADA').length,
    cancelada:  reservas.filter((r) => r.estado === 'CANCELADA').length,
  }), [reservas])

  // ── Reservas filtradas + ordenadas por fecha/hora ────────────────────────────

  const reservasFiltradas = useMemo(() => {
    const base =
      filtro === 'TODAS' ? reservas
      : filtro === 'HOY' ? reservas.filter((r) => esHoy(r.fecha_hora_inicio))
      : reservas.filter((r) => r.estado === filtro)
    return [...base].sort(
      (a, b) => new Date(a.fecha_hora_inicio).getTime() - new Date(b.fecha_hora_inicio).getTime(),
    )
  }, [reservas, filtro])

  // ── Pestañas ────────────────────────────────────────────────────────────────

  const pestanas: Pestana[] = [
    { id: 'HOY',        etiqueta: 'Hoy',         contador: stats.hoy        },
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

  const ejecutarNoAsistio = async (id: string) => {
    try { await marcarNoAsistio(id); toast.success('Marcada como no asistió') }
    catch { toast.error('No se pudo marcar la inasistencia') }
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
        return <CeldaCliente nombre={cliente?.nombre} telefono={cliente?.telefono} />
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
        const rel = etiquetaRelativa(r.fecha_hora_inicio)
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontFamily: 'var(--fuente-display-sc)', fontWeight: 700, fontSize: 'var(--tamano-sm)', letterSpacing: '0.02em' }}>
                {fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              {rel && <span className={`celda-tiempo ${rel.clase}`}>{rel.texto}</span>}
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
        indicador={cargando ? undefined : String(reservasFiltradas.length)}
        acciones={
          <Boton variante="primario" icono={<Plus size={14} />} onClick={() => setCrearAbierto(true)}>
            Nueva reserva
          </Boton>
        }
      />

      {/* Chips de resumen — clickables, sincronizados con el filtro */}
      {cargando ? (
        <div className="reservas-stats-fila">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="reserva-stat-chip" style={{ height: '4.5rem', background: 'var(--color-borde)', animation: 'esqueleto-pulsar 1.4s ease infinite', cursor: 'default' }} />
          ))}
        </div>
      ) : !error && reservas.length > 0 ? (
        <div className="reservas-stats-fila">
          {[
            { id: 'PENDIENTE',  variante: 'advertencia', valor: stats.pendiente,  etiqueta: 'Pendientes'  },
            { id: 'CONFIRMADA', variante: 'exito',       valor: stats.confirmada, etiqueta: 'Confirmadas' },
            { id: 'COMPLETADA', variante: 'primario',    valor: stats.completada, etiqueta: 'Completadas' },
            { id: 'CANCELADA',  variante: 'error',       valor: stats.cancelada,  etiqueta: 'Canceladas'  },
          ].map(({ id, variante, valor, etiqueta }, i) => (
            <motion.button
              key={etiqueta}
              type="button"
              onClick={() => setFiltro((f) => (f === id ? 'TODAS' : (id as FiltroEstado)))}
              aria-pressed={filtro === id}
              className={`reserva-stat-chip reserva-stat-chip--${variante}${filtro === id ? ' reserva-stat-chip--activo' : ''}`}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...springSuave, delay: delayItem(i) }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
            >
              <div>
                <div className="reserva-stat-valor">{valor}</div>
                <div className="reserva-stat-etiqueta">{etiqueta}</div>
              </div>
            </motion.button>
          ))}
        </div>
      ) : null}

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

          {(() => {
            const vacioTitulo =
              filtro === 'TODAS'      ? 'Sin reservas aún'
              : filtro === 'HOY'        ? 'Sin reservas para hoy'
              : filtro === 'PENDIENTE'  ? 'Sin reservas pendientes'
              : filtro === 'CONFIRMADA' ? 'Sin reservas confirmadas'
              : filtro === 'COMPLETADA' ? 'Sin reservas completadas'
              : 'Sin reservas canceladas'
            const vacioMensaje =
              filtro === 'TODAS' || filtro === 'HOY'
                ? 'Las reservas de tus clientes aparecerán aquí cuando las registres.'
                : 'No hay reservas con este estado en este momento.'
            const ctaNueva = (
              <Boton variante="primario" icono={<Plus size={14} />} onClick={() => setCrearAbierto(true)}>
                Nueva reserva
              </Boton>
            )
            const accionesReserva = (reserva: Reserva) => ({
              onEditar:    () => setReservaEditando(reserva),
              onConfirmar: () => void ejecutarConfirmar(reserva.id),
              onCompletar: () => void ejecutarCompletar(reserva.id),
              onNoAsistio: () => void ejecutarNoAsistio(reserva.id),
              onCancelar:  () => setReservaCancelando(reserva.id),
            })
            return (
              <>
                {/* Desktop: tabla */}
                <div className="reservas-tabla-wrap">
                  <TablaDatos<Reserva>
                    columnas={columnas}
                    filas={reservasFiltradas}
                    obtenerClave={(r) => r.id}
                    cargando={cargando}
                    filasCargando={6}
                    vacioIcono={<Calendar size={24} />}
                    vacioTitulo={vacioTitulo}
                    vacioMensaje={vacioMensaje}
                    vacioAccion={(filtro === 'TODAS' || filtro === 'HOY') ? ctaNueva : undefined}
                    onClickFila={(r) => navegar(`/reservas/${r.id}`)}
                    acciones={(reserva) => (
                      <BotonesAccion reserva={reserva} ejecutando={ejecutando} {...accionesReserva(reserva)} />
                    )}
                  />
                </div>

                {/* Móvil: tarjetas apiladas */}
                <div className="reservas-tarjetas">
                  {cargando ? (
                    [0, 1, 2].map((i) => <div key={i} className="reserva-tarjeta-skel" />)
                  ) : reservasFiltradas.length === 0 ? (
                    <Vacio icono={<Calendar size={24} />} titulo={vacioTitulo} mensaje={vacioMensaje}
                      accion={(filtro === 'TODAS' || filtro === 'HOY') ? ctaNueva : undefined} />
                  ) : (
                    reservasFiltradas.map((reserva) => (
                      <TarjetaReserva
                        key={reserva.id}
                        reserva={reserva}
                        cliente={mapaClientes[reserva.cliente_id]}
                        barberoNombre={mapaBarberos[reserva.barbero_id]}
                        ejecutando={ejecutando}
                        onAbrir={() => navegar(`/reservas/${reserva.id}`)}
                        {...accionesReserva(reserva)}
                      />
                    ))
                  )}
                </div>
              </>
            )
          })()}
        </SeccionTarjeta>
      )}

      {/* Modal de reserva (crear + editar) */}
      <ModalReserva
        abierto={crearAbierto || reservaEditando !== null}
        reserva={reservaEditando}
        alCerrar={cerrarModalReserva}
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
