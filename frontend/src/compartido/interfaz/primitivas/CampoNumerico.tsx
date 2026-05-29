/**
 * CampoNumerico — input numérico con validación integrada.
 *
 * Solo acepta dígitos (y opcionalmente decimales).
 * Props compatibles con <Campo> para usar dentro del mismo layout.
 */
import React, { useState } from 'react'

interface PropsCampoNumerico {
  /** Valor como string para compatibilidad con formularios */
  valor: string
  alCambiar: (valor: string) => void
  /** Permite punto decimal */
  decimal?: boolean
  /** Máximo de decimales (default 2 cuando decimal=true) */
  maxDecimales?: number
  /** Valor mínimo permitido */
  min?: number
  /** Valor máximo permitido */
  max?: number
  /** Longitud máxima en dígitos enteros (sin decimales) */
  maxDigitosEnteros?: number
  placeholder?: string
  error?: boolean
  deshabilitado?: boolean
  id?: string
  className?: string
  style?: React.CSSProperties
  autoFocus?: boolean
}

export function CampoNumerico({
  valor,
  alCambiar,
  decimal = false,
  maxDecimales = 2,
  min,
  max,
  maxDigitosEnteros,
  placeholder = '0',
  error = false,
  deshabilitado = false,
  id,
  className,
  style,
  autoFocus,
}: PropsCampoNumerico) {
  const [tocado, setTocado] = useState(false)

  const filtrar = (raw: string): string => {
    if (decimal) {
      // Permitir dígitos y máximo un punto
      let limpio = raw.replace(/[^\d.]/g, '')
      const partes = limpio.split('.')
      if (partes.length > 2) limpio = partes[0] + '.' + partes.slice(1).join('')
      if (partes[1] !== undefined && partes[1].length > maxDecimales)
        limpio = partes[0] + '.' + partes[1].slice(0, maxDecimales)
      if (maxDigitosEnteros && partes[0].length > maxDigitosEnteros)
        limpio = partes[0].slice(0, maxDigitosEnteros) + (partes[1] !== undefined ? '.' + partes[1] : '')
      return limpio
    }
    // Solo dígitos enteros
    let limpio = raw.replace(/\D/g, '')
    if (maxDigitosEnteros) limpio = limpio.slice(0, maxDigitosEnteros)
    return limpio
  }

  const validarRango = (s: string): boolean => {
    if (!s || !tocado) return true
    const n = parseFloat(s)
    if (isNaN(n)) return false
    if (min !== undefined && n < min) return false
    if (max !== undefined && n > max) return false
    return true
  }

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    alCambiar(filtrar(e.target.value))
  }

  const fuera = validarRango(valor)

  return (
    <input
      id={id}
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={valor}
      onChange={manejarCambio}
      onBlur={() => setTocado(true)}
      disabled={deshabilitado}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={['campo-input', error || (!fuera) ? 'campo-input--error' : '', className].filter(Boolean).join(' ')}
      style={style}
      autoComplete="off"
    />
  )
}
