export type ItemMenu = {
  etiqueta: string;
  ruta: string;
  icono: string;
  capacidad?: string;
  /** Roles que pueden ver este item. Undefined = visible para todos. */
  soloAdmin?: boolean;
};

export const MENU_CAPACIDADES: ItemMenu[] = [
  { etiqueta: 'Tablero',        ruta: '/tablero',           icono: '⊞' },
  { etiqueta: 'Reservas',       ruta: '/reservas',          icono: '📅' },
  { etiqueta: 'Clientes',       ruta: '/reservas/clientes', icono: '👥' },
  { etiqueta: 'Barberos',       ruta: '/agenda/barberos',   icono: '✂️',  soloAdmin: true },
  { etiqueta: 'Servicios',      ruta: '/agenda/servicios',  icono: '🗓️', soloAdmin: true },
  { etiqueta: 'Tarifas esp.',   ruta: '/agenda/tarifas',    icono: '🏷️', soloAdmin: true },
  { etiqueta: 'Canal WhatsApp', ruta: '/canal-whatsapp',    icono: '💬', capacidad: 'CANAL_WHATSAPP', soloAdmin: true },
  { etiqueta: 'Lealtad',        ruta: '/lealtad',           icono: '⭐', capacidad: 'LEALTAD', soloAdmin: true },
  { etiqueta: 'Inventario',      ruta: '/inventario',        icono: '📦', soloAdmin: true },
  { etiqueta: 'Lista espera',    ruta: '/reservas/lista-espera', icono: '⏳', soloAdmin: true },
  { etiqueta: 'Notificaciones', ruta: '/notificaciones',    icono: '🔔', soloAdmin: true },
  { etiqueta: 'Plantillas',     ruta: '/plantillas',        icono: '📄', soloAdmin: true },
  { etiqueta: 'Organización',   ruta: '/organizacion',      icono: '🏢', soloAdmin: true },
  { etiqueta: 'Accesos',        ruta: '/gobierno-acceso',   icono: '🔑', soloAdmin: true },
  { etiqueta: 'Suscripción',    ruta: '/monetizacion',      icono: '💳', soloAdmin: true },
];
