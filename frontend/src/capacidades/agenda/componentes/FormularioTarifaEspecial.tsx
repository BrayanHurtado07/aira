import React, { useState } from 'react'
import { Tag } from 'lucide-react'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { CampoMoneda } from '@/compartido/interfaz/primitivas/CampoMoneda'
import { SelectorFecha } from '@/compartido/interfaz/primitivas/SelectorFecha'
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta'
import { SelectorServicio } from './SelectorServicio'

export interface DatosTarifaEspecial {
  servicio_id: string
  fecha: string
  precio_especial: number
  motivo?: string
}

interface PropsFormularioTarifaEspecial {
  onSubmit: (datos: DatosTarifaEspecial) => void
  enviando: boolean
  error?: string | null
  textoEnviar?: string
}

// Formulario de tarifa especial reutilizable, compuesto de primitivas.
export function FormularioTarifaEspecial({
  onSubmit,
  enviando,
  error,
  textoEnviar = 'Crear tarifa',
}: PropsFormularioTarifaEspecial) {
  const [servicioId, setServicioId] = useState('')
  const [fecha, setFecha] = useState('')
  const [precio, setPrecio] = useState('')
  const [motivo, setMotivo] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const nuevos: Record<string, string> = {}
    if (!servicioId) nuevos.servicio_id = 'Selecciona un servicio'
    if (!fecha) nuevos.fecha = 'La fecha es obligatoria'
    if (!precio || Number(precio) <= 0) nuevos.precio_especial = 'Ingresa un precio válido'
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return }

    onSubmit({
      servicio_id: servicioId,
      fecha,
      precio_especial: Number(precio),
      motivo: motivo.trim() || undefined,
    })
  }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
      <Campo etiqueta="Servicio" requerido error={errores.servicio_id}>
        <SelectorServicio
          valor={servicioId}
          alCambiar={(v) => { setServicioId(v); setErrores((p) => ({ ...p, servicio_id: '' })) }}
          error={!!errores.servicio_id}
        />
      </Campo>

      <Campo etiqueta="Fecha" requerido error={errores.fecha}>
        <SelectorFecha
          soloFecha
          valor={fecha}
          alCambiar={(v) => { setFecha(v); setErrores((p) => ({ ...p, fecha: '' })) }}
          error={!!errores.fecha}
          minDate={new Date()}
        />
      </Campo>

      <Campo etiqueta="Precio especial" requerido error={errores.precio_especial}>
        <CampoMoneda
          valor={precio}
          alCambiar={(v) => { setPrecio(v); setErrores((p) => ({ ...p, precio_especial: '' })) }}
          simbolo="S/"
          error={!!errores.precio_especial}
          placeholder="0.00"
        />
      </Campo>

      <Campo
        etiqueta="Motivo (opcional)"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Ej: Feriado, Promoción…"
      />

      {error && <BannerAlerta variante="error" mensaje={error} />}

      <Boton type="submit" variante="primario" cargando={enviando} icono={<Tag size={14} />} style={{ marginTop: '0.25rem' }}>
        {textoEnviar}
      </Boton>
    </form>
  )
}
