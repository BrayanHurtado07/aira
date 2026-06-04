import { Check } from 'lucide-react'

const PASOS = ['Servicio', 'Fecha y hora', 'Tus datos', 'Confirmar']

type Props = { pasoActual: number }

export function IndicadorPasos({ pasoActual }: Props) {
  return (
    <div className="indicador-pasos">
      {PASOS.map((etiqueta, i) => {
        const completado = i < pasoActual
        const activo = i === pasoActual
        return (
          <div key={etiqueta} className="indicador-pasos__item">
            <div
              className={[
                'indicador-pasos__circulo',
                completado ? 'indicador-pasos__circulo--completado' : '',
                activo ? 'indicador-pasos__circulo--activo' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {completado ? <Check size={12} /> : i + 1}
            </div>
            <span
              className={`indicador-pasos__etiqueta${activo ? ' indicador-pasos__etiqueta--activa' : ''}`}
            >
              {etiqueta}
            </span>
            {i < PASOS.length - 1 && (
              <div
                className={`indicador-pasos__linea${completado ? ' indicador-pasos__linea--completada' : ''}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
