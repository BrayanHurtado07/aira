type TamanoAvatar = 'sm' | 'md' | 'lg';

type PropsAvatar = {
  nombre?: string | null;
  tamano?: TamanoAvatar;
  /** Muestra 2 iniciales (monograma) en vez de 1. 'Diego Ríos' → 'DR'. */
  monograma?: boolean;
  /** Asigna un color determinístico según el nombre (estable al reordenar). */
  colorAuto?: boolean;
  className?: string;
};

// Paleta de tokens — el índice se deriva del nombre, no de la posición en lista,
// para que el color de un barbero/cliente sea estable aunque se reordene la tabla.
const PALETA_AVATAR = [
  { fondo: 'var(--color-primario-suave)',    texto: 'var(--color-primario)' },
  { fondo: 'var(--color-info-suave)',        texto: 'var(--color-info)' },
  { fondo: 'var(--color-exito-suave)',       texto: 'var(--color-exito)' },
  { fondo: 'var(--color-advertencia-suave)', texto: 'var(--color-advertencia)' },
  { fondo: 'var(--color-acento-suave)',      texto: 'var(--color-primario)' },
] as const;

function inicialesDe(nombre: string, dos: boolean): string {
  const partes = nombre.split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (!dos || partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
}

function indicePaleta(nombre: string): number {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) | 0;
  return Math.abs(h) % PALETA_AVATAR.length;
}

// Avatar circular con la inicial (o monograma) del nombre. Único lugar donde vive
// este patrón (antes se reimplementaba en ~8 pantallas). Nunca crashea: si el
// nombre viene vacío/undefined, muestra '?'.
export function Avatar({ nombre, tamano = 'md', monograma = false, colorAuto = false, className }: PropsAvatar) {
  const limpio = (nombre ?? '').trim();
  const texto = limpio ? inicialesDe(limpio, monograma) : '?';
  const color = colorAuto && limpio ? PALETA_AVATAR[indicePaleta(limpio)] : null;

  const clases = [
    'buscador-avatar',
    tamano === 'sm' ? 'buscador-avatar--sm' : '',
    tamano === 'lg' ? 'buscador-avatar--lg' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={clases}
      aria-hidden="true"
      style={color ? { background: color.fondo, color: color.texto } : undefined}
    >
      {texto}
    </div>
  );
}
