/**
 * BannerAlerta — alerta inline con variantes de color y opción de cierre.
 *
 * Variantes:
 *   error       → rojo   (errores de petición, validación global)
 *   exito       → verde  (confirmación de acción exitosa)
 *   advertencia → ámbar  (avisos, datos incompletos)
 *   info        → azul   (información contextual)
 *
 * Uso:
 *   <BannerAlerta
 *     variante="error"
 *     titulo="No se pudo guardar"
 *     mensaje="Revisa tu conexión e intenta de nuevo."
 *     onCerrar={() => setError(null)}
 *   />
 */
import React from 'react'
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

export type VarianteBanner = 'error' | 'exito' | 'advertencia' | 'info'

interface PropsBannerAlerta {
  variante: VarianteBanner
  /** Título en negrita (opcional) */
  titulo?: string
  /** Texto del mensaje */
  mensaje: string
  /** Callback para mostrar el botón de cierre */
  onCerrar?: () => void
  className?: string
  style?: React.CSSProperties
}

const CONFIG: Record<VarianteBanner, { icono: React.ReactNode; clase: string }> = {
  error:       { icono: <AlertCircle size={16} />,   clase: 'banner-alerta--error' },
  exito:       { icono: <CheckCircle2 size={16} />,  clase: 'banner-alerta--exito' },
  advertencia: { icono: <AlertTriangle size={16} />, clase: 'banner-alerta--advertencia' },
  info:        { icono: <Info size={16} />,           clase: 'banner-alerta--info' },
}

export function BannerAlerta({
  variante,
  titulo,
  mensaje,
  onCerrar,
  className,
  style,
}: PropsBannerAlerta) {
  const cfg = CONFIG[variante]

  return (
    <div
      className={['banner-alerta', cfg.clase, className].filter(Boolean).join(' ')}
      style={style}
      role="alert"
    >
      <span className="banner-alerta-icono" aria-hidden="true">
        {cfg.icono}
      </span>

      <div className="banner-alerta-contenido">
        {titulo && <strong className="banner-alerta-titulo">{titulo}</strong>}
        <span className="banner-alerta-mensaje">{mensaje}</span>
      </div>

      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          className="banner-alerta-cerrar"
          aria-label="Cerrar alerta"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
