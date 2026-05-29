import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Scissors, MessageCircle, Clock, Package, Plus } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { usarReservas } from '@/capacidades/reservas/ganchos/usarReservas';
import { usarAccionesReserva } from '@/capacidades/reservas/ganchos/usarAccionesReserva';
import { usarBarberos } from '@/capacidades/agenda/ganchos/usarBarberos';
import { usarComplementosReserva, usarAgregarComplemento } from '@/capacidades/reservas/ganchos/usarComplementosReserva';
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio';
import { EstadoReserva } from '@/capacidades/reservas/componentes/EstadoReserva';
import { GuardiaPermiso } from '@/plataforma/activacion/GuardiaPermiso';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { Cargando } from '@/compartido/interfaz/retroalimentacion/Cargando';
import { Vacio } from '@/compartido/interfaz/retroalimentacion/Vacio';

const ETIQUETA_ORIGEN: Record<string, string> = { WHATSAPP: 'WhatsApp', WEB: 'Web', MANUAL: 'Presencial' };

// ── Panel de complementos ─────────────────────────────────────────────────────

function PanelComplementos({ reservaId }: { reservaId: string }) {
  const { complementos, cargando } = usarComplementosReserva(reservaId);
  const mutacionAgregar = usarAgregarComplemento(reservaId);

  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [errores, setErrores] = useState<Record<string, string>>({});

  const manejarAgregar = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevos: Record<string, string> = {};
    if (!productoId.trim()) nuevos.productoId = 'Ingresa el ID del producto';
    if (!cantidad || Number(cantidad) <= 0) nuevos.cantidad = 'Cantidad debe ser mayor a 0';
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return; }

    mutacionAgregar.mutate(
      { producto_id: productoId.trim(), cantidad: Number(cantidad) },
      {
        onSuccess: () => {
          toast.success('Complemento agregado');
          setProductoId('');
          setCantidad('1');
          setErrores({});
        },
        onError: (err) => toast.error(mensajeDeError(err)),
      },
    );
  };

  return (
    <div
      style={{
        border: '1px solid var(--color-borde)',
        borderRadius: 'var(--radio-xl)',
        padding: 'var(--espacio-md) var(--espacio-lg)',
        backgroundColor: 'var(--color-superficie)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--espacio-md)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Package size={14} style={{ color: 'var(--color-texto-suave)' }} />
        <span style={{ fontWeight: 600, fontSize: 'var(--tamano-sm)', color: 'var(--color-texto)' }}>
          Complementos de la reserva
        </span>
      </div>

      {cargando ? (
        <Cargando mensaje="Cargando complementos..." />
      ) : complementos.length === 0 ? (
        <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-muted)', margin: 0 }}>
          Sin complementos agregados aún.
        </p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {complementos.map((c) => (
            <li
              key={c.producto_id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--tamano-sm)',
                padding: '0.375rem 0',
                borderBottom: '1px solid var(--color-borde-suave)',
              }}
            >
              <span style={{ color: 'var(--color-texto)' }}>{c.nombre_producto}</span>
              <span style={{ color: 'var(--color-texto-suave)', fontWeight: 500 }}>x{c.cantidad}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Formulario para agregar complemento */}
      <form
        onSubmit={manejarAgregar}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-sm)' }}
      >
        <div style={{ display: 'flex', gap: 'var(--espacio-sm)', flexWrap: 'wrap' }}>
          <div className="campo-grupo" style={{ flex: 2, minWidth: 160 }}>
            <label className="campo-etiqueta">ID de producto</label>
            <input
              className={`campo-entrada${errores.productoId ? ' campo-entrada--error' : ''}`}
              value={productoId}
              onChange={(e) => { setProductoId(e.target.value); setErrores((p) => ({ ...p, productoId: '' })); }}
              placeholder="producto-uuid"
            />
            {errores.productoId && <span className="campo-error-inline">{errores.productoId}</span>}
          </div>
          <div className="campo-grupo" style={{ flex: 1, minWidth: 80 }}>
            <label className="campo-etiqueta">Cantidad</label>
            <input
              type="number"
              min="1"
              className={`campo-entrada${errores.cantidad ? ' campo-entrada--error' : ''}`}
              value={cantidad}
              onChange={(e) => { setCantidad(e.target.value); setErrores((p) => ({ ...p, cantidad: '' })); }}
            />
            {errores.cantidad && <span className="campo-error-inline">{errores.cantidad}</span>}
          </div>
        </div>
        <Boton
          type="submit"
          variante="secundario"
          cargando={mutacionAgregar.isPending}
          icono={<Plus size={13} />}
        >
          Agregar complemento
        </Boton>
      </form>
    </div>
  );
}

function FilaDetalle({ etiqueta, valor, icono }: { etiqueta: string; valor: React.ReactNode; icono?: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 0',
        borderBottom: '1px solid var(--color-borde-suave)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-texto-suave)' }}>
        {icono}
        <span style={{ fontSize: 'var(--tamano-sm)' }}>{etiqueta}</span>
      </div>
      <div style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
        {valor}
      </div>
    </div>
  );
}

export function PaginaDetalleReserva() {
  const { reservaId } = useParams<{ reservaId: string }>();
  const { reservas, cargando, error } = usarReservas();
  const { confirmar, cancelar, completar, ejecutando } = usarAccionesReserva();
  const { barberos } = usarBarberos();

  const reserva = reservas.find((r) => r.id === reservaId);
  const mapaBarberos = Object.fromEntries(barberos.map((b) => [b.id, b.nombre]));

  const manejarConfirmar = async () => {
    if (!reserva) return;
    await confirmar(reserva.id);
    toast.success('Reserva confirmada');
  };

  const manejarCompletar = async () => {
    if (!reserva) return;
    await completar(reserva.id);
    toast.success('Reserva marcada como completada');
  };

  const manejarCancelar = async () => {
    if (!reserva) return;
    await cancelar(reserva.id);
    toast.info('Reserva cancelada');
  };

  const estiloContenedor: React.CSSProperties = {
    padding: 'var(--espacio-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--espacio-lg)',
    maxWidth: '640px',
  };

  if (cargando) return <div style={estiloContenedor}><Cargando mensaje="Cargando reserva..." /></div>;

  if (error) return (
    <div style={estiloContenedor}>
      <Vacio titulo="Error al cargar" mensaje="No se pudo obtener la información de la reserva." />
    </div>
  );

  if (!reserva) return (
    <div style={estiloContenedor}>
      <Link to="/reservas" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: 'var(--tamano-sm)', color: 'var(--color-primario)', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Volver a reservas
      </Link>
      <Vacio titulo="Reserva no encontrada" mensaje="La reserva que buscas no existe o fue eliminada." />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={estiloContenedor}
    >
      <Link
        to="/reservas"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: 'var(--tamano-sm)', color: 'var(--color-primario)', textDecoration: 'none', width: 'fit-content' }}
      >
        <ArrowLeft size={14} /> Volver a reservas
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ fontSize: 'var(--tamano-xl)', fontWeight: 700, color: 'var(--color-texto)', margin: 0, letterSpacing: '-0.02em' }}>
          Detalle de reserva
        </h1>
        <EstadoReserva estado={reserva.estado} />
      </div>

      {/* Card de información */}
      <div
        style={{
          border: '1px solid var(--color-borde)',
          borderRadius: 'var(--radio-xl)',
          padding: 'var(--espacio-md) var(--espacio-lg)',
          backgroundColor: 'var(--color-superficie)',
        }}
      >
        <FilaDetalle
          etiqueta="Cliente"
          icono={<User size={14} />}
          valor={
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-texto-suave)' }}>
              <User size={12} /> Cliente registrado
            </span>
          }
        />
        <FilaDetalle
          etiqueta="Barbero"
          icono={<Scissors size={14} />}
          valor={mapaBarberos[reserva.barbero_id] ?? (
            <span style={{ color: 'var(--color-texto-muted)', fontStyle: 'italic' }}>Sin asignar</span>
          )}
        />
        <FilaDetalle
          etiqueta="Canal"
          icono={<MessageCircle size={14} />}
          valor={ETIQUETA_ORIGEN[reserva.origen] ?? reserva.origen}
        />
        <FilaDetalle
          etiqueta="Fecha y hora"
          icono={<Clock size={14} />}
          valor={new Date(reserva.fecha_hora_inicio).toLocaleDateString('es-PE', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        />
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 'var(--espacio-sm)', flexWrap: 'wrap' }}>
        <GuardiaPermiso permiso="RESERVA_CONFIRMAR">
          <Boton
            variante="primario"
            cargando={ejecutando}
            onClick={manejarConfirmar}
            disabled={reserva.estado !== 'PENDIENTE'}
          >
            Confirmar reserva
          </Boton>
        </GuardiaPermiso>
        <GuardiaPermiso permiso="RESERVA_COMPLETAR">
          <Boton
            variante="secundario"
            cargando={ejecutando}
            onClick={manejarCompletar}
            disabled={reserva.estado !== 'CONFIRMADA'}
          >
            Marcar completada
          </Boton>
        </GuardiaPermiso>
        <GuardiaPermiso permiso="RESERVA_CANCELAR">
          <Boton
            variante="peligro"
            cargando={ejecutando}
            onClick={manejarCancelar}
            disabled={reserva.estado === 'CANCELADA' || reserva.estado === 'COMPLETADA'}
          >
            Cancelar reserva
          </Boton>
        </GuardiaPermiso>
      </div>

      {/* Complementos */}
      <PanelComplementos reservaId={reserva.id} />
    </motion.div>
  );
}
