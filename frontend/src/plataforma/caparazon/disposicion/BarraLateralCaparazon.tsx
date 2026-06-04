import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Calendar, CalendarDays, MessageCircle,
  Star, Bell, Building2, Shield, CreditCard,
  Users, Scissors,
  type LucideIcon,
} from 'lucide-react';
import { MENU_CAPACIDADES } from '../navegacion/menu-capacidades';
import { usarAlmacenSesion } from '@/plataforma/identidad/almacen-sesion';
import { springLento } from '@/plataforma/diseno/motion';

interface Props {
  abierta: boolean;
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

function esRutaPadre(ruta: string): boolean {
  return MENU_CAPACIDADES.some(
    (otro) => otro.ruta !== ruta && otro.ruta.startsWith(ruta + '/'),
  );
}

export function BarraLateralCaparazon({ abierta, alCerrar }: Props) {
  const nombreRol = usarAlmacenSesion((s) => s.sesion?.nombreRol ?? '');
  const esAdmin = !nombreRol || nombreRol.toUpperCase().includes('ADMIN');
  const itemsVisibles = MENU_CAPACIDADES.filter(item => esAdmin || !item.soloAdmin);

  return (
    <aside
      className={[
        'barra-lateral-caparazon',
        'barra-lateral-barberia',
        abierta ? 'barra-lateral-caparazon--abierta' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* ── Logo ── */}
      <div className="barra-lateral__logo-area">
        <motion.div
          className="barra-lateral__logo-icono"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          transition={springLento}
        >
          <Scissors size={14} />
        </motion.div>
        <div>
          <p className="barra-lateral__nombre">AIRA</p>
          <p className="barra-lateral__rol">
            {esAdmin ? 'Barbería Admin' : 'Panel Barbero'}
          </p>
        </div>
      </div>

      {/* ── Navegación con pill deslizante ── */}
      <nav className="barra-lateral__nav">
        {itemsVisibles.map((item) => {
          const Icono = ICONOS_MENU[item.icono] ?? LayoutDashboard;
          return (
            <NavLink
              key={item.ruta}
              to={item.ruta}
              end={esRutaPadre(item.ruta)}
              onClick={alCerrar}
              className={({ isActive }) =>
                ['barra-lateral__nav-item', isActive ? 'barra-lateral__nav-item--activo' : ''].filter(Boolean).join(' ')
              }
              style={{ position: 'relative' }}
            >
              {({ isActive }) => (
                <>
                  {/* Pill deslizante — se mueve con layoutId entre items activos */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="barra-lateral__nav-pill"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ ...springLento, duration: 0.22 }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '0.5rem',
                          background: 'rgba(204, 28, 46, 0.10)',
                          zIndex: 0,
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Indicador lateral */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        layoutId="nav-indicador"
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        exit={{ scaleY: 0, opacity: 0 }}
                        transition={springLento}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 3,
                          height: '1.125rem',
                          background: 'var(--color-primario)',
                          borderRadius: '0 3px 3px 0',
                          zIndex: 1,
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Contenido */}
                  <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Icono
                      size={15}
                      className="barra-lateral__nav-icono"
                      style={{ opacity: isActive ? 1 : 0.5 }}
                    />
                    <span>{item.etiqueta}</span>
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Pie ── */}
      <div className="barra-lateral__pie">
        <div className="barra-lateral__franja-tricolor">
          <span style={{ background: '#CC1C2E' }} />
          <span style={{ background: '#1B3A8C' }} />
          <span style={{ background: '#F8F5F0' }} />
        </div>
        <p className="barra-lateral__version">Serbio v0.1.0 · Codeplex</p>
      </div>
    </aside>
  );
}
