import React, { useState } from 'react'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { SelectorTelefono } from '@/compartido/interfaz/primitivas/SelectorTelefono'
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta'

export interface DatosBarbero {
  nombre: string
  telefono: string
}

interface PropsFormularioBarbero {
  onSubmit: (datos: DatosBarbero) => void
  enviando: boolean
  error?: string | null
  valoresIniciales?: Partial<DatosBarbero>
  textoEnviar?: string
  iconoEnviar?: React.ReactNode
}

const VACIO: DatosBarbero = { nombre: '', telefono: '' }

// Formulario de barbero reutilizable (crear/editar).
export function FormularioBarbero({ onSubmit, enviando, error, valoresIniciales, textoEnviar = 'Guardar', iconoEnviar }: PropsFormularioBarbero) {
  const [datos, setDatos] = useState<DatosBarbero>(() => ({ ...VACIO, ...valoresIniciales }))
  const [errorNombre, setErrorNombre] = useState('')

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!datos.nombre.trim()) { setErrorNombre('Ingresa el nombre completo'); return }
    onSubmit({ nombre: datos.nombre.trim(), telefono: datos.telefono.trim() })
  }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
      <Campo
        etiqueta="Nombre completo"
        requerido
        error={errorNombre}
        value={datos.nombre}
        onChange={(e) => { setDatos((p) => ({ ...p, nombre: e.target.value })); setErrorNombre('') }}
        placeholder="Ej: Carlos Ramírez"
        autoFocus
      />

      <Campo etiqueta="Teléfono" ayuda="Opcional">
        <SelectorTelefono valor={datos.telefono} alCambiar={(v) => setDatos((p) => ({ ...p, telefono: v }))} />
      </Campo>

      {error && <BannerAlerta variante="error" mensaje={error} />}

      <Boton type="submit" variante="primario" cargando={enviando} icono={iconoEnviar} style={{ marginTop: '0.25rem' }}>
        {textoEnviar}
      </Boton>
    </form>
  )
}
