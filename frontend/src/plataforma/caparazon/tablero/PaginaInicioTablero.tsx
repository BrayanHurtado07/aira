import { motion } from 'framer-motion';
import { Calendar, Users, Scissors, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usarUsuarioActual } from '@/plataforma/identidad/ganchos/usarUsuarioActual';
import { usarContextoActivo } from '@/plataforma/contexto/ganchos/usarContextoActivo';
import { usarAlmacenSesion } from '@/plataforma/identidad/almacen-sesion';

const ACCIONES_RAPIDAS = [
  {
    icono: Calendar,
    titulo: 'Nueva reserva',
    descripcion: 'Registra una reserva de cliente',
    ruta: '/reservas/nueva',
    color: 'var(--color-primario)',
    colorSuave: 'rgba(52,82,204,0.08)',
  },
  {
    icono: Users,
    titulo: 'Gestión de barberos',
    descripcion: 'Administra tu equipo',
    ruta: '/agenda/barberos',
    color: 'var(--color-exito)',
    colorSuave: 'var(--color-exito-suave)',
  },
  {
    icono: Scissors,
    titulo: 'Servicios',
    descripcion: 'Administra los servicios',
    ruta: '/agenda/servicios',
    color: 'var(--color-advertencia)',
    colorSuave: 'var(--color-advertencia-suave)',
  },
  {
    icono: TrendingUp,
    titulo: 'Lealtad',
    descripcion: 'Programa de sellos',
    ruta: '/lealtad',
    color: 'var(--color-info)',
    colorSuave: 'var(--color-info-suave)',
  },
];

const ACCIONES_BARBERO = [
  {
    icono: Calendar,
    titulo: 'Nueva reserva',
    descripcion: 'Registra una reserva presencial',
    ruta: '/reservas/nueva',
    color: 'var(--color-primario)',
    colorSuave: 'rgba(52,82,204,0.08)',
  },
  {
    icono: Users,
    titulo: 'Mis reservas',
    descripcion: 'Ver el listado de reservas',
    ruta: '/reservas',
    color: 'var(--color-exito)',
    colorSuave: 'var(--color-exito-suave)',
  },
];

export function PaginaInicioTablero() {
  const usuario = usarUsuarioActual();
  const contexto = usarContextoActivo();
  const sesion = usarAlmacenSesion((s) => s.sesion)
  const esAdmin = !sesion?.nombreRol || sesion.nombreRol.toUpperCase().includes('ADMIN')
  const acciones = esAdmin ? ACCIONES_RAPIDAS : ACCIONES_BARBERO

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="pagina-tablero"
    >
      {/* Bienvenida */}
      <div>
        <h1
          style={{
            fontSize: 'var(--tamano-2xl)',
            fontWeight: 700,
            color: 'var(--color-texto)',
            letterSpacing: '-0.025em',
            margin: 0,
          }}
        >
          {saludo}{usuario.nombre ? `, ${usuario.nombre}` : ''}
        </h1>
        {contexto && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.375rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '99px',
                backgroundColor: 'rgba(52,82,204,0.08)',
                fontSize: 'var(--tamano-xs)',
                fontWeight: 500,
                color: 'var(--color-primario)',
              }}
            >
              {contexto.barberiaNombre}
            </span>
            {!esAdmin && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '99px',
                backgroundColor: 'rgba(217,119,6,0.1)',
                fontSize: 'var(--tamano-xs)',
                fontWeight: 500,
                color: 'var(--color-advertencia)',
              }}>
                {sesion?.nombreRol}
              </span>
            )}
            {contexto.sedeNombre && (
              <span
                style={{
                  fontSize: 'var(--tamano-xs)',
                  color: 'var(--color-texto-suave)',
                }}
              >
                · {contexto.sedeNombre}
              </span>
            )}
            {contexto.periodoLabel && (
              <span
                style={{
                  fontSize: 'var(--tamano-xs)',
                  color: 'var(--color-texto-suave)',
                }}
              >
                · {contexto.periodoLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      <div>
        <p
          style={{
            fontSize: 'var(--tamano-xs)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-texto-suave)',
            marginBottom: 'var(--espacio-md)',
          }}
        >
          Acciones rápidas
        </p>
        <div className="tablero-acciones-grid">
          {acciones.map((accion, i) => {
            const Icono = accion.icono;
            return (
              <motion.div
                key={accion.titulo}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <Link
                  to={accion.ruta}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      padding: 'var(--espacio-md)',
                      borderRadius: 'var(--radio-xl)',
                      border: '1px solid var(--color-borde)',
                      backgroundColor: 'var(--color-superficie)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      transition: 'box-shadow var(--transicion), transform var(--transicion)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = 'var(--sombra-md)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div
                      style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: 'var(--radio-lg)',
                        backgroundColor: accion.colorSuave,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: accion.color,
                      }}
                    >
                      <Icono size={18} />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 'var(--tamano-sm)',
                          fontWeight: 600,
                          color: 'var(--color-texto)',
                          margin: 0,
                        }}
                      >
                        {accion.titulo}
                      </p>
                      <p
                        style={{
                          fontSize: 'var(--tamano-xs)',
                          color: 'var(--color-texto-suave)',
                          margin: '0.125rem 0 0 0',
                        }}
                      >
                        {accion.descripcion}
                      </p>
                    </div>
                    <ArrowRight
                      size={14}
                      style={{ color: 'var(--color-texto-muted)', alignSelf: 'flex-end' }}
                    />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
