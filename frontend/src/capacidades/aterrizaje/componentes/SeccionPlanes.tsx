import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usarReveal } from '../ganchos/usarReveal';

const PLANES = [
  {
    nombre: 'Básico',
    precio: 'S/. 49',
    descripcion: 'Para barberias que empiezan. Todo lo esencial para gestionar tu primer local.',
    destacado: false,
    badge: null,
    caracteristicas: [
      '1 sede',
      'Hasta 3 barberos',
      'Reservas ilimitadas',
      'Panel de gestión',
      'Soporte por correo',
    ],
  },
  {
    nombre: 'Pro',
    precio: 'S/. 99',
    descripcion: 'El favorito de los maestros. Automatización y lealtad para crecer.',
    destacado: true,
    badge: 'Más popular',
    caracteristicas: [
      'Hasta 3 sedes',
      'Hasta 10 barberos',
      'Reservas ilimitadas',
      'WhatsApp Bot (Serbio)',
      'Programa de lealtad',
      'Métricas avanzadas',
      'Soporte prioritario',
    ],
  },
  {
    nombre: 'Elite',
    precio: 'S/. 199',
    descripcion: 'Para cadenas y franquicias. Sin límites, con todo el poder de AIRA.',
    destacado: false,
    badge: null,
    caracteristicas: [
      'Sedes ilimitadas',
      'Barberos ilimitados',
      'Reservas ilimitadas',
      'WhatsApp Bot (Serbio)',
      'Lealtad multi-sede',
      'API acceso',
      'Gerente de cuenta dedicado',
    ],
  },
] as const;

export function SeccionPlanes() {
  const refCabecera = usarReveal();

  return (
    <section id="planes" className="planes-aterrizaje">
      <div className="aterrizaje__contenedor">
        <div ref={refCabecera} className="planes-aterrizaje__cabecera revelar">
          <span className="seccion-eyebrow">Precios simples</span>
          <h2 className="seccion-titulo">
            Elige el plan de tu barbería
          </h2>
          <p className="seccion-descripcion">
            Sin contratos largos. Sin sorpresas. Cancela cuando quieras.
          </p>
        </div>

        <div className="planes-aterrizaje__grid">
          {PLANES.map(({ nombre, precio, descripcion, destacado, badge, caracteristicas }, i) => (
            <TarjetaPlan
              key={nombre}
              nombre={nombre}
              precio={precio}
              descripcion={descripcion}
              destacado={destacado}
              badge={badge}
              caracteristicas={[...caracteristicas]}
              delay={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type Props = {
  nombre: string;
  precio: string;
  descripcion: string;
  destacado: boolean;
  badge: string | null;
  caracteristicas: string[];
  delay: number;
};

function TarjetaPlan({ nombre, precio, descripcion, destacado, badge, caracteristicas, delay }: Props) {
  const ref = usarReveal();
  const delayClass = delay > 0 ? ` revelar-delay-${delay}` : '';
  const claseDestacado = destacado ? ' plan-tarjeta--destacado' : '';

  return (
    <div ref={ref} className={`plan-tarjeta revelar${delayClass}${claseDestacado}`}>
      {badge && <span className="plan-tarjeta__badge">{badge}</span>}

      <p className="plan-tarjeta__nombre">{nombre}</p>
      <div className="plan-tarjeta__precio">
        {precio}
        <span>/mes</span>
      </div>
      <p className="plan-tarjeta__descripcion">{descripcion}</p>

      <ul className="plan-tarjeta__lista">
        {caracteristicas.map((item) => (
          <li key={item} className="plan-tarjeta__item">
            <Check size={14} className="plan-tarjeta__item-check" />
            {item}
          </li>
        ))}
      </ul>

      <Link
        to="/iniciar-sesion"
        className={`plan-tarjeta__boton ${destacado ? 'plan-tarjeta__boton--solido' : 'plan-tarjeta__boton--outline'}`}
      >
        {destacado ? 'Empezar con Pro' : 'Empezar gratis'}
      </Link>
    </div>
  );
}
