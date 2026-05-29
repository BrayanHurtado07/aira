import { GuardiaCapacidad } from '@/plataforma/activacion/GuardiaCapacidad'
import { usarConversaciones } from '../ganchos/usarConversaciones'
import { usarMensajesNoLeidos } from '../ganchos/usarMensajesNoLeidos'
import { ListaConversaciones } from '../componentes/ListaConversaciones'

function ContenidoConversaciones() {
  const { conversaciones, cargando, error } = usarConversaciones()
  const { total: totalNoLeidos } = usarMensajesNoLeidos()

  return (
    <div style={{ padding: 'var(--espacio-md)', maxWidth: '800px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--espacio-md)',
        }}
      >
        <h1 style={{ color: 'var(--color-texto)', margin: 0, fontSize: '1.5rem' }}>
          Conversaciones WhatsApp
        </h1>

        {totalNoLeidos > 0 && (
          <span
            style={{
              backgroundColor: 'var(--color-acento)',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 'var(--radio-md)',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {totalNoLeidos} sin leer
          </span>
        )}
      </div>

      {error && (
        <p style={{ color: 'red', marginBottom: 'var(--espacio-md)' }}>
          No se pudieron cargar las conversaciones.
        </p>
      )}

      <ListaConversaciones items={conversaciones} cargando={cargando} />
    </div>
  )
}

export function PaginaConversaciones() {
  return (
    <GuardiaCapacidad codigo="CANAL_WHATSAPP">
      <ContenidoConversaciones />
    </GuardiaCapacidad>
  )
}
