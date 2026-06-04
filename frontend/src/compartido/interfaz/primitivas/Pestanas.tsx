import React, { useId } from 'react'
import { motion } from 'motion/react'

export interface Pestana {
  id: string
  etiqueta: string
  icono?: React.ReactNode
  contador?: number
  deshabilitada?: boolean
}

interface PropsPestanas {
  pestanas: Pestana[]
  activa: string
  alCambiar: (id: string) => void
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
  const uid = useId()

  return (
    <div
      className={['pestanas', `pestanas--${variante}`, className].filter(Boolean).join(' ')}
      style={style}
      role="tablist"
    >
      {pestanas.map((p) => {
        const estaActiva = p.id === activa
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={estaActiva}
            disabled={p.deshabilitada}
            onClick={() => !p.deshabilitada && alCambiar(p.id)}
            className={[
              'pestana-boton',
              `pestana-boton--${variante}`,
              estaActiva ? 'pestana-boton--activa' : '',
              p.deshabilitada ? 'pestana-boton--deshabilitada' : '',
            ].filter(Boolean).join(' ')}
            style={{ position: 'relative' }}
          >
            {p.icono && (
              <span className="pestana-icono" aria-hidden="true">{p.icono}</span>
            )}
            {p.etiqueta}
            {p.contador !== undefined && (
              <span className={['pestana-contador', estaActiva ? 'pestana-contador--activa' : ''].filter(Boolean).join(' ')}>
                {p.contador}
              </span>
            )}

            {/* Indicador deslizante — línea activa con layoutId */}
            {estaActiva && variante === 'linea' && (
              <motion.span
                layoutId={`${uid}-indicador`}
                style={{
                  position: 'absolute',
                  bottom: -1,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: 'var(--color-primario)',
                  borderRadius: '2px 2px 0 0',
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}

            {/* Pill activo para variante pastilla */}
            {estaActiva && variante === 'pastilla' && (
              <motion.span
                layoutId={`${uid}-pill`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--color-acento-suave)',
                  borderRadius: 'var(--radio-md)',
                  border: '1px solid var(--color-acento-borde)',
                  zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
