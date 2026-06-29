import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { CalendarDays, Clock, Ban, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { usarDisponibilidadBarbero } from '@/capacidades/agenda/ganchos/usarDisponibilidadBarbero'
import { usarExcepcionesBarbero } from '@/capacidades/agenda/ganchos/usarExcepcionesBarbero'
import { usarBarberos } from '@/capacidades/agenda/ganchos/usarBarberos'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { Selector } from '@/compartido/interfaz/primitivas/Selector'
import { SelectorFecha } from '@/compartido/interfaz/primitivas/SelectorFecha'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta'
import { Vacio } from '@/compartido/interfaz/retroalimentacion/Vacio'
import { SelectorBarbero } from '@/capacidades/agenda/componentes/SelectorBarbero'
import type {
  SolicitudRegistrarDisponibilidad,
  BloqueDisponibilidad,
  ExcepcionDisponibilidad,
  SolicitudRegistrarExcepcion,
  MotivoExcepcion,
} from '@/capacidades/agenda/contratos/tipos'

// ── Constantes ────────────────────────────────────────────────────────────────

const DIAS_SEMANA = [
  { valor: '0', etiqueta: 'Domingo' },
  { valor: '1', etiqueta: 'Lunes' },
  { valor: '2', etiqueta: 'Martes' },
  { valor: '3', etiqueta: 'Miércoles' },
  { valor: '4', etiqueta: 'Jueves' },
  { valor: '5', etiqueta: 'Viernes' },
  { valor: '6', etiqueta: 'Sábado' },
]

const OPCIONES_MOTIVO = [
  { valor: 'VACACION', etiqueta: 'Vacación' },
  { valor: 'FERIADO', etiqueta: 'Feriado' },
  { valor: 'CIERRE', etiqueta: 'Cierre' },
  { valor: 'OTRO', etiqueta: 'Otro' },
]

function etiquetaDia(numero: number): string {
  return DIAS_SEMANA.find((d) => d.valor === String(numero))?.etiqueta ?? `Día ${numero}`
}

function etiquetaMotivo(motivo: string): string {
  return OPCIONES_MOTIVO.find((m) => m.valor === motivo)?.etiqueta ?? motivo
}

// ── Panel Horarios ────────────────────────────────────────────────────────────

function PanelHorarios({ bloques, onEliminar, eliminando }: { bloques: BloqueDisponibilidad[]; onEliminar?: (id: string) => void; eliminando?: boolean }) {
  if (bloques.length === 0) {
    return (
      <Vacio
        icono={<Clock size={24} />}
        titulo="Sin horarios registrados"
        mensaje="Registra disponibilidad usando el formulario de arriba."
      />
    )
  }

  const porDia = DIAS_SEMANA.map((d) => ({
    ...d,
    bloques: bloques.filter((b) => b.dia_semana === Number(d.valor)),
  })).filter((d) => d.bloques.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-sm)' }}>
      {porDia.map((dia) => (
        <motion.div
          key={dia.valor}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            border: '1px solid var(--color-borde)',
            borderRadius: 'var(--radio-lg)',
            overflow: 'hidden',
            backgroundColor: 'var(--color-superficie)',
          }}
        >
          <div
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-superficie-2)',
              borderBottom: '1px solid var(--color-borde)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            <CalendarDays size={13} style={{ color: 'var(--color-primario)' }} />
            <span style={{ fontSize: 'var(--tamano-xs)', fontWeight: 600, color: 'var(--color-texto)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {dia.etiqueta}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)' }}>
              {dia.bloques.length} {dia.bloques.length === 1 ? 'bloque' : 'bloques'}
            </span>
          </div>
          <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {dia.bloques.map((b) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
                <Clock size={12} style={{ color: 'var(--color-texto-suave)', flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500 }}>
                  {b.hora_inicio} – {b.hora_fin}
                </span>
                {onEliminar && (
                  <button
                    type="button"
                    onClick={() => onEliminar(b.id)}
                    disabled={eliminando}
                    aria-label={`Eliminar bloque ${b.hora_inicio} a ${b.hora_fin}`}
                    title="Eliminar bloque"
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-texto-suave)', display: 'flex', padding: '0.25rem' }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── Panel Excepciones ─────────────────────────────────────────────────────────

function PanelExcepciones({ barberoId, barberoNombre }: { barberoId: string; barberoNombre: string }) {
  const [form, setForm] = useState<SolicitudRegistrarExcepcion>({ fecha: '', motivo: 'VACACION', descripcion: '' })
  const { excepciones, cargandoExcepciones, errorCarga, registrar, registrando, eliminar, errorRegistrar } =
    usarExcepcionesBarbero(barberoId)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fecha) { toast.error('Selecciona una fecha'); return }
    try {
      await registrar(form)
      setForm({ fecha: '', motivo: 'VACACION', descripcion: '' })
      toast.success('Día bloqueado', { description: `${form.fecha} · ${etiquetaMotivo(form.motivo)}` })
    } catch {
      toast.error(errorRegistrar ?? 'No se pudo registrar el bloqueo')
    }
  }

  const manejarEliminar = async (ex: ExcepcionDisponibilidad) => {
    try {
      await eliminar(ex.id)
      toast.success('Bloqueo eliminado', { description: ex.fecha })
    } catch {
      toast.error('No se pudo eliminar el bloqueo')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-lg)' }}>
      <SeccionTarjeta titulo={`Bloquear día a ${barberoNombre}`} icono={<Ban size={14} />} maxAncho={520}>
        <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--espacio-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
                Fecha <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <SelectorFecha
                soloFecha
                valor={form.fecha}
                alCambiar={(v) => setForm((p) => ({ ...p, fecha: v }))}
                minDate={new Date()}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
                Motivo
              </label>
              <Selector
                valor={form.motivo}
                alCambiar={(v) => setForm((p) => ({ ...p, motivo: v as MotivoExcepcion }))}
                opciones={OPCIONES_MOTIVO}
              />
            </div>
          </div>

          <Campo
            etiqueta="Descripción (opcional)"
            value={form.descripcion ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Ej: Semana santa, viaje…"
          />

          <Boton type="submit" variante="secundario" icono={<Ban size={14} />} cargando={registrando}>
            Bloquear día
          </Boton>
        </form>
      </SeccionTarjeta>

      {cargandoExcepciones ? (
        <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)' }}>Cargando bloqueos…</p>
      ) : errorCarga ? (
        <BannerAlerta variante="error" mensaje="No se pudieron cargar los días bloqueados." />
      ) : excepciones.length === 0 ? (
        <Vacio icono={<Ban size={20} />} titulo="Sin días bloqueados" mensaje="Los días bloqueados aparecerán aquí." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxWidth: 520 }}>
          {excepciones.map((ex) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              transition={{ duration: 0.15 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                border: '1px solid var(--color-borde)',
                borderRadius: 'var(--radio-md)',
                backgroundColor: 'var(--color-superficie)',
              }}
            >
              <Ban size={14} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 'var(--tamano-sm)', fontWeight: 600 }}>{ex.fecha}</p>
                <p style={{ margin: 0, fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)' }}>
                  {etiquetaMotivo(ex.motivo)}{ex.descripcion ? ` · ${ex.descripcion}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => manejarEliminar(ex)}
                title="Eliminar bloqueo"
                aria-label={`Eliminar bloqueo del ${ex.fecha}`}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0.25rem', color: 'var(--color-texto-suave)',
                  display: 'flex', alignItems: 'center', borderRadius: 'var(--radio-sm)',
                }}
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

const ESTADO_INICIAL: SolicitudRegistrarDisponibilidad = {
  barbero_id: '',
  dia_semana: 1,
  hora_inicio: '09:00',
  hora_fin: '18:00',
}

export function PaginaAgendaBarbero() {
  const { barberos } = usarBarberos()
  const [formulario, setFormulario] = useState<SolicitudRegistrarDisponibilidad>(ESTADO_INICIAL)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [verHorarios, setVerHorarios] = useState(false)
  const [verExcepciones, setVerExcepciones] = useState(false)

  const { registrar, registrando, bloques, cargandoBloques, errorCarga, eliminar, eliminando } = usarDisponibilidadBarbero(
    formulario.barbero_id || undefined,
  )

  const barberoSeleccionado = barberos.find((b) => b.id === formulario.barbero_id)

  const cambiarCampo = (campo: keyof SolicitudRegistrarDisponibilidad, valor: string | number) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: '' }))
  }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    const nuevos: Record<string, string> = {}
    if (!formulario.barbero_id) nuevos.barbero_id = 'Selecciona un barbero'
    if (formulario.hora_inicio >= formulario.hora_fin)
      nuevos.hora_fin = 'La hora de fin debe ser posterior a la de inicio'
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return }

    try {
      await registrar(formulario)
      setFormulario((prev) => ({ ...prev, dia_semana: 1, hora_inicio: '09:00', hora_fin: '18:00' }))
      setVerHorarios(true)
      toast.success('Disponibilidad registrada', {
        description: `${etiquetaDia(formulario.dia_semana)} · ${formulario.hora_inicio} – ${formulario.hora_fin}`,
      })
    } catch {
      toast.error('No se pudo registrar la disponibilidad')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <EncabezadoPagina
        titulo="Agenda de disponibilidad"
        descripcion="Define horarios semanales y bloquea días no disponibles"
        indicador={barberoSeleccionado ? barberoSeleccionado.nombre : undefined}
        style={{
          padding: 'var(--espacio-lg)',
          borderBottom: '1px solid var(--color-borde)',
          backgroundColor: 'var(--color-superficie)',
        }}
      />

      <div style={{ padding: 'var(--espacio-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-xl)' }}>

        {/* Formulario disponibilidad */}
        <SeccionTarjeta titulo="Registrar disponibilidad" icono={<Clock size={14} />} maxAncho={520}>
          <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>

            <Campo etiqueta="Barbero" requerido error={errores.barbero_id}>
              <SelectorBarbero
                valor={formulario.barbero_id}
                alCambiar={(v) => cambiarCampo('barbero_id', v)}
                error={!!errores.barbero_id}
              />
            </Campo>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
                Día de la semana
              </label>
              <Selector
                valor={String(formulario.dia_semana)}
                alCambiar={(v) => cambiarCampo('dia_semana', parseInt(v, 10))}
                opciones={DIAS_SEMANA}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--espacio-md)' }}>
              <Campo
                etiqueta="Hora de inicio"
                type="time"
                value={formulario.hora_inicio}
                onChange={(e) => cambiarCampo('hora_inicio', e.target.value)}
              />
              <Campo
                etiqueta="Hora de fin"
                type="time"
                value={formulario.hora_fin}
                onChange={(e) => cambiarCampo('hora_fin', e.target.value)}
                error={errores.hora_fin}
              />
            </div>

            <Boton type="submit" variante="primario" cargando={registrando}>
              Registrar disponibilidad
            </Boton>
          </form>
        </SeccionTarjeta>

        {/* Horarios del barbero seleccionado */}
        {formulario.barbero_id && (
          <div style={{ maxWidth: '600px' }}>
            <button
              type="button"
              onClick={() => setVerHorarios((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                marginBottom: 'var(--espacio-md)',
              }}
            >
              <p style={{ fontSize: 'var(--tamano-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-texto-suave)', margin: 0 }}>
                Horarios de {barberoSeleccionado?.nombre ?? 'barbero'}
              </p>
              {verHorarios
                ? <ChevronUp size={14} style={{ color: 'var(--color-texto-suave)' }} />
                : <ChevronDown size={14} style={{ color: 'var(--color-texto-suave)' }} />}
            </button>

            <AnimatePresence>
              {verHorarios && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  {cargandoBloques
                    ? <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)' }}>Cargando horarios…</p>
                    : errorCarga
                      ? <BannerAlerta variante="error" mensaje="No se pudo cargar la disponibilidad." />
                      : <PanelHorarios bloques={bloques} onEliminar={eliminar} eliminando={eliminando} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Excepciones / días bloqueados */}
        {formulario.barbero_id && (
          <div style={{ maxWidth: '600px' }}>
            <button
              type="button"
              onClick={() => setVerExcepciones((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                marginBottom: 'var(--espacio-md)',
              }}
            >
              <Ban size={13} style={{ color: 'var(--color-error)' }} />
              <p style={{ fontSize: 'var(--tamano-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-texto-suave)', margin: 0 }}>
                Días bloqueados de {barberoSeleccionado?.nombre ?? 'barbero'}
              </p>
              {verExcepciones
                ? <ChevronUp size={14} style={{ color: 'var(--color-texto-suave)' }} />
                : <ChevronDown size={14} style={{ color: 'var(--color-texto-suave)' }} />}
            </button>

            <AnimatePresence>
              {verExcepciones && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <PanelExcepciones
                    barberoId={formulario.barbero_id}
                    barberoNombre={barberoSeleccionado?.nombre ?? ''}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </motion.div>
  )
}
