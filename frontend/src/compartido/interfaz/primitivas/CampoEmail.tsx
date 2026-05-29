/**
 * CampoEmail — input de correo con validación completa integrada.
 *
 * Validaciones:
 *   · Presencia del símbolo @
 *   · Un solo @ en el valor
 *   · Usuario no vacío antes del @
 *   · Dominio con al menos un punto
 *   · TLD de mínimo 2 caracteres
 *   · Longitud máxima 254 caracteres (RFC 5321)
 *   · Patrón general de formato
 *   · Detección de dominios mal escritos con sugerencia de corrección
 *
 * Comportamiento:
 *   · Valida en tiempo real DESPUÉS del primer blur (no molesta al escribir)
 *   · Muestra indicador verde (✓) cuando el correo es válido
 *   · Muestra sugerencia de dominio si detecta typo (ej: gmial → gmail)
 *   · Campo requerido opcional con mensaje específico
 */
import React, { useState, useCallback } from 'react'
import { CheckCircle2 } from 'lucide-react'

// ── Patrón RFC-simplificado ───────────────────────────────────────────────────
const PATRON_EMAIL = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

// ── Correcciones de dominios mal escritos ─────────────────────────────────────
const DOMINIOS_CORRECCION: Record<string, string> = {
  'gmial.com':     'gmail.com',
  'gmai.com':      'gmail.com',
  'gmail.co':      'gmail.com',
  'gnail.com':     'gmail.com',
  'gamil.com':     'gmail.com',
  'gmal.com':      'gmail.com',
  'hotmial.com':   'hotmail.com',
  'hotmai.com':    'hotmail.com',
  'hotmal.com':    'hotmail.com',
  'hotmaill.com':  'hotmail.com',
  'yaho.com':      'yahoo.com',
  'yahooo.com':    'yahoo.com',
  'yahho.com':     'yahoo.com',
  'outlok.com':    'outlook.com',
  'outloo.com':    'outlook.com',
  'outlookk.com':  'outlook.com',
  'iclod.com':     'icloud.com',
  'icloud.co':     'icloud.com',
}

// ── Validación detallada ──────────────────────────────────────────────────────

function validarFormato(email: string): string | null {
  const val = email.trim()
  if (!val) return null // vacío → sin error de formato (lo maneja `requerido`)

  if (!val.includes('@'))
    return 'Falta el símbolo @'

  const partes = val.split('@')
  if (partes.length > 2)
    return 'Solo puede haber un símbolo @'

  const [local, dominio] = partes

  if (!local)
    return 'Escribe el usuario antes del @'

  if (!dominio || !dominio.includes('.'))
    return 'El dominio necesita un punto (ej: gmail.com)'

  const tld = dominio.split('.').pop() ?? ''
  if (tld.length < 2)
    return 'La extensión del dominio no es válida (ej: .com, .pe)'

  if (val.length > 254)
    return `Demasiado largo · máximo 254 caracteres`

  if (!PATRON_EMAIL.test(val))
    return 'Formato de correo inválido'

  return null
}

function obtenerSugerencia(email: string): string | null {
  const val = email.trim()
  if (!val.includes('@')) return null
  const idx = val.indexOf('@')
  const local = val.slice(0, idx)
  const dominio = val.slice(idx + 1).toLowerCase()
  const correcto = DOMINIOS_CORRECCION[dominio]
  return correcto ? `${local}@${correcto}` : null
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PropsCampoEmail {
  valor: string
  alCambiar: (valor: string) => void
  placeholder?: string
  /** Fuerza estado de error desde el padre (ej: validación global del form) */
  error?: boolean
  deshabilitado?: boolean
  requerido?: boolean
  id?: string
  className?: string
  style?: React.CSSProperties
}

// ── Componente ────────────────────────────────────────────────────────────────

export function CampoEmail({
  valor,
  alCambiar,
  placeholder = 'correo@ejemplo.com',
  error = false,
  deshabilitado = false,
  requerido = false,
  id,
  className,
  style,
}: PropsCampoEmail) {
  const [tocado, setTocado] = useState(false)

  // Valida solo después del primer blur para no interrumpir la escritura
  const errorFormato = tocado ? validarFormato(valor) : null
  const errorVacio   = tocado && requerido && !valor.trim() ? 'El correo es obligatorio' : null
  const mensajeError = errorVacio ?? errorFormato

  const sugerencia   = tocado && !mensajeError ? obtenerSugerencia(valor) : null
  const esValido     = tocado && !mensajeError && PATRON_EMAIL.test(valor.trim()) && !!valor.trim()

  const hayError = error || !!mensajeError

  const aceptarSugerencia = useCallback(() => {
    if (sugerencia) alCambiar(sugerencia)
  }, [sugerencia, alCambiar])

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
      className={className}
    >
      {/* Input */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={id}
          type="email"
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          onBlur={() => setTocado(true)}
          disabled={deshabilitado}
          placeholder={placeholder}
          maxLength={254}
          className={[
            'campo-input',
            hayError ? 'campo-input--error' : '',
            esValido  ? 'campo-input--valido' : '',
          ].filter(Boolean).join(' ')}
          style={{
            paddingRight: esValido ? '2.25rem' : undefined,
            ...style,
          }}
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
        />

        {/* Indicador de éxito */}
        {esValido && (
          <span
            style={{
              position: 'absolute',
              right: '0.625rem',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-exito)',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            <CheckCircle2 size={15} />
          </span>
        )}
      </div>

      {/* Error */}
      {mensajeError && (
        <span className="campo-error-inline" role="alert">
          {mensajeError}
        </span>
      )}

      {/* Sugerencia de dominio */}
      {sugerencia && (
        <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)' }}>
          ¿Quisiste decir{' '}
          <button
            type="button"
            onClick={aceptarSugerencia}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              font: 'inherit',
              fontSize: 'var(--tamano-xs)',
              color: 'var(--color-primario)',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            {sugerencia}
          </button>
          ?
        </span>
      )}
    </div>
  )
}
