import React, { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Zap } from 'lucide-react'
import { Modal } from '@/compartido/interfaz/primitivas/Modal'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { Cargando } from '@/compartido/interfaz/retroalimentacion/Cargando'
import { Vacio } from '@/compartido/interfaz/retroalimentacion/Vacio'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import { usarAtajos } from '../ganchos/usarAtajos'

type Props = {
  abierto: boolean
  alCerrar: () => void
}

// Gestión de atajos: lista existentes, crea nuevos y da de baja.
export function ModalGestionAtajos({ abierto, alCerrar }: Props) {
  const { atajos, cargando, crear, creando, eliminar } = usarAtajos()
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [errores, setErrores] = useState<{ titulo?: string; contenido?: string }>({})

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const nuevos: typeof errores = {}
    if (!titulo.trim()) nuevos.titulo = 'Ponle un nombre corto'
    if (!contenido.trim()) nuevos.contenido = 'Escribe el mensaje del atajo'
    if (Object.keys(nuevos).length) { setErrores(nuevos); return }

    crear(
      { titulo: titulo.trim(), contenido: contenido.trim(), orden: atajos.length },
      {
        onSuccess: () => {
          toast.success('Atajo creado')
          setTitulo('')
          setContenido('')
          setErrores({})
        },
        onError: (err) => toast.error(mensajeDeError(err)),
      },
    )
  }

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Atajos de respuesta"
      descripcion="Respuestas rápidas que insertas con 1 toque en el chat."
      ancho="md"
    >
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
        <Campo
          etiqueta="Nombre del atajo"
          requerido
          error={errores.titulo}
          value={titulo}
          onChange={(e) => { setTitulo(e.target.value); setErrores((p) => ({ ...p, titulo: '' })) }}
          placeholder="Ej: Saludo, Precios, Estamos llenos…"
          maxLength={60}
        />
        <Campo etiqueta="Mensaje" requerido error={errores.contenido}>
          <textarea
            className="wa-caja-input"
            style={{ width: '100%', minHeight: '4.5rem' }}
            value={contenido}
            onChange={(e) => { setContenido(e.target.value); setErrores((p) => ({ ...p, contenido: '' })) }}
            placeholder="Ej: ¡Hola! Gracias por escribir a la barbería. ¿En qué te ayudo?"
          />
        </Campo>
        <Boton type="submit" variante="primario" cargando={creando} icono={<Plus size={14} />} style={{ alignSelf: 'flex-start' }}>
          Agregar atajo
        </Boton>
      </form>

      <div style={{ marginTop: 'var(--espacio-lg)', borderTop: '1px solid var(--color-borde)', paddingTop: 'var(--espacio-md)' }}>
        {cargando && <Cargando mensaje="Cargando atajos…" />}

        {!cargando && atajos.length === 0 && (
          <Vacio icono={<Zap size={26} />} titulo="Sin atajos todavía" mensaje="Crea el primero arriba." />
        )}

        {!cargando && atajos.length > 0 && (
          <ul className="wa-atajos-gestion-lista">
            {atajos.map((a) => (
              <li key={a.id} className="wa-atajos-gestion-item">
                <div className="wa-atajos-gestion-texto">
                  <strong>{a.titulo}</strong>
                  <span>{a.contenido}</span>
                </div>
                <button
                  type="button"
                  className="wa-atajos-gestion-eliminar"
                  onClick={() =>
                    eliminar(a.id, {
                      onSuccess: () => toast.success('Atajo eliminado'),
                      onError: (err) => toast.error(mensajeDeError(err)),
                    })
                  }
                  aria-label={`Eliminar atajo ${a.titulo}`}
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
