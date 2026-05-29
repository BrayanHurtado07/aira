import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { FileText, Plus, X, MessageCircle, Mail } from 'lucide-react'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia'
import { usarPlantillas, usarCrearPlantilla } from '../ganchos/usarPlantillas'
import type { PlantillaMensaje, CanalPlantilla } from '../contratos/tipos'

// ── Helpers ───────────────────────────────────────────────────────────────────

function iconoCanal(canal: CanalPlantilla) {
  if (canal === 'WHATSAPP') return <MessageCircle size={13} style={{ color: '#22c55e' }} />
  return <Mail size={13} style={{ color: 'var(--color-primario)' }} />
}

function etiquetaCanal(canal: CanalPlantilla): string {
  if (canal === 'WHATSAPP') return 'WhatsApp'
  return 'Email'
}

// ── Estado inicial del formulario ─────────────────────────────────────────────

const FORM_VACIO = {
  nombre: '',
  canal: 'WHATSAPP' as CanalPlantilla,
  contenido_plantilla: '',
}

// ── Página ────────────────────────────────────────────────────────────────────

export function PaginaPlantillas() {
  const { plantillas, cargando } = usarPlantillas()
  const mutacionCrear = usarCrearPlantilla()

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const manejarCambio = (
    campo: keyof typeof FORM_VACIO,
    valor: string,
  ) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: '' }))
  }

  const manejarEnviar = (e: React.FormEvent) => {
    e.preventDefault()
    const nuevos: Record<string, string> = {}
    if (!form.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio'
    if (!form.contenido_plantilla.trim()) nuevos.contenido_plantilla = 'El contenido es obligatorio'
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return }

    mutacionCrear.mutate(
      {
        nombre: form.nombre.trim(),
        canal: form.canal,
        contenido_plantilla: form.contenido_plantilla.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Plantilla creada', { description: form.nombre })
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
      clave: 'nombre',
      etiqueta: 'Nombre',
      render: (p: PlantillaMensaje) => (
        <span style={{ fontWeight: 500, color: 'var(--color-texto)' }}>{p.nombre}</span>
      ),
    },
    {
      clave: 'canal',
      etiqueta: 'Canal',
      render: (p: PlantillaMensaje) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          {iconoCanal(p.canal)}
          <span style={{ fontSize: 'var(--tamano-sm)' }}>{etiquetaCanal(p.canal)}</span>
        </div>
      ),
    },
    {
      clave: 'contenido_plantilla',
      etiqueta: 'Contenido',
      render: (p: PlantillaMensaje) => (
        <span
          style={{
            fontSize: 'var(--tamano-sm)',
            color: 'var(--color-texto-suave)',
            maxWidth: '320px',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {p.contenido_plantilla}
        </span>
      ),
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (p: PlantillaMensaje) => (
        <Insignia variante={p.estado === 'ACTIVO' ? 'exito' : 'neutral'}>
          {p.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
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
        titulo="Plantillas de mensajes"
        descripcion="Gestiona las plantillas para WhatsApp y Email"
        acciones={
          <Boton
            variante="primario"
            icono={<Plus size={14} />}
            onClick={() => setMostrarFormulario((v) => !v)}
          >
            {mostrarFormulario ? 'Cancelar' : 'Nueva plantilla'}
          </Boton>
        }
      />

      {/* Formulario nueva plantilla */}
      {mostrarFormulario && (
        <SeccionTarjeta
          titulo="Nueva plantilla"
          descripcion="Define el mensaje que se enviará por el canal seleccionado"
          icono={<FileText size={14} />}
          maxAncho={540}
        >
          <form onSubmit={manejarEnviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>

            {/* Nombre */}
            <div className="campo-grupo">
              <label className="campo-etiqueta">
                Nombre <span className="campo-requerido">*</span>
              </label>
              <input
                className={`campo-entrada${errores.nombre ? ' campo-entrada--error' : ''}`}
                value={form.nombre}
                onChange={(e) => manejarCambio('nombre', e.target.value)}
                placeholder="Ej: Confirmación de reserva"
              />
              {errores.nombre && <span className="campo-error-inline">{errores.nombre}</span>}
            </div>

            {/* Canal */}
            <div className="campo-grupo">
              <label className="campo-etiqueta">Canal</label>
              <select
                className="campo-entrada"
                value={form.canal}
                onChange={(e) => manejarCambio('canal', e.target.value)}
              >
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>

            {/* Contenido */}
            <div className="campo-grupo">
              <label className="campo-etiqueta">
                Contenido <span className="campo-requerido">*</span>
              </label>
              <textarea
                className={`campo-entrada${errores.contenido_plantilla ? ' campo-entrada--error' : ''}`}
                value={form.contenido_plantilla}
                onChange={(e) => manejarCambio('contenido_plantilla', e.target.value)}
                placeholder="Hola {nombre}, tu reserva está confirmada para el {fecha}..."
                rows={4}
                style={{ resize: 'vertical' }}
              />
              {errores.contenido_plantilla && (
                <span className="campo-error-inline">{errores.contenido_plantilla}</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--espacio-sm)' }}>
              <Boton
                type="submit"
                variante="primario"
                cargando={mutacionCrear.isPending}
                icono={<FileText size={14} />}
              >
                Crear plantilla
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

      {/* Tabla de plantillas */}
      <SeccionTarjeta titulo="Plantillas registradas" sinPaddingCuerpo>
        <TablaDatos<PlantillaMensaje>
          columnas={columnas}
          filas={plantillas}
          obtenerClave={(p) => p.id}
          cargando={cargando}
          vacioIcono={<FileText size={28} />}
          vacioTitulo="Sin plantillas aún"
          vacioMensaje="Crea la primera plantilla usando el botón de arriba."
        />
      </SeccionTarjeta>
    </motion.div>
  )
}
