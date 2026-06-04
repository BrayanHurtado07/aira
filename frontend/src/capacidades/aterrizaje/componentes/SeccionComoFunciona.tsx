import { Building2, Settings, CalendarCheck, type LucideIcon } from 'lucide-react';
import { usarReveal } from '../ganchos/usarReveal';

const PASOS = [
  {
    numero: '01',
    Icono: Building2,
    titulo: 'Registra tu barbería',
    descripcion:
      'Crea tu cuenta, configura tu empresa y sedes. Listo en menos de 5 minutos, sin tarjeta de crédito.',
  },
  {
    numero: '02',
    Icono: Settings,
    titulo: 'Configura tu equipo',
    descripcion:
      'Agrega barberos, define servicios, precios y disponibilidad. AIRA aprende cómo trabaja tu negocio.',
  },
  {
    numero: '03',
    Icono: CalendarCheck,
    titulo: 'Empieza a recibir reservas',
    descripcion:
      'Comparte tu enlace de WhatsApp. Tus clientes ya pueden agendar. Tú ya puedes descansar.',
  },
] as const;

export function SeccionComoFunciona() {
  const refCabecera = usarReveal();

  return (
    <section id="como-funciona" className="como-funciona-aterrizaje">
      <div className="aterrizaje__contenedor">
        <div ref={refCabecera} className="como-funciona-aterrizaje__cabecera revelar">
          <span className="seccion-eyebrow">Sin complicaciones</span>
          <h2 className="seccion-titulo seccion-titulo--claro">
            Tres pasos para modernizar tu barbería
          </h2>
          <p className="seccion-descripcion seccion-descripcion--claro">
            No necesitas ser técnico. Si sabes usar WhatsApp, sabes usar AIRA.
          </p>
        </div>

        <div className="como-funciona-aterrizaje__pasos">
          {PASOS.map(({ numero, Icono, titulo, descripcion }, i) => (
            <TarjetaPaso
              key={numero}
              numero={numero}
              Icono={Icono}
              titulo={titulo}
              descripcion={descripcion}
              delay={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type Props = {
  numero: string;
  Icono: LucideIcon;
  titulo: string;
  descripcion: string;
  delay: number;
};

function TarjetaPaso({ numero, Icono, titulo, descripcion, delay }: Props) {
  const ref = usarReveal();
  const delayClass = delay > 0 ? ` revelar-delay-${delay}` : '';

  return (
    <div ref={ref} className={`paso-tarjeta revelar${delayClass}`}>
      <div className="paso-tarjeta__numero">{numero}</div>
      <div className="paso-tarjeta__icono-wrap">
        <Icono size={20} />
      </div>
      <h3 className="paso-tarjeta__titulo">{titulo}</h3>
      <p className="paso-tarjeta__descripcion">{descripcion}</p>
    </div>
  );
}
