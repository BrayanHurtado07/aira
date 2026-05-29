/**
 * MenuAcciones — menú desplegable de acciones con íconos para filas de tabla.
 *
 * Usa posicionamiento `fixed` para no quedar recortado por `overflow:hidden`.
 *
 * Uso:
 *   <MenuAcciones
 *     acciones={[
 *       { id: 'editar',   etiqueta: 'Editar',   icono: <Pencil size={14} /> },
 *       { id: 'bloquear', etiqueta: 'Bloquear', icono: <Ban size={14} />,   variante: 'advertencia', separador: true },
 *       { id: 'eliminar', etiqueta: 'Eliminar', icono: <Trash2 size={14} />, variante: 'peligro' },
 *     ]}
 *     onAccion={(id) => manejar(id)}
 *   />
 */
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MoreVertical } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type VarianteAccion = 'normal' | 'peligro' | 'advertencia'

export interface AccionMenu {
  id: string
  etiqueta: string
  icono: React.ReactNode
  variante?: VarianteAccion
  /** Dibuja una línea separadora ANTES de este ítem */
  separador?: boolean
  deshabilitada?: boolean
}

interface PropsMenuAcciones {
  acciones: AccionMenu[]
  onAccion: (id: string) => void
  /** Ícono personalizado del botón disparador (default: ⋮) */
  iconoDisparador?: React.ReactNode
  /** Tooltip del botón */
  titulo?: string
  deshabilitado?: boolean
}

// ── Colores por variante ──────────────────────────────────────────────────────

const COLOR_VARIANTE: Record<VarianteAccion, string> = {
  normal:      'var(--color-texto)',
  peligro:     'var(--color-error)',
  advertencia: 'var(--color-advertencia, #f59e0b)',
}

// ── Componente ────────────────────────────────────────────────────────────────

export function MenuAcciones({
  acciones,
  onAccion,
  iconoDisparador,
  titulo = 'Más acciones',
  deshabilitado = false,
}: PropsMenuAcciones) {
  const [abierto, setAbierto] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const botonRef = useRef<HTMLButtonElement>(null)
  const menuRef  = useRef<HTMLDivElement>(null)

  // Calcula posición fija relativa al botón
  const abrir = useCallback(() => {
    if (!botonRef.current) return
    const rect = botonRef.current.getBoundingClientRect()
    setPos({
      top:   rect.bottom + 6,
      right: window.innerWidth - rect.right,
    })
    setAbierto(true)
  }, [])

  // Cierra al hacer clic fuera
  useEffect(() => {
    if (!abierto) return
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current  && !menuRef.current.contains(e.target as Node) &&
        botonRef.current && !botonRef.current.contains(e.target as Node)
      ) {
        setAbierto(false)
      }
    }
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown',   handleEsc)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown',   handleEsc)
    }
  }, [abierto])

  const ejecutar = (id: string) => {
    setAbierto(false)
    onAccion(id)
  }

  return (
    <>
      {/* Botón disparador */}
      <button
        ref={botonRef}
        type="button"
        title={titulo}
        disabled={deshabilitado}
        onClick={abierto ? () => setAbierto(false) : abrir}
        className={['menu-acciones-btn', abierto ? 'menu-acciones-btn--abierto' : ''].filter(Boolean).join(' ')}
        aria-haspopup="menu"
        aria-expanded={abierto}
      >
        {iconoDisparador ?? <MoreVertical size={15} />}
      </button>

      {/* Dropdown portal (position:fixed) */}
      <AnimatePresence>
        {abierto && (
          <motion.div
            ref={menuRef}
            key="menu"
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.95, y: -4  }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className="menu-acciones-panel"
            style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 300 }}
          >
            {acciones.map((accion) => (
              <React.Fragment key={accion.id}>
                {accion.separador && <div className="menu-acciones-separador" />}
                <button
                  type="button"
                  role="menuitem"
                  disabled={accion.deshabilitada}
                  onClick={() => !accion.deshabilitada && ejecutar(accion.id)}
                  className={[
                    'menu-acciones-item',
                    accion.deshabilitada ? 'menu-acciones-item--deshabilitado' : '',
                  ].filter(Boolean).join(' ')}
                  style={{ color: COLOR_VARIANTE[accion.variante ?? 'normal'] }}
                >
                  <span className="menu-acciones-item-icono">{accion.icono}</span>
                  <span className="menu-acciones-item-etiqueta">{accion.etiqueta}</span>
                </button>
              </React.Fragment>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
