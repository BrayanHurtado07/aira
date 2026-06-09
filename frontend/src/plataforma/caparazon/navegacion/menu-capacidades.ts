import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, CalendarCheck, Users, ListOrdered,
  Scissors, Wrench, Tag, MessageCircle, Bell, FileText,
  Award, Package, Building2, Shield, CreditCard,
} from 'lucide-react';

export type GrupoMenu =
  | 'principal'
  | 'reservas'
  | 'agenda'
  | 'comunicacion'
  | 'negocio'
  | 'sistema';

export const ETIQUETAS_GRUPO: Record<GrupoMenu, string> = {
  principal:   '',
  reservas:    'Reservas',
  agenda:      'Agenda',
  comunicacion:'Comunicación',
  negocio:     'Negocio',
  sistema:     'Sistema',
};

export type ItemMenu = {
  etiqueta: string;
  ruta: string;
  Icono: LucideIcon;
  grupo: GrupoMenu;
  soloAdmin?: boolean;
};

export const MENU_CAPACIDADES: ItemMenu[] = [
  // ── Principal ──────────────────────────────────────────────────────
  { etiqueta: 'Tablero',        ruta: '/tablero',                Icono: LayoutDashboard, grupo: 'principal' },

  // ── Reservas ───────────────────────────────────────────────────────
  { etiqueta: 'Reservas',       ruta: '/reservas',               Icono: CalendarCheck,   grupo: 'reservas' },
  { etiqueta: 'Clientes',       ruta: '/reservas/clientes',      Icono: Users,           grupo: 'reservas' },
  { etiqueta: 'Lista espera',   ruta: '/reservas/lista-espera',  Icono: ListOrdered,     grupo: 'reservas',  soloAdmin: true },

  // ── Agenda ─────────────────────────────────────────────────────────
  { etiqueta: 'Barberos',       ruta: '/agenda/barberos',        Icono: Scissors,        grupo: 'agenda',    soloAdmin: true },
  { etiqueta: 'Servicios',      ruta: '/agenda/servicios',       Icono: Wrench,          grupo: 'agenda',    soloAdmin: true },
  { etiqueta: 'Tarifas esp.',   ruta: '/agenda/tarifas',         Icono: Tag,             grupo: 'agenda',    soloAdmin: true },

  // ── Comunicación ───────────────────────────────────────────────────
  { etiqueta: 'Canal WhatsApp', ruta: '/canal-whatsapp',         Icono: MessageCircle,   grupo: 'comunicacion', soloAdmin: true },
  { etiqueta: 'Notificaciones', ruta: '/notificaciones',         Icono: Bell,            grupo: 'comunicacion', soloAdmin: true },
  { etiqueta: 'Plantillas',     ruta: '/plantillas',             Icono: FileText,        grupo: 'comunicacion', soloAdmin: true },

  // ── Negocio ────────────────────────────────────────────────────────
  { etiqueta: 'Lealtad',        ruta: '/lealtad',                Icono: Award,           grupo: 'negocio',   soloAdmin: true },
  { etiqueta: 'Inventario',     ruta: '/inventario',             Icono: Package,         grupo: 'negocio',   soloAdmin: true },

  // ── Sistema ────────────────────────────────────────────────────────
  { etiqueta: 'Organización',   ruta: '/organizacion',           Icono: Building2,       grupo: 'sistema',   soloAdmin: true },
  { etiqueta: 'Accesos',        ruta: '/gobierno-acceso',        Icono: Shield,          grupo: 'sistema',   soloAdmin: true },
  { etiqueta: 'Suscripción',    ruta: '/monetizacion',           Icono: CreditCard,      grupo: 'sistema',   soloAdmin: true },
];
