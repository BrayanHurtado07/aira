import { usarContextoActivo } from './ganchos/usarContextoActivo';

export function SelectorContexto() {
  const contexto = usarContextoActivo();

  if (!contexto) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--espacio-sm)',
        fontSize: 'var(--tamano-sm)',
        color: 'var(--color-texto-suave)',
        padding: '0.25rem 0.75rem',
        backgroundColor: 'var(--color-fondo)',
        borderRadius: 'var(--radio-lg)',
        border: '1px solid var(--color-borde)',
      }}
    >
      <span title="Barbería">{contexto.barberiaNombre}</span>
      <span>·</span>
      <span title="Sede">{contexto.sedeNombre}</span>
      <span>·</span>
      <span title="Período">{contexto.periodoLabel}</span>
    </div>
  );
}
