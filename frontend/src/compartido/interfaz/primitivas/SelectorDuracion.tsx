/**
 * SelectorDuracion — selector visual de duración en minutos.
 *
 * Muestra chips de presets rápidos (10, 15, 20, 30, 45, 60, 90, 120 min)
 * y un input numérico para valores personalizados.
 *
 * El valor siempre es un string con los minutos totales (ej: "30").
 *
 * Uso:
 *   <SelectorDuracion
 *     valor={formulario.duracion_minutos}
 *     alCambiar={cambiar('duracion_minutos')}
 *     error={!!errores.duracion_minutos}
 *   />
 */
import React, { useState } from 'react'
import { Clock } from 'lucide-react'

// ── Presets ───────────────────────────────────────────────────────────────────

interface Preset {
  minutos: number
  etiqueta: string
}

const PRESETS: Preset[] = [
  { minutos: 10,  etiqueta: '10 min' },
  { minutos: 15,  etiqueta: '15 min' },
  { minutos: 20,  etiqueta: '20 min' },
  { minutos: 30,  etiqueta: '30 min' },
  { minutos: 45,  etiqueta: '45 min' },
  { minutos: 60,  etiqueta: '1 hr'   },
  { minutos: 90,  etiqueta: '1:30 hr'},
  { minutos: 120, etiqueta: '2 hr'   },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatearDuracion(minutos: number): string {
  if (minutos <= 0) return ''
  if (minutos < 60) return `${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PropsSelectorDuracion {
  /** Valor en minutos como string ("30", "90", etc.) */
  valor: string
  alCambiar: (v: string) => void
  error?: boolean
}

// ── Componente ────────────────────────────────────────────────────────────────

export function SelectorDuracion({ valor, alCambiar, error = false }: PropsSelectorDuracion) {
  const valorNum   = parseInt(valor) || 0
  const esPreset   = PRESETS.some((p) => p.minutos === valorNum)
  const [custom, setCustom] = useState(!esPreset && valorNum > 0)

  const seleccionar = (minutos: number) => {
    setCustom(false)
    alCambiar(String(minutos))
  }

  const activarCustom = () => {
    setCustom(true)
    // Si ya hay un valor no-preset, mantenerlo; si no, limpiar
    if (esPreset) alCambiar('')
  }

  const manejarCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    alCambiar(raw)
  }

  return (
    <div className={['selector-duracion', error ? 'selector-duracion--error' : ''].filter(Boolean).join(' ')}>

      {/* Chips de presets */}
      <div className="selector-duracion-chips">
        {PRESETS.map((p) => (
          <button
            key={p.minutos}
            type="button"
            onClick={() => seleccionar(p.minutos)}
            className={[
              'selector-duracion-chip',
              !custom && valorNum === p.minutos ? 'selector-duracion-chip--activo' : '',
            ].filter(Boolean).join(' ')}
          >
            {p.etiqueta}
          </button>
        ))}

        {/* Chip "Otro" */}
        <button
          type="button"
          onClick={activarCustom}
          className={[
            'selector-duracion-chip',
            'selector-duracion-chip--otro',
            custom ? 'selector-duracion-chip--activo' : '',
          ].filter(Boolean).join(' ')}
        >
          Otro
        </button>
      </div>

      {/* Input personalizado */}
      {custom && (
        <div className="selector-duracion-custom">
          <Clock size={13} className="selector-duracion-custom-icono" />
          <input
            type="text"
            inputMode="numeric"
            value={valor}
            onChange={manejarCustomInput}
            placeholder="Ej: 75"
            className={['campo-input', 'selector-duracion-custom-input', error ? 'campo-input--error' : ''].filter(Boolean).join(' ')}
            autoFocus
          />
          <span className="selector-duracion-custom-sufijo">min</span>
          {valorNum > 0 && (
            <span className="selector-duracion-custom-preview">
              = {formatearDuracion(valorNum)}
            </span>
          )}
        </div>
      )}

      {/* Resumen del valor seleccionado */}
      {!custom && valorNum > 0 && (
        <div className="selector-duracion-resumen">
          <Clock size={12} />
          {formatearDuracion(valorNum)} seleccionados
        </div>
      )}
    </div>
  )
}
