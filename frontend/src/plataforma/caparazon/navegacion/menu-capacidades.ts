import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, CalendarCheck, Users, ListOrdered,
  Scissors, Wrench, Tag, MessageCircle, Bell, FileText,
  Award, Package, Building2, Shield, CreditCard, CalendarDays,
  UserCog, Star, DollarSign, Send,
} from 'lucide-react';
import type { Rol } from '@/plataforma/identidad/roles';
import { ROL } from '@/plataforma/identidad/roles';

export type GrupoMenu =
  | 'principal'
  | 'reservas'
  | 'agenda'
  | 'comunicacion'
  | 'negocio'
  | 'sistema'
  | 'plataforma';

export const ETIQUETAS_GRUPO: Record<GrupoMenu, string> = {
  principal:   '',
  reservas:    'Reservas',
  agenda:      'Agenda',
  comunicacion:'Comunicación',
  negocio:     'Negocio',
  sistema:     'Sistema',
  plataforma:  'Plataforma',
};

export type ItemMenu = {
  etiqueta: string;
  ruta: string;
  Icono: LucideIcon;
  grupo: GrupoMenu;
  dataTour?: string;
  // roles que pueden ver este item. Si undefined → todos los autenticados.
  rolesPermitidos?: Rol[];
};

export const MENU_CAPACIDADES: ItemMenu[] = [
  // ── Principal ──────────────────────────────────────────────────────────────
  { etiqueta: 'Tablero',        ruta: '/tablero',                Icono: LayoutDashboard, grupo: 'principal',   dataTour: 'nav-tablero',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA, ROL.BARBERO] },

  // ── Plataforma (solo SUPERADMIN) ───────────────────────────────────────────
  { etiqueta: 'Empresas',       ruta: '/superadmin',             Icono: UserCog,         grupo: 'plataforma',  dataTour: 'nav-empresas',
    rolesPermitidos: [ROL.SUPERADMIN] },

  // ── Reservas ───────────────────────────────────────────────────────────────
  { etiqueta: 'Reservas',       ruta: '/reservas',               Icono: CalendarCheck,   grupo: 'reservas',    dataTour: 'nav-reservas',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA, ROL.BARBERO, ROL.CLIENTE] },
  { etiqueta: 'Clientes',       ruta: '/reservas/clientes',      Icono: Users,           grupo: 'reservas',    dataTour: 'nav-clientes',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA] },
  { etiqueta: 'Lista espera',   ruta: '/reservas/lista-espera',  Icono: ListOrdered,     grupo: 'reservas',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA] },

  // ── Agenda ─────────────────────────────────────────────────────────────────
  { etiqueta: 'Mi agenda',      ruta: '/agenda/mi-agenda',       Icono: CalendarDays,    grupo: 'agenda',      dataTour: 'nav-mi-agenda',
    rolesPermitidos: [ROL.BARBERO] },
  { etiqueta: 'Barberos',       ruta: '/agenda/barberos',        Icono: Scissors,        grupo: 'agenda',      dataTour: 'nav-barberos',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA] },
  { etiqueta: 'Servicios',      ruta: '/agenda/servicios',       Icono: Wrench,          grupo: 'agenda',      dataTour: 'nav-servicios',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA] },
  { etiqueta: 'Tarifas esp.',   ruta: '/agenda/tarifas',         Icono: Tag,             grupo: 'agenda',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA] },

  // ── Comunicación ───────────────────────────────────────────────────────────
  { etiqueta: 'Canal WhatsApp', ruta: '/canal-whatsapp',         Icono: MessageCircle,   grupo: 'comunicacion', dataTour: 'nav-whatsapp',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA] },
  { etiqueta: 'Notificaciones', ruta: '/notificaciones',         Icono: Bell,            grupo: 'comunicacion',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA] },
  { etiqueta: 'Plantillas',     ruta: '/plantillas',             Icono: FileText,        grupo: 'comunicacion',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA] },
  { etiqueta: 'Campañas',       ruta: '/campanias',              Icono: Send,            grupo: 'comunicacion',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA] },

  // ── Negocio ────────────────────────────────────────────────────────────────
  { etiqueta: 'Lealtad',        ruta: '/lealtad',                Icono: Award,           grupo: 'negocio',     dataTour: 'nav-lealtad',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA, ROL.CLIENTE] },
  { etiqueta: 'Inventario',     ruta: '/inventario',             Icono: Package,         grupo: 'negocio',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA] },
  { etiqueta: 'Comisiones',     ruta: '/comisiones',             Icono: DollarSign,      grupo: 'negocio',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA] },
  { etiqueta: 'Reputación',     ruta: '/reputacion',             Icono: Star,            grupo: 'negocio',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA] },

  // ── Sistema ────────────────────────────────────────────────────────────────
  { etiqueta: 'Organización',   ruta: '/organizacion',           Icono: Building2,       grupo: 'sistema',     dataTour: 'nav-organizacion',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA] },
  { etiqueta: 'Accesos',        ruta: '/gobierno-acceso',        Icono: Shield,          grupo: 'sistema',     dataTour: 'nav-accesos',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA] },
  { etiqueta: 'Suscripción',    ruta: '/monetizacion',           Icono: CreditCard,      grupo: 'sistema',
    rolesPermitidos: [ROL.SUPERADMIN, ROL.ADMIN_BARBERIA] },
];
