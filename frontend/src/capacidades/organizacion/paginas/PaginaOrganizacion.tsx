import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Building2, MapPin, Power, PowerOff,
  CalendarDays, Lock, Settings,
} from 'lucide-react';
import { Campo } from '@/compartido/interfaz/primitivas/Campo';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { Interruptor } from '@/compartido/interfaz/primitivas/Interruptor';
import { SelectorFecha } from '@/compartido/interfaz/primitivas/SelectorFecha';
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina';
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta';
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos';
import { MenuAcciones } from '@/compartido/interfaz/primitivas/MenuAcciones';
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion';
import { Insignia, insigniaPorEstado } from '@/compartido/interfaz/retroalimentacion/Insignia';
import { Pestanas } from '@/compartido/interfaz/primitivas/Pestanas';
import { usarSedes } from '../ganchos/usarSedes';
import { usarPeriodos } from '../ganchos/usarPeriodos';
import { usarConfiguracion } from '../ganchos/usarConfiguracion';
import type { Sucursal, Periodo, SolicitudCrearPeriodo } from '../contratos/tipos';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatearFecha(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function etiquetaEstadoPeriodo(estado: string): string {
  if (estado === 'ACTIVO')  return 'Activo';
  if (estado === 'CERRADO') return 'Cerrado';
  return estado;
}

function variantePeriodo(estado: string): 'exito' | 'neutral' | 'info' {
  if (estado === 'ACTIVO')  return 'exito';
  if (estado === 'CERRADO') return 'neutral';
  return 'info';
}

// ── Pestaña Sedes ─────────────────────────────────────────────────────────────

function PestanaSedes() {
  const { sedes, cargando, crearSede, creando, actualizarEstado } = usarSedes();

  const [nombre, setNombre]   = useState('');
  const [error, setError]     = useState('');
  const [sedeAccion, setSedeAccion] = useState<{ sede: Sucursal; nuevo: 'ACTIVO' | 'INACTIVO' } | null>(null);
  const [ejecutando, setEjecutando] = useState(false);

  const enviarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('Ingresa el nombre de la sede'); return; }
    try {
      await crearSede({ nombre: nombre.trim() });
      toast.success('Sede registrada', { description: nombre.trim() });
      setNombre('');
      setError('');
    } catch {
      toast.error('No se pudo registrar la sede');
    }
  };

  const confirmarCambioEstado = async () => {
    if (!sedeAccion) return;
    setEjecutando(true);
    try {
      await actualizarEstado({ id: sedeAccion.sede.id, estado: sedeAccion.nuevo });
      toast.success(
        sedeAccion.nuevo === 'ACTIVO' ? 'Sede activada' : 'Sede desactivada',
        { description: sedeAccion.sede.nombre },
      );
      setSedeAccion(null);
    } catch {
      toast.error('No se pudo cambiar el estado de la sede');
    } finally {
      setEjecutando(false);
    }
  };

  const columnas = [
    {
      clave: 'nombre',
      etiqueta: 'Sede',
      render: (sede: Sucursal) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="tabla-datos-avatar tabla-datos-avatar--icono">
            <MapPin size={14} />
          </div>
          <span style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500 }}>{sede.nombre}</span>
        </div>
      ),
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (sede: Sucursal) => (
        <Insignia variante={insigniaPorEstado(sede.estado)}>
          {sede.estado === 'ACTIVO' ? 'Activa' : 'Inactiva'}
        </Insignia>
      ),
    },
    {
      clave: 'acciones',
      etiqueta: '',
      render: (sede: Sucursal) => (
        <MenuAcciones
          acciones={[
            { id: 'activar',    etiqueta: 'Activar',    icono: <Power size={13} />,    deshabilitada: sede.estado === 'ACTIVO' },
            { id: 'desactivar', etiqueta: 'Desactivar', icono: <PowerOff size={13} />, variante: 'advertencia' as const, deshabilitada: sede.estado === 'INACTIVO' },
          ]}
          onAccion={(id) => {
            if (id === 'activar')    setSedeAccion({ sede, nuevo: 'ACTIVO' });
            if (id === 'desactivar') setSedeAccion({ sede, nuevo: 'INACTIVO' });
          }}
        />
      ),
    },
  ];

  return (
    <>
      <SeccionTarjeta titulo="Nueva sede" icono={<Building2 size={14} />} maxAncho={480}>
        <form onSubmit={enviarFormulario} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
          <Campo
            etiqueta="Nombre de la sede"
            requerido
            error={error}
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); setError(''); }}
            placeholder="Ej: Sede Principal"
            className="campo-input"
          />
          <Boton type="submit" variante="primario" cargando={creando}>
            Registrar sede
          </Boton>
        </form>
      </SeccionTarjeta>

      <SeccionTarjeta titulo="Sedes registradas" sinPaddingCuerpo>
        <TablaDatos<Sucursal>
          columnas={columnas}
          filas={sedes}
          obtenerClave={(s) => s.id}
          cargando={cargando}
          vacioIcono={<Building2 size={24} />}
          vacioTitulo="Sin sedes aún"
          vacioMensaje="Registra la primera sede de la barbería."
        />
      </SeccionTarjeta>

      {sedeAccion && (
        <DialogoConfirmacion
          abierto
          titulo={sedeAccion.nuevo === 'ACTIVO' ? 'Activar sede' : 'Desactivar sede'}
          descripcion={
            sedeAccion.nuevo === 'ACTIVO'
              ? `¿Confirmas activar la sede "${sedeAccion.sede.nombre}"? Volverá a estar disponible.`
              : `¿Confirmas desactivar la sede "${sedeAccion.sede.nombre}"? No podrá recibir nuevas reservas.`
          }
          textoConfirmar={sedeAccion.nuevo === 'ACTIVO' ? 'Activar' : 'Desactivar'}
          variante={sedeAccion.nuevo === 'INACTIVO' ? 'advertencia' : 'normal'}
          cargando={ejecutando}
          alConfirmar={confirmarCambioEstado}
          alCancelar={() => setSedeAccion(null)}
        />
      )}
    </>
  );
}

// ── Pestaña Períodos ──────────────────────────────────────────────────────────

const PERIODO_INICIAL: SolicitudCrearPeriodo = { nombre: '', fecha_inicio: '', fecha_fin: '' };

function PestanaPeriodos() {
  const { periodos, cargando, crearPeriodo, cerrarPeriodo, creando, cerrando } = usarPeriodos();

  const [formulario, setFormulario] = useState<SolicitudCrearPeriodo>(PERIODO_INICIAL);
  const [errores, setErrores]       = useState<Record<string, string>>({});
  const [periodoCerrar, setPeriodoCerrar] = useState<Periodo | null>(null);

  const cambiar = (campo: keyof SolicitudCrearPeriodo) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormulario((prev) => ({ ...prev, [campo]: e.target.value }));
      setErrores((prev) => ({ ...prev, [campo]: '' }));
    };

  const enviarCrear = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevos: Record<string, string> = {};
    if (!formulario.nombre.trim())  nuevos.nombre       = 'Ingresa el nombre del período';
    if (!formulario.fecha_inicio)   nuevos.fecha_inicio  = 'Selecciona la fecha de inicio';
    if (!formulario.fecha_fin)      nuevos.fecha_fin     = 'Selecciona la fecha de fin';
    // SelectorFecha soloFecha devuelve "YYYY-MM-DD", comparación lexicográfica es correcta
    if (formulario.fecha_inicio && formulario.fecha_fin && formulario.fecha_inicio >= formulario.fecha_fin)
      nuevos.fecha_fin = 'La fecha de fin debe ser posterior al inicio';
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return; }

    crearPeriodo(formulario, {
      onSuccess: () => {
        toast.success('Período creado', { description: formulario.nombre.trim() });
        setFormulario(PERIODO_INICIAL);
        setErrores({});
      },
      onError: () => toast.error('No se pudo crear el período'),
    });
  };

  const confirmarCierre = async () => {
    if (!periodoCerrar) return;
    try {
      await cerrarPeriodo(periodoCerrar.id);
      toast.success('Período cerrado', { description: periodoCerrar.nombre });
      setPeriodoCerrar(null);
    } catch {
      toast.error('No se pudo cerrar el período');
    }
  };

  const columnas = [
    {
      clave: 'nombre',
      etiqueta: 'Período',
      render: (p: Periodo) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="tabla-datos-avatar tabla-datos-avatar--icono">
            <CalendarDays size={14} />
          </div>
          <span style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500 }}>{p.nombre}</span>
        </div>
      ),
    },
    {
      clave: 'fechas',
      etiqueta: 'Fechas',
      render: (p: Periodo) => (
        <span style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)' }}>
          {formatearFecha(p.fecha_inicio)} – {formatearFecha(p.fecha_fin)}
        </span>
      ),
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (p: Periodo) => (
        <Insignia variante={variantePeriodo(p.estado)}>
          {etiquetaEstadoPeriodo(p.estado)}
        </Insignia>
      ),
    },
    {
      clave: 'acciones',
      etiqueta: '',
      render: (p: Periodo) => (
        <MenuAcciones
          acciones={[
            {
              id: 'cerrar',
              etiqueta: 'Cerrar período',
              icono: <Lock size={13} />,
              variante: 'peligro' as const,
              deshabilitada: p.estado !== 'ACTIVO',
            },
          ]}
          onAccion={() => setPeriodoCerrar(p)}
        />
      ),
    },
  ];

  return (
    <>
      <SeccionTarjeta titulo="Nuevo período" icono={<CalendarDays size={14} />} maxAncho={560}>
        <form onSubmit={enviarCrear} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
          <Campo
            etiqueta="Nombre del período"
            requerido
            error={errores.nombre}
            value={formulario.nombre}
            onChange={cambiar('nombre')}
            placeholder="Ej: Mayo 2026"
            className="campo-input"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacio-md)' }}>
            <div className="campo-grupo">
              <label className="campo-etiqueta">
                Fecha de inicio <span className="campo-requerido">*</span>
              </label>
              <SelectorFecha
                soloFecha
                valor={formulario.fecha_inicio}
                alCambiar={(v) => { setFormulario((p) => ({ ...p, fecha_inicio: v })); setErrores((p) => ({ ...p, fecha_inicio: '' })); }}
                error={!!errores.fecha_inicio}
              />
              {errores.fecha_inicio && <span className="campo-error-inline">{errores.fecha_inicio}</span>}
            </div>
            <div className="campo-grupo">
              <label className="campo-etiqueta">
                Fecha de fin <span className="campo-requerido">*</span>
              </label>
              <SelectorFecha
                soloFecha
                valor={formulario.fecha_fin}
                alCambiar={(v) => { setFormulario((p) => ({ ...p, fecha_fin: v })); setErrores((p) => ({ ...p, fecha_fin: '' })); }}
                error={!!errores.fecha_fin}
              />
              {errores.fecha_fin && <span className="campo-error-inline">{errores.fecha_fin}</span>}
            </div>
          </div>
          <Boton type="submit" variante="primario" cargando={creando}>
            Crear período
          </Boton>
        </form>
      </SeccionTarjeta>

      <SeccionTarjeta titulo="Períodos registrados" sinPaddingCuerpo>
        <TablaDatos<Periodo>
          columnas={columnas}
          filas={periodos}
          obtenerClave={(p) => p.id}
          cargando={cargando}
          vacioIcono={<CalendarDays size={24} />}
          vacioTitulo="Sin períodos aún"
          vacioMensaje="Crea el primer período de operación."
        />
      </SeccionTarjeta>

      {periodoCerrar && (
        <DialogoConfirmacion
          abierto
          titulo="Cerrar período"
          descripcion={`¿Confirmas cerrar el período "${periodoCerrar.nombre}"? No podrá recibir nuevas operaciones y no puede deshacerse.`}
          textoConfirmar="Cerrar período"
          variante="peligro"
          cargando={cerrando}
          alConfirmar={confirmarCierre}
          alCancelar={() => setPeriodoCerrar(null)}
        />
      )}
    </>
  );
}

// ── Pestaña Configuración ─────────────────────────────────────────────────────

function PestanaConfiguracion() {
  const { configuracion, cargando, guardar, guardando } = usarConfiguracion()

  const [horas_anticipacion_cancelacion, setHorasAnticipacion] = useState(2)
  const [dias_max_reserva_anticipada, setDiasMax]              = useState(30)
  const [horas_recordatorio_reserva, setHorasRecordatorio]     = useState(24)
  const [permite_reserva_mismo_dia, setPermiteMismoDia]        = useState(true)
  const [requiere_confirmacion_manual, setRequiereConfirm]     = useState(false)
  const [inicializado, setInicializado]                        = useState(false)

  useEffect(() => {
    if (configuracion && !inicializado) {
      setHorasAnticipacion(configuracion.HorasAnticipacionCancelacion)
      setDiasMax(configuracion.DiasMaxReservaAnticipada)
      setHorasRecordatorio(configuracion.HorasRecordatorioReserva)
      setPermiteMismoDia(configuracion.PermiteReservaMismoDia)
      setRequiereConfirm(configuracion.RequiereConfirmacionManual)
      setInicializado(true)
    }
  }, [configuracion, inicializado])

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    guardar(
      {
        horas_anticipacion_cancelacion,
        dias_max_reserva_anticipada,
        horas_recordatorio_reserva,
        permite_reserva_mismo_dia,
        requiere_confirmacion_manual,
      },
      {
        onSuccess: () => toast.success('Configuración guardada'),
        onError: () => toast.error('No se pudo guardar la configuración'),
      },
    )
  }

  if (cargando) return null

  return (
    <SeccionTarjeta titulo="Configuración operativa" icono={<Settings size={14} />} maxAncho={520}>
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>

        <Campo
          etiqueta="Horas mínimas para cancelar una reserva"
          type="number"
          value={String(horas_anticipacion_cancelacion)}
          onChange={(e) => setHorasAnticipacion(Math.max(0, parseInt(e.target.value) || 0))}
          className="campo-input"
        />

        <Campo
          etiqueta="Días máximos de anticipación para reservar"
          type="number"
          value={String(dias_max_reserva_anticipada)}
          onChange={(e) => setDiasMax(Math.max(1, parseInt(e.target.value) || 1))}
          className="campo-input"
        />

        <Campo
          etiqueta="Horas antes de la reserva para enviar recordatorio"
          type="number"
          value={String(horas_recordatorio_reserva)}
          onChange={(e) => setHorasRecordatorio(Math.max(0, parseInt(e.target.value) || 0))}
          className="campo-input"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-sm)' }}>
          <Interruptor
            id="permite-mismo-dia"
            activo={permite_reserva_mismo_dia}
            alCambiar={setPermiteMismoDia}
            etiqueta="Permitir reservas el mismo día"
          />
          <Interruptor
            id="requiere-confirmacion"
            activo={requiere_confirmacion_manual}
            alCambiar={setRequiereConfirm}
            etiqueta="Requerir confirmación manual del barbero"
          />
        </div>

        <Boton type="submit" variante="primario" cargando={guardando}>
          Guardar configuración
        </Boton>
      </form>
    </SeccionTarjeta>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

const PESTANAS = [
  { id: 'sedes',         etiqueta: 'Sedes',         icono: <MapPin size={14} /> },
  { id: 'periodos',      etiqueta: 'Períodos',       icono: <CalendarDays size={14} /> },
  { id: 'configuracion', etiqueta: 'Configuración',  icono: <Settings size={14} /> },
];

export function PaginaOrganizacion() {
  const [pestanaActiva, setPestanaActiva] = useState('sedes');

  const { sedes }   = usarSedes();
  const { periodos } = usarPeriodos();

  const sedesActivas    = sedes.filter((s) => s.estado === 'ACTIVO').length;
  const periodosActivos = periodos.filter((p) => p.estado === 'ACTIVO').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="pagina-organizacion"
    >
      <EncabezadoPagina
        titulo="Organización"
        descripcion="Administra las sedes y períodos de operación de la barbería"
        indicador={
          (sedesActivas > 0 || periodosActivos > 0) ? (
            <span className="encabezado-indicador-chip">
              <Building2 size={11} />
              {sedesActivas} sede{sedesActivas !== 1 ? 's' : ''} · {periodosActivos} período{periodosActivos !== 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      />

      <div className="organizacion-pestanas-wrapper">
        <Pestanas
          pestanas={PESTANAS}
          activa={pestanaActiva}
          alCambiar={setPestanaActiva}
          variante="linea"
        />
      </div>

      <div className="organizacion-contenido">
        {pestanaActiva === 'sedes'         && <PestanaSedes />}
        {pestanaActiva === 'periodos'      && <PestanaPeriodos />}
        {pestanaActiva === 'configuracion' && <PestanaConfiguracion />}
      </div>
    </motion.div>
  );
}
