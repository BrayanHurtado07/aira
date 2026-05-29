/**
 * TablaDatos<T> — tabla de datos genérica y completamente reutilizable.
 *
 * Uso:
 *   <TablaDatos<Cliente>
 *     columnas={[
 *       { clave: 'nombre', etiqueta: 'Nombre', render: (c) => <strong>{c.nombre}</strong> },
 *       { clave: 'estado', etiqueta: 'Estado' },
 *     ]}
 *     filas={clientes}
 *     obtenerClave={(c) => c.id}
 *     cargando={cargando}
 *     acciones={(c) => <Boton onClick={() => eliminar(c)}>Eliminar</Boton>}
 *     vacioTitulo="Sin clientes"
 *     vacioMensaje="Registra el primer cliente."
 *   />
 */
import React from 'react'
import { motion } from 'framer-motion'
import { EsqueletoTabla } from '@/compartido/interfaz/retroalimentacion/Esqueleto'
import { Vacio } from '@/compartido/interfaz/retroalimentacion/Vacio'

// ── Definición de columnas ────────────────────────────────────────────────────

export interface ColumnaTabla<T> {
  /** Identificador único de columna */
  clave: string
  /** Texto del encabezado */
  etiqueta: string
  /**
   * Función de render personalizada.
   * Si no se provee, muestra `(fila as any)[clave]` como string.
   */
  render?: (fila: T, indice: number) => React.ReactNode
  /** Ancho fijo en px/rem/% */
  ancho?: string | number
  /** Alineación del contenido */
  alinear?: 'izquierda' | 'centro' | 'derecha'
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PropsTablaDatos<T> {
  columnas: ColumnaTabla<T>[]
  filas: T[]
  /** Extrae la clave única de cada fila (equivale a `keyExtractor`) */
  obtenerClave: (fila: T) => string
  cargando?: boolean
  /** Filas de skeleton durante carga (default 5) */
  filasCargando?: number
  vacioIcono?: React.ReactNode
  vacioTitulo?: string
  vacioMensaje?: string
  /**
   * Función que retorna los controles de acción para cada fila.
   * Se renderiza en una columna final "Acciones".
   * Los clics en esta celda NO propagan al `onClickFila`.
   */
  acciones?: (fila: T) => React.ReactNode
  /** Callback al hacer clic en una fila completa */
  onClickFila?: (fila: T) => void
  className?: string
  style?: React.CSSProperties
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAP_ALINEAR: Record<string, React.CSSProperties['textAlign']> = {
  izquierda: 'left',
  centro: 'center',
  derecha: 'right',
}

// ── Componente ────────────────────────────────────────────────────────────────

export function TablaDatos<T>({
  columnas,
  filas,
  obtenerClave,
  cargando = false,
  filasCargando = 5,
  vacioIcono,
  vacioTitulo = 'Sin registros',
  vacioMensaje = 'No hay datos para mostrar.',
  acciones,
  onClickFila,
  className,
  style,
}: PropsTablaDatos<T>) {
  const numColumnas = columnas.length + (acciones ? 1 : 0)

  if (cargando) {
    return <EsqueletoTabla columnas={numColumnas} filas={filasCargando} />
  }

  if (filas.length === 0) {
    return (
      <Vacio
        icono={vacioIcono}
        titulo={vacioTitulo}
        mensaje={vacioMensaje}
      />
    )
  }

  return (
    <div
      className={['tabla-datos-wrapper', className].filter(Boolean).join(' ')}
      style={style}
    >
      <div style={{ overflowX: 'auto' }}>
        <table className="tabla-datos">
          <thead>
            <tr className="tabla-datos-encabezado">
              {columnas.map((col) => (
                <th
                  key={col.clave}
                  className="tabla-datos-th"
                  style={{
                    width: col.ancho,
                    textAlign: col.alinear ? MAP_ALINEAR[col.alinear] : 'left',
                  }}
                >
                  {col.etiqueta}
                </th>
              ))}
              {acciones && (
                <th
                  className="tabla-datos-th tabla-datos-th--acciones"
                  style={{ textAlign: 'right' }}
                >
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => {
              const clave = obtenerClave(fila)
              return (
                <motion.tr
                  key={clave}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.14, delay: i * 0.025 }}
                  className={[
                    'tabla-datos-fila',
                    onClickFila ? 'tabla-datos-fila--clickable' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={onClickFila ? () => onClickFila(fila) : undefined}
                >
                  {columnas.map((col) => {
                    const contenido = col.render
                      ? col.render(fila, i)
                      : String((fila as Record<string, unknown>)[col.clave] ?? '')
                    return (
                      <td
                        key={col.clave}
                        className="tabla-datos-td"
                        style={{
                          textAlign: col.alinear ? MAP_ALINEAR[col.alinear] : 'left',
                        }}
                      >
                        {contenido}
                      </td>
                    )
                  })}
                  {acciones && (
                    <td
                      className="tabla-datos-td tabla-datos-td--acciones"
                      style={{ textAlign: 'right' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {acciones(fila)}
                    </td>
                  )}
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
