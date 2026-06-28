import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  CreditCard, CheckCircle2, PauseCircle, XCircle,
  CalendarClock, Package, Zap,
} from 'lucide-react';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina';
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta';
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos';
import { MenuAcciones } from '@/compartido/interfaz/primitivas/MenuAcciones';
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion';
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia';
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta';
import { Pestanas } from '@/compartido/interfaz/primitivas/Pestanas';
import { SelectorFecha } from '@/compartido/interfaz/primitivas/SelectorFecha';
import { usarSuscripcion } from '../ganchos/usarSuscripcion';
import { usarAlmacenSesion } from '@/plataforma/identidad/almacen-sesion';
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio';
import type { SolicitudActivarSuscripcion, SuscripcionResumen } from '../contratos/tipos';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatearFecha(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function varianteEstadoSuscripcion(estado: string): 'exito' | 'advertencia' | 'error' | 'neutral' {
  if (estado === 'ACTIVA')     return 'exito';
  if (estado === 'SUSPENDIDA') return 'advertencia';
  if (estado === 'CANCELADA')  return 'error';
  return 'neutral';
}

function etiquetaEstado(estado: string): string {
  if (estado === 'ACTIVA')     return 'Activa';
  if (estado === 'SUSPENDIDA') return 'Suspendida';
  if (estado === 'CANCELADA')  return 'Cancelada';
  return estado;
}

// ── Pestaña: Mis suscripciones ────────────────────────────────────────────────

function PestanaSuscripciones() {
  const { suscripciones, cargando, suspender, cancelar, estadoSuspender, estadoCancelar } = usarSuscripcion();
  const [suscripcionAccion, setSuscripcionAccion] = useState<{ sus: SuscripcionResumen; accion: 'suspender' | 'cancelar' } | null>(null);

  const confirmarAccion = () => {
    if (!suscripcionAccion) return;
    const { sus, accion } = suscripcionAccion;

    if (accion === 'suspender') {
      suspender(sus.id, {
        onSuccess: () => {
          toast.success('Suscripción suspendida', { description: sus.nombre_plan });
          setSuscripcionAccion(null);
        },
        onError: () => {
          toast.error('No se pudo suspender la suscripción');
          setSuscripcionAccion(null);
        },
      });
    } else {
      cancelar(sus.id, {
        onSuccess: () => {
          toast.success('Suscripción cancelada', { description: sus.nombre_plan });
          setSuscripcionAccion(null);
        },
        onError: () => {
          toast.error('No se pudo cancelar la suscripción');
          setSuscripcionAccion(null);
        },
      });
    }
  };

  const columnas = [
    {
      clave: 'plan',
      etiqueta: 'Plan',
      render: (s: SuscripcionResumen) => (
        <div className="suscripcion-celda-plan">
          <div className="tabla-datos-avatar tabla-datos-avatar--icono">
            <Package size={14} />
          </div>
          <span className="suscripcion-plan-nombre">{s.nombre_plan}</span>
        </div>
      ),
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (s: SuscripcionResumen) => (
        <Insignia variante={varianteEstadoSuscripcion(s.estado)}>
          {etiquetaEstado(s.estado)}
        </Insignia>
      ),
    },
    {
      clave: 'inicio',
      etiqueta: 'Inicio',
      render: (s: SuscripcionResumen) => (
        <span className="suscripcion-fecha">{formatearFecha(s.fecha_inicio)}</span>
      ),
    },
    {
      clave: 'renovacion',
      etiqueta: 'Renovación',
      render: (s: SuscripcionResumen) => (
        <span className="suscripcion-fecha">{formatearFecha(s.fecha_renovacion)}</span>
      ),
    },
    {
      clave: 'acciones',
      etiqueta: '',
      render: (s: SuscripcionResumen) => (
        <MenuAcciones
          acciones={[
            {
              id: 'suspender',
              etiqueta: 'Suspender',
              icono: <PauseCircle size={13} />,
              variante: 'advertencia' as const,
              deshabilitada: s.estado !== 'ACTIVA',
            },
            {
              id: 'cancelar',
              etiqueta: 'Cancelar definitivamente',
              icono: <XCircle size={13} />,
              variante: 'peligro' as const,
              deshabilitada: s.estado === 'CANCELADA',
            },
          ]}
          onAccion={(id) => {
            if (id === 'suspender') setSuscripcionAccion({ sus: s, accion: 'suspender' });
            if (id === 'cancelar')  setSuscripcionAccion({ sus: s, accion: 'cancelar' });
          }}
        />
      ),
    },
  ];

  return (
    <>
      <SeccionTarjeta titulo="Suscripciones registradas" sinPaddingCuerpo>
        <TablaDatos<SuscripcionResumen>
          columnas={columnas}
          filas={suscripciones}
          obtenerClave={(s) => s.id}
          cargando={cargando}
          vacioIcono={<CreditCard size={28} />}
          vacioTitulo="Sin suscripciones aún"
          vacioMensaje="Activa un plan desde la pestaña Activar."
        />
      </SeccionTarjeta>

      {/* Diálogo suspender */}
      <DialogoConfirmacion
        abierto={suscripcionAccion?.accion === 'suspender'}
        titulo="Suspender suscripción"
        descripcion={`¿Confirmas suspender el plan "${suscripcionAccion?.sus.nombre_plan}"? La barbería perderá acceso temporalmente hasta que se reactive.`}
        textoConfirmar="Suspender"
        variante="advertencia"
        cargando={estadoSuspender.ejecutando}
        alConfirmar={confirmarAccion}
        alCancelar={() => setSuscripcionAccion(null)}
      />

      {/* Diálogo cancelar */}
      <DialogoConfirmacion
        abierto={suscripcionAccion?.accion === 'cancelar'}
        titulo="Cancelar suscripción definitivamente"
        descripcion={`Esta acción es irreversible. La barbería perderá el plan "${suscripcionAccion?.sus.nombre_plan}" de forma permanente e inmediata. ¿Deseas continuar?`}
        textoConfirmar="Cancelar suscripción"
        variante="peligro"
        cargando={estadoCancelar.ejecutando}
        alConfirmar={confirmarAccion}
        alCancelar={() => setSuscripcionAccion(null)}
      />
    </>
  );
}

// ── Pestaña: Activar suscripción ──────────────────────────────────────────────

const ESTADO_INICIAL: SolicitudActivarSuscripcion = {
  empresa_id: '',
  plan_id: '',
  fecha_inicio: '',
  fecha_renovacion: '',
};

function PestanaActivar() {
  const { planes, activar, estadoActivar } = usarSuscripcion();
  const sesion = usarAlmacenSesion((s) => s.sesion);

  const [formulario, setFormulario] = useState<SolicitudActivarSuscripcion>({
    ...ESTADO_INICIAL,
    empresa_id: sesion?.barberiaId ?? '',
  });
  const [errores, setErrores] = useState<Record<string, string>>({});

  const planSeleccionado = planes.find((p) => p.id === formulario.plan_id);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevos: Record<string, string> = {};
    if (!formulario.plan_id)         nuevos.plan_id         = 'Selecciona un plan';
    if (!formulario.fecha_inicio)    nuevos.fecha_inicio    = 'Selecciona la fecha de inicio';
    if (!formulario.fecha_renovacion) nuevos.fecha_renovacion = 'Selecciona la fecha de renovación';
    if (
      formulario.fecha_inicio &&
      formulario.fecha_renovacion &&
      formulario.fecha_inicio >= formulario.fecha_renovacion
    ) nuevos.fecha_renovacion = 'La renovación debe ser posterior al inicio';
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return; }

    activar(
      { ...formulario, empresa_id: sesion?.barberiaId ?? '' },
      {
        onSuccess: () => {
          toast.success('Suscripción activada', { description: planSeleccionado?.nombre });
          setFormulario({ ...ESTADO_INICIAL, empresa_id: sesion?.barberiaId ?? '' });
          setErrores({});
        },
        onError: () => toast.error('No se pudo activar la suscripción'),
      },
    );
  };

  return (
    <SeccionTarjeta
      titulo="Activar suscripción"
      descripcion="Selecciona un plan y define el período de vigencia"
      icono={<Zap size={14} />}
      maxAncho={560}
    >
      {estadoActivar.error && (
        <BannerAlerta
          variante="error"
          titulo="No se pudo activar"
          mensaje={mensajeDeError(estadoActivar.error)}
          style={{ marginBottom: 'var(--espacio-md)' }}
        />
      )}

      <form onSubmit={enviar} className="suscripcion-form">

        {/* Selector de plan */}
        <div className="campo-grupo">
          <label className="campo-etiqueta">
            Plan <span className="campo-requerido">*</span>
          </label>
          {planes.length === 0 ? (
            <p className="suscripcion-planes-vacio">
              <Package size={14} /> No hay planes disponibles.
            </p>
          ) : (
            <div className="suscripcion-planes-lista">
              {planes.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => { setFormulario((p) => ({ ...p, plan_id: plan.id })); setErrores((p) => ({ ...p, plan_id: '' })); }}
                  className={[
                    'suscripcion-plan-opcion',
                    formulario.plan_id === plan.id ? 'suscripcion-plan-opcion--activa' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <Package size={14} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{plan.nombre}</span>
                  {formulario.plan_id === plan.id && (
                    <CheckCircle2 size={14} style={{ color: 'var(--color-exito)', flexShrink: 0 }} />
                  )}
                </button>
              ))}
            </div>
          )}
          {errores.plan_id && <span className="campo-error-inline">{errores.plan_id}</span>}
        </div>

        {/* Fechas con SelectorFecha */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--espacio-md)' }}>
          <div className="campo-grupo">
            <label className="campo-etiqueta">
              Inicio <span className="campo-requerido">*</span>
            </label>
            <SelectorFecha
              valor={formulario.fecha_inicio}
              alCambiar={(v) => { setFormulario((p) => ({ ...p, fecha_inicio: v })); setErrores((p) => ({ ...p, fecha_inicio: '' })); }}
              error={!!errores.fecha_inicio}
            />
            {errores.fecha_inicio && <span className="campo-error-inline">{errores.fecha_inicio}</span>}
          </div>
          <div className="campo-grupo">
            <label className="campo-etiqueta">
              Renovación <span className="campo-requerido">*</span>
            </label>
            <SelectorFecha
              valor={formulario.fecha_renovacion}
              alCambiar={(v) => { setFormulario((p) => ({ ...p, fecha_renovacion: v })); setErrores((p) => ({ ...p, fecha_renovacion: '' })); }}
              error={!!errores.fecha_renovacion}
            />
            {errores.fecha_renovacion && <span className="campo-error-inline">{errores.fecha_renovacion}</span>}
          </div>
        </div>

        {/* Preview */}
        {formulario.plan_id && formulario.fecha_inicio && formulario.fecha_renovacion && (
          <div className="suscripcion-preview">
            <CreditCard size={13} style={{ color: 'var(--color-primario)', flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--tamano-sm)' }}>
              Plan <strong>{planSeleccionado?.nombre}</strong> · vigente desde{' '}
              <strong>{formatearFecha(formulario.fecha_inicio)}</strong>
              {' '}hasta{' '}
              <strong>{formatearFecha(formulario.fecha_renovacion)}</strong>
            </span>
          </div>
        )}

        <Boton type="submit" variante="primario" cargando={estadoActivar.ejecutando} icono={<CreditCard size={14} />}>
          Activar suscripción
        </Boton>
      </form>
    </SeccionTarjeta>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

const PESTANAS = [
  { id: 'suscripciones', etiqueta: 'Mis suscripciones', icono: <CalendarClock size={14} /> },
  { id: 'activar',       etiqueta: 'Activar',           icono: <Zap size={14} /> },
];

export function PaginaSuscripcion() {
  const [pestanaActiva, setPestanaActiva] = useState('suscripciones');
  const { suscripciones } = usarSuscripcion();
  const activas = suscripciones.filter((s) => s.estado === 'ACTIVA').length;

  return (
    <motion.div
      className="pagina-monetizacion"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <EncabezadoPagina
        titulo="Suscripciones"
        descripcion="Administra los planes SaaS de la barbería"
        indicador={
          activas > 0 ? (
            <span className="encabezado-indicador-chip">
              <CreditCard size={11} />
              {activas} activa{activas !== 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      />

      <div className="monetizacion-pestanas-wrapper">
        <Pestanas
          pestanas={PESTANAS}
          activa={pestanaActiva}
          alCambiar={setPestanaActiva}
          variante="linea"
        />
      </div>

      <div className="monetizacion-contenido">
        {pestanaActiva === 'suscripciones' && <PestanaSuscripciones />}
        {pestanaActiva === 'activar'        && <PestanaActivar />}
      </div>
    </motion.div>
  );
}
