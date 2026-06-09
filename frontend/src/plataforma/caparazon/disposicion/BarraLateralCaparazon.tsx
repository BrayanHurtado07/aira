import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Scissors, ChevronLeft, ChevronRight } from 'lucide-react';
import { MENU_CAPACIDADES, ETIQUETAS_GRUPO } from '../navegacion/menu-capacidades';
import type { GrupoMenu } from '../navegacion/menu-capacidades';
import { usarAlmacenSesion } from '@/plataforma/identidad/almacen-sesion';
import { springLento } from '@/plataforma/diseno/motion';

// ── Grupos en orden de aparición ──────────────────────────────────────────────

const ORDEN_GRUPOS: GrupoMenu[] = ['principal', 'reservas', 'agenda', 'comunicacion', 'negocio', 'sistema'];

function esRutaPadre(ruta: string): boolean {
  return MENU_CAPACIDADES.some(
    (otro) => otro.ruta !== ruta && otro.ruta.startsWith(ruta + '/'),
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  abierta: boolean;
  alCerrar: () => void;
  colapsada: boolean;
  alToggleColapso: () => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function BarraLateralCaparazon({ abierta, alCerrar, colapsada, alToggleColapso }: Props) {
  const nombreRol = usarAlmacenSesion((s) => s.sesion?.nombreRol ?? '');
  const esAdmin   = !nombreRol || nombreRol.toUpperCase().includes('ADMIN');

  // En móvil (overlay abierto), siempre expandida
  const colapsadaActiva = colapsada && !abierta;

  const itemsVisibles = MENU_CAPACIDADES.filter((item) => esAdmin || !item.soloAdmin);
  const gruposConItems = ORDEN_GRUPOS.filter((g) =>
    itemsVisibles.some((item) => item.grupo === g),
  );

  return (
    <motion.aside
      className={[
        'barra-lateral-caparazon',
        'barra-lateral-barberia',
        abierta ? 'barra-lateral-caparazon--abierta' : '',
        colapsadaActiva ? 'barra-lateral-caparazon--colapsada' : '',
      ].filter(Boolean).join(' ')}
      animate={{ width: colapsadaActiva ? '3.5rem' : '15rem' }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
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

        <AnimatePresence initial={false}>
          {!colapsadaActiva && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}
            >
              <p className="barra-lateral__nombre">AIRA</p>
              <p className="barra-lateral__rol">
                {esAdmin ? 'Barbería Admin' : 'Panel Barbero'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón colapsar — solo desktop, oculto en mobile */}
        <button
          type="button"
          onClick={alToggleColapso}
          className="barra-lateral__btn-colapso"
          title={colapsadaActiva ? 'Expandir menú' : 'Colapsar menú'}
          aria-label={colapsadaActiva ? 'Expandir menú' : 'Colapsar menú'}
        >
          {colapsadaActiva ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* ── Navegación por grupos ── */}
      <nav className="barra-lateral__nav">
        {gruposConItems.map((grupo, gIdx) => {
          const items = itemsVisibles.filter((item) => item.grupo === grupo);
          const etiqueta = ETIQUETAS_GRUPO[grupo];

          return (
            <div key={grupo} className="barra-lateral__grupo">
              {/* Etiqueta del grupo */}
              <AnimatePresence initial={false}>
                {!colapsadaActiva && etiqueta && gIdx > 0 && (
                  <motion.p
                    className="barra-lateral__grupo-label"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {etiqueta}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Separador cuando colapsada */}
              {colapsadaActiva && gIdx > 0 && (
                <div className="barra-lateral__grupo-separador" />
              )}

              {items.map((item) => (
                <NavLink
                  key={item.ruta}
                  to={item.ruta}
                  end={esRutaPadre(item.ruta)}
                  onClick={alCerrar}
                  title={colapsadaActiva ? item.etiqueta : undefined}
                  className={({ isActive }) =>
                    [
                      'barra-lateral__nav-item',
                      isActive ? 'barra-lateral__nav-item--activo' : '',
                      colapsadaActiva ? 'barra-lateral__nav-item--colapsado' : '',
                    ].filter(Boolean).join(' ')
                  }
                  style={{ position: 'relative' }}
                >
                  {({ isActive }) => (
                    <>
                      {/* Pill activo */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.span
                            layoutId="nav-pill"
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
                      <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.625rem', width: '100%' }}>
                        <item.Icono
                          size={16}
                          className="barra-lateral__nav-icono"
                          aria-hidden="true"
                        />
                        <AnimatePresence initial={false}>
                          {!colapsadaActiva && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="barra-lateral__nav-etiqueta"
                            >
                              {item.etiqueta}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
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
        <AnimatePresence initial={false}>
          {!colapsadaActiva && (
            <motion.p
              className="barra-lateral__version"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              AIRA v0.1.0 · Codeplex
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
