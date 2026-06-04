import { Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PieAterrizaje() {
  return (
    <footer className="pie-aterrizaje">
      {/* Franja tricolor roja-azul-blanca */}
      <div className="pie-aterrizaje__tricolor">
        <div className="pie-aterrizaje__tricolor-seg" style={{ background: 'var(--landing-rojo)' }} />
        <div className="pie-aterrizaje__tricolor-seg" style={{ background: 'var(--landing-azul)' }} />
        <div className="pie-aterrizaje__tricolor-seg" style={{ background: 'var(--landing-blanco)' }} />
      </div>

      <div className="aterrizaje__contenedor pie-aterrizaje__inner">
        <div className="pie-aterrizaje__grid">
          <div>
            <div className="pie-aterrizaje__marca">
              AI<em>RA</em>
            </div>
            <p className="pie-aterrizaje__tagline">
              La plataforma de gestión para barberías modernas. Reservas,
              equipo y lealtad en un solo lugar.
            </p>
          </div>

          <div>
            <p className="pie-aterrizaje__grupo-titulo">Producto</p>
            <ul className="pie-aterrizaje__grupo-enlaces">
              <li>
                <a href="#caracteristicas" className="pie-aterrizaje__enlace">
                  Características
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="pie-aterrizaje__enlace">
                  Cómo funciona
                </a>
              </li>
              <li>
                <a href="#planes" className="pie-aterrizaje__enlace">
                  Planes
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="pie-aterrizaje__grupo-titulo">Cuenta</p>
            <ul className="pie-aterrizaje__grupo-enlaces">
              <li>
                <Link to="/iniciar-sesion" className="pie-aterrizaje__enlace">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link to="/solicitar-reset" className="pie-aterrizaje__enlace">
                  Recuperar contraseña
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pie-aterrizaje__base">
          <p className="pie-aterrizaje__copyright">
            © {new Date().getFullYear()} AIRA — Serbio Barbería. Todos los derechos reservados.
          </p>
          <div className="pie-aterrizaje__poste-mini" aria-hidden>
            <div className="pie-aterrizaje__franja" style={{ background: 'var(--landing-rojo)' }} />
            <div className="pie-aterrizaje__franja" style={{ background: 'var(--landing-blanco)' }} />
            <div className="pie-aterrizaje__franja" style={{ background: 'var(--landing-azul)' }} />
            <Scissors size={14} style={{ color: 'rgba(248,245,240,0.35)', marginLeft: '0.25rem' }} />
          </div>
        </div>
      </div>
    </footer>
  );
}
