/**
 * SeccionTarjeta — contenedor con borde, radio y cabecera opcional.
 * Reemplaza el bloque "div borde + borderRadius + padding" repetido en formularios y listas.
 *
 * Uso:
 *   <SeccionTarjeta
 *     titulo="Nuevo servicio"
 *     icono={<Plus size={14} />}
 *     maxAncho={480}
 *   >
 *     <form>…</form>
 *   </SeccionTarjeta>
 */
import React from 'react'

interface PropsSeccionTarjeta {
  titulo?: string
  descripcion?: string
  /** Ícono que aparece en un círculo de color a la izquierda del título */
  icono?: React.ReactNode
  /** Color de fondo del círculo del ícono (token CSS o valor directo) */
  colorIcono?: string
  /** Controles alineados a la derecha de la cabecera */
  acciones?: React.ReactNode
  children: React.ReactNode
  /** Ancho máximo (px, rem, %, etc.) */
  maxAncho?: string | number
  className?: string
  style?: React.CSSProperties
  /** Elimina el padding del cuerpo (útil para tablas que ocupan todo el ancho) */
  sinPaddingCuerpo?: boolean
}

export function SeccionTarjeta({
  titulo,
  descripcion,
  icono,
  colorIcono = 'rgba(52,82,204,0.08)',
  acciones,
  children,
  maxAncho,
  className,
  style,
  sinPaddingCuerpo = false,
}: PropsSeccionTarjeta) {
  const tieneEncabezado = titulo || icono || acciones

  return (
    <div
      className={['seccion-tarjeta', className].filter(Boolean).join(' ')}
      style={{ maxWidth: maxAncho, ...style }}
    >
      {tieneEncabezado && (
        <div className="seccion-tarjeta-cabecera">
          <div className="seccion-tarjeta-cabecera-izquierda">
            {icono && (
              <div
                className="seccion-tarjeta-icono"
                style={{ backgroundColor: colorIcono }}
              >
                {icono}
              </div>
            )}
            <div>
              {titulo && (
                <h2 className="seccion-tarjeta-titulo">{titulo}</h2>
              )}
              {descripcion && (
                <p className="seccion-tarjeta-desc">{descripcion}</p>
              )}
            </div>
          </div>
          {acciones && (
            <div className="seccion-tarjeta-acciones">{acciones}</div>
          )}
        </div>
      )}

      <div
        className="seccion-tarjeta-cuerpo"
        style={sinPaddingCuerpo ? { padding: 0 } : undefined}
      >
        {children}
      </div>
    </div>
  )
}
