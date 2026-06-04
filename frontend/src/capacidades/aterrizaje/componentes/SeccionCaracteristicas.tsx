import { Calendar, Users, MessageSquare, Star, BarChart2, Shield, type LucideIcon } from 'lucide-react';
import { usarReveal } from '../ganchos/usarReveal';

const CARACTERISTICAS = [
  {
    Icono: Calendar,
    titulo: 'Reservas inteligentes',
    descripcion:
      'Agenda automática 24/7. Tus clientes reservan su corte desde WhatsApp sin que tengas que levantar el teléfono.',
  },
  {
    Icono: Users,
    titulo: 'Equipo bajo control',
    descripcion:
      'Gestiona barberos, horarios y disponibilidad desde un panel centralizado. Sin hojas de papel ni WhatsApp groups.',
  },
  {
    Icono: MessageSquare,
    titulo: 'WhatsApp integrado',
    descripcion:
      'Serbio responde, agenda y confirma reservas por WhatsApp automáticamente. Tu barbería nunca cierra.',
  },
  {
    Icono: Star,
    titulo: 'Programa de lealtad',
    descripcion:
      'Sellos digitales que premian a tus clientes frecuentes. Más retención, más cortes, más ingresos recurrentes.',
  },
  {
    Icono: BarChart2,
    titulo: 'Métricas en tiempo real',
    descripcion:
      'Reportes de ingresos, ocupación y rendimiento por barbero. Toma decisiones con datos, no con intuición.',
  },
  {
    Icono: Shield,
    titulo: 'Acceso por roles',
    descripcion:
      'Admin, barbero y recepcionista con permisos diferentes. Tu negocio seguro, cada quien ve solo lo que necesita.',
  },
] as const;

export function SeccionCaracteristicas() {
  const refCabecera = usarReveal();

  return (
    <section id="caracteristicas" className="caracteristicas-aterrizaje">
      <div className="aterrizaje__contenedor">
        <div ref={refCabecera} className="caracteristicas-aterrizaje__cabecera revelar">
          <span className="seccion-eyebrow">Todo lo que necesitas</span>
          <h2 className="seccion-titulo">
            Una plataforma. Todo tu negocio.
          </h2>
          <p className="seccion-descripcion">
            Desde la primera reserva hasta el reporte del mes, AIRA cubre
            cada parte de la operación de tu barbería.
          </p>
        </div>

        <div className="caracteristicas-aterrizaje__grid">
          {CARACTERISTICAS.map(({ Icono, titulo, descripcion }, i) => (
            <TarjetaCaracteristica
              key={titulo}
              Icono={Icono}
              titulo={titulo}
              descripcion={descripcion}
              delay={i % 3}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type Props = {
  Icono: LucideIcon;
  titulo: string;
  descripcion: string;
  delay: number;
};

function TarjetaCaracteristica({ Icono, titulo, descripcion, delay }: Props) {
  const ref = usarReveal();
  const delayClass = delay > 0 ? ` revelar-delay-${delay}` : '';

  return (
    <div ref={ref} className={`caracteristica-tarjeta revelar${delayClass}`}>
      <div className="caracteristica-tarjeta__icono">
        <Icono size={20} />
      </div>
      <h3 className="caracteristica-tarjeta__titulo">{titulo}</h3>
      <p className="caracteristica-tarjeta__descripcion">{descripcion}</p>
    </div>
  );
}
