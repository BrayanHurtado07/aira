import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, CalendarDays, MessageCircle,
  Star, Bell, Building2, Shield, CreditCard,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { MENU_CAPACIDADES } from '../navegacion/menu-capacidades';
import { usarAlmacenSesion } from '@/plataforma/identidad/almacen-sesion';

interface Props {
  /** Estado de apertura en móvil */
  abierta: boolean;
  /** Callback para cerrar la barra (al navegar en móvil) */
  alCerrar: () => void;
}

const ICONOS_MENU: Record<string, LucideIcon> = {
  '⊞': LayoutDashboard,
  '📅': Calendar,
  '👥': Users,
  '🗓️': CalendarDays,
  '💬': MessageCircle,
  '⭐': Star,
  '🔔': Bell,
  '🏢': Building2,
  '🔑': Shield,
  '💳': CreditCard,
};

// Rutas padre → no marcar activa cuando estamos en sub-ruta
function esRutaPadre(ruta: string): boolean {
  return MENU_CAPACIDADES.some(
    (otro) => otro.ruta !== ruta && otro.ruta.startsWith(ruta + '/'),
  );
}

export function BarraLateralCaparazon({ abierta, alCerrar }: Props) {
  const nombreRol = usarAlmacenSesion((s) => s.sesion?.nombreRol ?? '')
  const esAdmin = !nombreRol || nombreRol.toUpperCase().includes('ADMIN')
  const itemsVisibles = MENU_CAPACIDADES.filter(item => esAdmin || !item.soloAdmin)

  return (
    <aside
      className={[
        'barra-lateral-caparazon',
        abierta ? 'barra-lateral-caparazon--abierta' : '',
      ].filter(Boolean).join(' ')}
      style={{
        backgroundColor: '#111111',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        borderRight: '1px solid #1E1E1E',
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          padding: '1.25rem 1rem',
          borderBottom: '1px solid #1E1E1E',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #C9A84C 0%, #8B6A1F 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 800,
              color: '#111',
              flexShrink: 0,
            }}
          >
            S
          </div>
          <div>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#C9A84C', margin: 0, letterSpacing: '-0.02em' }}>
              Serbio
            </p>
            <p style={{ fontSize: '0.625rem', color: '#555', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {esAdmin ? 'Barbería Admin' : 'Panel Barbero'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Navegación ── */}
      <nav style={{ flex: 1, padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {itemsVisibles.map((item) => {
          const Icono = ICONOS_MENU[item.icono] ?? LayoutDashboard;
          return (
            <NavLink
              key={item.ruta}
              to={item.ruta}
              end={esRutaPadre(item.ruta)}
              onClick={alCerrar}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#C9A84C' : 'rgba(255,255,255,0.4)',
                backgroundColor: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
                borderLeft: isActive ? '2px solid #C9A84C' : '2px solid transparent',
                textDecoration: 'none',
                transition: 'all 150ms ease',
                outline: 'none',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icono
                    size={15}
                    style={{ flexShrink: 0, opacity: isActive ? 1 : 0.5 }}
                  />
                  <span>{item.etiqueta}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Pie ── */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid #1E1E1E',
          flexShrink: 0,
        }}
      >
        <p style={{ fontSize: '0.6875rem', color: '#3D3D3D', margin: 0, textAlign: 'center' }}>
          Serbio v0.1.0 · Codeplex
        </p>
      </div>
    </aside>
  );
}
