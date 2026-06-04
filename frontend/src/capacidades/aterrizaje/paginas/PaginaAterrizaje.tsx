import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import '../estilos/aterrizaje.css';

import { NavegacionAterrizaje } from '../componentes/NavegacionAterrizaje';
import { HeroAterrizaje } from '../componentes/HeroAterrizaje';
import { SeccionCaracteristicas } from '../componentes/SeccionCaracteristicas';
import { SeccionComoFunciona } from '../componentes/SeccionComoFunciona';
import { SeccionPlanes } from '../componentes/SeccionPlanes';
import { PieAterrizaje } from '../componentes/PieAterrizaje';
import { usarReveal } from '../ganchos/usarReveal';

const ITEMS_MARQUEE = [
  'Reservas', 'Barberos', 'Clientes', 'Lealtad',
  'WhatsApp', 'Pagos', 'Reportes', 'Sedes',
];

export function PaginaAterrizaje() {
  useEffect(() => {
    document.documentElement.style.scrollPaddingTop = '5rem';
    return () => {
      document.documentElement.style.scrollPaddingTop = '';
    };
  }, []);

  return (
    <div className="aterrizaje">
      <NavegacionAterrizaje />
      <HeroAterrizaje />

      {/* ── Marquee ── */}
      <div className="marquee-aterrizaje" aria-hidden>
        {/* Duplicado para bucle continuo sin salto */}
        <div className="marquee-aterrizaje__pista">
          {[...ITEMS_MARQUEE, ...ITEMS_MARQUEE].map((item, i) => (
            <span key={i} className="marquee-aterrizaje__item">
              {item}
            </span>
          ))}
        </div>
      </div>

      <SeccionCaracteristicas />
      <SeccionComoFunciona />
      <SeccionPlanes />

      {/* ── CTA final ── */}
      <CtaFinal />

      <PieAterrizaje />
    </div>
  );
}

function CtaFinal() {
  const ref = usarReveal();

  return (
    <section className="cta-aterrizaje">
      <div className="aterrizaje__contenedor">
        <div ref={ref} className="revelar">
          <h2 className="cta-aterrizaje__titulo">
            Tu barbería merece más<br />que una libreta de papel.
          </h2>
          <p className="cta-aterrizaje__subtitulo">
            Únete a más de 500 barberías que ya gestionan su negocio con AIRA.
          </p>
          <Link to="/iniciar-sesion" className="cta-aterrizaje__boton">
            Empieza hoy, gratis
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
