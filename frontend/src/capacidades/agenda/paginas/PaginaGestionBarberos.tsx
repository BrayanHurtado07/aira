import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  UserPlus,
  Scissors,
  Check,
  Plus,
  X,
  Phone,
  Save,
  Power,
  PowerOff,
  Pencil,
  CalendarDays,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usarBarberos } from '@/capacidades/agenda/ganchos/usarBarberos'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { SelectorTelefono } from '@/compartido/interfaz/primitivas/SelectorTelefono'
import { Avatar } from '@/compartido/interfaz/primitivas/Avatar'
import { CeldaCliente } from '@/compartido/interfaz/primitivas/CeldaCliente'
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import type { ColumnaTabla } from '@/compartido/interfaz/primitivas/TablaDatos'
import { Modal } from '@/compartido/interfaz/primitivas/Modal'
import { MenuAcciones } from '@/compartido/interfaz/primitivas/MenuAcciones'
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion'
import { Insignia, insigniaPorEstado } from '@/compartido/interfaz/retroalimentacion/Insignia'
import { ModalBarbero } from '@/capacidades/agenda/componentes/ModalBarbero'
import { GrillaDiasSemana } from '@/capacidades/agenda/componentes/GrillaDiasSemana'
import {
  obtenerServicios,
  obtenerServiciosBarbero,
  asignarServicioBarbero,
  desasignarServicioBarbero,
  actualizarBarbero,
  cambiarEstadoBarbero,
} from '@/capacidades/agenda/servicios/servicio-agenda'
import type { Barbero, Servicio } from '@/capacidades/agenda/contratos/tipos'

// ── Sección: servicios — dos grupos: asignados / sin asignar ──────────────────

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
  const asignados = todosServicios.filter((s) => idsAsignados.has(s.id))
  const sinAsignar = todosServicios.filter((s) => !idsAsignados.has(s.id))

  const renderChip = (s: Servicio, esAsignado: boolean) => {
    const enProceso = pendiente === s.id
    return (
      <button
        key={s.id}
        type="button"
        onClick={() => toggleServicio(s)}
        disabled={!!pendiente}
        title={esAsignado ? `Quitar: ${s.nombre}` : `Asignar: ${s.nombre}`}
        className={[
          'barbero-servicio-chip',
          esAsignado ? 'barbero-servicio-chip--asignado' : '',
          enProceso ? 'barbero-servicio-chip--pendiente' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {enProceso ? (
          <span className="barbero-chip-spinner" />
        ) : esAsignado ? (
          <Check size={11} aria-hidden />
        ) : (
          <Plus size={11} aria-hidden />
        )}
        <span>{s.nombre}</span>
        <span className="barbero-chip-meta">{s.duracion_minutos} min</span>
      </button>
    )
  }

  return (
    <div className="barbero-panel-bloque">
      <div className="barbero-panel-bloque-titulo">
        <Scissors size={13} style={{ color: 'var(--color-primario)' }} aria-hidden />
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
          <a href="/agenda/servicios" style={{ color: 'var(--color-primario)' }}>
            Crea uno primero
          </a>
          .
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
          {/* Grupo: asignados */}
          {asignados.length > 0 && (
            <div>
              <p className="barbero-servicios-grupo-titulo">Asignados</p>
              <div className="barbero-servicios-grid">{asignados.map((s) => renderChip(s, true))}</div>
            </div>
          )}

          {/* Grupo: sin asignar */}
          {sinAsignar.length > 0 && (
            <div>
              <p className="barbero-servicios-grupo-titulo">
                {asignados.length === 0 ? 'Sin asignar — pulsa para agregar' : 'Sin asignar'}
              </p>
              <div className="barbero-servicios-grid">
                {sinAsignar.map((s) => renderChip(s, false))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Panel de perfil del barbero ───────────────────────────────────────────────

function PerfilBarbero({
  barbero,
  onActualizado,
}: {
  barbero: Barbero
  onActualizado?: (nombre: string, telefono: string) => void
}) {
  const clienteConsulta = useQueryClient()
  const telefonoMostrado = barbero.telefono || barbero.especialidad || ''

  const [editando, setEditando] = useState(false)
  const [editNombre, setEditNombre] = useState(barbero.nombre)
  const [editTelefono, setEditTelefono] = useState(telefonoMostrado)
  const [errorNombre, setErrorNombre] = useState('')
  const [estadoLocal, setEstadoLocal] = useState<'ACTIVO' | 'INACTIVO'>(
    barbero.estado as 'ACTIVO' | 'INACTIVO'
  )
  const [confirmarInactivar, setConfirmarInactivar] = useState(false)

  const mutActualizar = useMutation({
    mutationFn: () =>
      actualizarBarbero(barbero.id, {
        nombre: editNombre.trim(),
        telefono: editTelefono || undefined,
      }),
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
      toast.success('Estado actualizado', {
        description: estado === 'ACTIVO' ? 'Barbero activo' : 'Barbero inactivo',
      })
    },
    onError: () => toast.error('No se pudo cambiar el estado'),
  })

  const guardar = () => {
    if (!editNombre.trim()) {
      setErrorNombre('El nombre es obligatorio')
      return
    }
    setErrorNombre('')
    mutActualizar.mutate()
  }

  const cancelar = () => {
    setEditNombre(barbero.nombre)
    setEditTelefono(telefonoMostrado)
    setErrorNombre('')
    setEditando(false)
  }

  const iniciarEdicion = () => {
    setEditNombre(barbero.nombre)
    setEditTelefono(telefonoMostrado)
    setEditando(true)
  }

  const accionesMenu = [
    {
      id: 'editar',
      etiqueta: 'Editar datos',
      icono: <Pencil size={14} />,
    },
    ...(estadoLocal === 'ACTIVO'
      ? [
          {
            id: 'inactivar',
            etiqueta: 'Marcar como inactivo',
            icono: <PowerOff size={14} />,
            variante: 'advertencia' as const,
            separador: true,
          },
        ]
      : [
          {
            id: 'activar',
            etiqueta: 'Marcar como activo',
            icono: <Power size={14} />,
            separador: true,
          },
        ]),
  ]

  const manejarAccionMenu = (id: string) => {
    if (id === 'editar') iniciarEdicion()
    if (id === 'inactivar') setConfirmarInactivar(true)
    if (id === 'activar') mutEstado.mutate('ACTIVO')
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
        <Avatar nombre={barbero.nombre} monograma colorAuto tamano="lg" />

        <div className="barbero-perfil-info">
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
                  onChange={(e) => {
                    setEditNombre(e.target.value)
                    setErrorNombre('')
                  }}
                  placeholder="Nombre completo"
                  autoFocus
                />
                <SelectorTelefono valor={editTelefono} alCambiar={setEditTelefono} />
                <div className="barbero-perfil-edicion-acciones">
                  <Boton
                    variante="primario"
                    icono={<Save size={13} />}
                    cargando={mutActualizar.isPending}
                    onClick={guardar}
                    tamano="sm"
                  >
                    Guardar
                  </Boton>
                  <Boton
                    variante="fantasma"
                    icono={<X size={13} />}
                    onClick={cancelar}
                    tamano="sm"
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
                {/* Nombre + kebab */}
                <div className="barbero-perfil-info-top">
                  <h2 className="barbero-perfil-nombre">{barbero.nombre}</h2>
                  <MenuAcciones
                    acciones={accionesMenu}
                    onAccion={manejarAccionMenu}
                    titulo="Acciones del barbero"
                    deshabilitado={mutEstado.isPending}
                  />
                </div>

                {/* Insignia de estado */}
                <div style={{ marginTop: 'var(--espacio-xs)' }}>
                  <Insignia variante={insigniaPorEstado(estadoLocal)}>
                    {estadoLocal === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                  </Insignia>
                </div>

                {/* Teléfono */}
                {telefonoMostrado ? (
                  <div className="barbero-perfil-tel">
                    <Phone size={12} aria-hidden />
                    <span>{telefonoMostrado}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="barbero-perfil-agregar-tel"
                    onClick={iniciarEdicion}
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

      {/* ── Secciones ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--espacio-xl)',
          marginTop: 'var(--espacio-xl)',
        }}
      >
        <SeccionServicios barbero={barbero} />

        <div className="barbero-panel-bloque">
          <div className="barbero-panel-bloque-titulo">
            <CalendarDays size={13} style={{ color: 'var(--color-primario)' }} aria-hidden />
            <span>Horario semanal</span>
          </div>
          <GrillaDiasSemana barberoId={barbero.id} />
        </div>
      </div>

      {/* Diálogo de confirmación para inactivar (rendered inside motion.div; modal es position:fixed) */}
      <DialogoConfirmacion
        abierto={confirmarInactivar}
        titulo="¿Marcar como inactivo?"
        descripcion={`${barbero.nombre} quedará inactivo y no recibirá reservas nuevas.`}
        variante="advertencia"
        textoConfirmar="Marcar inactivo"
        cargando={mutEstado.isPending}
        alConfirmar={() => {
          mutEstado.mutate('INACTIVO')
          setConfirmarInactivar(false)
        }}
        alCancelar={() => setConfirmarInactivar(false)}
      />
    </motion.div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────

export function PaginaGestionBarberos() {
  const { barberos, cargando, error } = usarBarberos()
  const clienteConsulta = useQueryClient()
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false)
  const [barberoEditando, setBarberoEditando] = useState<Barbero | null>(null)
  const [confirmarDesactivar, setConfirmarDesactivar] = useState<Barbero | null>(null)

  const mutEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'ACTIVO' | 'INACTIVO' }) => cambiarEstadoBarbero(id, estado),
    onSuccess: (_, { estado }) => {
      clienteConsulta.invalidateQueries({ queryKey: ['barberos'] })
      toast.success(estado === 'ACTIVO' ? 'Barbero activado' : 'Barbero desactivado')
      setConfirmarDesactivar(null)
    },
    onError: () => toast.error('No se pudo cambiar el estado'),
  })

  const activos = barberos.filter((b) => b.estado === 'ACTIVO').length

  const ctaNuevo = (
    <Boton variante="primario" icono={<UserPlus size={14} />} onClick={() => setModalNuevoAbierto(true)}>
      Nuevo barbero
    </Boton>
  )

  const columnas: ColumnaTabla<Barbero>[] = [
    {
      clave: 'nombre',
      etiqueta: 'Barbero',
      render: (b) => <CeldaCliente nombre={b.nombre} telefono={b.telefono || b.especialidad} />,
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (b) => (
        <Insignia variante={insigniaPorEstado(b.estado as string)}>
          {b.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
        </Insignia>
      ),
    },
  ]

  const acciones = (b: Barbero) => (
    <div className="reserva-acciones-fila">
      <button
        className="reserva-accion-btn reserva-accion-btn--editar"
        onClick={() => setBarberoEditando(b)}
        data-tooltip="Editar barbero"
        type="button"
        aria-label={`Editar ${b.nombre}`}
      >
        <Pencil size={13} />
      </button>
      {b.estado === 'ACTIVO' ? (
        <button
          className="reserva-accion-btn reserva-accion-btn--no-asistio"
          onClick={() => setConfirmarDesactivar(b)}
          data-tooltip="Desactivar"
          type="button"
          aria-label={`Desactivar ${b.nombre}`}
        >
          <PowerOff size={13} />
        </button>
      ) : (
        <button
          className="reserva-accion-btn reserva-accion-btn--confirmar"
          onClick={() => mutEstado.mutate({ id: b.id, estado: 'ACTIVO' })}
          data-tooltip="Activar"
          type="button"
          aria-label={`Activar ${b.nombre}`}
        >
          <Power size={13} />
        </button>
      )}
    </div>
  )

  return (
    <motion.div
      className="pagina-contenido"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
    >
      <EncabezadoPagina
        titulo="Barberos"
        descripcion="Gestiona el equipo, sus servicios y disponibilidad"
        indicador={!cargando ? `${activos} ${activos === 1 ? 'activo' : 'activos'}` : undefined}
        acciones={ctaNuevo}
      />

      {!cargando && error && (
        <BannerAlerta variante="error" titulo="Error al cargar el equipo" mensaje={error} />
      )}

      <SeccionTarjeta sinPaddingCuerpo>
        <TablaDatos<Barbero>
          columnas={columnas}
          filas={barberos}
          obtenerClave={(b) => b.id}
          cargando={cargando}
          filasCargando={4}
          tarjetaMovil
          vacioIcono={<Scissors size={24} />}
          vacioTitulo="Sin barberos"
          vacioMensaje="Registra el primer integrante del equipo."
          vacioAccion={ctaNuevo}
          onClickFila={(b) => setBarberoEditando(b)}
          acciones={acciones}
        />
      </SeccionTarjeta>

      {/* Modal: nuevo barbero → al crear, abre su gestión (servicios + horario) */}
      <ModalBarbero
        abierto={modalNuevoAbierto}
        alCerrar={() => setModalNuevoAbierto(false)}
        onCreado={(b) => setBarberoEditando(b)}
      />

      {/* Modal: editar barbero (datos + servicios + horario) */}
      <Modal
        abierto={barberoEditando !== null}
        alCerrar={() => setBarberoEditando(null)}
        titulo="Editar barbero"
        descripcion="Datos, servicios y horario del barbero."
        ancho="lg"
      >
        {barberoEditando && (
          <PerfilBarbero
            key={barberoEditando.id}
            barbero={barberoEditando}
            onActualizado={(nombre, telefono) =>
              setBarberoEditando((prev) => (prev ? { ...prev, nombre, telefono } : prev))
            }
          />
        )}
      </Modal>

      {/* Confirmar desactivar */}
      <DialogoConfirmacion
        abierto={confirmarDesactivar !== null}
        titulo={`¿Desactivar a ${confirmarDesactivar?.nombre ?? ''}?`}
        descripcion="Quedará inactivo y no recibirá reservas nuevas. Puedes reactivarlo cuando quieras."
        variante="advertencia"
        textoConfirmar="Sí, desactivar"
        cargando={mutEstado.isPending}
        alConfirmar={() => confirmarDesactivar && mutEstado.mutate({ id: confirmarDesactivar.id, estado: 'INACTIVO' })}
        alCancelar={() => setConfirmarDesactivar(null)}
      />
    </motion.div>
  )
}
