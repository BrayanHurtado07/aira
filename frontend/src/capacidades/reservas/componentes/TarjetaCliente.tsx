import { Phone, Mail } from 'lucide-react';
import { Insignia, insigniaPorEstado } from '@/compartido/interfaz/retroalimentacion/Insignia';
import type { Cliente } from '@/capacidades/reservas/contratos/tipos';

interface PropsTarjetaCliente {
  cliente: Cliente;
}

export function TarjetaCliente({ cliente }: PropsTarjetaCliente) {
  const iniciales = cliente.nombre
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        border: '1px solid var(--color-borde)',
        borderRadius: 'var(--radio-xl)',
        padding: 'var(--espacio-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--espacio-sm)',
        backgroundColor: 'var(--color-superficie)',
        transition: 'box-shadow var(--transicion)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--sombra-md)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Avatar + nombre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            backgroundColor: 'var(--insignia-exito-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-exito)',
            fontWeight: 700,
            fontSize: 'var(--tamano-sm)',
            flexShrink: 0,
          }}
        >
          {iniciales}
        </div>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: 'var(--tamano-sm)',
              fontWeight: 600,
              color: 'var(--color-texto)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {cliente.nombre}
          </p>
          <Insignia variante={insigniaPorEstado(cliente.estado)}>
            {cliente.estado === 'ACTIVO' ? 'Activo' : cliente.estado === 'INACTIVO' ? 'Inactivo' : 'Bloqueado'}
          </Insignia>
        </div>
      </div>

      {/* Datos de contacto */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Phone size={12} style={{ color: 'var(--color-texto-suave)', flexShrink: 0 }} />
          <span
            style={{
              fontSize: 'var(--tamano-xs)',
              color: 'var(--color-texto-suave)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {cliente.telefono}
          </span>
        </div>

        {cliente.correo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Mail size={12} style={{ color: 'var(--color-texto-suave)', flexShrink: 0 }} />
            <span
              style={{
                fontSize: 'var(--tamano-xs)',
                color: 'var(--color-texto-suave)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {cliente.correo}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
