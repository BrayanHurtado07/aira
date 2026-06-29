import { Selector } from '@/compartido/interfaz/primitivas/Selector'
import { usarSedes } from '../ganchos/usarSedes'

interface PropsSelectorSede {
  valor: string
  alCambiar: (valor: string) => void
  error?: boolean
  placeholder?: string
}

// Selector de sede reutilizable: encapsula la carga de sucursales activas.
// Úsalo en cualquier pantalla que necesite elegir una sede.
export function SelectorSede({ valor, alCambiar, error, placeholder = 'Selecciona una sede' }: PropsSelectorSede) {
  const { sedes, cargando } = usarSedes()
  const opciones = sedes
    .filter((s) => s.estado === 'ACTIVO')
    .map((s) => ({ valor: s.id, etiqueta: s.nombre }))

  return (
    <Selector
      valor={valor}
      alCambiar={alCambiar}
      opciones={opciones}
      placeholder={placeholder}
      cargando={cargando}
      error={error}
    />
  )
}
