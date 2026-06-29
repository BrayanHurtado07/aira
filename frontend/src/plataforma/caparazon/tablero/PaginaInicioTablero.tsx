import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  TrendingUp, TrendingDown, Minus,
  ClipboardList, DollarSign, Users,
  AlertCircle, Star, Scissors,
  RefreshCw, Download, Calendar,
  ChevronsUpDown, ChevronUp, ChevronDown,
  Plus, CalendarClock, Package, Award, ArrowRight, CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { usarUsuarioActual } from '@/plataforma/identidad/ganchos/usarUsuarioActual';
import { usarAlmacenSesion } from '@/plataforma/identidad/almacen-sesion';
import { Avatar } from '@/compartido/interfaz/primitivas/Avatar';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta';
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia';
import { usarMetricasTablero } from './ganchos/usarMetricasTablero';
import type { MetricasTablero, FiltroTablero } from './contratos/tipos';
import { springTactil, springSuave, delayItem } from '@/plataforma/diseno/motion';

// ── Helpers de fecha ──────────────────────────────────────────────────────────

function hoy(): string {
  return new Date().toISOString().split('T')[0];
}

function primerDiaSemana(): string {
  const d = new Date();
  // getDay(): 0=Dom..6=Sáb. Días transcurridos desde el lunes de ESTA semana.
  // Para domingo (0) son 6 días, no -1 (que saltaba al lunes de la próxima).
  const offset = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - offset);
  return d.toISOString().split('T')[0];
}

function primerDiaMes(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function ultimoDiaMes(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
}

function primerDiaAnio(): string {
  return `${new Date().getFullYear()}-01-01`;
}

const PRESETS = [
  { id: 'hoy',     etiqueta: 'Hoy',         inicio: hoy,           fin: hoy           },
  { id: 'semana',  etiqueta: 'Semana',       inicio: primerDiaSemana, fin: hoy         },
  { id: 'mes',     etiqueta: 'Mes actual',   inicio: primerDiaMes,  fin: ultimoDiaMes  },
  { id: 'anio',    etiqueta: 'Este año',     inicio: primerDiaAnio, fin: hoy           },
] as const;

type PresetId = typeof PRESETS[number]['id'];

function formatearMoneda(valor: number): string {
  return `S/. ${valor.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatearPct(valor: number): string {
  const signo = valor > 0 ? '+' : '';
  return `${signo}${valor.toFixed(1)}%`;
}

// ── Componente KPI individual ─────────────────────────────────────────────────

type PropsTarjetaKPI = {
  Icono: LucideIcon;
  etiqueta: string;
  valor: string;
  contexto?: string;
  tendencia?: number;
  colorIcono: string;
  fondoIcono: string;
  cargando: boolean;
  indice?: number;
};

function TarjetaKPI({ Icono, etiqueta, valor, contexto, tendencia, colorIcono, fondoIcono, cargando, indice = 0 }: PropsTarjetaKPI) {
  const claseTendencia =
    tendencia === undefined ? ''
    : tendencia > 0 ? 'tablero-kpi-tendencia--sube'
    : tendencia < 0 ? 'tablero-kpi-tendencia--baja'
    : 'tablero-kpi-tendencia--neutro';

  const IconoTendencia =
    tendencia !== undefined && tendencia > 0 ? TrendingUp
    : tendencia !== undefined && tendencia < 0 ? TrendingDown
    : Minus;

  return (
    <motion.div
      className="tablero-kpi-tarjeta"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springSuave, delay: delayItem(indice) }}
      whileHover={{ y: -3, transition: { ...springTactil, duration: 0.18 } }}
    >
      <div className="tablero-kpi-cabecera">
        <span className="tablero-kpi-etiqueta">{etiqueta}</span>
        <div className="tablero-kpi-icono" style={{ background: fondoIcono, color: colorIcono }}>
          <Icono size={14} />
        </div>
      </div>

      {cargando ? (
        <div className="tablero-kpi-skeleton" />
      ) : (
        <motion.div
          className="tablero-kpi-numero"
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...springSuave, delay: delayItem(indice) + 0.06 }}
        >
          {valor}
        </motion.div>
      )}

      {!cargando && contexto && (
        <p className="tablero-kpi-contexto">{contexto}</p>
      )}

      {!cargando && tendencia !== undefined && (
        <span className={`tablero-kpi-tendencia ${claseTendencia}`}>
          <IconoTendencia size={12} />
          {formatearPct(tendencia)} vs período anterior
        </span>
      )}
    </motion.div>
  );
}

// ── Sección 3A: Top servicios ─────────────────────────────────────────────────

function TablaServiciosTop({ datos, cargando }: { datos: MetricasTablero['servicios_top'] | undefined; cargando: boolean }) {
  return (
    <div className="tablero-panel" aria-busy={cargando}>
      <div className="tablero-panel-cabecera">
        <span className="tablero-panel-titulo">Top servicios</span>
        <Scissors size={14} style={{ color: 'var(--color-texto-suave)' }} />
      </div>
      <div className="tablero-panel-cuerpo">
        {cargando ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: '1.5rem', background: 'var(--color-borde)', borderRadius: 'var(--radio-md)', animation: 'esqueleto-pulsar 1.4s ease infinite' }} />
            ))}
          </div>
        ) : !datos?.length ? (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-texto-suave)', padding: '0.5rem 0' }}>
            Sin datos en el período
          </p>
        ) : (
          <table className="tablero-tabla-servicios">
            <thead>
              <tr>
                <th style={{ width: '1.5rem' }}>#</th>
                <th>Servicio</th>
                <th style={{ textAlign: 'center' }}>Veces</th>
                <th style={{ textAlign: 'right' }}>Ingreso</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((s, i) => (
                <tr key={s.id_servicio}>
                  <td className="tablero-pos">{i + 1}</td>
                  <td>{s.nombre}</td>
                  <td style={{ textAlign: 'center', color: 'var(--color-texto-suave)' }}>{s.veces_vendido}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-texto)' }}>
                    {formatearMoneda(s.ingreso_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Sección 3B: Origen de reservas ───────────────────────────────────────────

function PanelOrigen({ datos, cargando }: { datos: MetricasTablero['origen_reservas'] | undefined; cargando: boolean }) {
  const total = datos ? datos.whatsapp + datos.web + datos.manual : 0;
  const filas = datos
    ? [
        { etiqueta: 'WhatsApp', valor: datos.whatsapp, color: 'var(--color-whatsapp)' },
        { etiqueta: 'Web',      valor: datos.web,       color: 'var(--color-info)' },
        { etiqueta: 'Manual',   valor: datos.manual,    color: 'var(--color-advertencia)' },
      ]
    : [];

  return (
    <div className="tablero-panel" aria-busy={cargando}>
      <div className="tablero-panel-cabecera">
        <span className="tablero-panel-titulo">Origen de reservas</span>
        <Calendar size={14} style={{ color: 'var(--color-texto-suave)' }} />
      </div>
      <div className="tablero-panel-cuerpo">
        {cargando ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: '1.25rem', background: 'var(--color-borde)', borderRadius: 'var(--radio-md)', animation: 'esqueleto-pulsar 1.4s ease infinite' }} />
            ))}
          </div>
        ) : total === 0 ? (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-texto-suave)', padding: '0.5rem 0' }}>
            Sin reservas en el período
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {filas.map((f) => (
              <div key={f.etiqueta} className="tablero-barra-row">
                <span className="tablero-barra-etiqueta">{f.etiqueta}</span>
                <div className="tablero-barra-track">
                  <div
                    className="tablero-barra-fill"
                    style={{ width: `${total ? (f.valor / total) * 100 : 0}%`, background: f.color }}
                  />
                </div>
                <span className="tablero-barra-valor">{f.valor}</span>
              </div>
            ))}
            <p style={{ fontSize: '0.7rem', color: 'var(--color-texto-suave)', marginTop: '0.5rem' }}>
              {total} reservas totales en el período
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sección 4: Tabla rendimiento del equipo ───────────────────────────────────

type CampoOrden = 'reservas' | 'completadas' | 'ingresos' | 'rating_promedio' | 'comision_pendiente' | 'no_asistio';
type DireccionOrden = 'asc' | 'desc';

function EstrellaRating({ valor }: { valor: number }) {
  if (valor === 0) return <span style={{ color: 'var(--color-texto-muted)', fontSize: '0.75rem' }}>—</span>;
  return (
    <span className="tablero-rating">
      <Star size={11} fill="currentColor" />
      {valor.toFixed(1)}
    </span>
  );
}

type PropsColumna = {
  campo: CampoOrden;
  ordenActual: CampoOrden;
  direccion: DireccionOrden;
  alOrdenar: (c: CampoOrden) => void;
  children: React.ReactNode;
  alinear?: 'left' | 'right';
};

function ColumnaOrdenable({ campo, ordenActual, direccion, alOrdenar, children, alinear = 'right' }: PropsColumna) {
  const activo = ordenActual === campo;
  const Icono = activo ? (direccion === 'desc' ? ChevronDown : ChevronUp) : ChevronsUpDown;
  return (
    <th
      onClick={() => alOrdenar(campo)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          alOrdenar(campo);
        }
      }}
      tabIndex={0}
      role="columnheader"
      aria-sort={activo ? (direccion === 'desc' ? 'descending' : 'ascending') : 'none'}
      title={`Ordenar por ${typeof children === 'string' ? children : campo}`}
      style={{ textAlign: alinear, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', opacity: activo ? 1 : 0.7 }}>
        {children}
        <Icono size={10} />
      </span>
    </th>
  );
}

type PropsTablaEquipo = {
  barberos: MetricasTablero['barberos'] | undefined;
  cargando: boolean;
};

function TablaRendimientoEquipo({ barberos, cargando }: PropsTablaEquipo) {
  const [orden, setOrden] = useState<CampoOrden>('ingresos');
  const [direccion, setDireccion] = useState<DireccionOrden>('desc');

  const alternarOrden = useCallback((campo: CampoOrden) => {
    setDireccion((d) => (orden === campo ? (d === 'desc' ? 'asc' : 'desc') : 'desc'));
    setOrden(campo);
  }, [orden]);

  const ordenados = barberos
    ? [...barberos].sort((a, b) => {
        const va = a[orden];
        const vb = b[orden];
        return direccion === 'desc' ? (vb as number) - (va as number) : (va as number) - (vb as number);
      })
    : [];

  return (
    <div className="tablero-panel" aria-busy={cargando}>
      <div className="tablero-panel-cabecera">
        <span className="tablero-panel-titulo">Rendimiento del equipo</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-texto-suave)', fontFamily: 'var(--fuente-acento)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {cargando ? '—' : `${barberos?.length ?? 0} barberos activos`}
        </span>
      </div>

      {cargando ? (
        <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '2.25rem', background: 'var(--color-borde)', borderRadius: 'var(--radio-md)', animation: 'esqueleto-pulsar 1.4s ease infinite', opacity: 1 - i * 0.2 }} />
          ))}
        </div>
      ) : !ordenados.length ? (
        <div style={{ padding: '2rem 1.25rem', textAlign: 'center' }}>
          <Users size={24} style={{ color: 'var(--color-texto-muted)', margin: '0 auto 0.5rem' }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--color-texto-suave)' }}>Sin barberos activos</p>
        </div>
      ) : (
        <>
        <div className="tablero-equipo-tabla" style={{ overflowX: 'auto' }}>
          <table className="tablero-tabla-equipo">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Barbero</th>
                <ColumnaOrdenable campo="reservas" ordenActual={orden} direccion={direccion} alOrdenar={alternarOrden}>
                  Reservas
                </ColumnaOrdenable>
                <ColumnaOrdenable campo="completadas" ordenActual={orden} direccion={direccion} alOrdenar={alternarOrden}>
                  Completadas
                </ColumnaOrdenable>
                <ColumnaOrdenable campo="no_asistio" ordenActual={orden} direccion={direccion} alOrdenar={alternarOrden}>
                  No asistió
                </ColumnaOrdenable>
                <ColumnaOrdenable campo="ingresos" ordenActual={orden} direccion={direccion} alOrdenar={alternarOrden}>
                  Ingresos
                </ColumnaOrdenable>
                <ColumnaOrdenable campo="rating_promedio" ordenActual={orden} direccion={direccion} alOrdenar={alternarOrden}>
                  Rating
                </ColumnaOrdenable>
                <ColumnaOrdenable campo="comision_pendiente" ordenActual={orden} direccion={direccion} alOrdenar={alternarOrden}>
                  Comisión
                </ColumnaOrdenable>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((b, idx) => {
                const tasaComplecion = b.reservas > 0 ? Math.round((b.completadas / b.reservas) * 100) : 0;
                const tieneComision = b.comision_pendiente > 0;
                return (
                  <motion.tr
                    key={b.id_barbero}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springSuave, delay: delayItem(idx, 5) }}
                  >
                    {/* Nombre + avatar */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <Avatar nombre={b.nombre} monograma colorAuto />
                        <div>
                          <span className="tablero-barbero-nombre">{b.nombre}</span>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--color-texto-muted)', marginTop: '1px' }}>
                            {b.reservas > 0 ? `${tasaComplecion}% completado` : 'Sin reservas'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Reservas */}
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--color-texto)' }}>{b.reservas}</span>
                    </td>

                    {/* Completadas con mini barra */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-exito)' }}>{b.completadas}</span>
                        {b.reservas > 0 && (
                          <div style={{ width: '3rem', height: '3px', background: 'var(--color-borde)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${tasaComplecion}%`, height: '100%', background: 'var(--color-exito)', borderRadius: '99px' }} />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* No asistió */}
                    <td>
                      <span style={{ color: b.no_asistio > 0 ? 'var(--color-error)' : 'var(--color-texto-muted)', fontWeight: b.no_asistio > 0 ? 600 : 400 }}>
                        {b.no_asistio > 0 ? b.no_asistio : '—'}
                      </span>
                    </td>

                    {/* Ingresos */}
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--color-texto)', fontFamily: 'var(--fuente-display)', letterSpacing: '-0.02em' }}>
                        {formatearMoneda(b.ingresos)}
                      </span>
                    </td>

                    {/* Rating */}
                    <td><EstrellaRating valor={b.rating_promedio} /></td>

                    {/* Comisión pendiente */}
                    <td>
                      {tieneComision ? (
                        <Insignia variante="primario">{formatearMoneda(b.comision_pendiente)}</Insignia>
                      ) : (
                        <span style={{ color: 'var(--color-texto-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>

            {/* Fila de totales */}
            {ordenados.length > 1 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--color-borde)' }}>
                  <td style={{ fontFamily: 'var(--fuente-acento)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-texto-suave)', paddingTop: '0.75rem' }}>
                    Total equipo
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-texto)', paddingTop: '0.75rem' }}>
                    {ordenados.reduce((s, b) => s + b.reservas, 0)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-exito)', paddingTop: '0.75rem' }}>
                    {ordenados.reduce((s, b) => s + b.completadas, 0)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-error)', paddingTop: '0.75rem' }}>
                    {ordenados.reduce((s, b) => s + b.no_asistio, 0) || '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--fuente-display)', letterSpacing: '-0.02em', color: 'var(--color-texto)', paddingTop: '0.75rem' }}>
                    {formatearMoneda(ordenados.reduce((s, b) => s + b.ingresos, 0))}
                  </td>
                  <td style={{ paddingTop: '0.75rem' }} />
                  <td style={{ textAlign: 'right', paddingTop: '0.75rem' }}>
                    {ordenados.some((b) => b.comision_pendiente > 0) ? (
                      <Insignia variante="primario">
                        {formatearMoneda(ordenados.reduce((s, b) => s + b.comision_pendiente, 0))}
                      </Insignia>
                    ) : '—'}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Variante móvil: tarjetas apiladas (la tabla de 7 columnas no cabe en 360px) */}
        <ul className="tablero-equipo-cards" role="list">
          {ordenados.map((b) => {
            const tasaComplecion = b.reservas > 0 ? Math.round((b.completadas / b.reservas) * 100) : 0;
            return (
              <li key={b.id_barbero} className="tablero-equipo-card">
                <div className="tablero-equipo-card-cabecera">
                  <Avatar nombre={b.nombre} monograma colorAuto />
                  <div style={{ minWidth: 0 }}>
                    <span className="tablero-barbero-nombre">{b.nombre}</span>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-texto-muted)', marginTop: '1px' }}>
                      {b.reservas > 0 ? `${tasaComplecion}% completado` : 'Sin reservas'}
                    </div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontWeight: 700, fontFamily: 'var(--fuente-display)', letterSpacing: '-0.02em' }}>
                    {formatearMoneda(b.ingresos)}
                  </span>
                </div>
                <div className="tablero-equipo-card-stats">
                  <span>{b.reservas} reservas</span>
                  <span style={{ color: 'var(--color-exito)' }}>{b.completadas} comp.</span>
                  {b.no_asistio > 0 && <span style={{ color: 'var(--color-error)' }}>{b.no_asistio} no asist.</span>}
                  <EstrellaRating valor={b.rating_promedio} />
                  {b.comision_pendiente > 0 && (
                    <Insignia variante="primario">{formatearMoneda(b.comision_pendiente)}</Insignia>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        </>
      )}
    </div>
  );
}

// ── Exportar CSV ──────────────────────────────────────────────────────────────

function exportarCSV(datos: MetricasTablero, filtro: FiltroTablero) {
  const filas = [
    ['MÉTRICAS TABLERO AIRA', '', ''],
    [`Período: ${filtro.inicio} — ${filtro.fin}`, '', ''],
    ['', '', ''],
    ['RESUMEN DE RESERVAS', '', ''],
    ['Total', datos.reservas.total, ''],
    ['Completadas', datos.reservas.completadas, ''],
    ['Confirmadas', datos.reservas.confirmadas, ''],
    ['Pendientes', datos.reservas.pendientes, ''],
    ['Canceladas', datos.reservas.canceladas, ''],
    ['No asistió', datos.reservas.no_asistio, ''],
    ['Tasa de completado', `${(datos.reservas.tasa_completado * 100).toFixed(1)}%`, ''],
    ['', '', ''],
    ['INGRESOS', '', ''],
    ['Total', datos.ingresos.total, ''],
    ['Variación vs período anterior', `${datos.ingresos.variacion_pct.toFixed(1)}%`, ''],
    ['', '', ''],
    ['CLIENTES', '', ''],
    ['Total activos', datos.clientes.total, ''],
    ['Nuevos en el período', datos.clientes.nuevos, ''],
    ['', '', ''],
    ['TOP SERVICIOS', '', ''],
    ['Nombre', 'Veces vendido', 'Ingreso total'],
    ...datos.servicios_top.map((s) => [s.nombre, s.veces_vendido, s.ingreso_total]),
    ['', '', ''],
    ['RENDIMIENTO POR BARBERO', '', ''],
    ['Nombre', 'Reservas', 'Completadas', 'Ingresos', 'Rating'],
    ...datos.barberos.map((b) => [b.nombre, b.reservas, b.completadas, b.ingresos, b.rating_promedio.toFixed(1)]),
  ];

  const csv = filas.map((f) => f.join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tablero-aira-${filtro.inicio}-${filtro.fin}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Página principal ──────────────────────────────────────────────────────────

export function PaginaInicioTablero() {
  const usuario = usarUsuarioActual();
  const sesion = usarAlmacenSesion((s) => s.sesion);
  const esAdmin = !sesion?.nombreRol || sesion.nombreRol.toUpperCase().includes('ADMIN');
  const navegar = useNavigate();

  const [presetActivo, setPresetActivo] = useState<PresetId>('mes');

  const presetActual = PRESETS.find((p) => p.id === presetActivo)!;
  const filtro: FiltroTablero = {
    inicio: presetActual.inicio(),
    fin: presetActual.fin(),
  };

  const { data, isLoading, isFetching, isError, refetch } = usarMetricasTablero(filtro);
  const cargando = isLoading;

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const fechaHoy = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });

  const alertasInventario = data?.inventario_alertas ?? [];
  const barberosConComision = data?.barberos?.filter((b) => b.comision_pendiente > 0).length ?? 0;

  return (
    <div className="pagina-tablero animar-aparecer">

      {/* ── Sección 1: Cabecera + filtros ── */}
      <div className="tablero-cabecera">
        <div>
          <h1 className="tablero-saludo">
            {saludo}{usuario.nombre ? `, ${usuario.nombre.split(' ')[0]}` : ''}
          </h1>
          <div className="tablero-saludo-meta">
            {sesion?.barberiaId && sesion.nombre && (
              <Insignia variante="primario">{sesion.nombre}</Insignia>
            )}
            {!esAdmin && sesion?.nombreRol && (
              <Insignia variante="advertencia">{sesion.nombreRol}</Insignia>
            )}
          </div>
        </div>

        <div className="tablero-filtros">
          {esAdmin ? (
            <Boton tamano="sm" icono={<Plus size={14} />} onClick={() => navegar('/reservas?nueva=1')}>
              Nueva reserva
            </Boton>
          ) : (
            <Boton tamano="sm" icono={<Calendar size={14} />} onClick={() => navegar('/agenda/mi-agenda')}>
              Mi agenda
            </Boton>
          )}

          <div className="tablero-periodo-grupo">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                className="tablero-periodo-btn"
                onClick={() => setPresetActivo(p.id)}
                style={{ position: 'relative', zIndex: 1 }}
              >
                {/* Pill deslizante — se mueve entre botones activos */}
                {presetActivo === p.id && (
                  <motion.span
                    layoutId="periodo-pill"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--color-primario)',
                      borderRadius: '4px',
                      zIndex: -1,
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                <span style={{ position: 'relative', color: presetActivo === p.id ? '#fff' : 'inherit' }}>
                  {p.etiqueta}
                </span>
              </button>
            ))}
          </div>

          <button
            className="tablero-btn-accion"
            onClick={() => refetch()}
            title="Actualizar"
            disabled={isFetching}
            style={{ opacity: isFetching ? 0.6 : 1 }}
          >
            <RefreshCw size={12} style={{ animation: isFetching ? 'girar 1s linear infinite' : 'none' }} />
          </button>

          {data && esAdmin && (
            <button
              className="tablero-btn-accion"
              onClick={() => exportarCSV(data, filtro)}
              title="Exportar CSV"
            >
              <Download size={12} />
              Exportar
            </button>
          )}
        </div>
      </div>

      {/* ── Estado de error ── */}
      {isError && (
        <BannerAlerta
          variante="error"
          titulo="No se pudieron cargar las métricas"
          mensaje="Revisa tu conexión e intenta de nuevo."
          onCerrar={() => refetch()}
          style={{ marginBottom: '1rem' }}
        />
      )}

      {/* ── Alerta de inventario bajo mínimo (solo admin, solo si hay) ── */}
      {esAdmin && alertasInventario.length > 0 && (
        <button
          type="button"
          onClick={() => navegar('/inventario')}
          className="tablero-banner-inventario"
        >
          <Package size={16} aria-hidden="true" />
          <span>
            <strong>{alertasInventario.length} producto{alertasInventario.length > 1 ? 's' : ''} bajo mínimo</strong>
            {' — '}
            {alertasInventario.slice(0, 3).map((p) => p.nombre).join(', ')}
            {alertasInventario.length > 3 ? '…' : ''}
          </span>
          <ArrowRight size={14} aria-hidden="true" style={{ marginLeft: 'auto', flexShrink: 0 }} />
        </button>
      )}

      {/* ── Snapshot de HOY — solo cuando el período NO es "Hoy" (si no, duplica los KPIs) ── */}
      {presetActivo !== 'hoy' && (
      <div className="tablero-hoy" aria-busy={cargando}>
        <div className="tablero-hoy-titulo">
          <CalendarClock size={15} aria-hidden="true" />
          <span>Hoy, {fechaHoy}</span>
        </div>
        {cargando ? (
          <div className="tablero-hoy-skeleton" />
        ) : !data || data.hoy.reservas_total === 0 ? (
          <p className="tablero-hoy-vacio">Sin reservas programadas para hoy</p>
        ) : (
          <div className="tablero-hoy-stats">
            <div className="tablero-hoy-stat">
              <span className="tablero-hoy-valor">{data.hoy.reservas_total}</span>
              <span className="tablero-hoy-etq">reservas</span>
            </div>
            <div className="tablero-hoy-stat">
              <span className="tablero-hoy-valor" style={{ color: 'var(--color-exito)' }}>{data.hoy.reservas_completadas}</span>
              <span className="tablero-hoy-etq">completadas</span>
            </div>
            <div className="tablero-hoy-stat">
              <span className="tablero-hoy-valor" style={{ color: 'var(--color-advertencia)' }}>{data.hoy.reservas_pendientes}</span>
              <span className="tablero-hoy-etq">pendientes</span>
            </div>
            {esAdmin && (
              <div className="tablero-hoy-stat">
                <span className="tablero-hoy-valor">{formatearMoneda(data.hoy.ingresos)}</span>
                <span className="tablero-hoy-etq">ingresos</span>
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          className="tablero-hoy-cta"
          onClick={() => navegar(esAdmin ? '/reservas' : '/agenda/mi-agenda')}
        >
          {esAdmin ? 'Ver reservas' : 'Ver mi agenda'} <ArrowRight size={13} aria-hidden="true" />
        </button>
      </div>
      )}

      {/* ── Sección 2: KPIs ── */}
      <div className="tablero-kpi-grid" aria-busy={cargando}>
        <TarjetaKPI
          indice={0}
          Icono={DollarSign}
          etiqueta="Ingresos del período"
          valor={cargando ? '—' : formatearMoneda(data?.ingresos.total ?? 0)}
          tendencia={data && data.ingresos.variacion_pct !== 0 ? data.ingresos.variacion_pct : undefined}
          colorIcono="var(--color-primario)"
          fondoIcono="var(--color-acento-suave)"
          cargando={cargando}
        />
        <TarjetaKPI
          indice={1}
          Icono={ClipboardList}
          etiqueta="Reservas totales"
          valor={cargando ? '—' : String(data?.reservas.total ?? 0)}
          contexto={
            data
              ? `${data.reservas.completadas} comp · ${data.reservas.confirmadas} conf · ${data.reservas.pendientes} pend`
              : undefined
          }
          colorIcono="var(--color-info)"
          fondoIcono="var(--color-info-suave)"
          cargando={cargando}
        />
        <TarjetaKPI
          indice={2}
          Icono={CheckCircle2}
          etiqueta="Tasa de completado"
          valor={cargando ? '—' : `${((data?.reservas.tasa_completado ?? 0) * 100).toFixed(0)}%`}
          contexto={
            data
              ? `${data.reservas.completadas + data.reservas.no_asistio} atendidas en el período`
              : undefined
          }
          colorIcono="var(--color-exito)"
          fondoIcono="var(--color-exito-suave)"
          cargando={cargando}
        />
        <TarjetaKPI
          indice={3}
          Icono={AlertCircle}
          etiqueta="No asistencias"
          valor={cargando ? '—' : String(data?.reservas.no_asistio ?? 0)}
          contexto={
            data && data.reservas.no_asistio > 0
              ? `≈ ${formatearMoneda((data.ingresos.total / Math.max(data.reservas.completadas, 1)) * data.reservas.no_asistio)} no cobrado`
              : 'Sin ausencias en el período'
          }
          colorIcono="var(--color-error)"
          fondoIcono="var(--color-error-suave)"
          cargando={cargando}
        />
        <TarjetaKPI
          indice={4}
          Icono={Users}
          etiqueta="Clientes nuevos"
          valor={cargando ? '—' : String(data?.clientes.nuevos ?? 0)}
          contexto={data ? `${data.clientes.total} clientes activos totales` : undefined}
          colorIcono="var(--color-advertencia)"
          fondoIcono="var(--color-advertencia-suave)"
          cargando={cargando}
        />
        {esAdmin && (
          <TarjetaKPI
            indice={5}
            Icono={DollarSign}
            etiqueta="Comisiones por pagar"
            valor={cargando ? '—' : formatearMoneda(data?.comisiones_pendientes ?? 0)}
            contexto={
              data
                ? barberosConComision > 0
                  ? `${barberosConComision} barbero${barberosConComision > 1 ? 's' : ''} por liquidar`
                  : 'Todo liquidado'
                : undefined
            }
            colorIcono="var(--color-texto-suave)"
            fondoIcono="var(--color-superficie-2)"
            cargando={cargando}
          />
        )}
        <TarjetaKPI
          indice={6}
          Icono={Award}
          etiqueta="Lealtad — por canjear"
          valor={cargando ? '—' : String(data?.lealtad.listos_para_canjear ?? 0)}
          contexto={
            data
              ? `${data.lealtad.sellos_acumulados} sellos · ${data.lealtad.canjes_periodo} canjes en el período`
              : undefined
          }
          colorIcono="var(--color-primario)"
          fondoIcono="var(--color-acento-suave)"
          cargando={cargando}
        />
      </div>

      {/* ── Sección 3: Análisis — Servicios + Origen ── */}
      <div className="tablero-analisis-grid">
        <TablaServiciosTop datos={data?.servicios_top} cargando={cargando} />
        <PanelOrigen datos={data?.origen_reservas} cargando={cargando} />
      </div>

      {/* ── Sección 4: Rendimiento del equipo ── */}
      {esAdmin && (
        <TablaRendimientoEquipo barberos={data?.barberos} cargando={cargando} />
      )}

    </div>
  );
}
