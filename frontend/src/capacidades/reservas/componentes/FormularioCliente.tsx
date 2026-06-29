import React, { useState } from 'react'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { CampoEmail } from '@/compartido/interfaz/primitivas/CampoEmail'
import { SelectorTelefono } from '@/compartido/interfaz/primitivas/SelectorTelefono'
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta'

export interface DatosCliente {
  nombre: string
  telefono: string
  correo: string
}

interface PropsFormularioCliente {
  onSubmit: (datos: DatosCliente) => void
  enviando: boolean
  error?: string | null
  valoresIniciales?: Partial<DatosCliente>
  textoEnviar?: string
  iconoEnviar?: React.ReactNode
}

const VACIO: DatosCliente = { nombre: '', telefono: '', correo: '' }

// Formulario de cliente reutilizable: lo usan el modal de crear y el de editar
// (antes el form se reimplementaba en la página y en el modal de edición).
export function FormularioCliente({ onSubmit, enviando, error, valoresIniciales, textoEnviar = 'Guardar', iconoEnviar }: PropsFormularioCliente) {
  const [datos, setDatos] = useState<DatosCliente>(() => ({ ...VACIO, ...valoresIniciales }))
  const [errorNombre, setErrorNombre] = useState('')
  const [errorTelefono, setErrorTelefono] = useState('')

  const cambiar = (campo: keyof DatosCliente, valor: string) => {
    setDatos((p) => ({ ...p, [campo]: valor }))
    if (campo === 'nombre') setErrorNombre('')
    if (campo === 'telefono') setErrorTelefono('')
  }

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    let ok = true
    if (!datos.nombre.trim()) { setErrorNombre('Ingresa el nombre completo'); ok = false }
    if (!datos.telefono.trim()) { setErrorTelefono('Ingresa el número de teléfono'); ok = false }
    if (!ok) return
    onSubmit({ nombre: datos.nombre.trim(), telefono: datos.telefono.trim(), correo: datos.correo.trim() })
  }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
      <Campo
        etiqueta="Nombre completo"
        requerido
        error={errorNombre}
        value={datos.nombre}
        onChange={(e) => cambiar('nombre', e.target.value)}
        placeholder="Ej: Juan Pérez"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
          Teléfono <span style={{ color: 'var(--color-error)' }}>*</span>
        </label>
        <SelectorTelefono valor={datos.telefono} alCambiar={(v) => cambiar('telefono', v)} error={!!errorTelefono} />
        {errorTelefono && <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>{errorTelefono}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
          Correo electrónico <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)' }}>(Opcional)</span>
        </label>
        <CampoEmail valor={datos.correo} alCambiar={(v) => cambiar('correo', v)} />
      </div>

      {error && <BannerAlerta variante="error" mensaje={error} />}

      <Boton type="submit" variante="primario" cargando={enviando} icono={iconoEnviar} style={{ marginTop: '0.25rem' }}>
        {textoEnviar}
      </Boton>
    </form>
  )
}
