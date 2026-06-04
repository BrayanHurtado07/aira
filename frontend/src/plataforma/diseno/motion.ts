/**
 * Constantes de spring para Motion/React — estilo Emil Kowalski.
 * SOLO para micro-interacciones: hover, press, mount.
 * No usar para: scroll, parallax, animaciones continuas.
 */

export const springTactil = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 28,
  mass: 0.8,
};

export const springSuave = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 24,
  mass: 0.9,
};

export const springLento = {
  type: 'spring' as const,
  stiffness: 180,
  damping: 22,
  mass: 1,
};

/** Variante de entrada estándar para listas escalonadas */
export const varianteItem = {
  oculto:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

/** Contenedor para stagger de lista */
export const varianteLista = {
  oculto:  {},
  visible: { transition: { staggerChildren: 0.05 } },
};

/** Duración máxima de stagger para n items — evita que listas largas sean lentas */
export function delayItem(indice: number, max = 6): number {
  return Math.min(indice, max) * 0.055;
}
