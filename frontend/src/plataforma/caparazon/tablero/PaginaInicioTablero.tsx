import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp, TrendingDown, Minus,
  ClipboardList, DollarSign, Users,
  AlertCircle, Star, Scissors,
  RefreshCw, Download, Calendar,
  ChevronsUpDown, ChevronUp, ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { usarUsuarioActual } from '@/plataforma/identidad/ganchos/usarUsuarioActual';
import { usarAlmacenSesion } from '@/plataforma/identidad/almacen-sesion';
import { usarMetricasTablero } from './ganchos/usarMetricasTablero';
import type { MetricasTablero, FiltroTablero } from './contratos/tipos';
import { springTactil, springSuave, delayItem } from '@/plataforma/diseno/motion';

// ── Helpers de fecha ──────────────────────────────────────────────────────────

function hoy(): string {
  return new Date().toISOString().split('T')[0];
}

function primerDiaSemana(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1);
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
    <div className="tablero-panel">
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
    <div className="tablero-panel">
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

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

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
    <div className="tablero-panel">
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
        <div style={{ overflowX: 'auto' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                        <span
                          className="tablero-barbero-avatar"
                          style={{
                            background: idx === 0 ? 'var(--color-primario-suave)' : 'var(--color-acento-suave)',
                            color: idx === 0 ? 'var(--color-primario)' : 'var(--color-texto-suave)',
                          }}
                        >
                          {iniciales(b.nombre)}
                        </span>
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
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                          padding: '0.15rem 0.5rem', borderRadius: '99px',
                          background: 'var(--color-primario-suave)', color: 'var(--color-primario)',
                          fontWeight: 600, fontSize: '0.75rem',
                        }}>
                          {formatearMoneda(b.comision_pendiente)}
                        </span>
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
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', background: 'var(--color-primario-suave)', color: 'var(--color-primario)', fontWeight: 700, fontSize: '0.75rem' }}>
                        {formatearMoneda(ordenados.reduce((s, b) => s + b.comision_pendiente, 0))}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
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

  const [presetActivo, setPresetActivo] = useState<PresetId>('mes');

  const presetActual = PRESETS.find((p) => p.id === presetActivo)!;
  const filtro: FiltroTablero = {
    inicio: presetActual.inicio(),
    fin: presetActual.fin(),
  };

  const { data, isLoading, isFetching, refetch } = usarMetricasTablero(filtro);
  const cargando = isLoading;

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="pagina-tablero animar-aparecer">

      {/* ── Sección 1: Cabecera + filtros ── */}
      <div className="tablero-cabecera">
        <div>
          <h1 className="tablero-saludo">
            {saludo}{usuario.nombre ? `, ${usuario.nombre.split(' ')[0]}` : ''}
          </h1>
          <div className="tablero-saludo-meta">
            {sesion?.barberiaId && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.2rem 0.625rem', borderRadius: '99px',
                background: 'var(--color-acento-suave)', fontSize: 'var(--tamano-xs)',
                fontWeight: 500, color: 'var(--color-primario)',
              }}>
                {sesion.nombre}
              </span>
            )}
            {!esAdmin && sesion?.nombreRol && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.2rem 0.625rem', borderRadius: '99px',
                background: 'var(--color-advertencia-suave)', fontSize: 'var(--tamano-xs)',
                fontWeight: 500, color: 'var(--color-advertencia)',
              }}>
                {sesion.nombreRol}
              </span>
            )}
          </div>
        </div>

        <div className="tablero-filtros">
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

      {/* ── Sección 2: KPIs ── */}
      <div className="tablero-kpi-grid">
        <TarjetaKPI
          indice={0}
          Icono={DollarSign}
          etiqueta="Ingresos del período"
          valor={cargando ? '—' : formatearMoneda(data?.ingresos.total ?? 0)}
          tendencia={data?.ingresos.variacion_pct}
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
          Icono={TrendingUp}
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
        <TarjetaKPI
          indice={5}
          Icono={Star}
          etiqueta="Comisiones por pagar"
          valor={cargando ? '—' : formatearMoneda(data?.comisiones_pendientes ?? 0)}
          contexto={
            data && data.lealtad.tarjetas_activas > 0
              ? `${data.lealtad.tarjetas_activas} tarjetas de lealtad activas`
              : 'Sin obligaciones pendientes'
          }
          colorIcono="var(--color-texto-suave)"
          fondoIcono="var(--color-superficie-2)"
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
