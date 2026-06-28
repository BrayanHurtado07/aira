import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Coins,
  Wallet,
  Plus,
  Sparkles,
  Calculator,
  CheckCircle2,
  BadgeDollarSign,
  AlertCircle,
} from 'lucide-react'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Modal } from '@/compartido/interfaz/primitivas/Modal'
import { Selector } from '@/compartido/interfaz/primitivas/Selector'
import { CampoMoneda } from '@/compartido/interfaz/primitivas/CampoMoneda'
import { CampoNumerico } from '@/compartido/interfaz/primitivas/CampoNumerico'
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia'
import { usarBarberos } from '@/capacidades/agenda/ganchos/usarBarberos'
import { usarReservas } from '@/capacidades/reservas/ganchos/usarReservas'
import type { Barbero } from '@/capacidades/agenda/contratos/tipos'
import type { Reserva } from '@/capacidades/reservas/contratos/tipos'
import {
  usarComisiones,
  usarLiquidaciones,
  usarCrearEsquema,
  usarGenerarComision,
  usarCalcularLiquidacion,
  usarAccionesLiquidacion,
} from '../ganchos/usarComisiones'
import type {
  Comision,
  Liquidacion,
  FrecuenciaLiquidacion,
} from '../contratos/tipos'

// ── Utilidades de presentación ────────────────────────────────────────────────

function formatearMoneda(monto: string): string {
  const valor = parseFloat(monto || '0')
  if (isNaN(valor)) return 'S/ 0.00'
  return `S/ ${valor.toFixed(2)}`
}

function formatearFecha(iso: string): string {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (isNaN(fecha.getTime())) return iso
  return fecha.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function varianteEstadoLiquidacion(
  estado: string,
): 'advertencia' | 'info' | 'exito' | 'neutral' {
  const mapa: Record<string, 'advertencia' | 'info' | 'exito'> = {
    PENDIENTE: 'advertencia',
    APROBADA: 'info',
    PAGADA: 'exito',
  }
  return mapa[estado.toUpperCase()] ?? 'neutral'
}

function varianteEstadoComision(
  estado: string,
): 'advertencia' | 'exito' | 'error' | 'neutral' {
  const mapa: Record<string, 'advertencia' | 'exito' | 'error'> = {
    GENERADA: 'exito',
    PENDIENTE: 'advertencia',
    LIQUIDADA: 'exito',
    ANULADA: 'error',
  }
  return mapa[estado.toUpperCase()] ?? 'neutral'
}

const OPCIONES_FRECUENCIA: { valor: FrecuenciaLiquidacion; etiqueta: string }[] = [
  { valor: 'SEMANAL', etiqueta: 'Semanal' },
  { valor: 'QUINCENAL', etiqueta: 'Quincenal' },
  { valor: 'MENSUAL', etiqueta: 'Mensual' },
]

// ── Mensaje de error legible ──────────────────────────────────────────────────

function MensajeError({ mensaje }: { mensaje: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--espacio-sm)',
        padding: 'var(--espacio-md)',
        borderRadius: 'var(--radio-md)',
        backgroundColor: 'var(--color-error-suave)',
        color: 'var(--color-error)',
        fontSize: 'var(--tamano-sm)',
      }}
    >
      <AlertCircle size={16} style={{ flexShrink: 0 }} />
      <span>{mensaje}</span>
    </div>
  )
}

// ── Modal: Crear esquema de comisión ──────────────────────────────────────────

function ModalCrearEsquema({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  const { crearEsquema, ejecutando } = usarCrearEsquema()
  const [nombre, setNombre] = useState('')
  const [porcentaje, setPorcentaje] = useState('')
  const [sueldoBase, setSueldoBase] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})

  function limpiar() {
    setNombre('')
    setPorcentaje('')
    setSueldoBase('')
    setDescripcion('')
    setErrores({})
  }

  function manejarCerrar() {
    limpiar()
    alCerrar()
  }

  function manejarGuardar() {
    const nuevos: Record<string, string> = {}
    const porcentajeNum = parseFloat(porcentaje)
    if (!nombre.trim()) nuevos.nombre = 'El nombre es obligatorio'
    if (isNaN(porcentajeNum) || porcentajeNum <= 0) nuevos.porcentaje = 'Ingresa un porcentaje válido'
    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos)
      return
    }

    crearEsquema(
      {
        nombre: nombre.trim(),
        tipo: 'PORCENTAJE',
        porcentaje_por_servicio: porcentajeNum,
        sueldo_base: sueldoBase ? parseFloat(sueldoBase) : 0,
        descripcion: descripcion.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Esquema de comisión creado', { description: nombre.trim() })
          manejarCerrar()
        },
        onError: () => toast.error('No se pudo crear el esquema'),
      },
    )
  }

  return (
    <Modal
      abierto={abierto}
      alCerrar={manejarCerrar}
      titulo="Crear esquema de comisión"
      descripcion="Define el porcentaje por servicio que recibirá el barbero."
      ancho="sm"
      pie={
        <>
          <Boton variante="secundario" type="button" onClick={manejarCerrar}>
            Cancelar
          </Boton>
          <Boton
            variante="primario"
            type="button"
            icono={<Plus size={14} />}
            onClick={manejarGuardar}
            cargando={ejecutando}
          >
            Crear esquema
          </Boton>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label className="campo-etiqueta">
            Nombre del esquema <span className="campo-requerido">*</span>
          </label>
          <input
            className={['campo-input', errores.nombre ? 'campo-input--error' : ''].filter(Boolean).join(' ')}
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              setErrores((p) => ({ ...p, nombre: '' }))
            }}
            placeholder="Ej: Comisión estándar 40%"
            autoComplete="off"
          />
          {errores.nombre && (
            <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>{errores.nombre}</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label className="campo-etiqueta">
            Porcentaje por servicio (%) <span className="campo-requerido">*</span>
          </label>
          <CampoNumerico
            valor={porcentaje}
            alCambiar={(v) => {
              setPorcentaje(v)
              setErrores((p) => ({ ...p, porcentaje: '' }))
            }}
            decimal
            max={100}
            error={Boolean(errores.porcentaje)}
            placeholder="Ej: 40"
          />
          {errores.porcentaje && (
            <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>{errores.porcentaje}</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label className="campo-etiqueta">Sueldo base (opcional)</label>
          <CampoMoneda valor={sueldoBase} alCambiar={setSueldoBase} placeholder="0.00" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label className="campo-etiqueta">Descripción (opcional)</label>
          <input
            className="campo-input"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Aplica a todos los servicios de corte"
            autoComplete="off"
          />
        </div>
      </div>
    </Modal>
  )
}

// ── Modal: Generar comisión por reserva completada ────────────────────────────

function ModalGenerarComision({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  const { generar, ejecutando } = usarGenerarComision()
  const { reservas, cargando } = usarReservas()
  const [reservaId, setReservaId] = useState('')
  const [error, setError] = useState('')

  const reservasCompletadas = (reservas as Reserva[]).filter((r) => r.estado === 'COMPLETADA')

  function manejarCerrar() {
    setReservaId('')
    setError('')
    alCerrar()
  }

  function manejarGenerar() {
    if (!reservaId) {
      setError('Selecciona una reserva completada')
      return
    }
    generar(
      { reserva_id: reservaId },
      {
        onSuccess: () => {
          toast.success('Comisión generada correctamente')
          manejarCerrar()
        },
        onError: () => toast.error('No se pudo generar la comisión'),
      },
    )
  }

  return (
    <Modal
      abierto={abierto}
      alCerrar={manejarCerrar}
      titulo="Generar comisión"
      descripcion="Genera la comisión de una reserva completada según el esquema vigente."
      ancho="sm"
      pie={
        <>
          <Boton variante="secundario" type="button" onClick={manejarCerrar}>
            Cancelar
          </Boton>
          <Boton
            variante="primario"
            type="button"
            icono={<Sparkles size={14} />}
            onClick={manejarGenerar}
            cargando={ejecutando}
            disabled={!reservaId}
          >
            Generar comisión
          </Boton>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <label className="campo-etiqueta">
          Reserva completada <span className="campo-requerido">*</span>
        </label>
        <Selector
          valor={reservaId}
          alCambiar={(v) => {
            setReservaId(v)
            setError('')
          }}
          cargando={cargando}
          placeholder="Selecciona una reserva"
          error={Boolean(error)}
          opciones={reservasCompletadas.map((r) => ({
            valor: r.id,
            etiqueta: `${formatearFecha(r.fecha_hora_inicio)} · ${r.id.slice(0, 8)}`,
          }))}
        />
        {reservasCompletadas.length === 0 && !cargando && (
          <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)' }}>
            No hay reservas completadas disponibles.
          </span>
        )}
        {error && (
          <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>{error}</span>
        )}
      </div>
    </Modal>
  )
}

// ── Modal: Calcular liquidación ───────────────────────────────────────────────

function ModalCalcularLiquidacion({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  const { calcular, ejecutando } = usarCalcularLiquidacion()
  const { barberos, cargando } = usarBarberos()
  const [barberoId, setBarberoId] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [frecuencia, setFrecuencia] = useState<FrecuenciaLiquidacion>('MENSUAL')
  const [errores, setErrores] = useState<Record<string, string>>({})

  function manejarCerrar() {
    setBarberoId('')
    setFechaInicio('')
    setFechaFin('')
    setFrecuencia('MENSUAL')
    setErrores({})
    alCerrar()
  }

  function manejarCalcular() {
    const nuevos: Record<string, string> = {}
    if (!barberoId) nuevos.barbero = 'Selecciona un barbero'
    if (!fechaInicio) nuevos.fechaInicio = 'Indica la fecha de inicio'
    if (!fechaFin) nuevos.fechaFin = 'Indica la fecha de fin'
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) nuevos.fechaFin = 'La fecha fin no puede ser anterior'
    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos)
      return
    }

    calcular(
      { barbero_id: barberoId, fecha_inicio: fechaInicio, fecha_fin: fechaFin, frecuencia },
      {
        onSuccess: () => {
          toast.success('Liquidación calculada correctamente')
          manejarCerrar()
        },
        onError: () => toast.error('No se pudo calcular la liquidación'),
      },
    )
  }

  return (
    <Modal
      abierto={abierto}
      alCerrar={manejarCerrar}
      titulo="Calcular liquidación"
      descripcion="Agrupa las comisiones pendientes de un barbero en un periodo."
      ancho="sm"
      pie={
        <>
          <Boton variante="secundario" type="button" onClick={manejarCerrar}>
            Cancelar
          </Boton>
          <Boton
            variante="primario"
            type="button"
            icono={<Calculator size={14} />}
            onClick={manejarCalcular}
            cargando={ejecutando}
          >
            Calcular liquidación
          </Boton>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label className="campo-etiqueta">
            Barbero <span className="campo-requerido">*</span>
          </label>
          <Selector
            valor={barberoId}
            alCambiar={(v) => {
              setBarberoId(v)
              setErrores((p) => ({ ...p, barbero: '' }))
            }}
            cargando={cargando}
            placeholder="Selecciona un barbero"
            error={Boolean(errores.barbero)}
            opciones={(barberos as Barbero[]).map((b) => ({ valor: b.id, etiqueta: b.nombre }))}
          />
          {errores.barbero && (
            <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>{errores.barbero}</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--espacio-md)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
            <label className="campo-etiqueta">
              Desde <span className="campo-requerido">*</span>
            </label>
            <input
              type="date"
              className={['campo-input', errores.fechaInicio ? 'campo-input--error' : ''].filter(Boolean).join(' ')}
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value)
                setErrores((p) => ({ ...p, fechaInicio: '' }))
              }}
            />
            {errores.fechaInicio && (
              <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>{errores.fechaInicio}</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
            <label className="campo-etiqueta">
              Hasta <span className="campo-requerido">*</span>
            </label>
            <input
              type="date"
              className={['campo-input', errores.fechaFin ? 'campo-input--error' : ''].filter(Boolean).join(' ')}
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value)
                setErrores((p) => ({ ...p, fechaFin: '' }))
              }}
            />
            {errores.fechaFin && (
              <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>{errores.fechaFin}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label className="campo-etiqueta">Frecuencia</label>
          <Selector
            valor={frecuencia}
            alCambiar={(v) => setFrecuencia(v as FrecuenciaLiquidacion)}
            opciones={OPCIONES_FRECUENCIA.map((f) => ({ valor: f.valor, etiqueta: f.etiqueta }))}
          />
        </div>
      </div>
    </Modal>
  )
}

// ── Sección: Comisiones ───────────────────────────────────────────────────────

function SeccionComisiones() {
  const { comisiones, cargando, error } = usarComisiones()
  const [modalEsquema, setModalEsquema] = useState(false)
  const [modalGenerar, setModalGenerar] = useState(false)

  return (
    <>
      <ModalCrearEsquema abierto={modalEsquema} alCerrar={() => setModalEsquema(false)} />
      <ModalGenerarComision abierto={modalGenerar} alCerrar={() => setModalGenerar(false)} />

      <SeccionTarjeta
        titulo="Comisiones"
        descripcion="Comisiones generadas por reservas completadas."
        icono={<Coins size={14} />}
        sinPaddingCuerpo
        acciones={
          <div style={{ display: 'flex', gap: 'var(--espacio-sm)' }}>
            <Boton
              variante="secundario"
              type="button"
              icono={<Plus size={14} />}
              onClick={() => setModalEsquema(true)}
            >
              Crear esquema
            </Boton>
            <Boton
              variante="primario"
              type="button"
              icono={<Sparkles size={14} />}
              onClick={() => setModalGenerar(true)}
            >
              Generar comisión
            </Boton>
          </div>
        }
      >
        {error ? (
          <div style={{ padding: 'var(--espacio-md)' }}>
            <MensajeError mensaje="No se pudieron cargar las comisiones. Intenta nuevamente." />
          </div>
        ) : (
          <TablaDatos<Comision>
            columnas={[
              {
                clave: 'barbero',
                etiqueta: 'Barbero',
                render: (c) => <strong>{c.barbero_nombre || '—'}</strong>,
              },
              {
                clave: 'reserva',
                etiqueta: 'Reserva',
                render: (c) => (
                  <span style={{ color: 'var(--color-texto-suave)', fontFamily: 'var(--fuente-mono, monospace)' }}>
                    {c.reserva_id ? c.reserva_id.slice(0, 8) : '—'}
                  </span>
                ),
              },
              {
                clave: 'monto_calculado',
                etiqueta: 'Monto',
                alinear: 'derecha',
                render: (c) => <strong>{formatearMoneda(c.monto_calculado)}</strong>,
              },
              {
                clave: 'estado',
                etiqueta: 'Estado',
                alinear: 'centro',
                render: (c) => (
                  <Insignia variante={varianteEstadoComision(c.estado)}>{c.estado}</Insignia>
                ),
              },
              {
                clave: 'generado_en',
                etiqueta: 'Generado',
                render: (c) => (
                  <span style={{ color: 'var(--color-texto-suave)' }}>{formatearFecha(c.generado_en)}</span>
                ),
              },
            ]}
            filas={comisiones}
            obtenerClave={(c) => c.id}
            cargando={cargando}
            vacioIcono={<Coins size={32} />}
            vacioTitulo="Sin comisiones aún"
            vacioMensaje="Genera la comisión de una reserva completada para verla aquí."
          />
        )}
      </SeccionTarjeta>
    </>
  )
}

// ── Sección: Liquidaciones ────────────────────────────────────────────────────

function SeccionLiquidaciones() {
  const { liquidaciones, cargando, error } = usarLiquidaciones()
  const { aprobar, pagar, aprobando, pagando } = usarAccionesLiquidacion()
  const [modalCalcular, setModalCalcular] = useState(false)

  function manejarAprobar(l: Liquidacion) {
    aprobar(l.id, {
      onSuccess: () => toast.success('Liquidación aprobada'),
      onError: () => toast.error('No se pudo aprobar la liquidación'),
    })
  }

  function manejarPagar(l: Liquidacion) {
    pagar(l.id, {
      onSuccess: () => toast.success('Liquidación pagada'),
      onError: () => toast.error('No se pudo registrar el pago'),
    })
  }

  return (
    <>
      <ModalCalcularLiquidacion abierto={modalCalcular} alCerrar={() => setModalCalcular(false)} />

      <SeccionTarjeta
        titulo="Liquidaciones"
        descripcion="Pagos agrupados de comisiones por barbero y periodo."
        icono={<Wallet size={14} />}
        sinPaddingCuerpo
        acciones={
          <Boton
            variante="primario"
            type="button"
            icono={<Calculator size={14} />}
            onClick={() => setModalCalcular(true)}
          >
            Calcular liquidación
          </Boton>
        }
      >
        {error ? (
          <div style={{ padding: 'var(--espacio-md)' }}>
            <MensajeError mensaje="No se pudieron cargar las liquidaciones. Intenta nuevamente." />
          </div>
        ) : (
          <TablaDatos<Liquidacion>
            columnas={[
              {
                clave: 'barbero',
                etiqueta: 'Barbero',
                render: (l) => <strong>{l.barbero_nombre || '—'}</strong>,
              },
              {
                clave: 'periodo',
                etiqueta: 'Periodo',
                render: (l) => (
                  <span style={{ color: 'var(--color-texto-suave)' }}>
                    {formatearFecha(l.fecha_inicio)} – {formatearFecha(l.fecha_fin)}
                  </span>
                ),
              },
              {
                clave: 'frecuencia',
                etiqueta: 'Frecuencia',
                render: (l) => (
                  <span style={{ color: 'var(--color-texto-suave)' }}>{l.frecuencia || '—'}</span>
                ),
              },
              {
                clave: 'monto_total',
                etiqueta: 'Monto total',
                alinear: 'derecha',
                render: (l) => <strong>{formatearMoneda(l.monto_total)}</strong>,
              },
              {
                clave: 'estado',
                etiqueta: 'Estado',
                alinear: 'centro',
                render: (l) => (
                  <Insignia variante={varianteEstadoLiquidacion(l.estado)}>{l.estado}</Insignia>
                ),
              },
            ]}
            filas={liquidaciones}
            obtenerClave={(l) => l.id}
            cargando={cargando}
            vacioIcono={<Wallet size={32} />}
            vacioTitulo="Sin liquidaciones"
            vacioMensaje="Calcula una liquidación para agrupar las comisiones pendientes."
            acciones={(l) => {
              const estado = l.estado.toUpperCase()
              if (estado === 'PENDIENTE') {
                return (
                  <Boton
                    variante="secundario"
                    tamano="sm"
                    type="button"
                    icono={<CheckCircle2 size={13} />}
                    onClick={() => manejarAprobar(l)}
                    cargando={aprobando}
                  >
                    Aprobar
                  </Boton>
                )
              }
              if (estado === 'APROBADA') {
                return (
                  <Boton
                    variante="primario"
                    tamano="sm"
                    type="button"
                    icono={<BadgeDollarSign size={13} />}
                    onClick={() => manejarPagar(l)}
                    cargando={pagando}
                  >
                    Pagar
                  </Boton>
                )
              }
              return (
                <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-muted)' }}>
                  Pagada
                </span>
              )
            }}
          />
        )}
      </SeccionTarjeta>
    </>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export function PaginaComisiones() {
  return (
    <motion.div
      className="pagina-comisiones"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <EncabezadoPagina
        titulo="Comisiones y liquidaciones"
        descripcion="Gestiona las comisiones de tus barberos y liquídalas por periodo"
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--espacio-lg)',
          marginTop: 'var(--espacio-lg)',
        }}
      >
        <SeccionComisiones />
        <SeccionLiquidaciones />
      </div>
    </motion.div>
  )
}
