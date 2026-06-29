import { useQuery } from '@tanstack/react-query'
import { Selector } from '@/compartido/interfaz/primitivas/Selector'
import { obtenerServicios } from '../servicios/servicio-agenda'

interface PropsSelectorServicio {
  valor: string
  alCambiar: (valor: string) => void
  error?: boolean
  placeholder?: string
}

// Selector de servicio reutilizable: lista los servicios activos de la barbería
// (independiente del barbero). Para servicios DE un barbero usar el flujo de agenda.
export function SelectorServicio({ valor, alCambiar, error, placeholder = 'Selecciona un servicio' }: PropsSelectorServicio) {
  const { data, isLoading } = useQuery({ queryKey: ['servicios'], queryFn: obtenerServicios })
  const opciones = (data ?? [])
    .filter((s) => s.estado === 'ACTIVO')
    .map((s) => ({ valor: s.id, etiqueta: `${s.nombre} · ${s.duracion_minutos} min` }))

  return (
    <Selector
      valor={valor}
      alCambiar={alCambiar}
      opciones={opciones}
      placeholder={placeholder}
      cargando={isLoading}
      error={error}
    />
  )
}
