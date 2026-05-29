import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Clock, Plus, X, User } from 'lucide-react'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia'
import { usarListaEspera, usarIngresarListaEspera } from '../ganchos/usarListaEspera'
import type { EntradaListaEspera, EstadoListaEspera } from '../contratos/tipos'

// ── Helpers ───────────────────────────────────────────────────────────────────

function varianteEstado(estado: EstadoListaEspera): 'advertencia' | 'info' | 'exito' | 'error' {
  if (estado === 'ESPERANDO') return 'advertencia'
  if (estado === 'NOTIFICADO') return 'info'
  if (estado === 'ATENDIDO') return 'exito'
  return 'error'
}

function etiquetaEstado(estado: EstadoListaEspera): string {
  const mapa: Record<EstadoListaEspera, string> = {
    ESPERANDO: 'Esperando',
    NOTIFICADO: 'Notificado',
    ATENDIDO: 'Atendido',
    CANCELADO: 'Cancelado',
  }
  return mapa[estado] ?? estado
}

function formatearFecha(fechaHora: string): string {
  if (!fechaHora) return '—'
  try {
    return new Date(fechaHora).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return fechaHora
  }
}

// ── Estado inicial del formulario ─────────────────────────────────────────────

const FORM_VACIO = {
  cliente_id: '',
  sucursal_id: '',
  servicio_id: '',
  barbero_id: '',
  fecha_hora_deseada: '',
}

// ── Página ────────────────────────────────────────────────────────────────────

export function PaginaListaEspera() {
  const { listaEspera, cargando } = usarListaEspera()
  const mutacionIngresar = usarIngresarListaEspera()

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const manejarCambio = (campo: keyof typeof FORM_VACIO, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: '' }))
  }

  const manejarEnviar = (e: React.FormEvent) => {
    e.preventDefault()
    const nuevos: Record<string, string> = {}
    if (!form.cliente_id.trim()) nuevos.cliente_id = 'El ID de cliente es obligatorio'
    if (!form.sucursal_id.trim()) nuevos.sucursal_id = 'La sucursal es obligatoria'
    if (!form.servicio_id.trim()) nuevos.servicio_id = 'El servicio es obligatorio'
    if (!form.fecha_hora_deseada) nuevos.fecha_hora_deseada = 'La fecha deseada es obligatoria'
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return }

    mutacionIngresar.mutate(
      {
        cliente_id: form.cliente_id.trim(),
        sucursal_id: form.sucursal_id.trim(),
        servicio_id: form.servicio_id.trim(),
        barbero_id: form.barbero_id.trim() || undefined,
        fecha_hora_deseada: form.fecha_hora_deseada,
      },
      {
        onSuccess: () => {
          toast.success('Cliente ingresado a la lista de espera')
          setForm(FORM_VACIO)
          setMostrarFormulario(false)
          setErrores({})
        },
        onError: (err) => toast.error(mensajeDeError(err)),
      },
    )
  }

  const columnas = [
    {
      clave: 'cliente_id',
      etiqueta: 'Cliente',
      render: (e: EntradaListaEspera) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <User size={13} style={{ color: 'var(--color-texto-suave)' }} />
          <span style={{ fontFamily: 'monospace', fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)' }}>
            {e.cliente_id.slice(0, 8)}…
          </span>
        </span>
      ),
    },
    {
      clave: 'servicio_id',
      etiqueta: 'Servicio',
      render: (e: EntradaListaEspera) => (
        <span style={{ fontFamily: 'monospace', fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)' }}>
          {e.servicio_id.slice(0, 8)}…
        </span>
      ),
    },
    {
      clave: 'fecha_hora_deseada',
      etiqueta: 'Fecha deseada',
      render: (e: EntradaListaEspera) => (
        <span style={{ fontWeight: 500 }}>{formatearFecha(e.fecha_hora_deseada)}</span>
      ),
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (e: EntradaListaEspera) => (
        <Insignia variante={varianteEstado(e.estado)}>
          {etiquetaEstado(e.estado)}
        </Insignia>
      ),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ padding: 'var(--espacio-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-lg)' }}
    >
      <EncabezadoPagina
        titulo="Lista de espera"
        descripcion="Clientes en espera cuando no hay disponibilidad inmediata"
        acciones={
          <Boton
            variante="primario"
            icono={<Plus size={14} />}
            onClick={() => setMostrarFormulario((v) => !v)}
          >
            {mostrarFormulario ? 'Cancelar' : 'Agregar a lista'}
          </Boton>
        }
      />

      {/* Formulario */}
      {mostrarFormulario && (
        <SeccionTarjeta
          titulo="Ingresar cliente a lista de espera"
          icono={<Clock size={14} />}
          maxAncho={540}
        >
          <form onSubmit={manejarEnviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>

            <div className="campo-grupo">
              <label className="campo-etiqueta">ID Cliente <span className="campo-requerido">*</span></label>
              <input
                className={`campo-entrada${errores.cliente_id ? ' campo-entrada--error' : ''}`}
                value={form.cliente_id}
                onChange={(e) => manejarCambio('cliente_id', e.target.value)}
                placeholder="UUID del cliente"
              />
              {errores.cliente_id && <span className="campo-error-inline">{errores.cliente_id}</span>}
            </div>

            <div className="campo-grupo">
              <label className="campo-etiqueta">ID Sucursal <span className="campo-requerido">*</span></label>
              <input
                className={`campo-entrada${errores.sucursal_id ? ' campo-entrada--error' : ''}`}
                value={form.sucursal_id}
                onChange={(e) => manejarCambio('sucursal_id', e.target.value)}
                placeholder="UUID de la sucursal"
              />
              {errores.sucursal_id && <span className="campo-error-inline">{errores.sucursal_id}</span>}
            </div>

            <div className="campo-grupo">
              <label className="campo-etiqueta">ID Servicio <span className="campo-requerido">*</span></label>
              <input
                className={`campo-entrada${errores.servicio_id ? ' campo-entrada--error' : ''}`}
                value={form.servicio_id}
                onChange={(e) => manejarCambio('servicio_id', e.target.value)}
                placeholder="UUID del servicio"
              />
              {errores.servicio_id && <span className="campo-error-inline">{errores.servicio_id}</span>}
            </div>

            <div className="campo-grupo">
              <label className="campo-etiqueta">ID Barbero (opcional)</label>
              <input
                className="campo-entrada"
                value={form.barbero_id}
                onChange={(e) => manejarCambio('barbero_id', e.target.value)}
                placeholder="UUID del barbero (dejar vacío para cualquiera)"
              />
            </div>

            <div className="campo-grupo">
              <label className="campo-etiqueta">Fecha y hora deseada <span className="campo-requerido">*</span></label>
              <input
                type="datetime-local"
                className={`campo-entrada${errores.fecha_hora_deseada ? ' campo-entrada--error' : ''}`}
                value={form.fecha_hora_deseada}
                onChange={(e) => manejarCambio('fecha_hora_deseada', e.target.value)}
              />
              {errores.fecha_hora_deseada && <span className="campo-error-inline">{errores.fecha_hora_deseada}</span>}
            </div>

            <div style={{ display: 'flex', gap: 'var(--espacio-sm)' }}>
              <Boton
                type="submit"
                variante="primario"
                cargando={mutacionIngresar.isPending}
                icono={<Clock size={14} />}
              >
                Agregar a lista
              </Boton>
              <Boton
                type="button"
                variante="fantasma"
                icono={<X size={14} />}
                onClick={() => { setMostrarFormulario(false); setForm(FORM_VACIO); setErrores({}) }}
              >
                Cancelar
              </Boton>
            </div>
          </form>
        </SeccionTarjeta>
      )}

      {/* Tabla */}
      <SeccionTarjeta titulo="Clientes en espera" sinPaddingCuerpo>
        <TablaDatos<EntradaListaEspera>
          columnas={columnas}
          filas={listaEspera}
          obtenerClave={(e) => e.id}
          cargando={cargando}
          vacioIcono={<Clock size={28} />}
          vacioTitulo="Lista de espera vacía"
          vacioMensaje="No hay clientes en lista de espera en este momento."
        />
      </SeccionTarjeta>
    </motion.div>
  )
}
