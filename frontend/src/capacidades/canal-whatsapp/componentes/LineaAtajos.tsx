import { useState } from 'react'
import { Zap, Settings2 } from 'lucide-react'
import { usarAtajos } from '../ganchos/usarAtajos'
import { ModalGestionAtajos } from './ModalGestionAtajos'

type Props = {
  /** Inserta el contenido del atajo en el composer. */
  onUsar: (contenido: string) => void
}

// Línea de atajos: chips de respuesta rápida sobre el composer + acceso a gestión.
export function LineaAtajos({ onUsar }: Props) {
  const { atajos, cargando } = usarAtajos()
  const [gestionAbierta, setGestionAbierta] = useState(false)

  return (
    <>
      <div className="wa-atajos" role="toolbar" aria-label="Respuestas rápidas">
        <button
          type="button"
          className="wa-atajos-gestion"
          onClick={() => setGestionAbierta(true)}
          aria-label="Gestionar atajos"
          title="Gestionar atajos"
        >
          <Settings2 size={15} aria-hidden />
        </button>

        <div className="wa-atajos-chips">
          {!cargando && atajos.length === 0 && (
            <button
              type="button"
              className="wa-atajo-chip wa-atajo-chip--vacio"
              onClick={() => setGestionAbierta(true)}
            >
              <Zap size={13} aria-hidden /> Crea tu primer atajo
            </button>
          )}

          {atajos.map((a) => (
            <button
              key={a.id}
              type="button"
              className="wa-atajo-chip"
              onClick={() => onUsar(a.contenido)}
              title={a.contenido}
            >
              {a.titulo}
            </button>
          ))}
        </div>
      </div>

      <ModalGestionAtajos abierto={gestionAbierta} alCerrar={() => setGestionAbierta(false)} />
    </>
  )
}
