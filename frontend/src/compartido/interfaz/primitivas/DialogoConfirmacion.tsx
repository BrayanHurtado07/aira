/**
 * DialogoConfirmacion — modal de confirmación con variantes de peligro, advertencia y normal.
 * Envuelve Modal con un pie estándar Cancelar / Confirmar.
 *
 * Uso:
 *   <DialogoConfirmacion
 *     abierto={confirmar}
 *     titulo="¿Eliminar servicio?"
 *     descripcion="Esta acción no se puede deshacer."
 *     variante="peligro"
 *     textoConfirmar="Eliminar"
 *     cargando={eliminando}
 *     alConfirmar={handleEliminar}
 *     alCancelar={() => setConfirmar(false)}
 *   />
 */
import React from 'react'
import { Trash2, AlertTriangle, HelpCircle } from 'lucide-react'
import { Modal } from './Modal'
import { Boton } from './Boton'

type VarianteDialogo = 'peligro' | 'advertencia' | 'normal'

interface PropsDialogoConfirmacion {
  abierto: boolean
  titulo: string
  /** Texto explicativo que aparece dentro del diálogo */
  descripcion?: string
  textoConfirmar?: string
  textoCancelar?: string
  variante?: VarianteDialogo
  cargando?: boolean
  alConfirmar: () => void
  alCancelar: () => void
}

const CONF: Record<VarianteDialogo, { icono: React.ReactNode; fondoIcono: string; colorIcono: string }> = {
  peligro:     { icono: <Trash2 size={22} />,       fondoIcono: 'rgba(239,68,68,0.08)',    colorIcono: 'var(--color-error)' },
  advertencia: { icono: <AlertTriangle size={22} />, fondoIcono: 'rgba(245,158,11,0.08)',   colorIcono: 'var(--color-advertencia, #f59e0b)' },
  normal:      { icono: <HelpCircle size={22} />,    fondoIcono: 'rgba(52,82,204,0.08)',    colorIcono: 'var(--color-primario)' },
}

export function DialogoConfirmacion({
  abierto,
  titulo,
  descripcion,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'normal',
  cargando = false,
  alConfirmar,
  alCancelar,
}: PropsDialogoConfirmacion) {
  const cfg = CONF[variante]

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCancelar}
      titulo={titulo}
      ancho="sm"
      sinCerrarAlFondo={cargando}
      pie={
        <>
          <Boton
            variante="secundario"
            onClick={alCancelar}
            disabled={cargando}
          >
            {textoCancelar}
          </Boton>
          <Boton
            variante={variante === 'peligro' ? 'peligro' : 'primario'}
            cargando={cargando}
            onClick={alConfirmar}
          >
            {textoConfirmar}
          </Boton>
        </>
      }
    >
      <div className="dialogo-conf-cuerpo">
        {/* Ícono visual */}
        <div
          className="dialogo-conf-icono"
          style={{
            backgroundColor: cfg.fondoIcono,
            color: cfg.colorIcono,
          }}
        >
          {cfg.icono}
        </div>

        {/* Descripción */}
        {descripcion && (
          <p className="dialogo-conf-descripcion">{descripcion}</p>
        )}
      </div>
    </Modal>
  )
}
