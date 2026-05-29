import React from 'react';
import { Link } from 'react-router-dom'
import { Cargando } from '@/compartido/interfaz/retroalimentacion/Cargando'
import { Vacio } from '@/compartido/interfaz/retroalimentacion/Vacio'
import type { Conversacion } from '../contratos/tipos'

const etiquetaEstado: Record<Conversacion['estado'], string> = {
  ACTIVA: 'Activa',
  CERRADA: 'Cerrada',
}

const estiloInsignia: Record<Conversacion['estado'], React.CSSProperties> = {
  ACTIVA: {
    backgroundColor: 'var(--color-acento)',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: 'var(--radio-md)',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  CERRADA: {
    backgroundColor: 'var(--color-borde)',
    color: 'var(--color-texto)',
    padding: '2px 8px',
    borderRadius: 'var(--radio-md)',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
}

type Props = {
  items: Conversacion[]
  cargando: boolean
}

export function ListaConversaciones({ items, cargando }: Props) {
  if (cargando) return <Cargando />
  if (items.length === 0) return <Vacio mensaje="No hay conversaciones registradas." />

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
      {items.map((conv) => (
        <li
          key={conv.id}
          style={{
            border: '1px solid var(--color-borde)',
            borderRadius: 'var(--radio-md)',
            padding: 'var(--espacio-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--espacio-md)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-texto)' }}>
              {conv.numero_cliente}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-texto)', opacity: 0.6 }}>
              {new Date(conv.creado_en).toLocaleString('es-PE')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacio-md)' }}>
            <span style={estiloInsignia[conv.estado]}>
              {etiquetaEstado[conv.estado]}
            </span>
            <Link
              to={`/canal-whatsapp/${conv.id}`}
              style={{
                color: 'var(--color-acento)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Ver detalle →
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}
