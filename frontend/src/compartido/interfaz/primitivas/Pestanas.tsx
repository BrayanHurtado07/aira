/**
 * Pestanas — navegación por pestañas (tabs) controlada.
 *
 * Uso:
 *   const [activa, setActiva] = useState('general')
 *
 *   <Pestanas
 *     pestanas={[
 *       { id: 'general', etiqueta: 'General', icono: <Settings size={14} /> },
 *       { id: 'servicios', etiqueta: 'Servicios', contador: 5 },
 *     ]}
 *     activa={activa}
 *     alCambiar={setActiva}
 *   />
 *
 *   {activa === 'general' && <SeccionGeneral />}
 *   {activa === 'servicios' && <SeccionServicios />}
 */
import React from 'react'

export interface Pestana {
  id: string
  etiqueta: string
  icono?: React.ReactNode
  /** Número que aparece como badge junto a la etiqueta */
  contador?: number
  /** Deshabilitar pestaña */
  deshabilitada?: boolean
}

interface PropsPestanas {
  pestanas: Pestana[]
  activa: string
  alCambiar: (id: string) => void
  /** Variante visual: 'linea' (borde inferior) | 'pastilla' (fondo redondeado) */
  variante?: 'linea' | 'pastilla'
  className?: string
  style?: React.CSSProperties
}

export function Pestanas({
  pestanas,
  activa,
  alCambiar,
  variante = 'linea',
  className,
  style,
}: PropsPestanas) {
  return (
    <div
      className={[
        'pestanas',
        `pestanas--${variante}`,
        className,
      ].filter(Boolean).join(' ')}
      style={style}
      role="tablist"
    >
      {pestanas.map((p) => (
        <button
          key={p.id}
          type="button"
          role="tab"
          aria-selected={p.id === activa}
          disabled={p.deshabilitada}
          onClick={() => !p.deshabilitada && alCambiar(p.id)}
          className={[
            'pestana-boton',
            `pestana-boton--${variante}`,
            p.id === activa ? 'pestana-boton--activa' : '',
            p.deshabilitada ? 'pestana-boton--deshabilitada' : '',
          ].filter(Boolean).join(' ')}
        >
          {p.icono && (
            <span className="pestana-icono" aria-hidden="true">
              {p.icono}
            </span>
          )}
          {p.etiqueta}
          {p.contador !== undefined && (
            <span
              className={[
                'pestana-contador',
                p.id === activa ? 'pestana-contador--activa' : '',
              ].filter(Boolean).join(' ')}
            >
              {p.contador}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
