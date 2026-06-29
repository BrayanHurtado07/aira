import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Star, XCircle, Gift, Award, Phone, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { GuardiaCapacidad } from '@/plataforma/activacion/GuardiaCapacidad';
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina';
import { Pestanas } from '@/compartido/interfaz/primitivas/Pestanas';
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta';
import { Avatar } from '@/compartido/interfaz/primitivas/Avatar';
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos';
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta';
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion';
import { Modal } from '@/compartido/interfaz/primitivas/Modal';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { Campo } from '@/compartido/interfaz/primitivas/Campo';
import { BuscadorCliente } from '@/capacidades/reservas/componentes/BuscadorCliente';
import { usarReservas } from '@/capacidades/reservas/ganchos/usarReservas';
import type { Reserva } from '@/capacidades/reservas/contratos/tipos';
import {
  usarCrearPrograma,
  usarPrograma,
  usarTarjetas,
  usarTarjetaDeCliente,
  usarTarjetaLealtad,
  usarSellosCliente,
} from '../ganchos/usarTarjetaLealtad';
import type { TarjetaLealtad, SelloActivo } from '../contratos/tipos';

// ── Utilidades ────────────────────────────────────────────────────────────────

function FilaSellos({ activos, total }: { activos: number; total: number }) {
  const maximo = Math.max(total, 1);
  return (
    <div className="lealtad-sello-fila">
      {Array.from({ length: maximo }).map((_, i) => (
        <span
          key={i}
          className={[
            'lealtad-sello-circulo',
            i < activos ? 'lealtad-sello-circulo--activo' : 'lealtad-sello-circulo--vacio',
          ].join(' ')}
          title={i < activos ? 'Sello acumulado' : 'Sello pendiente'}
        />
      ))}
    </div>
  );
}

function formatearFechaCorta(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatearFechaHora(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-PE', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// ── Modal: Crear programa de lealtad ─────────────────────────────────────────

function ModalCrearPrograma({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  const { crear, ejecutando } = usarCrearPrograma();
  const [nombre, setNombre] = useState('');
  const [sellos, setSellos] = useState<number | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});

  function limpiar() {
    setNombre('');
    setSellos('');
    setDescripcion('');
    setErrores({});
  }

  function manejarCerrar() {
    limpiar();
    alCerrar();
  }

  function manejarCrear() {
    const nuevos: Record<string, string> = {};
    if (!nombre.trim()) nuevos.nombre = 'El nombre es obligatorio';
    if (!sellos || sellos <= 0) nuevos.sellos = 'Debe ser un número mayor a 0';
    if (!descripcion.trim()) nuevos.descripcion = 'Describe la recompensa';
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return; }

    crear(
      { nombre: nombre.trim(), sellos_para_recompensa: sellos as number, descripcion_recompensa: descripcion.trim() },
      {
        onSuccess: () => {
          toast.success('Programa de lealtad creado', { description: nombre.trim() });
          limpiar();
          alCerrar();
        },
        onError: (err: Error) => {
          const msg = err?.message ?? '';
          if (msg.includes('ya_tiene_programa')) {
            toast.error('La empresa ya tiene un programa activo');
          } else {
            toast.error('No se pudo crear el programa');
          }
        },
      },
    );
  }

  return (
    <Modal
      abierto={abierto}
      alCerrar={manejarCerrar}
      titulo="Crear programa de lealtad"
      descripcion="Define cuántos sellos necesita un cliente para canjear una recompensa."
      ancho="sm"
      pie={
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Boton variante="secundario" type="button" onClick={manejarCerrar}>
            Cancelar
          </Boton>
          <Boton
            variante="primario"
            type="button"
            icono={<Plus size={14} />}
            onClick={manejarCrear}
            cargando={ejecutando}
          >
            Crear programa
          </Boton>
        </div>
      }
    >
      <div className="lealtad-form">
        <Campo
          etiqueta="Nombre del programa"
          requerido
          error={errores.nombre}
          value={nombre}
          onChange={(e) => { setNombre(e.target.value); setErrores((p) => ({ ...p, nombre: '' })); }}
          placeholder="Ej: Programa Fidelidad Premium"
          className="campo-input"
        />
        <Campo
          etiqueta="Sellos para recompensa"
          requerido
          type="number"
          error={errores.sellos}
          value={sellos === '' ? '' : String(sellos)}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            setSellos(isNaN(v) ? '' : v);
            setErrores((p) => ({ ...p, sellos: '' }));
          }}
          min={1}
          max={50}
          placeholder="Ej: 10"
          className="campo-input"
        />
        <Campo
          etiqueta="Descripción de la recompensa"
          requerido
          error={errores.descripcion}
          value={descripcion}
          onChange={(e) => { setDescripcion(e.target.value); setErrores((p) => ({ ...p, descripcion: '' })); }}
          placeholder="Ej: Corte de cabello gratis"
          className="campo-input"
        />
      </div>
    </Modal>
  );
}

// ── Pestaña 1: Resumen ────────────────────────────────────────────────────────

function PestanaResumen() {
  const { programa, cargando: cargandoPrograma } = usarPrograma();
  const { tarjetas, cargando: cargandoTarjetas } = usarTarjetas();
  const [modalCrear, setModalCrear] = useState(false);

  const totalSellos = programa?.sellos_para_recompensa ?? 10;

  return (
    <div className="lealtad-pestana-contenido">
      {/* Modal crear programa */}
      <ModalCrearPrograma abierto={modalCrear} alCerrar={() => setModalCrear(false)} />

      {/* Info del programa */}
      <SeccionTarjeta
        titulo="Programa activo"
        icono={<Award size={14} />}
        colorIcono="rgba(217,119,6,0.1)"
        maxAncho={600}
        acciones={!cargandoPrograma && !programa ? (
          <Boton
            variante="primario"
            type="button"
            icono={<Plus size={14} />}
            onClick={() => setModalCrear(true)}
          >
            Crear programa
          </Boton>
        ) : undefined}
      >
        {cargandoPrograma ? (
          <p className="lealtad-cargando">Cargando programa…</p>
        ) : programa ? (
          <div className="lealtad-programa-card">
            <div className="lealtad-programa-header">
              <div className="lealtad-programa-nombre">{programa.nombre}</div>
              <span className="lealtad-programa-estado-chip">Activo</span>
            </div>
            <div className="lealtad-programa-meta">
              <div className="lealtad-programa-meta-item">
                <Star size={13} style={{ color: 'var(--color-advertencia)' }} />
                <span>{programa.sellos_para_recompensa} sellos por recompensa</span>
              </div>
              {programa.descripcion_recompensa && (
                <div className="lealtad-programa-meta-item">
                  <Gift size={13} style={{ color: 'var(--color-exito)' }} />
                  <span>{programa.descripcion_recompensa}</span>
                </div>
              )}
            </div>
            <FilaSellos activos={programa.sellos_para_recompensa} total={programa.sellos_para_recompensa} />
          </div>
        ) : (
          <div className="lealtad-programa-vacio">
            <AlertCircle size={28} style={{ color: 'var(--color-texto-muted)' }} />
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-texto)' }}>Sin programa activo</p>
            <p style={{ margin: 0, fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)' }}>
              Crea un programa de lealtad para comenzar a acumular sellos con tus clientes.
            </p>
            <Boton
              variante="primario"
              type="button"
              icono={<Plus size={14} />}
              onClick={() => setModalCrear(true)}
              style={{ marginTop: '0.75rem' }}
            >
              Crear programa
            </Boton>
          </div>
        )}
      </SeccionTarjeta>

      {/* Tabla de tarjetas */}
      <SeccionTarjeta titulo="Tarjetas de clientes" sinPaddingCuerpo>
        <TablaDatos<TarjetaLealtad>
          columnas={[
            {
              clave: 'cliente',
              etiqueta: 'Cliente',
              render: (t) => (
                <div className="lealtad-tabla-cliente">
                  <Avatar nombre={t.nombre_cliente} tamano="sm" />
                  <div className="lealtad-tabla-cliente-info">
                    <span className="lealtad-tabla-cliente-nombre">{t.nombre_cliente || '—'}</span>
                    {t.telefono && (
                      <span className="lealtad-tabla-cliente-telefono">
                        <Phone size={10} style={{ marginRight: '0.2rem', verticalAlign: 'middle' }} />
                        {t.telefono}
                      </span>
                    )}
                  </div>
                </div>
              ),
            },
            {
              clave: 'progreso',
              etiqueta: 'Progreso',
              render: (t) => <FilaSellos activos={t.sellos_activos} total={totalSellos} />,
            },
            {
              clave: 'sellos_activos',
              etiqueta: 'Sellos',
              alinear: 'centro',
              render: (t) => (
                <span className="lealtad-badge-sellos">{t.sellos_activos} / {totalSellos}</span>
              ),
            },
            {
              clave: 'total_canjes',
              etiqueta: 'Canjes',
              alinear: 'centro',
              render: (t) => <span className="lealtad-badge-canjes">{t.total_canjes}</span>,
            },
          ]}
          filas={tarjetas}
          obtenerClave={(t) => t.tarjeta_id}
          cargando={cargandoTarjetas}
          vacioIcono={<Star size={32} />}
          vacioTitulo="Sin tarjetas aún"
          vacioMensaje="Acumula el primer sello para crear una tarjeta de lealtad."
        />
      </SeccionTarjeta>
    </div>
  );
}

// ── Pestaña 2: Acumular sello ─────────────────────────────────────────────────

function PestanaAcumularSello() {
  const { acumular, estadoAcumular } = usarTarjetaLealtad();
  const { reservas } = usarReservas();

  const [clienteId, setClienteId] = useState('');
  const [reservaId, setReservaId] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});

  const reservasDelCliente = useMemo(
    () => (reservas as Reserva[]).filter(
      (rv) => rv.cliente_id === clienteId && rv.estado === 'COMPLETADA',
    ),
    [reservas, clienteId],
  );

  function manejarAcumular() {
    const nuevos: Record<string, string> = {};
    if (!clienteId) nuevos.cliente = 'Selecciona un cliente';
    if (!reservaId) nuevos.reserva = 'Selecciona una reserva completada';
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return; }

    acumular({ cliente_id: clienteId, reserva_id: reservaId }, {
      onSuccess: () => {
        toast.success('Sello acumulado correctamente');
        setClienteId('');
        setReservaId('');
        setErrores({});
      },
      onError: () => toast.error('No se pudo acumular el sello'),
    });
  }

  return (
    <div className="lealtad-pestana-contenido">
      <SeccionTarjeta
        titulo="Acumular sello"
        descripcion="Selecciona el cliente y una reserva completada para acumular un sello."
        icono={<Star size={14} />}
        colorIcono="rgba(217,119,6,0.1)"
        maxAncho={520}
      >
        <div className="lealtad-form">
          {/* Selector de cliente */}
          <BuscadorCliente
            valor={clienteId}
            alCambiar={(id) => {
              setClienteId(id);
              setReservaId('');
              setErrores((p) => ({ ...p, cliente: '' }));
            }}
            error={errores.cliente}
          />

          {/* Reservas completadas del cliente */}
          {clienteId && (
            <div className="campo-grupo">
              <label className="campo-etiqueta">
                Reserva completada <span className="campo-requerido">*</span>
              </label>
              {reservasDelCliente.length === 0 ? (
                <BannerAlerta
                  variante="advertencia"
                  mensaje="Este cliente no tiene reservas completadas disponibles."
                />
              ) : (
                <div className="lealtad-reservas-lista">
                  {reservasDelCliente.map((rv) => (
                    <button
                      key={rv.id}
                      type="button"
                      onClick={() => { setReservaId(rv.id); setErrores((p) => ({ ...p, reserva: '' })); }}
                      className={[
                        'lealtad-reserva-opcion',
                        reservaId === rv.id ? 'lealtad-reserva-opcion--activa' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <Clock size={12} style={{ flexShrink: 0 }} />
                      <span className="lealtad-reserva-fecha">
                        {formatearFechaHora(rv.fecha_hora_inicio)}
                      </span>
                      {reservaId === rv.id && (
                        <CheckCircle2 size={13} style={{ marginLeft: 'auto', color: 'var(--color-exito)', flexShrink: 0 }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
              {errores.reserva && (
                <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>{errores.reserva}</span>
              )}
            </div>
          )}

          <Boton
            type="button"
            variante="primario"
            onClick={manejarAcumular}
            cargando={estadoAcumular.ejecutando}
            icono={<Star size={14} />}
            disabled={!clienteId || !reservaId}
          >
            Acumular sello
          </Boton>
        </div>
      </SeccionTarjeta>
    </div>
  );
}

// ── Pestaña 3: Operaciones ────────────────────────────────────────────────────

function SubseccionAplicarCanje() {
  const { canjear, estadoCanjear } = usarTarjetaLealtad();

  const [clienteId, setClienteId] = useState('');
  const [sellosAUsar, setSellosAUsar] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});

  const { tarjeta } = usarTarjetaDeCliente(clienteId);

  function manejarCanje() {
    const cantidad = parseInt(sellosAUsar, 10);
    const nuevos: Record<string, string> = {};
    if (!clienteId) nuevos.cliente = 'Selecciona un cliente';
    if (!tarjeta) nuevos.cliente = 'Este cliente no tiene tarjeta de lealtad';
    if (isNaN(cantidad) || cantidad <= 0) nuevos.sellos = 'Ingresa una cantidad válida';
    if (tarjeta && cantidad > tarjeta.sellos_activos) nuevos.sellos = `Máximo ${tarjeta.sellos_activos} sellos disponibles`;
    if (!descripcion.trim()) nuevos.descripcion = 'Describe el beneficio del canje';
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return; }

    canjear(
      { tarjeta_id: tarjeta!.tarjeta_id, reserva_id: '', sellos_a_usar: cantidad, descripcion: descripcion.trim() },
      {
        onSuccess: () => {
          toast.success('Canje aplicado correctamente', { description: descripcion.trim() });
          setClienteId('');
          setSellosAUsar('');
          setDescripcion('');
          setErrores({});
        },
        onError: () => toast.error('No se pudo aplicar el canje'),
      },
    );
  }

  return (
    <SeccionTarjeta
      titulo="Aplicar canje"
      descripcion="Usa los sellos acumulados de un cliente para aplicar una recompensa."
      icono={<Gift size={14} />}
      colorIcono="rgba(5,150,105,0.1)"
    >
      <div className="lealtad-form">
        <BuscadorCliente
          valor={clienteId}
          alCambiar={(id) => { setClienteId(id); setErrores((p) => ({ ...p, cliente: '' })); }}
          error={errores.cliente}
        />

        {tarjeta ? (
          <div className="lealtad-tarjeta-info">
            <div className="lealtad-tarjeta-info-fila">
              <Star size={13} style={{ color: 'var(--color-advertencia)' }} />
              <span className="lealtad-tarjeta-info-etiqueta">Sellos disponibles:</span>
              <span className="lealtad-tarjeta-info-valor">{tarjeta.sellos_activos}</span>
            </div>
            <FilaSellos activos={tarjeta.sellos_activos} total={Math.max(tarjeta.sellos_activos, 10)} />
          </div>
        ) : clienteId ? (
          <BannerAlerta
            variante="advertencia"
            mensaje="Este cliente aún no tiene tarjeta de lealtad."
          />
        ) : null}

        <Campo
          etiqueta="Sellos a usar"
          requerido
          type="number"
          error={errores.sellos}
          value={sellosAUsar}
          onChange={(e) => { setSellosAUsar(e.target.value); setErrores((p) => ({ ...p, sellos: '' })); }}
          placeholder={tarjeta ? `Máximo: ${tarjeta.sellos_activos}` : 'Ej: 5'}
          min={1}
          className="campo-input"
        />
        <Campo
          etiqueta="Descripción del beneficio"
          requerido
          error={errores.descripcion}
          value={descripcion}
          onChange={(e) => { setDescripcion(e.target.value); setErrores((p) => ({ ...p, descripcion: '' })); }}
          placeholder="Ej: Corte gratis por 10 sellos"
          className="campo-input"
        />
        <Boton
          type="button"
          variante="primario"
          onClick={manejarCanje}
          cargando={estadoCanjear.ejecutando}
          icono={<Gift size={14} />}
          disabled={!clienteId || !tarjeta}
        >
          Aplicar canje
        </Boton>
      </div>
    </SeccionTarjeta>
  );
}

// ── Anular sello: flujo cliente → sello ───────────────────────────────────────

function SubseccionAnularSello() {
  const { anular, estadoAnular } = usarTarjetaLealtad();

  const [clienteId, setClienteId] = useState('');
  const [selloSeleccionado, setSelloSeleccionado] = useState<SelloActivo | null>(null);
  const [motivo, setMotivo] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [confirmar, setConfirmar] = useState(false);

  const { tarjeta } = usarTarjetaDeCliente(clienteId);
  const { sellos, cargando: cargandoSellos } = usarSellosCliente(clienteId);

  const solicitarAnulacion = () => {
    const nuevos: Record<string, string> = {};
    if (!clienteId) nuevos.cliente = 'Selecciona un cliente';
    if (!selloSeleccionado) nuevos.sello = 'Selecciona el sello a anular';
    if (!motivo.trim()) nuevos.motivo = 'Describe el motivo de la anulación';
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return; }
    setConfirmar(true);
  };

  const confirmarAnulacion = () => {
    anular({ selloId: selloSeleccionado!.sello_id, motivo: motivo.trim() }, {
      onSuccess: () => {
        toast.success('Sello anulado correctamente');
        setClienteId('');
        setSelloSeleccionado(null);
        setMotivo('');
        setErrores({});
        setConfirmar(false);
      },
      onError: () => {
        toast.error('No se pudo anular el sello');
        setConfirmar(false);
      },
    });
  };

  return (
    <>
      <SeccionTarjeta
        titulo="Anular sello"
        descripcion="Selecciona el cliente, elige el sello y proporciona el motivo."
        icono={<XCircle size={14} />}
        colorIcono="rgba(191,30,46,0.08)"
      >
        <div className="lealtad-form">
          {/* Cliente */}
          <BuscadorCliente
            valor={clienteId}
            alCambiar={(id) => {
              setClienteId(id);
              setSelloSeleccionado(null);
              setErrores((p) => ({ ...p, cliente: '', sello: '' }));
            }}
            error={errores.cliente}
          />

          {/* Info tarjeta */}
          {tarjeta && (
            <div className="lealtad-tarjeta-info">
              <div className="lealtad-tarjeta-info-fila">
                <Star size={13} style={{ color: 'var(--color-advertencia)' }} />
                <span className="lealtad-tarjeta-info-etiqueta">Sellos activos:</span>
                <span className="lealtad-tarjeta-info-valor">{tarjeta.sellos_activos}</span>
              </div>
            </div>
          )}

          {clienteId && !tarjeta && (
            <BannerAlerta
              variante="advertencia"
              mensaje="Este cliente no tiene tarjeta de lealtad."
            />
          )}

          {/* Lista de sellos del cliente */}
          {clienteId && tarjeta && (
            <div className="campo-grupo">
              <label className="campo-etiqueta">
                Sello a anular <span className="campo-requerido">*</span>
              </label>
              {cargandoSellos ? (
                <p className="lealtad-cargando">Cargando sellos…</p>
              ) : sellos.length === 0 ? (
                <BannerAlerta
                  variante="info"
                  mensaje="Este cliente no tiene sellos activos para anular."
                />
              ) : (
                <div className="lealtad-sellos-lista">
                  {sellos.map((s, i) => (
                    <button
                      key={s.sello_id}
                      type="button"
                      onClick={() => { setSelloSeleccionado(s); setErrores((p) => ({ ...p, sello: '' })); }}
                      className={[
                        'lealtad-sello-item',
                        selloSeleccionado?.sello_id === s.sello_id ? 'lealtad-sello-item--activo' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <span className="lealtad-sello-item-num">#{i + 1}</span>
                      <Clock size={11} style={{ flexShrink: 0, color: 'var(--color-texto-suave)' }} />
                      <span className="lealtad-sello-item-fecha">{formatearFechaCorta(s.creado_en)}</span>
                      {selloSeleccionado?.sello_id === s.sello_id && (
                        <CheckCircle2 size={13} style={{ marginLeft: 'auto', color: 'var(--color-exito)', flexShrink: 0 }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
              {errores.sello && (
                <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>{errores.sello}</span>
              )}
            </div>
          )}

          {/* Motivo */}
          <Campo
            etiqueta="Motivo de anulación"
            requerido
            error={errores.motivo}
            value={motivo}
            onChange={(e) => { setMotivo(e.target.value); setErrores((p) => ({ ...p, motivo: '' })); }}
            placeholder="Describe el motivo de la anulación"
            className="campo-input"
          />

          <Boton
            type="button"
            variante="peligro"
            onClick={solicitarAnulacion}
            icono={<XCircle size={14} />}
            disabled={!clienteId || !selloSeleccionado}
          >
            Anular sello
          </Boton>
        </div>
      </SeccionTarjeta>

      <DialogoConfirmacion
        abierto={confirmar}
        titulo="¿Anular este sello?"
        descripcion={`Se anulará el sello del ${formatearFechaCorta(selloSeleccionado?.creado_en ?? '')}. Motivo: "${motivo}". Esta acción no se puede deshacer.`}
        variante="peligro"
        textoConfirmar="Anular sello"
        cargando={estadoAnular.ejecutando}
        alConfirmar={confirmarAnulacion}
        alCancelar={() => setConfirmar(false)}
      />
    </>
  );
}

function PestanaOperaciones() {
  return (
    <div className="lealtad-pestana-contenido lealtad-pestana-contenido--doble">
      <SubseccionAplicarCanje />
      <SubseccionAnularSello />
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

const PESTANAS = [
  { id: 'resumen',      etiqueta: 'Resumen',       icono: <Award size={14} /> },
  { id: 'acumular',     etiqueta: 'Acumular sello', icono: <Star size={14} /> },
  { id: 'operaciones',  etiqueta: 'Operaciones',    icono: <Gift size={14} /> },
];

function ContenidoLealtad() {
  const [pestanaActiva, setPestanaActiva] = useState('resumen');

  return (
    <motion.div
      className="pagina-lealtad"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <EncabezadoPagina
        titulo="Programa de lealtad"
        descripcion="Gestiona sellos, canjes y el progreso de fidelización de tus clientes"
      />

      <div className="lealtad-pestanas-wrapper">
        <Pestanas
          pestanas={PESTANAS}
          activa={pestanaActiva}
          alCambiar={setPestanaActiva}
          variante="linea"
        />
      </div>

      <div className="lealtad-contenido">
        {pestanaActiva === 'resumen'      && <PestanaResumen />}
        {pestanaActiva === 'acumular'     && <PestanaAcumularSello />}
        {pestanaActiva === 'operaciones'  && <PestanaOperaciones />}
      </div>
    </motion.div>
  );
}

export function PaginaLealtad() {
  return (
    <GuardiaCapacidad codigo="LEALTAD">
      <ContenidoLealtad />
    </GuardiaCapacidad>
  );
}
