import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Bell, BellOff, Clock, MessageCircle, Mail, Phone,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, SendHorizonal,
} from 'lucide-react';
import { Avatar } from '@/compartido/interfaz/primitivas/Avatar';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { SelectorFecha } from '@/compartido/interfaz/primitivas/SelectorFecha';
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina';
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta';
import { Pestanas } from '@/compartido/interfaz/primitivas/Pestanas';
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos';
import { MenuAcciones } from '@/compartido/interfaz/primitivas/MenuAcciones';
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion';
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia';
import { BuscadorCliente } from '@/capacidades/reservas/componentes/BuscadorCliente';
import { usarClientes } from '@/capacidades/reservas/ganchos/usarClientes';
import { usarReservas } from '@/capacidades/reservas/ganchos/usarReservas';
import { usarRecordatorios, usarListaRecordatorios } from '../ganchos/usarRecordatorios';
import type { CanalRecordatorio, RecordatorioResumen } from '../contratos/tipos';

// ── Constantes ────────────────────────────────────────────────────────────────

const OPCIONES_CANAL: { valor: CanalRecordatorio; etiqueta: string; icono: React.ReactNode }[] = [
  { valor: 'WHATSAPP', etiqueta: 'WhatsApp',          icono: <MessageCircle size={13} /> },
  { valor: 'EMAIL',    etiqueta: 'Email',              icono: <Mail size={13} /> },
  { valor: 'SMS',      etiqueta: 'SMS',                icono: <Phone size={13} /> },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatearFechaHora(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-PE', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatearFechaCorta(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function iconoCanal(canal: CanalRecordatorio) {
  if (canal === 'WHATSAPP') return <MessageCircle size={13} style={{ color: '#22c55e' }} />;
  if (canal === 'EMAIL')    return <Mail size={13} style={{ color: 'var(--color-primario)' }} />;
  return <Phone size={13} style={{ color: 'var(--color-texto-suave)' }} />;
}

function varianteEstado(estado: string): 'exito' | 'info' | 'error' | 'neutral' | 'advertencia' {
  if (estado === 'ENVIADO')   return 'exito';
  if (estado === 'PENDIENTE') return 'advertencia';
  if (estado === 'FALLIDO')   return 'error';
  if (estado === 'CANCELADO') return 'neutral';
  return 'info';
}

function iconoEstado(estado: string) {
  if (estado === 'ENVIADO')   return <CheckCircle2 size={11} />;
  if (estado === 'PENDIENTE') return <Clock size={11} />;
  if (estado === 'FALLIDO')   return <AlertCircle size={11} />;
  if (estado === 'CANCELADO') return <BellOff size={11} />;
  return null;
}

function etiquetaEstado(estado: string): string {
  if (estado === 'ENVIADO')   return 'Enviado';
  if (estado === 'PENDIENTE') return 'Pendiente';
  if (estado === 'FALLIDO')   return 'Fallido';
  if (estado === 'CANCELADO') return 'Cancelado';
  return estado;
}

// ── Pestaña 1: Programar recordatorio ────────────────────────────────────────

function PestanaProgramar() {
  const { programar, estadoProgramar } = usarRecordatorios();
  const { clientes } = usarClientes();
  const { reservas } = usarReservas();

  const [clienteId, setClienteId]   = useState('');
  const [reservaId, setReservaId]   = useState('');
  const [enviarEn, setEnviarEn]     = useState('');
  const [canal, setCanal]           = useState<CanalRecordatorio>('WHATSAPP');
  const [errores, setErrores]       = useState<Record<string, string>>({});

  const nombreCliente = useMemo(
    () => clientes.find((c) => c.id === clienteId)?.nombre ?? '',
    [clientes, clienteId],
  );

  const reservasCliente = useMemo(() => {
    if (!clienteId) return [];
    return reservas.filter(
      (r) => r.cliente_id === clienteId && (r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA'),
    );
  }, [reservas, clienteId]);

  const manejarProgramar = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevos: Record<string, string> = {};
    if (!clienteId)  nuevos.cliente  = 'Selecciona un cliente';
    if (!reservaId)  nuevos.reservaId = 'Selecciona la reserva a recordar';
    if (!enviarEn)   nuevos.enviarEn  = 'Selecciona la fecha y hora de envío';
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return; }

    programar(
      { reserva_id: reservaId, enviar_en: enviarEn, canal },
      {
        onSuccess: () => {
          const op = OPCIONES_CANAL.find((o) => o.valor === canal);
          toast.success('Recordatorio programado', {
            description: `${op?.etiqueta} · ${new Date(enviarEn).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}`,
          });
          setClienteId('');
          setReservaId('');
          setEnviarEn('');
          setCanal('WHATSAPP');
          setErrores({});
        },
        onError: () => toast.error('No se pudo programar el recordatorio'),
      },
    );
  };

  return (
    <SeccionTarjeta
      titulo="Nuevo recordatorio"
      descripcion="Programa un aviso automático para la reserva de un cliente."
      icono={<Bell size={14} />}
      maxAncho={540}
    >
      <form onSubmit={manejarProgramar} className="notificacion-form">

        {/* Selector de cliente */}
        <BuscadorCliente
          valor={clienteId}
          alCambiar={(id) => {
            setClienteId(id);
            setReservaId('');
            setErrores((p) => ({ ...p, cliente: '', reservaId: '' }));
          }}
          error={errores.cliente}
        />

        {/* Reservas del cliente */}
        {clienteId && (
          <div className="campo-grupo">
            <label className="campo-etiqueta">
              Reserva a recordar <span className="campo-requerido">*</span>
            </label>
            {reservasCliente.length === 0 ? (
              <div className="notificacion-aviso-vacio">
                <Clock size={14} />
                <span>{nombreCliente} no tiene reservas pendientes o confirmadas.</span>
              </div>
            ) : (
              <div className="notificacion-reservas-lista">
                {reservasCliente.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setReservaId(r.id); setErrores((p) => ({ ...p, reservaId: '' })); }}
                    className={[
                      'notificacion-reserva-opcion',
                      reservaId === r.id ? 'notificacion-reserva-opcion--activa' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <Clock size={12} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{formatearFechaHora(r.fecha_hora_inicio)}</span>
                    <span className={`notificacion-estado-chip notificacion-estado-chip--${r.estado.toLowerCase()}`}>
                      {r.estado === 'PENDIENTE' ? 'Pendiente' : 'Confirmada'}
                    </span>
                    {reservaId === r.id && (
                      <CheckCircle2 size={13} style={{ color: 'var(--color-exito)', flexShrink: 0 }} />
                    )}
                  </button>
                ))}
              </div>
            )}
            {errores.reservaId && (
              <span className="campo-error-inline">{errores.reservaId}</span>
            )}
          </div>
        )}

        {/* Fecha y hora de envío */}
        <div className="campo-grupo">
          <label className="campo-etiqueta">
            Enviar el <span className="campo-requerido">*</span>
          </label>
          <SelectorFecha
            valor={enviarEn}
            alCambiar={(v) => { setEnviarEn(v); setErrores((p) => ({ ...p, enviarEn: '' })); }}
            error={!!errores.enviarEn}
          />
          {errores.enviarEn && (
            <span className="campo-error-inline">{errores.enviarEn}</span>
          )}
        </div>

        {/* Canal */}
        <div className="campo-grupo">
          <label className="campo-etiqueta">Canal</label>
          <div className="notificacion-canales">
            {OPCIONES_CANAL.map((op) => (
              <button
                key={op.valor}
                type="button"
                onClick={() => setCanal(op.valor)}
                className={[
                  'notificacion-canal-chip',
                  canal === op.valor ? 'notificacion-canal-chip--activo' : '',
                ].filter(Boolean).join(' ')}
              >
                {op.icono}
                {op.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {/* Preview del recordatorio */}
        {clienteId && reservaId && enviarEn && (
          <div className="notificacion-preview">
            <SendHorizonal size={13} style={{ color: 'var(--color-primario)', flexShrink: 0 }} />
            <div className="notificacion-preview-texto">
              <span>Se enviará un aviso por <strong>{OPCIONES_CANAL.find((o) => o.valor === canal)?.etiqueta}</strong> el </span>
              <strong>{formatearFechaHora(enviarEn)}</strong>
            </div>
          </div>
        )}

        <Boton
          type="submit"
          variante="primario"
          cargando={estadoProgramar.ejecutando}
          icono={<Bell size={14} />}
        >
          Programar recordatorio
        </Boton>
      </form>
    </SeccionTarjeta>
  );
}

// ── Pestaña 2: Lista de recordatorios ─────────────────────────────────────────

function PestanaRecordatorios() {
  const { recordatorios, cargando } = usarListaRecordatorios();
  const { cancelar, estadoCancelar } = usarRecordatorios();
  const [recordatorioACancelar, setRecordatorioACancelar] = useState<RecordatorioResumen | null>(null);

  const pendientes  = recordatorios.filter((r) => r.estado === 'PENDIENTE').length;
  const enviados    = recordatorios.filter((r) => r.estado === 'ENVIADO').length;
  const fallidos    = recordatorios.filter((r) => r.estado === 'FALLIDO').length;

  const confirmarCancelacion = () => {
    if (!recordatorioACancelar) return;
    cancelar(recordatorioACancelar.id, {
      onSuccess: () => {
        toast.success('Recordatorio cancelado');
        setRecordatorioACancelar(null);
      },
      onError: () => {
        toast.error('No se pudo cancelar el recordatorio');
        setRecordatorioACancelar(null);
      },
    });
  };

  const columnas = [
    {
      clave: 'cliente',
      etiqueta: 'Cliente',
      render: (r: RecordatorioResumen) => (
        <div className="notificacion-celda-cliente">
          <Avatar nombre={r.nombre_cliente} tamano="sm" />
          <div>
            <p className="notificacion-cliente-nombre">{r.nombre_cliente}</p>
            {r.fecha_reserva && (
              <p className="notificacion-cliente-reserva">
                <Clock size={10} /> {formatearFechaCorta(r.fecha_reserva)}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      clave: 'enviar_en',
      etiqueta: 'Enviar el',
      render: (r: RecordatorioResumen) => (
        <span className="notificacion-fecha-envio">
          {formatearFechaHora(r.enviar_en)}
        </span>
      ),
    },
    {
      clave: 'canal',
      etiqueta: 'Canal',
      render: (r: RecordatorioResumen) => (
        <div className="notificacion-canal-celda">
          {iconoCanal(r.canal)}
          <span>{r.canal === 'WHATSAPP' ? 'WhatsApp' : r.canal === 'EMAIL' ? 'Email' : 'SMS'}</span>
        </div>
      ),
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (r: RecordatorioResumen) => (
        <Insignia variante={varianteEstado(r.estado)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {iconoEstado(r.estado)}
            {etiquetaEstado(r.estado)}
          </span>
        </Insignia>
      ),
    },
    {
      clave: 'acciones',
      etiqueta: '',
      render: (r: RecordatorioResumen) => (
        <MenuAcciones
          acciones={[
            {
              id: 'cancelar',
              etiqueta: 'Cancelar',
              icono: <XCircle size={13} />,
              variante: 'peligro' as const,
              deshabilitada: r.estado !== 'PENDIENTE',
            },
          ]}
          onAccion={() => setRecordatorioACancelar(r)}
        />
      ),
    },
  ];

  return (
    <>
      {/* Stats */}
      {recordatorios.length > 0 && (
        <div className="notificacion-stats">
          <div className="notificacion-stat notificacion-stat--advertencia">
            <Clock size={13} />
            <span>{pendientes} pendiente{pendientes !== 1 ? 's' : ''}</span>
          </div>
          <div className="notificacion-stat notificacion-stat--exito">
            <CheckCircle2 size={13} />
            <span>{enviados} enviado{enviados !== 1 ? 's' : ''}</span>
          </div>
          {fallidos > 0 && (
            <div className="notificacion-stat notificacion-stat--error">
              <AlertCircle size={13} />
              <span>{fallidos} fallido{fallidos !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      <SeccionTarjeta titulo="Historial de recordatorios" sinPaddingCuerpo>
        <TablaDatos<RecordatorioResumen>
          columnas={columnas}
          filas={recordatorios}
          obtenerClave={(r) => r.id}
          cargando={cargando}
          vacioIcono={<Bell size={28} />}
          vacioTitulo="Sin recordatorios aún"
          vacioMensaje="Programa el primero desde la pestaña anterior."
        />
      </SeccionTarjeta>

      <DialogoConfirmacion
        abierto={!!recordatorioACancelar}
        titulo="Cancelar recordatorio"
        descripcion={
          recordatorioACancelar
            ? `¿Cancelar el recordatorio por ${recordatorioACancelar.canal === 'WHATSAPP' ? 'WhatsApp' : recordatorioACancelar.canal} para ${recordatorioACancelar.nombre_cliente} programado el ${formatearFechaHora(recordatorioACancelar.enviar_en)}?`
            : ''
        }
        textoConfirmar="Cancelar recordatorio"
        variante="peligro"
        cargando={estadoCancelar.ejecutando}
        alConfirmar={confirmarCancelacion}
        alCancelar={() => setRecordatorioACancelar(null)}
      />
    </>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

const PESTANAS = [
  { id: 'programar',    etiqueta: 'Programar',     icono: <Bell size={14} /> },
  { id: 'recordatorios', etiqueta: 'Recordatorios', icono: <RefreshCw size={14} /> },
];

export function PaginaRecordatorios() {
  const [pestanaActiva, setPestanaActiva] = useState('programar');
  const { recordatorios } = usarListaRecordatorios();
  const pendientes = recordatorios.filter((r) => r.estado === 'PENDIENTE').length;

  return (
    <motion.div
      className="pagina-notificaciones"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <EncabezadoPagina
        titulo="Recordatorios automáticos"
        descripcion="Programa y gestiona avisos de reservas por WhatsApp, email o SMS"
        indicador={
          pendientes > 0 ? (
            <span className="encabezado-indicador-chip encabezado-indicador-chip--advertencia">
              <Clock size={11} />
              {pendientes} pendiente{pendientes !== 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      />

      <div className="notificaciones-pestanas-wrapper">
        <Pestanas
          pestanas={PESTANAS}
          activa={pestanaActiva}
          alCambiar={setPestanaActiva}
          variante="linea"
        />
      </div>

      <div className="notificaciones-contenido">
        {pestanaActiva === 'programar'     && <PestanaProgramar />}
        {pestanaActiva === 'recordatorios' && <PestanaRecordatorios />}
      </div>
    </motion.div>
  );
}
