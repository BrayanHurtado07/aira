import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Scissors, Plus, Pencil, Power, PowerOff, Clock, DollarSign, Save,
} from 'lucide-react'

import {
  obtenerServicios,
  crearServicio,
  actualizarServicio,
  cambiarEstadoServicio,
} from '@/capacidades/agenda/servicios/servicio-agenda'

import { EncabezadoPagina }    from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta }      from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos }          from '@/compartido/interfaz/primitivas/TablaDatos'
import type { ColumnaTabla }   from '@/compartido/interfaz/primitivas/TablaDatos'
import { MenuAcciones }        from '@/compartido/interfaz/primitivas/MenuAcciones'
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion'
import { Boton }               from '@/compartido/interfaz/primitivas/Boton'
import { Campo }               from '@/compartido/interfaz/primitivas/Campo'
import { CampoMoneda }         from '@/compartido/interfaz/primitivas/CampoMoneda'
import { SelectorDuracion }    from '@/compartido/interfaz/primitivas/SelectorDuracion'
import { BannerAlerta }        from '@/compartido/interfaz/primitivas/BannerAlerta'
import { Modal }               from '@/compartido/interfaz/primitivas/Modal'
import { Insignia }            from '@/compartido/interfaz/retroalimentacion/Insignia'

import type {
  Servicio,
  SolicitudCrearServicio,
  SolicitudActualizarServicio,
} from '@/capacidades/agenda/contratos/tipos'

// ── Estado inicial del formulario ─────────────────────────────────────────────

const FORM_VACIO = { nombre: '', duracion_minutos: '30', precio: '' }

// ── ModalEditarServicio ───────────────────────────────────────────────────────

interface PropsModalEditar {
  servicio: Servicio | null
  alCerrar: () => void
}

function ModalEditarServicio({ servicio, alCerrar }: PropsModalEditar) {
  const clienteConsulta = useQueryClient()
  const [form, setForm] = useState({
    nombre:           servicio?.nombre ?? '',
    duracion_minutos: String(servicio?.duracion_minutos ?? 30),
    precio:           String(servicio?.precio ?? ''),
  })
  const [errores, setErrores] = useState<Record<string, string>>({})

  React.useEffect(() => {
    if (!servicio) return
    setForm({
      nombre:           servicio.nombre,
      duracion_minutos: String(servicio.duracion_minutos),
      precio:           String(servicio.precio),
    })
    setErrores({})
  }, [servicio?.id])

  const mutacion = useMutation({
    mutationFn: (solicitud: SolicitudActualizarServicio) =>
      actualizarServicio(servicio!.id, solicitud),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['servicios'] })
      toast.success('Servicio actualizado')
      alCerrar()
    },
    onError: () => toast.error('No se pudo actualizar el servicio'),
  })

  const cambiar = (campo: keyof typeof form) => (valor: string) => {
    setForm((p) => ({ ...p, [campo]: valor }))
    setErrores((p) => ({ ...p, [campo]: '' }))
  }

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault()
    const duracion = parseInt(form.duracion_minutos) || 0
    const precio   = parseFloat(form.precio) || 0
    const nuevos: Record<string, string> = {}
    if (!form.nombre.trim())  nuevos.nombre           = 'Ingresa el nombre del servicio'
    if (duracion <= 0)        nuevos.duracion_minutos = 'La duración debe ser mayor a 0 min'
    if (precio < 0)           nuevos.precio           = 'El precio no puede ser negativo'
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return }

    mutacion.mutate({
      nombre:           form.nombre.trim(),
      duracion_minutos: duracion,
      precio,
    })
  }

  return (
    <Modal
      abierto={servicio !== null}
      alCerrar={alCerrar}
      titulo="Editar servicio"
      descripcion="Actualiza el nombre, duración y precio del servicio."
      ancho="sm"
    >
      <form
        onSubmit={manejarEnvio}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}
      >
        <Campo
          etiqueta="Nombre del servicio"
          requerido
          error={errores.nombre}
          value={form.nombre}
          onChange={(e) => cambiar('nombre')(e.target.value)}
          placeholder="Ej: Corte clásico"
          className="campo-input"
          autoFocus
        />

        {/* Duración */}
        <div className="campo-grupo">
          <label className="campo-etiqueta">
            Duración <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <SelectorDuracion
            valor={form.duracion_minutos}
            alCambiar={cambiar('duracion_minutos')}
            error={!!errores.duracion_minutos}
          />
          {errores.duracion_minutos && (
            <span className="campo-error-inline">{errores.duracion_minutos}</span>
          )}
        </div>

        {/* Precio */}
        <div className="campo-grupo">
          <label className="campo-etiqueta">Precio</label>
          <CampoMoneda
            valor={form.precio}
            alCambiar={cambiar('precio')}
            simbolo="S/"
            error={!!errores.precio}
          />
          {errores.precio && (
            <span className="campo-error-inline">{errores.precio}</span>
          )}
        </div>

        {mutacion.isError && (
          <BannerAlerta
            variante="error"
            mensaje="No se pudo actualizar el servicio. Inténtalo de nuevo."
          />
        )}

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

// ── PaginaGestionServicios ────────────────────────────────────────────────────

export function PaginaGestionServicios() {
  const clienteConsulta = useQueryClient()

  const [formulario, setFormulario] = useState(FORM_VACIO)
  const [errores, setErrores]       = useState<Record<string, string>>({})
  const [servicioEditando, setServicioEditando]   = useState<Servicio | null>(null)
  const [servicioToggle, setServicioToggle]       = useState<Servicio | null>(null)
  const [toggleando, setToggleando]               = useState(false)

  const { data: servicios = [], isLoading } = useQuery({
    queryKey: ['servicios'],
    queryFn: () => obtenerServicios(),
  })

  // ── Crear ──────────────────────────────────────────────────────────────────

  const mutCrear = useMutation({
    mutationFn: crearServicio,
    onSuccess: (servicio) => {
      clienteConsulta.invalidateQueries({ queryKey: ['servicios'] })
      setFormulario(FORM_VACIO)
      toast.success('Servicio creado', { description: servicio.nombre })
    },
    onError: () => toast.error('No se pudo crear el servicio'),
  })

  // ── Cambiar estado ─────────────────────────────────────────────────────────

  const mutEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'ACTIVO' | 'INACTIVO' }) =>
      cambiarEstadoServicio(id, estado),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['servicios'] })
      const nuevoEstado = servicioToggle?.estado === 'ACTIVO' ? 'desactivado' : 'activado'
      toast.success(`Servicio ${nuevoEstado}`)
      setServicioToggle(null)
    },
    onError: () => toast.error('No se pudo cambiar el estado'),
  })

  const ejecutarToggle = async () => {
    if (!servicioToggle) return
    setToggleando(true)
    try {
      const nuevoEstado = servicioToggle.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
      await mutEstado.mutateAsync({ id: servicioToggle.id, estado: nuevoEstado })
    } finally {
      setToggleando(false)
    }
  }

  // ── Formulario de creación ─────────────────────────────────────────────────

  const cambiar = (campo: keyof typeof FORM_VACIO) => (valor: string) => {
    setFormulario((p) => ({ ...p, [campo]: valor }))
    setErrores((p) => ({ ...p, [campo]: '' }))
  }

  const manejarCrear = (e: React.FormEvent) => {
    e.preventDefault()
    const duracion = parseInt(formulario.duracion_minutos) || 0
    const precio   = parseFloat(formulario.precio) || 0

    const nuevos: Record<string, string> = {}
    if (!formulario.nombre.trim()) nuevos.nombre           = 'Ingresa el nombre del servicio'
    if (duracion <= 0)             nuevos.duracion_minutos = 'La duración debe ser mayor a 0 min'
    if (precio < 0)                nuevos.precio           = 'El precio no puede ser negativo'
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return }

    const solicitud: SolicitudCrearServicio = {
      nombre: formulario.nombre.trim(),
      duracion_minutos: duracion,
      precio,
    }
    mutCrear.mutate(solicitud)
  }

  // ── Columnas ───────────────────────────────────────────────────────────────

  const columnas: ColumnaTabla<Servicio>[] = [
    {
      clave:    'nombre',
      etiqueta: 'Servicio',
      render: (s) => (
        <div className="tabla-datos-celda-identidad">
          <div className="tabla-datos-avatar tabla-datos-avatar--icono">
            <Scissors size={13} />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{s.nombre}</div>
          </div>
        </div>
      ),
    },
    {
      clave:    'duracion_minutos',
      etiqueta: 'Duración',
      render: (s) => (
        <span className="servicio-duracion-badge">
          <Clock size={12} />
          {s.duracion_minutos >= 60
            ? `${Math.floor(s.duracion_minutos / 60)} hr${s.duracion_minutos % 60 > 0 ? ` ${s.duracion_minutos % 60} min` : ''}`
            : `${s.duracion_minutos} min`}
        </span>
      ),
    },
    {
      clave:    'precio',
      etiqueta: 'Precio',
      render: (s) => (
        <span className="servicio-precio">
          <DollarSign size={12} />
          S/ {s.precio.toFixed(2)}
        </span>
      ),
    },
    {
      clave:    'estado',
      etiqueta: 'Estado',
      render: (s) => (
        <Insignia variante={s.estado === 'ACTIVO' ? 'exito' : 'neutral'}>
          {s.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
        </Insignia>
      ),
    },
  ]

  // ── Contadores ─────────────────────────────────────────────────────────────

  const totalActivos = servicios.filter((s) => s.estado === 'ACTIVO').length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="pagina-contenido"
    >
      {/* Encabezado */}
      <EncabezadoPagina
        titulo="Servicios"
        descripcion="Administra los servicios ofrecidos por la barbería"
        indicador={`${totalActivos} activos`}
      />

      {/* Formulario de creación */}
      <SeccionTarjeta
        titulo="Nuevo servicio"
        icono={<Plus size={14} />}
        maxAncho={520}
      >
        <form
          onSubmit={manejarCrear}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}
        >
          {/* Nombre */}
          <Campo
            etiqueta="Nombre del servicio"
            requerido
            error={errores.nombre}
            value={formulario.nombre}
            onChange={(e) => cambiar('nombre')(e.target.value)}
            placeholder="Ej: Corte clásico, Barba completa, Degradado..."
            className="campo-input"
          />

          {/* Duración */}
          <div className="campo-grupo">
            <label className="campo-etiqueta">
              Duración <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <SelectorDuracion
              valor={formulario.duracion_minutos}
              alCambiar={cambiar('duracion_minutos')}
              error={!!errores.duracion_minutos}
            />
            {errores.duracion_minutos && (
              <span className="campo-error-inline">{errores.duracion_minutos}</span>
            )}
          </div>

          {/* Precio */}
          <div className="campo-grupo" style={{ maxWidth: '200px' }}>
            <label className="campo-etiqueta">Precio</label>
            <CampoMoneda
              valor={formulario.precio}
              alCambiar={cambiar('precio')}
              simbolo="S/"
              error={!!errores.precio}
              placeholder="0.00"
            />
            {errores.precio && (
              <span className="campo-error-inline">{errores.precio}</span>
            )}
          </div>

          <div>
            <Boton
              type="submit"
              variante="primario"
              icono={<Scissors size={14} />}
              cargando={mutCrear.isPending}
            >
              Crear servicio
            </Boton>
          </div>
        </form>
      </SeccionTarjeta>

      {/* Tabla */}
      <SeccionTarjeta
        titulo="Servicios registrados"
        descripcion="Gestiona, edita y activa/desactiva cada servicio"
        icono={<Scissors size={14} />}
        sinPaddingCuerpo
      >
        <TablaDatos<Servicio>
          columnas={columnas}
          filas={servicios}
          obtenerClave={(s) => s.id}
          cargando={isLoading}
          filasCargando={4}
          vacioIcono={<Scissors size={24} />}
          vacioTitulo="Sin servicios"
          vacioMensaje="Crea el primer servicio de la barbería usando el formulario de arriba."
          acciones={(servicio) => (
            <MenuAcciones
              acciones={[
                {
                  id:       'editar',
                  etiqueta: 'Editar',
                  icono:    <Pencil size={14} />,
                },
                {
                  id:           'activar',
                  etiqueta:     'Activar',
                  icono:        <Power size={14} />,
                  separador:    true,
                  deshabilitada: servicio.estado === 'ACTIVO',
                },
                {
                  id:           'desactivar',
                  etiqueta:     'Desactivar',
                  icono:        <PowerOff size={14} />,
                  variante:     'advertencia',
                  deshabilitada: servicio.estado === 'INACTIVO',
                },
              ]}
              onAccion={(id) => {
                if (id === 'editar')     { setServicioEditando(servicio); return }
                if (id === 'activar' || id === 'desactivar') {
                  setServicioToggle(servicio)
                }
              }}
            />
          )}
        />
      </SeccionTarjeta>

      {/* Modal editar */}
      <ModalEditarServicio
        servicio={servicioEditando}
        alCerrar={() => setServicioEditando(null)}
      />

      {/* Confirmación de toggle estado */}
      <DialogoConfirmacion
        abierto={servicioToggle !== null}
        titulo={
          servicioToggle?.estado === 'ACTIVO'
            ? `¿Desactivar "${servicioToggle?.nombre}"?`
            : `¿Activar "${servicioToggle?.nombre}"?`
        }
        descripcion={
          servicioToggle?.estado === 'ACTIVO'
            ? 'El servicio dejará de estar disponible para nuevas reservas.'
            : 'El servicio volverá a estar disponible para reservas.'
        }
        textoConfirmar={servicioToggle?.estado === 'ACTIVO' ? 'Sí, desactivar' : 'Sí, activar'}
        variante={servicioToggle?.estado === 'ACTIVO' ? 'advertencia' : 'normal'}
        cargando={toggleando}
        alConfirmar={ejecutarToggle}
        alCancelar={() => setServicioToggle(null)}
      />
    </motion.div>
  )
}
