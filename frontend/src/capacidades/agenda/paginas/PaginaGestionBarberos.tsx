import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { UserPlus, Scissors, Clock, Check, Plus, X, CalendarDays, Phone, Pencil, Save, ChevronLeft } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usarBarberos } from '@/capacidades/agenda/ganchos/usarBarberos'
import { usarDisponibilidadBarbero } from '@/capacidades/agenda/ganchos/usarDisponibilidadBarbero'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { SelectorTelefono } from '@/compartido/interfaz/primitivas/SelectorTelefono'
import { EsqueletoFormulario } from '@/compartido/interfaz/retroalimentacion/Esqueleto'
import { Vacio } from '@/compartido/interfaz/retroalimentacion/Vacio'
import {
  obtenerServicios,
  obtenerServiciosBarbero,
  asignarServicioBarbero,
  desasignarServicioBarbero,
  actualizarBarbero,
  cambiarEstadoBarbero,
} from '@/capacidades/agenda/servicios/servicio-agenda'
import type { Barbero, Servicio, SolicitudRegistrarDisponibilidad } from '@/capacidades/agenda/contratos/tipos'

// ── Constantes ──────────────────────────────────────────────────────────────

const DIAS_SEMANA = [
  { valor: 1, abrev: 'Lun', etiqueta: 'Lunes' },
  { valor: 2, abrev: 'Mar', etiqueta: 'Martes' },
  { valor: 3, abrev: 'Mié', etiqueta: 'Miércoles' },
  { valor: 4, abrev: 'Jue', etiqueta: 'Jueves' },
  { valor: 5, abrev: 'Vie', etiqueta: 'Viernes' },
  { valor: 6, abrev: 'Sáb', etiqueta: 'Sábado' },
  { valor: 0, abrev: 'Dom', etiqueta: 'Domingo' },
]

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ── Fila de barbero en sidebar ───────────────────────────────────────────────

function FilaBarbero({
  barbero,
  seleccionado,
  onClick,
}: {
  barbero: Barbero
  seleccionado: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={['barbero-fila', seleccionado ? 'barbero-fila--seleccionado' : ''].filter(Boolean).join(' ')}
    >
      <div className="barbero-fila-avatar">
        {iniciales(barbero.nombre) || <Scissors size={14} />}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p className="barbero-fila-nombre">{barbero.nombre}</p>
        {(barbero.telefono || barbero.especialidad) && (
          <p className="barbero-fila-sub">{barbero.telefono || barbero.especialidad}</p>
        )}
      </div>
      <span
        className={`barbero-fila-dot ${barbero.estado === 'ACTIVO' ? 'barbero-fila-dot--activo' : 'barbero-fila-dot--inactivo'}`}
      />
    </button>
  )
}

// ── Formulario de nuevo barbero ──────────────────────────────────────────────

function FormularioNuevoBarbero({ onGuardar }: { onGuardar: () => void }) {
  const { registrar, registrando } = usarBarberos()
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setErrores({ nombre: 'Ingresa el nombre completo' })
      return
    }
    try {
      await registrar({ nombre: nombre.trim(), telefono: telefono || undefined })
      toast.success('Barbero registrado', { description: nombre.trim() })
      setNombre('')
      setTelefono('')
      onGuardar()
    } catch {
      toast.error('No se pudo registrar el barbero')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="barbero-panel-contenido"
    >
      <div className="barbero-panel-seccion-header">
        <div className="barbero-panel-icono" style={{ backgroundColor: 'rgba(52,82,204,0.08)', color: 'var(--color-primario)' }}>
          <UserPlus size={16} />
        </div>
        <div>
          <h2 className="barbero-panel-titulo">Nuevo barbero</h2>
          <p className="barbero-panel-subtitulo">Completa los datos y guarda</p>
        </div>
      </div>

      <form
        onSubmit={manejarEnvio}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)', maxWidth: '420px', marginTop: 'var(--espacio-xl)' }}
      >
        <Campo
          etiqueta="Nombre completo"
          requerido
          error={errores.nombre}
          value={nombre}
          onChange={(e) => { setNombre(e.target.value); setErrores((p) => ({ ...p, nombre: '' })) }}
          placeholder="Ej: Carlos Ramírez"
          className="campo-input"
        />

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--tamano-sm)',
              fontWeight: 500,
              color: 'var(--color-texto)',
              marginBottom: '0.375rem',
            }}
          >
            Teléfono
            <span style={{ marginLeft: '0.375rem', fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)', fontWeight: 400 }}>
              Opcional
            </span>
          </label>
          <SelectorTelefono
            valor={telefono}
            alCambiar={setTelefono}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--espacio-sm)', marginTop: '0.25rem' }}>
          <Boton type="submit" variante="primario" cargando={registrando} icono={<UserPlus size={14} />}>
            Registrar barbero
          </Boton>
        </div>
      </form>
    </motion.div>
  )
}

// ── Sección: servicios asignados ────────────────────────────────────────────

function SeccionServicios({ barbero }: { barbero: Barbero }) {
  const clienteConsulta = useQueryClient()
  const [pendiente, setPendiente] = useState<string | null>(null)

  const { data: todosServicios = [], isLoading: cargandoTodos } = useQuery({
    queryKey: ['servicios'],
    queryFn: obtenerServicios,
  })

  const { data: serviciosAsignados = [], isLoading: cargandoAsignados } = useQuery({
    queryKey: ['servicios-barbero', barbero.id],
    queryFn: () => obtenerServiciosBarbero(barbero.id),
  })

  const idsAsignados = new Set(serviciosAsignados.map((s) => s.id))

  const mutAsignar = useMutation({
    mutationFn: (servicioId: string) =>
      asignarServicioBarbero(barbero.id, { servicio_id: servicioId }),
    onMutate: (sid) => setPendiente(sid),
    onSettled: () => setPendiente(null),
    onSuccess: (_, sid) => {
      clienteConsulta.invalidateQueries({ queryKey: ['servicios-barbero', barbero.id] })
      const nombre = todosServicios.find((s) => s.id === sid)?.nombre ?? ''
      toast.success(`Servicio asignado: ${nombre}`)
    },
    onError: () => toast.error('No se pudo asignar el servicio'),
  })

  const mutDesasignar = useMutation({
    mutationFn: (servicioId: string) => desasignarServicioBarbero(barbero.id, servicioId),
    onMutate: (sid) => setPendiente(sid),
    onSettled: () => setPendiente(null),
    onSuccess: (_, sid) => {
      clienteConsulta.invalidateQueries({ queryKey: ['servicios-barbero', barbero.id] })
      const nombre = todosServicios.find((s) => s.id === sid)?.nombre ?? ''
      toast.success(`Servicio removido: ${nombre}`)
    },
    onError: () => toast.error('No se pudo remover el servicio'),
  })

  const toggleServicio = (servicio: Servicio) => {
    if (pendiente) return
    if (idsAsignados.has(servicio.id)) {
      mutDesasignar.mutate(servicio.id)
    } else {
      mutAsignar.mutate(servicio.id)
    }
  }

  const cargando = cargandoTodos || cargandoAsignados

  return (
    <div className="barbero-panel-bloque">
      <div className="barbero-panel-bloque-titulo">
        <Scissors size={13} style={{ color: 'var(--color-primario)' }} />
        <span>Servicios</span>
        {serviciosAsignados.length > 0 && (
          <span className="barbero-panel-badge">{serviciosAsignados.length}</span>
        )}
      </div>

      {cargando ? (
        <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)' }}>Cargando…</p>
      ) : todosServicios.length === 0 ? (
        <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)' }}>
          No hay servicios creados.{' '}
          <a href="/agenda/servicios" style={{ color: 'var(--color-primario)' }}>Crea uno primero</a>.
        </p>
      ) : (
        <div className="barbero-servicios-grid">
          {todosServicios.map((s) => {
            const asignado = idsAsignados.has(s.id)
            const enProceso = pendiente === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleServicio(s)}
                disabled={!!pendiente}
                className={[
                  'barbero-servicio-chip',
                  asignado ? 'barbero-servicio-chip--asignado' : '',
                  enProceso ? 'barbero-servicio-chip--pendiente' : '',
                ].filter(Boolean).join(' ')}
              >
                {enProceso ? (
                  <span className="barbero-chip-spinner" />
                ) : asignado ? (
                  <Check size={11} />
                ) : (
                  <Plus size={11} />
                )}
                <span>{s.nombre}</span>
                <span className="barbero-chip-meta">{s.duracion_minutos} min</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Sección: disponibilidad semanal ────────────────────────────────────────

function SeccionDisponibilidad({ barbero }: { barbero: Barbero }) {
  const { bloques, cargandoBloques, registrar, registrando } = usarDisponibilidadBarbero(barbero.id)
  const [diaActivo, setDiaActivo] = useState<number | null>(null)
  const [horario, setHorario] = useState({ hora_inicio: '09:00', hora_fin: '18:00' })
  const [errorHora, setErrorHora] = useState('')

  const bloquePorDia = (dia: number) => bloques.filter((b) => b.dia_semana === dia)

  const agregarBloque = async () => {
    if (diaActivo === null) return
    if (horario.hora_inicio >= horario.hora_fin) {
      setErrorHora('La hora de fin debe ser posterior a la de inicio')
      return
    }
    setErrorHora('')
    const solicitud: SolicitudRegistrarDisponibilidad = {
      barbero_id: barbero.id,
      dia_semana: diaActivo,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
    }
    try {
      await registrar(solicitud)
      toast.success(`Disponibilidad registrada`, {
        description: `${DIAS_SEMANA.find((d) => d.valor === diaActivo)?.etiqueta} · ${horario.hora_inicio} – ${horario.hora_fin}`,
      })
      setDiaActivo(null)
    } catch {
      toast.error('No se pudo registrar la disponibilidad')
    }
  }

  return (
    <div className="barbero-panel-bloque">
      <div className="barbero-panel-bloque-titulo">
        <CalendarDays size={13} style={{ color: 'var(--color-primario)' }} />
        <span>Disponibilidad semanal</span>
        {bloques.length > 0 && (
          <span className="barbero-panel-badge">{bloques.length} bloques</span>
        )}
      </div>

      {cargandoBloques ? (
        <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)' }}>Cargando…</p>
      ) : (
        <div className="barbero-semana-grid">
          {DIAS_SEMANA.map((dia) => {
            const bloquesDia = bloquePorDia(dia.valor)
            const seleccionado = diaActivo === dia.valor
            return (
              <div
                key={dia.valor}
                className={['barbero-dia-col', seleccionado ? 'barbero-dia-col--activo' : ''].filter(Boolean).join(' ')}
              >
                <button
                  type="button"
                  onClick={() => setDiaActivo(seleccionado ? null : dia.valor)}
                  className={['barbero-dia-btn', bloquesDia.length > 0 ? 'barbero-dia-btn--con-bloques' : ''].filter(Boolean).join(' ')}
                >
                  <span className="barbero-dia-abrev">{dia.abrev}</span>
                  {bloquesDia.length > 0 && (
                    <span className="barbero-dia-count">{bloquesDia.length}</span>
                  )}
                </button>

                {bloquesDia.length > 0 && (
                  <div className="barbero-dia-bloques">
                    {bloquesDia.map((b) => (
                      <span key={b.id} className="barbero-bloque-chip">
                        <Clock size={9} />
                        {b.hora_inicio}–{b.hora_fin}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Formulario inline para agregar bloque */}
      <AnimatePresence>
        {diaActivo !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="barbero-bloque-form">
              <div className="barbero-bloque-form-header">
                <span style={{ fontSize: 'var(--tamano-sm)', fontWeight: 600, color: 'var(--color-texto)' }}>
                  Agregar bloque · {DIAS_SEMANA.find((d) => d.valor === diaActivo)?.etiqueta}
                </span>
                <button
                  type="button"
                  onClick={() => { setDiaActivo(null); setErrorHora('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-texto-suave)', display: 'flex' }}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="barbero-bloque-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 'var(--espacio-sm)', alignItems: 'flex-end' }}>
                <Campo
                  etiqueta="Desde"
                  type="time"
                  value={horario.hora_inicio}
                  onChange={(e) => { setHorario((p) => ({ ...p, hora_inicio: e.target.value })); setErrorHora('') }}
                  className="campo-input"
                />
                <Campo
                  etiqueta="Hasta"
                  type="time"
                  value={horario.hora_fin}
                  onChange={(e) => { setHorario((p) => ({ ...p, hora_fin: e.target.value })); setErrorHora('') }}
                  error={errorHora}
                  className="campo-input"
                />
                <Boton
                  type="button"
                  variante="primario"
                  icono={<Plus size={14} />}
                  cargando={registrando}
                  onClick={agregarBloque}
                  style={{ marginBottom: errorHora ? '1.5rem' : 0 }}
                >
                  Agregar
                </Boton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!cargandoBloques && bloques.length === 0 && diaActivo === null && (
        <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)', marginTop: 'var(--espacio-sm)' }}>
          Selecciona un día para añadir horarios de atención.
        </p>
      )}
    </div>
  )
}

// ── Panel de perfil de barbero ───────────────────────────────────────────────

function PerfilBarbero({ barbero, onActualizado }: { barbero: Barbero; onActualizado?: (nombre: string, telefono: string) => void }) {
  const clienteConsulta = useQueryClient()
  const ini = iniciales(barbero.nombre)
  const telefonoMostrado = barbero.telefono || barbero.especialidad || ''

  const [editando, setEditando] = useState(false)
  const [editNombre, setEditNombre] = useState(barbero.nombre)
  const [editTelefono, setEditTelefono] = useState(telefonoMostrado)
  const [errorNombre, setErrorNombre] = useState('')
  const [estadoLocal, setEstadoLocal] = useState<'ACTIVO' | 'INACTIVO'>(barbero.estado as 'ACTIVO' | 'INACTIVO')

  const mutActualizar = useMutation({
    mutationFn: () =>
      actualizarBarbero(barbero.id, { nombre: editNombre.trim(), telefono: editTelefono || undefined }),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['barberos'] })
      toast.success('Datos actualizados', { description: editNombre.trim() })
      setEditando(false)
      onActualizado?.(editNombre.trim(), editTelefono)
    },
    onError: () => toast.error('No se pudo actualizar'),
  })

  const mutEstado = useMutation({
    mutationFn: (estado: 'ACTIVO' | 'INACTIVO') => cambiarEstadoBarbero(barbero.id, estado),
    onSuccess: (_, estado) => {
      setEstadoLocal(estado)
      clienteConsulta.invalidateQueries({ queryKey: ['barberos'] })
      toast.success('Estado actualizado', { description: estado === 'ACTIVO' ? 'Barbero activo' : 'Barbero inactivo' })
    },
    onError: () => toast.error('No se pudo cambiar el estado'),
  })

  const guardar = () => {
    if (!editNombre.trim()) { setErrorNombre('El nombre es obligatorio'); return }
    setErrorNombre('')
    mutActualizar.mutate()
  }

  const cancelar = () => {
    setEditNombre(barbero.nombre)
    setEditTelefono(telefonoMostrado)
    setErrorNombre('')
    setEditando(false)
  }

  return (
    <motion.div
      key={barbero.id}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="barbero-panel-contenido"
    >
      {/* ── Header del perfil ── */}
      <div className="barbero-perfil-header">
        <div className="barbero-perfil-avatar">
          {ini || <Scissors size={20} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            {editando ? (
              /* Modo edición */
              <motion.div
                key="edicion"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-sm)' }}
              >
                <Campo
                  etiqueta=""
                  error={errorNombre}
                  value={editNombre}
                  onChange={(e) => { setEditNombre(e.target.value); setErrorNombre('') }}
                  placeholder="Nombre completo"
                  className="campo-input"
                />
                <SelectorTelefono
                  valor={editTelefono}
                  alCambiar={setEditTelefono}
                />
                <div style={{ display: 'flex', gap: 'var(--espacio-sm)', marginTop: '0.25rem' }}>
                  <Boton
                    variante="primario"
                    icono={<Save size={13} />}
                    cargando={mutActualizar.isPending}
                    onClick={guardar}
                    style={{ fontSize: 'var(--tamano-xs)', padding: '0.375rem 0.75rem' }}
                  >
                    Guardar
                  </Boton>
                  <Boton
                    variante="fantasma"
                    icono={<X size={13} />}
                    onClick={cancelar}
                    style={{ fontSize: 'var(--tamano-xs)', padding: '0.375rem 0.75rem' }}
                  >
                    Cancelar
                  </Boton>
                </div>
              </motion.div>
            ) : (
              /* Modo lectura */
              <motion.div
                key="lectura"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacio-sm)', flexWrap: 'wrap' }}>
                  <h2 className="barbero-perfil-nombre">{barbero.nombre}</h2>
                  {/* Selector de estado interactivo */}
                  <select
                    value={estadoLocal}
                    disabled={mutEstado.isPending}
                    onChange={(e) => mutEstado.mutate(e.target.value as 'ACTIVO' | 'INACTIVO')}
                    className={[
                      'tabla-estado-select',
                      estadoLocal === 'ACTIVO' ? 'tabla-estado-select--activo' : 'tabla-estado-select--inactivo',
                    ].join(' ')}
                    title="Cambiar estado del barbero"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => { setEditNombre(barbero.nombre); setEditTelefono(telefonoMostrado); setEditando(true) }}
                    className="barbero-perfil-editar-btn"
                    title="Editar nombre y teléfono"
                  >
                    <Pencil size={12} />
                  </button>
                </div>

                {telefonoMostrado ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
                    <Phone size={12} style={{ color: 'var(--color-texto-suave)' }} />
                    <span style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)' }}>
                      {telefonoMostrado}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditando(true)}
                    className="barbero-perfil-agregar-tel"
                  >
                    <Plus size={11} />
                    Agregar teléfono
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-xl)', marginTop: 'var(--espacio-xl)' }}>
        <SeccionServicios barbero={barbero} />
        <SeccionDisponibilidad barbero={barbero} />
      </div>
    </motion.div>
  )
}

// ── Estado vacío del panel ───────────────────────────────────────────────────

function PanelVacio({ onNuevo }: { onNuevo: () => void }) {
  return (
    <div className="barbero-panel-vacio">
      <div className="barbero-panel-vacio-icono">
        <Scissors size={28} />
      </div>
      <p style={{ fontSize: 'var(--tamano-base)', fontWeight: 600, color: 'var(--color-texto)', margin: 0 }}>
        Selecciona un barbero
      </p>
      <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)', margin: 0 }}>
        Elige uno del panel izquierdo para ver su perfil completo
      </p>
      <Boton variante="secundario" icono={<UserPlus size={14} />} onClick={onNuevo}>
        Registrar nuevo barbero
      </Boton>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────

export function PaginaGestionBarberos() {
  const { barberos, cargando } = usarBarberos()
  const [barberoSeleccionado, setBarberoSeleccionado] = useState<Barbero | null>(null)
  const [creando, setCreando] = useState(false)

  // En móvil: true cuando se está viendo el detalle (panel derecho)
  const enDetalle = creando || !!barberoSeleccionado

  const seleccionar = (b: Barbero) => {
    setCreando(false)
    setBarberoSeleccionado(b)
  }

  const iniciarCreacion = () => {
    setBarberoSeleccionado(null)
    setCreando(true)
  }

  const alGuardar = () => {
    setCreando(false)
  }

  const volver = () => {
    setBarberoSeleccionado(null)
    setCreando(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Header de página ── */}
      <div className="gestion-header">
        <div>
          <h1 className="gestion-titulo">Barberos</h1>
          <p className="gestion-subtitulo">Gestiona el equipo, sus servicios y disponibilidad</p>
        </div>
      </div>

      {/* ── Layout dos paneles ── */}
      <div className={['gestion-layout', enDetalle ? 'gestion-layout--detalle' : ''].filter(Boolean).join(' ')}>

        {/* Sidebar (lista) */}
        <aside className="gestion-sidebar">
          <div className="gestion-sidebar-header">
            <span className="gestion-sidebar-label">
              Equipo
              {barberos.length > 0 && (
                <span className="gestion-sidebar-count">{barberos.length}</span>
              )}
            </span>
            <Boton
              variante="primario"
              icono={<UserPlus size={13} />}
              onClick={iniciarCreacion}
              style={{ padding: '0.375rem 0.625rem', fontSize: 'var(--tamano-xs)' }}
            >
              Nuevo
            </Boton>
          </div>

          <div className="gestion-sidebar-lista">
            {cargando && <EsqueletoFormulario campos={3} />}

            {!cargando && barberos.length === 0 && (
              <div style={{ padding: 'var(--espacio-lg)' }}>
                <Vacio titulo="Sin barberos" mensaje="Registra el primero." />
              </div>
            )}

            {!cargando && barberos.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: i * 0.03 }}
              >
                <FilaBarbero
                  barbero={b}
                  seleccionado={barberoSeleccionado?.id === b.id}
                  onClick={() => seleccionar(b)}
                />
              </motion.div>
            ))}
          </div>
        </aside>

        {/* Panel de detalle */}
        <main className="gestion-panel">
          {/* Botón volver — solo visible en móvil (CSS lo controla) */}
          <button
            type="button"
            className="gestion-panel-volver"
            onClick={volver}
            aria-label="Volver al listado"
          >
            <ChevronLeft size={16} />
            <span>Barberos</span>
          </button>

          <AnimatePresence mode="wait">
            {creando && (
              <FormularioNuevoBarbero key="nuevo" onGuardar={alGuardar} />
            )}
            {!creando && barberoSeleccionado && (
              <PerfilBarbero
                key={barberoSeleccionado.id}
                barbero={barberoSeleccionado}
                onActualizado={(nombre, telefono) =>
                  setBarberoSeleccionado((prev) => prev ? { ...prev, nombre, telefono } : prev)
                }
              />
            )}
            {!creando && !barberoSeleccionado && (
              <PanelVacio key="vacio" onNuevo={iniciarCreacion} />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
