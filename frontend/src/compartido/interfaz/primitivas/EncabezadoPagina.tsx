/**
 * EncabezadoPagina — cabecera estándar de página.
 * Reemplaza el bloque header repetido en todas las páginas.
 *
 * Uso:
 *   <EncabezadoPagina
 *     titulo="Clientes"
 *     descripcion="Administra los clientes de la barbería"
 *     indicador={<span>12 clientes</span>}
 *     acciones={<Boton variante="primario">Nuevo</Boton>}
 *   />
 */
import React from 'react'

interface PropsEncabezadoPagina {
  titulo: string
  descripcion?: string
  /** Chip/badge que aparece junto al título (ej: contador de registros) */
  indicador?: React.ReactNode
  /** Botones u otros controles alineados a la derecha */
  acciones?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function EncabezadoPagina({
  titulo,
  descripcion,
  indicador,
  acciones,
  className,
  style,
}: PropsEncabezadoPagina) {
  return (
    <div
      className={['encabezado-pagina', className].filter(Boolean).join(' ')}
      style={style}
    >
      <div className="encabezado-pagina-izquierda">
        <div className="encabezado-pagina-titulo-fila">
          <h1 className="encabezado-pagina-titulo">{titulo}</h1>
          {indicador && (
            <span className="encabezado-pagina-indicador">{indicador}</span>
          )}
        </div>
        {descripcion && (
          <p className="encabezado-pagina-descripcion">{descripcion}</p>
        )}
      </div>
      {acciones && (
        <div className="encabezado-pagina-acciones">{acciones}</div>
      )}
    </div>
  )
}
