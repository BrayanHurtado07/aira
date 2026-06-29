import { useQuery } from '@tanstack/react-query'
import { Selector } from '@/compartido/interfaz/primitivas/Selector'
import { obtenerBarberos } from '../servicios/servicio-agenda'

interface PropsSelectorBarbero {
  valor: string
  alCambiar: (valor: string) => void
  error?: boolean
  placeholder?: string
  /** Agrega la opción "Cualquier barbero disponible" (valor vacío). */
  incluirCualquiera?: boolean
  /** Si se pasa, solo lista barberos que SABEN hacer ese servicio (regla barbero↔servicio). */
  servicioId?: string
}

// Selector de barbero reutilizable: encapsula la carga de barberos activos.
// Con `servicioId` filtra a los que realizan ese servicio (no se ofrece un barbero
// que no sabe hacer el servicio elegido).
export function SelectorBarbero({
  valor,
  alCambiar,
  error,
  placeholder = 'Selecciona un barbero',
  incluirCualquiera = false,
  servicioId,
}: PropsSelectorBarbero) {
  const { data, isLoading } = useQuery({
    queryKey: ['barberos', servicioId ?? 'todos'],
    queryFn: () => obtenerBarberos(servicioId),
  })
  const base = (data ?? [])
    .filter((b) => b.estado === 'ACTIVO')
    .map((b) => ({ valor: b.id, etiqueta: b.especialidad ? `${b.nombre} · ${b.especialidad}` : b.nombre }))
  const opciones = incluirCualquiera
    ? [{ valor: '', etiqueta: 'Cualquier barbero disponible' }, ...base]
    : base

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
