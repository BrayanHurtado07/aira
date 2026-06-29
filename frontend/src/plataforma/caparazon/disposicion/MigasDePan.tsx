import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface Miga {
  label: string;
  href?: string;
}

const MAPA_RUTAS: Record<string, Miga[]> = {
  '/tablero':               [{ label: 'Tablero' }],
  '/agenda/barberos':       [{ label: 'Agenda', href: '/agenda/barberos' }, { label: 'Barberos' }],
  '/agenda/servicios':      [{ label: 'Agenda', href: '/agenda/barberos' }, { label: 'Servicios' }],
  '/agenda/tarifas':        [{ label: 'Agenda', href: '/agenda/barberos' }, { label: 'Tarifas especiales' }],
  '/reservas':              [{ label: 'Reservas' }],
  '/reservas/clientes':     [{ label: 'Reservas', href: '/reservas' }, { label: 'Clientes' }],
  '/reservas/lista-espera': [{ label: 'Reservas', href: '/reservas' }, { label: 'Lista de espera' }],
  '/organizacion':          [{ label: 'Organización' }],
  '/gobierno-acceso':       [{ label: 'Gobierno de acceso' }],
  '/usuarios':              [{ label: 'Usuarios' }],
  '/canal-whatsapp':        [{ label: 'Canal WhatsApp' }],
  '/monetizacion':          [{ label: 'Monetización' }],
  '/lealtad':               [{ label: 'Lealtad' }],
  '/notificaciones':        [{ label: 'Notificaciones' }],
  '/plantillas':            [{ label: 'Notificaciones', href: '/notificaciones' }, { label: 'Plantillas' }],
  '/inventario':            [{ label: 'Inventario' }],
};

function resolverMigas(pathname: string): Miga[] {
  if (MAPA_RUTAS[pathname]) return MAPA_RUTAS[pathname];

  // Segmentos dinámicos: /reservas/:id, /canal-whatsapp/:id
  const segmentos = pathname.split('/').filter(Boolean);
  if (segmentos.length >= 2) {
    const base = `/${segmentos[0]}`;
    const baseLabel = MAPA_RUTAS[base]?.[0]?.label;
    if (baseLabel) return [{ label: baseLabel, href: base }, { label: 'Detalle' }];
  }

  // Fallback: capitalizar último segmento
  const ultimo = segmentos[segmentos.length - 1] ?? 'Inicio';
  return [{ label: ultimo.charAt(0).toUpperCase() + ultimo.slice(1).replace(/-/g, ' ') }];
}

export function MigasDePan() {
  const { pathname } = useLocation();
  const migas = resolverMigas(pathname);

  return (
    <nav className="migas-de-pan" aria-label="Ruta de navegación">
      <Link to="/tablero" className="miga-inicio" aria-label="Ir al tablero">
        <Home size={13} />
      </Link>

      {migas.map((miga, i) => {
        const esUltima = i === migas.length - 1;
        return (
          <span key={i} className="miga-grupo">
            <ChevronRight size={11} className="miga-separador" aria-hidden="true" />
            {miga.href && !esUltima ? (
              <Link to={miga.href} className="miga-enlace">{miga.label}</Link>
            ) : (
              <span className="miga-actual" aria-current="page">{miga.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
