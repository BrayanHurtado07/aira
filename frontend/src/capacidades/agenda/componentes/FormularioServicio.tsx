import React, { useState } from 'react'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { CampoMoneda } from '@/compartido/interfaz/primitivas/CampoMoneda'
import { SelectorDuracion } from '@/compartido/interfaz/primitivas/SelectorDuracion'
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta'

export interface DatosServicio {
  nombre: string
  duracion_minutos: number
  precio: number
}

interface PropsFormularioServicio {
  onSubmit: (datos: DatosServicio) => void
  enviando: boolean
  error?: string | null
  valoresIniciales?: Partial<{ nombre: string; duracion_minutos: number; precio: number }>
  textoEnviar?: string
  iconoEnviar?: React.ReactNode
}

// Formulario de servicio reutilizable (crear/editar) con validaciones.
export function FormularioServicio({ onSubmit, enviando, error, valoresIniciales, textoEnviar = 'Guardar', iconoEnviar }: PropsFormularioServicio) {
  const [nombre, setNombre] = useState(valoresIniciales?.nombre ?? '')
  const [duracion, setDuracion] = useState(String(valoresIniciales?.duracion_minutos ?? 30))
  const [precio, setPrecio] = useState(valoresIniciales?.precio != null ? String(valoresIniciales.precio) : '')
  const [errores, setErrores] = useState<Record<string, string>>({})

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const dur = parseInt(duracion, 10) || 0
    const prc = parseFloat(precio) || 0
    const nuevos: Record<string, string> = {}
    if (!nombre.trim()) nuevos.nombre = 'Ingresa el nombre del servicio'
    if (dur <= 0) nuevos.duracion = 'La duración debe ser mayor a 0 min'
    if (prc < 0) nuevos.precio = 'El precio no puede ser negativo'
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return }
    onSubmit({ nombre: nombre.trim(), duracion_minutos: dur, precio: prc })
  }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
      <Campo
        etiqueta="Nombre del servicio"
        requerido
        error={errores.nombre}
        value={nombre}
        onChange={(e) => { setNombre(e.target.value); setErrores((p) => ({ ...p, nombre: '' })) }}
        placeholder="Ej: Corte clásico, Barba completa, Degradado…"
        autoFocus
      />

      <Campo etiqueta="Duración" requerido error={errores.duracion}>
        <SelectorDuracion
          valor={duracion}
          alCambiar={(v) => { setDuracion(v); setErrores((p) => ({ ...p, duracion: '' })) }}
          error={!!errores.duracion}
        />
      </Campo>

      <Campo etiqueta="Precio" error={errores.precio}>
        <CampoMoneda
          valor={precio}
          alCambiar={(v) => { setPrecio(v); setErrores((p) => ({ ...p, precio: '' })) }}
          simbolo="S/"
          error={!!errores.precio}
          placeholder="0.00"
        />
      </Campo>

      {error && <BannerAlerta variante="error" mensaje={error} />}

      <Boton type="submit" variante="primario" cargando={enviando} icono={iconoEnviar} style={{ marginTop: '0.25rem' }}>
        {textoEnviar}
      </Boton>
    </form>
  )
}
