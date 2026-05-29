/**
 * CampoMoneda — input de precio/dinero con símbolo de moneda prefijado.
 * Acepta solo dígitos y punto decimal (máx 2 decimales).
 * Muestra el símbolo de moneda como prefix visual.
 */
import React from 'react'

interface PropsCampoMoneda {
  valor: string
  alCambiar: (valor: string) => void
  /** Símbolo a mostrar (default: "S/") */
  simbolo?: string
  /** Valor máximo */
  max?: number
  placeholder?: string
  error?: boolean
  deshabilitado?: boolean
  id?: string
  style?: React.CSSProperties
}

export function CampoMoneda({
  valor,
  alCambiar,
  simbolo = 'S/',
  max,
  placeholder = '0.00',
  error = false,
  deshabilitado = false,
  id,
  style,
}: PropsCampoMoneda) {
  const filtrar = (raw: string): string => {
    let limpio = raw.replace(/[^\d.]/g, '')
    const partes = limpio.split('.')
    if (partes.length > 2) limpio = partes[0] + '.' + partes.slice(1).join('')
    if (partes[1] !== undefined && partes[1].length > 2)
      limpio = partes[0] + '.' + partes[1].slice(0, 2)
    if (max !== undefined && parseFloat(limpio) > max)
      limpio = String(max)
    return limpio
  }

  return (
    <div
      className={['campo-moneda-wrapper', error ? 'campo-moneda-wrapper--error' : ''].filter(Boolean).join(' ')}
      style={style}
    >
      <span className="campo-moneda-simbolo">{simbolo}</span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={valor}
        onChange={(e) => alCambiar(filtrar(e.target.value))}
        disabled={deshabilitado}
        placeholder={placeholder}
        className="campo-moneda-input"
        autoComplete="off"
      />
    </div>
  )
}
