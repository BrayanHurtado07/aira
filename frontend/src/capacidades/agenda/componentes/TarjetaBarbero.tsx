import { Scissors } from 'lucide-react';
import { Insignia, insigniaPorEstado } from '@/compartido/interfaz/retroalimentacion/Insignia';
import type { Barbero } from '@/capacidades/agenda/contratos/tipos';

interface PropsTarjetaBarbero {
  barbero: Barbero;
}

export function TarjetaBarbero({ barbero }: PropsTarjetaBarbero) {
  const iniciales = barbero.nombre
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
            backgroundColor: 'rgba(52,82,204,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primario)',
            fontWeight: 700,
            fontSize: 'var(--tamano-sm)',
            flexShrink: 0,
          }}
        >
          {iniciales || <Scissors size={16} />}
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
            {barbero.nombre}
          </p>
          {barbero.especialidad && (
            <p
              style={{
                fontSize: 'var(--tamano-xs)',
                color: 'var(--color-texto-suave)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {barbero.especialidad}
            </p>
          )}
        </div>
      </div>

      <Insignia variante={insigniaPorEstado(barbero.estado)}>
        {barbero.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
      </Insignia>
    </div>
  );
}
