import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { FileText, Plus, MessageCircle, Mail, Copy, Check } from 'lucide-react'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { Selector } from '@/compartido/interfaz/primitivas/Selector'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import { MenuAcciones } from '@/compartido/interfaz/primitivas/MenuAcciones'
import { Modal } from '@/compartido/interfaz/primitivas/Modal'
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia'
import { usarPlantillas, usarCrearPlantilla } from '../ganchos/usarPlantillas'
import type { PlantillaMensaje, CanalPlantilla } from '../contratos/tipos'

// ── Helpers ───────────────────────────────────────────────────────────────────

function iconoCanal(canal: CanalPlantilla) {
  if (canal === 'WHATSAPP') return <MessageCircle size={13} style={{ color: '#22c55e' }} />
  return <Mail size={13} style={{ color: 'var(--color-primario)' }} />
}

function etiquetaCanal(canal: CanalPlantilla): string {
  return canal === 'WHATSAPP' ? 'WhatsApp' : 'Email'
}

const OPCIONES_CANAL = [
  { valor: 'WHATSAPP', etiqueta: 'WhatsApp' },
  { valor: 'EMAIL',    etiqueta: 'Email' },
]

// ── Estado inicial del formulario ─────────────────────────────────────────────

const FORM_VACIO = {
  nombre: '',
  canal: 'WHATSAPP' as CanalPlantilla,
  contenido_plantilla: '',
}

// ── Modal de detalle / vista completa ─────────────────────────────────────────

function ModalVerPlantilla({
  plantilla,
  alCerrar,
}: {
  plantilla: PlantillaMensaje | null
  alCerrar: () => void
}) {
  const [copiado, setCopiado] = useState(false)

  const copiar = () => {
    if (!plantilla) return
    navigator.clipboard.writeText(plantilla.contenido_plantilla).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  return (
    <Modal
      abierto={!!plantilla}
      alCerrar={alCerrar}
      titulo={plantilla?.nombre ?? ''}
      descripcion={`Canal: ${plantilla ? etiquetaCanal(plantilla.canal) : ''}`}
      ancho="md"
      pie={
        <>
          <Boton variante="secundario" onClick={alCerrar}>
            Cerrar
          </Boton>
          <Boton
            variante="primario"
            icono={copiado ? <Check size={14} /> : <Copy size={14} />}
            onClick={copiar}
          >
            {copiado ? 'Copiado' : 'Copiar contenido'}
          </Boton>
        </>
      }
    >
      <div
        style={{
          backgroundColor: 'var(--color-superficie-2)',
          border: '1px solid var(--color-borde)',
          borderRadius: 'var(--radio-md)',
          padding: 'var(--espacio-md)',
          fontFamily: 'inherit',
          fontSize: 'var(--tamano-sm)',
          color: 'var(--color-texto)',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {plantilla?.contenido_plantilla}
      </div>
    </Modal>
  )
}

// ── Modal de nueva plantilla ──────────────────────────────────────────────────

function ModalNuevaPlantilla({
  abierto,
  alCerrar,
}: {
  abierto: boolean
  alCerrar: () => void
}) {
  const mutacionCrear = usarCrearPlantilla()
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const cambiar = (campo: keyof typeof FORM_VACIO, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: '' }))
  }

  const cerrar = () => {
    setForm(FORM_VACIO)
    setErrores({})
    alCerrar()
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
          cerrar()
        },
        onError: (err) => toast.error(mensajeDeError(err)),
      },
    )
  }

  return (
    <Modal
      abierto={abierto}
      alCerrar={cerrar}
      titulo="Nueva plantilla"
      descripcion="Define el mensaje que se enviará por el canal seleccionado"
      ancho="md"
      sinCerrarAlFondo={mutacionCrear.isPending}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={mutacionCrear.isPending}>
            Cancelar
          </Boton>
          <Boton
            variante="primario"
            icono={<FileText size={14} />}
            cargando={mutacionCrear.isPending}
            onClick={manejarEnviar as unknown as React.MouseEventHandler}
          >
            Crear plantilla
          </Boton>
        </>
      }
    >
      <form
        onSubmit={manejarEnviar}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}
      >
        <Campo
          etiqueta="Nombre"
          requerido
          error={errores.nombre}
          value={form.nombre}
          onChange={(e) => cambiar('nombre', e.target.value)}
          placeholder="Ej: Confirmación de reserva"
          autoFocus
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label
            style={{
              fontSize: 'var(--tamano-sm)',
              fontWeight: 500,
              color: 'var(--color-texto)',
              lineHeight: 1.4,
            }}
          >
            Canal
          </label>
          <Selector
            valor={form.canal}
            alCambiar={(v) => cambiar('canal', v)}
            opciones={OPCIONES_CANAL}
          />
        </div>

        <Campo
          etiqueta="Contenido"
          requerido
          error={errores.contenido_plantilla}
        >
          <textarea
            className={`campo-input${errores.contenido_plantilla ? ' campo-input--error' : ''}`}
            value={form.contenido_plantilla}
            onChange={(e) => cambiar('contenido_plantilla', e.target.value)}
            placeholder="Hola {nombre}, tu reserva está confirmada para el {fecha}..."
            rows={4}
            style={{ resize: 'vertical' }}
          />
        </Campo>

        {/* submit oculto para que Enter funcione */}
        <button type="submit" style={{ display: 'none' }} />
      </form>
    </Modal>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export function PaginaPlantillas() {
  const { plantillas, cargando } = usarPlantillas()

  const [modalCrear, setModalCrear] = useState(false)
  const [verPlantilla, setVerPlantilla] = useState<PlantillaMensaje | null>(null)

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
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <EncabezadoPagina
        titulo="Plantillas de mensajes"
        descripcion="Gestiona las plantillas para WhatsApp y Email"
        indicador={
          plantillas.length > 0 ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '99px',
                backgroundColor: 'rgba(5,150,105,0.08)',
                fontSize: 'var(--tamano-xs)',
                fontWeight: 600,
                color: 'var(--color-exito)',
              }}
            >
              <FileText size={12} />
              {plantillas.length} {plantillas.length === 1 ? 'plantilla' : 'plantillas'}
            </div>
          ) : undefined
        }
        acciones={
          <Boton
            variante="primario"
            icono={<Plus size={14} />}
            onClick={() => setModalCrear(true)}
          >
            Nueva plantilla
          </Boton>
        }
        style={{ padding: 'var(--espacio-lg)', borderBottom: '1px solid var(--color-borde)', backgroundColor: 'var(--color-superficie)' }}
      />

      <div style={{ padding: 'var(--espacio-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-lg)' }}>
        <SeccionTarjeta titulo="Plantillas registradas" sinPaddingCuerpo>
          <TablaDatos<PlantillaMensaje>
            columnas={columnas}
            filas={plantillas}
            obtenerClave={(p) => p.id}
            cargando={cargando}
            vacioIcono={<FileText size={28} />}
            vacioTitulo="Sin plantillas aún"
            vacioMensaje="Crea la primera plantilla usando el botón de arriba."
            acciones={(p) => (
              <MenuAcciones
                acciones={[
                  { id: 'ver', etiqueta: 'Ver contenido', icono: <FileText size={14} /> },
                  { id: 'copiar', etiqueta: 'Copiar contenido', icono: <Copy size={14} />, separador: true },
                ]}
                onAccion={(id) => {
                  if (id === 'ver') setVerPlantilla(p)
                  if (id === 'copiar') {
                    navigator.clipboard.writeText(p.contenido_plantilla).then(() =>
                      toast.success('Contenido copiado', { description: p.nombre }),
                    )
                  }
                }}
                titulo="Acciones de plantilla"
              />
            )}
          />
        </SeccionTarjeta>
      </div>

      <ModalNuevaPlantilla
        abierto={modalCrear}
        alCerrar={() => setModalCrear(false)}
      />

      <ModalVerPlantilla
        plantilla={verPlantilla}
        alCerrar={() => setVerPlantilla(null)}
      />
    </motion.div>
  )
}
