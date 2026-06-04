import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { PosteBarbero } from './PosteBarbero';

export function HeroAterrizaje() {
  return (
    <section className="hero-aterrizaje">
      <div className="aterrizaje__contenedor">
        <div className="hero-aterrizaje__inner">
          <div className="hero-aterrizaje__contenido">
            <span className="hero-aterrizaje__eyebrow">
              Gestión de Barbería SaaS
            </span>

            <h1 className="hero-aterrizaje__titulo">
              Cada corte
              <span className="hero-aterrizaje__titulo-acento">merece</span>
              una gestión perfecta.
            </h1>

            <p className="hero-aterrizaje__descripcion">
              AIRA automatiza reservas, gestiona tu equipo de barberos y
              fideliza clientes desde WhatsApp. Todo en un solo lugar,
              sin complicaciones.
            </p>

            <div className="hero-aterrizaje__acciones">
              <Link to="/iniciar-sesion" className="hero-aterrizaje__btn-principal">
                Empieza gratis
                <ArrowRight size={16} />
              </Link>
              <a href="#como-funciona" className="hero-aterrizaje__btn-secundario">
                <Play size={14} />
                Ver cómo funciona
              </a>
            </div>

            <div className="hero-aterrizaje__stats">
              <div>
                <div className="hero-aterrizaje__stat-numero">
                  +<em>500</em>
                </div>
                <div className="hero-aterrizaje__stat-label">Barberías activas</div>
              </div>
              <div>
                <div className="hero-aterrizaje__stat-numero">
                  +<em>50K</em>
                </div>
                <div className="hero-aterrizaje__stat-label">Cortes agendados</div>
              </div>
              <div>
                <div className="hero-aterrizaje__stat-numero">
                  <em>4.9</em>★
                </div>
                <div className="hero-aterrizaje__stat-label">Calificación</div>
              </div>
            </div>
          </div>

          <div className="hero-aterrizaje__visual">
            <PosteBarbero />
          </div>
        </div>
      </div>
    </section>
  );
}
