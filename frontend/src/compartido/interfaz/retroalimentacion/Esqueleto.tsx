
interface PropiedadesEsqueleto {
  ancho?: string;
  alto?: string;
  radio?: string;
  variante?: 'texto' | 'rectangular' | 'circular';
  className?: string;
}

export function Esqueleto({
  ancho = '100%',
  alto = '1rem',
  radio,
  variante = 'rectangular',
  className,
}: PropiedadesEsqueleto) {
  const radioCalculado =
    radio ??
    (variante === 'circular' ? '50%' : variante === 'texto' ? 'var(--radio-sm)' : 'var(--radio-md)');

  return (
    <div
      className={className}
      style={{
        width: ancho,
        height: alto,
        borderRadius: radioCalculado,
        backgroundColor: 'var(--color-borde)',
        animation: 'esqueleto-pulsar 1.5s ease-in-out infinite',
        flexShrink: 0,
      }}
    />
  );
}

interface PropiedadesEsqueletoFila {
  columnas?: number;
  filas?: number;
}

export function EsqueletoTabla({ columnas = 4, filas = 5 }: PropiedadesEsqueletoFila) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: 'var(--espacio-md)' }}>
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 'var(--espacio-md)', alignItems: 'center' }}>
          {Array.from({ length: columnas }).map((_, j) => (
            <Esqueleto
              key={j}
              variante="texto"
              ancho={j === 0 ? '30%' : j === columnas - 1 ? '10%' : '20%'}
              alto="0.875rem"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EsqueletoFormulario({ campos = 4 }: { campos?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-lg)' }}>
      {Array.from({ length: campos }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <Esqueleto variante="texto" ancho="8rem" alto="0.75rem" />
          <Esqueleto variante="rectangular" alto="2.25rem" />
        </div>
      ))}
    </div>
  );
}
