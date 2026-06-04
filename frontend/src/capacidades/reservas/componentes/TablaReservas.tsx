import { User } from 'lucide-react';
import { EstadoReserva } from '@/capacidades/reservas/componentes/EstadoReserva';
import { GuardiaPermiso } from '@/plataforma/activacion/GuardiaPermiso';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { usarBarberos } from '@/capacidades/agenda/ganchos/usarBarberos';
import type { Reserva } from '@/capacidades/reservas/contratos/tipos';

interface PropsTablaReservas {
  reservas: Reserva[];
  alConfirmar: (id: string) => void;
  alCancelar: (id: string) => void;
  alCompletar: (id: string) => void;
  ejecutando: boolean;
}

const ETIQUETA_ORIGEN: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  WEB: 'Web',
  MANUAL: 'Presencial',
};

const estiloTh: React.CSSProperties = {
  padding: '0.625rem 1rem',
  textAlign: 'left',
  fontSize: 'var(--tamano-xs)',
  fontWeight: 600,
  color: 'var(--color-texto-suave)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
};

const estiloTd: React.CSSProperties = {
  padding: '0.875rem 1rem',
  fontSize: 'var(--tamano-sm)',
  color: 'var(--color-texto)',
  verticalAlign: 'middle',
};

export function TablaReservas({
  reservas,
  alConfirmar,
  alCancelar,
  alCompletar,
  ejecutando,
}: PropsTablaReservas) {
  const { barberos } = usarBarberos();
  const mapaBarberos = Object.fromEntries(barberos.map((b) => [b.id, b.nombre]));

  return (
    <div style={{ overflow: 'hidden', borderRadius: 'var(--radio-lg)', border: '1px solid var(--color-borde)', backgroundColor: 'var(--color-superficie)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-borde)', backgroundColor: 'var(--color-superficie-2)' }}>
              <th style={estiloTh}>Cliente</th>
              <th style={estiloTh}>Barbero</th>
              <th style={estiloTh}>Origen</th>
              <th style={estiloTh}>Fecha</th>
              <th style={estiloTh}>Estado</th>
              <th style={estiloTh}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservas.map((reserva) => (
              <tr
                key={reserva.id}
                style={{ borderBottom: '1px solid var(--color-borde-suave)', transition: 'background-color var(--transicion)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-superficie-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {/* Cliente — avatar genérico, sin UUID */}
                <td style={estiloTd}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: '1.75rem',
                        height: '1.75rem',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-superficie-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-texto-muted)',
                        flexShrink: 0,
                      }}
                    >
                      <User size={12} />
                    </div>
                    <span style={{ color: 'var(--color-texto-suave)', fontSize: 'var(--tamano-xs)' }}>
                      Cliente registrado
                    </span>
                  </div>
                </td>

                {/* Barbero — nombre real */}
                <td style={{ ...estiloTd, fontWeight: 500 }}>
                  {mapaBarberos[reserva.barbero_id] ?? (
                    <span style={{ color: 'var(--color-texto-muted)', fontStyle: 'italic' }}>—</span>
                  )}
                </td>

                <td style={estiloTd}>
                  {ETIQUETA_ORIGEN[reserva.origen] ?? reserva.origen}
                </td>

                <td style={{ ...estiloTd, color: 'var(--color-texto-suave)', whiteSpace: 'nowrap' }}>
                  {new Date(reserva.fecha_hora_inicio).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>

                <td style={estiloTd}>
                  <EstadoReserva estado={reserva.estado} />
                </td>

                <td style={estiloTd}>
                  <div style={{ display: 'flex', gap: 'var(--espacio-xs)', flexWrap: 'wrap' }}>
                    <GuardiaPermiso permiso="RESERVA_CONFIRMAR">
                      <Boton
                        variante="primario"
                        tamano="sm"
                        cargando={ejecutando}
                        onClick={() => alConfirmar(reserva.id)}
                        disabled={reserva.estado !== 'PENDIENTE'}
                      >
                        Confirmar
                      </Boton>
                    </GuardiaPermiso>
                    <GuardiaPermiso permiso="RESERVA_COMPLETAR">
                      <Boton
                        variante="secundario"
                        tamano="sm"
                        cargando={ejecutando}
                        onClick={() => alCompletar(reserva.id)}
                        disabled={reserva.estado !== 'CONFIRMADA'}
                      >
                        Completar
                      </Boton>
                    </GuardiaPermiso>
                    <GuardiaPermiso permiso="RESERVA_CANCELAR">
                      <Boton
                        variante="peligro"
                        tamano="sm"
                        cargando={ejecutando}
                        onClick={() => alCancelar(reserva.id)}
                        disabled={reserva.estado === 'CANCELADA' || reserva.estado === 'COMPLETADA'}
                      >
                        Cancelar
                      </Boton>
                    </GuardiaPermiso>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
