import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, ArrowRight } from 'lucide-react';

export function NavegacionAterrizaje() {
  const [conFondo, setConFondo] = useState(false);

  useEffect(() => {
    const manejarScroll = () => setConFondo(window.scrollY > 60);
    window.addEventListener('scroll', manejarScroll, { passive: true });
    return () => window.removeEventListener('scroll', manejarScroll);
  }, []);

  return (
    <nav className={`nav-aterrizaje${conFondo ? ' --con-fondo' : ''}`}>
      <div className="aterrizaje__contenedor">
        <div className="nav-aterrizaje__inner">
          <Link to="/" className="nav-aterrizaje__logo">
            <Scissors size={20} className="nav-aterrizaje__logo-icono" />
            <span>
              AI<span className="nav-aterrizaje__logo-acento">RA</span>
            </span>
          </Link>

          <ul className="nav-aterrizaje__enlaces">
            <li>
              <a href="#caracteristicas" className="nav-aterrizaje__enlace">
                Características
              </a>
            </li>
            <li>
              <a href="#como-funciona" className="nav-aterrizaje__enlace">
                Cómo funciona
              </a>
            </li>
            <li>
              <a href="#planes" className="nav-aterrizaje__enlace">
                Planes
              </a>
            </li>
          </ul>

          <div className="nav-aterrizaje__acciones">
            <Link to="/iniciar-sesion" className="nav-aterrizaje__btn-entrar">
              Iniciar sesión
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
