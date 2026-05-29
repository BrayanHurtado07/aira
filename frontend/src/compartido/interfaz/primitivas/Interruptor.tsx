/**
 * Interruptor — toggle switch (boolean on/off).
 * Reemplaza <input type="checkbox"> con un diseño visual propio.
 */

interface PropsInterruptor {
  activo: boolean
  alCambiar: (valor: boolean) => void
  etiqueta?: string
  deshabilitado?: boolean
  tamano?: 'sm' | 'md'
  id?: string
}

export function Interruptor({
  activo,
  alCambiar,
  etiqueta,
  deshabilitado = false,
  tamano = 'md',
  id,
}: PropsInterruptor) {
  return (
    <label
      className={['interruptor-label', deshabilitado ? 'interruptor-label--deshabilitado' : ''].filter(Boolean).join(' ')}
      htmlFor={id}
    >
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={activo}
        disabled={deshabilitado}
        onClick={() => !deshabilitado && alCambiar(!activo)}
        className={[
          'interruptor-track',
          `interruptor-track--${tamano}`,
          activo ? 'interruptor-track--activo' : '',
        ].filter(Boolean).join(' ')}
      >
        <span
          className={[
            'interruptor-thumb',
            `interruptor-thumb--${tamano}`,
            activo ? 'interruptor-thumb--activo' : '',
          ].filter(Boolean).join(' ')}
        />
      </button>
      {etiqueta && (
        <span className="interruptor-etiqueta">{etiqueta}</span>
      )}
    </label>
  )
}
