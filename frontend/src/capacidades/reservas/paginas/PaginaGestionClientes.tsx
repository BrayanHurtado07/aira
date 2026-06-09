import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  UserPlus, Users, Search, Pencil, Ban, UserCheck,
  UserX, CheckCircle2, ChevronDown, Save,
} from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { usarClientes } from '@/capacidades/reservas/ganchos/usarClientes';
import {
  cambiarEstadoCliente,
  actualizarCliente,
} from '@/capacidades/reservas/servicios/servicio-reservas';
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos';
import type { ColumnaTabla } from '@/compartido/interfaz/primitivas/TablaDatos';
import { MenuAcciones } from '@/compartido/interfaz/primitivas/MenuAcciones';
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion';
import { Modal } from '@/compartido/interfaz/primitivas/Modal';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { Campo } from '@/compartido/interfaz/primitivas/Campo';
import { CampoEmail } from '@/compartido/interfaz/primitivas/CampoEmail';
import { SelectorTelefono } from '@/compartido/interfaz/primitivas/SelectorTelefono';
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina';
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta';
import type { Cliente, SolicitudRegistrarCliente } from '@/capacidades/reservas/contratos/tipos';

// ── Helpers ───────────────────────────────────────────────────────────────────

function iniciales(nombre: string): string {
  return nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

type EstadoCliente = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

const CFG_ESTADO: Record<EstadoCliente, { etiqueta: string; color: string; fondo: string; borde: string }> = {
  ACTIVO:   { etiqueta: 'Activo',    color: 'var(--color-exito)',        fondo: 'rgba(5,150,105,0.12)',   borde: 'rgba(5,150,105,0.2)' },
  INACTIVO: { etiqueta: 'Inactivo',  color: 'var(--color-texto-suave)',  fondo: 'rgba(107,114,128,0.12)', borde: 'rgba(107,114,128,0.2)' },
  BLOQUEADO:{ etiqueta: 'Bloqueado', color: 'var(--color-error)',        fondo: 'rgba(239,68,68,0.10)',   borde: 'rgba(239,68,68,0.2)' },
};

// ── Selector de estado con dropdown propio ────────────────────────────────────

function SelectorEstado({ cliente }: { cliente: Cliente }) {
  const clienteConsulta = useQueryClient();
  const [estado, setEstado] = useState<EstadoCliente>(cliente.estado as EstadoCliente);
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const botonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const mutacion = useMutation({
    mutationFn: (e: EstadoCliente) => cambiarEstadoCliente(cliente.id, e),
    onSuccess: (_, e) => {
      setEstado(e);
      clienteConsulta.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Estado actualizado', { description: `${cliente.nombre} · ${CFG_ESTADO[e].etiqueta}` });
    },
    onError: () => toast.error('No se pudo cambiar el estado'),
  });

  const abrir = useCallback(() => {
    if (!botonRef.current) return;
    const rect = botonRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left });
    setAbierto(true);
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node) && !botonRef.current?.contains(e.target as Node))
        setAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [abierto]);

  const cfg = CFG_ESTADO[estado];
  const OPCIONES: EstadoCliente[] = ['ACTIVO', 'INACTIVO', 'BLOQUEADO'];
  const DOT_COLOR: Record<EstadoCliente, string> = {
    ACTIVO: 'var(--color-exito)', INACTIVO: 'var(--color-texto-suave)', BLOQUEADO: 'var(--color-error)',
  };

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        disabled={mutacion.isPending}
        onClick={abierto ? () => setAbierto(false) : abrir}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.2rem 0.5rem 0.2rem 0.4rem',
          borderRadius: '99px', border: `1px solid ${cfg.borde}`,
          backgroundColor: cfg.fondo, color: cfg.color,
          cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 'var(--tamano-xs)', fontWeight: 600,
          transition: 'opacity 120ms',
          opacity: mutacion.isPending ? 0.55 : 1,
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: cfg.color, flexShrink: 0 }} />
        {cfg.etiqueta}
        <ChevronDown size={10} style={{ opacity: 0.7, transition: 'transform 120ms', transform: abierto ? 'rotate(180deg)' : '' }} />
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            ref={panelRef}
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className="selector-estado-panel"
            style={{ top: pos.top, left: pos.left }}
          >
            {OPCIONES.map((op) => (
              <button
                key={op}
                type="button"
                className={['selector-estado-opcion', op === estado ? 'selector-estado-opcion--seleccionada' : ''].filter(Boolean).join(' ')}
                style={{ color: DOT_COLOR[op] }}
                onClick={() => { setAbierto(false); if (op !== estado) mutacion.mutate(op); }}
              >
                <span className="selector-estado-opcion-dot" style={{ backgroundColor: DOT_COLOR[op] }} />
                <span style={{ color: 'var(--color-texto)', fontWeight: op === estado ? 600 : 400 }}>
                  {CFG_ESTADO[op].etiqueta}
                </span>
                {op === estado && <CheckCircle2 size={13} style={{ marginLeft: 'auto', color: DOT_COLOR[op] }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Modal de edición ──────────────────────────────────────────────────────────

interface PropsModalEditar {
  cliente: Cliente | null;
  alCerrar: () => void;
  alGuardar: () => void;
}

function ModalEditarCliente({ cliente, alCerrar, alGuardar }: PropsModalEditar) {
  const clienteConsulta = useQueryClient();
  const [nombre, setNombre] = useState(cliente?.nombre ?? '');
  const [telefono, setTelefono] = useState(cliente?.telefono ?? '');
  const [correo, setCorreo] = useState(cliente?.correo ?? '');
  const [errorNombre, setErrorNombre] = useState('');

  // Sincroniza cuando cambia el cliente seleccionado
  React.useEffect(() => {
    if (cliente) {
      setNombre(cliente.nombre);
      setTelefono(cliente.telefono);
      setCorreo(cliente.correo ?? '');
      setErrorNombre('');
    }
  }, [cliente]);

  const mutacion = useMutation({
    mutationFn: () => actualizarCliente(cliente!.id, {
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      ...(correo.trim() ? { correo_electronico: correo.trim() } : {}),
    }),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente actualizado', { description: nombre.trim() });
      alGuardar();
    },
    onError: () => toast.error('No se pudo actualizar el cliente'),
  });

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setErrorNombre('El nombre es obligatorio'); return; }
    setErrorNombre('');
    mutacion.mutate();
  };

  if (!cliente) return null;

  return (
    <Modal
      abierto={!!cliente}
      alCerrar={alCerrar}
      titulo="Editar cliente"
      descripcion={`Modifica los datos de ${cliente.nombre}`}
      ancho="sm"
      sinCerrarAlFondo={mutacion.isPending}
      pie={
        <>
          <Boton variante="secundario" onClick={alCerrar} disabled={mutacion.isPending}>
            Cancelar
          </Boton>
          <Boton
            variante="primario"
            icono={<Save size={14} />}
            cargando={mutacion.isPending}
            onClick={guardar as unknown as React.MouseEventHandler}
          >
            Guardar cambios
          </Boton>
        </>
      }
    >
      <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
        <Campo
          etiqueta="Nombre completo"
          requerido
          error={errorNombre}
          value={nombre}
          onChange={(e) => { setNombre(e.target.value); setErrorNombre(''); }}
          placeholder="Ej: Juan Pérez"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: 'var(--tamano-xs)', fontWeight: 600, color: 'var(--color-texto)', letterSpacing: '0.01em' }}>
            Teléfono
          </label>
          <SelectorTelefono valor={telefono} alCambiar={setTelefono} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: 'var(--tamano-xs)', fontWeight: 600, color: 'var(--color-texto)', letterSpacing: '0.01em' }}>
            Correo electrónico{' '}
            <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)' }}>(Opcional)</span>
          </label>
          <CampoEmail valor={correo} alCambiar={setCorreo} />
        </div>

        {/* Submit oculto para que Enter funcione */}
        <button type="submit" style={{ display: 'none' }} />
      </form>
    </Modal>
  );
}

// ── Estado del formulario de registro ─────────────────────────────────────────

const ESTADO_INICIAL = { nombre: '', telefono: '', correo_electronico: '' };

// ── Página principal ──────────────────────────────────────────────────────────

export function PaginaGestionClientes() {
  const { clientes, cargando, registrar, registrando } = usarClientes();
  const clienteConsulta = useQueryClient();

  const [formulario, setFormulario] = useState(ESTADO_INICIAL);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [confirmarBloqueo, setConfirmarBloqueo] = useState<Cliente | null>(null);

  // ── Formulario de registro ──────────────────────────────────────────────────
  const cambiar = (campo: keyof typeof ESTADO_INICIAL) => (valor: string) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: '' }));
  };

  const validar = (): boolean => {
    const nuevos: Record<string, string> = {};
    if (!formulario.nombre.trim()) nuevos.nombre = 'Ingresa el nombre completo';
    if (!formulario.telefono.trim()) nuevos.telefono = 'Ingresa el número de teléfono';
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return false; }
    return true;
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    const solicitud: SolicitudRegistrarCliente = {
      nombre: formulario.nombre.trim(),
      telefono: formulario.telefono.trim(),
      ...(formulario.correo_electronico.trim() ? { correo_electronico: formulario.correo_electronico.trim() } : {}),
    };
    try {
      await registrar(solicitud);
      setFormulario(ESTADO_INICIAL);
      toast.success('Cliente registrado', { description: `${solicitud.nombre} · ${solicitud.telefono}` });
    } catch {
      toast.error('No se pudo registrar el cliente');
    }
  };

  // ── Bloquear cliente ────────────────────────────────────────────────────────
  const mutBloquear = useMutation({
    mutationFn: (c: Cliente) => cambiarEstadoCliente(c.id, 'BLOQUEADO'),
    onSuccess: (_, c) => {
      clienteConsulta.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente bloqueado', { description: c.nombre });
      setConfirmarBloqueo(null);
    },
    onError: () => toast.error('No se pudo bloquear el cliente'),
  });

  // ── Filtrado ────────────────────────────────────────────────────────────────
  const clientesFiltrados = busqueda.trim()
    ? clientes.filter((c) =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.telefono.includes(busqueda) ||
        (c.correo && c.correo.toLowerCase().includes(busqueda.toLowerCase())),
      )
    : clientes;

  // ── Acciones por fila ───────────────────────────────────────────────────────
  const accionesCliente = (c: Cliente) => {
    const estadoActual = c.estado as EstadoCliente;
    return [
      { id: 'editar',     etiqueta: 'Editar datos',  icono: <Pencil size={14} /> },
      { id: 'activar',    etiqueta: 'Activar',        icono: <UserCheck size={14} />, separador: true,
        deshabilitada: estadoActual === 'ACTIVO' },
      { id: 'desactivar', etiqueta: 'Desactivar',     icono: <UserX size={14} />,
        deshabilitada: estadoActual === 'INACTIVO' },
      { id: 'bloquear',   etiqueta: 'Bloquear',       icono: <Ban size={14} />, variante: 'peligro' as const,
        deshabilitada: estadoActual === 'BLOQUEADO' },
    ];
  };

  const manejarAccion = (id: string, cliente: Cliente) => {
    if (id === 'editar')     { setEditando(cliente); return; }
    if (id === 'bloquear')   { setConfirmarBloqueo(cliente); return; }
    if (id === 'activar')    { cambiarEstadoCliente(cliente.id, 'ACTIVO')    .then(() => { clienteConsulta.invalidateQueries({ queryKey: ['clientes'] }); toast.success('Cliente activado'); }); }
    if (id === 'desactivar') { cambiarEstadoCliente(cliente.id, 'INACTIVO')  .then(() => { clienteConsulta.invalidateQueries({ queryKey: ['clientes'] }); toast.success('Cliente desactivado'); }); }
  };

  // ── Columnas ────────────────────────────────────────────────────────────────
  const columnas: ColumnaTabla<Cliente>[] = [
    {
      clave: 'nombre',
      etiqueta: 'Cliente',
      render: (c) => (
        <div className="tabla-celda-identidad">
          <div className="tabla-celda-avatar">{iniciales(c.nombre)}</div>
          <div>
            <p className="tabla-celda-nombre">{c.nombre}</p>
            {c.telefono && (
              <p className="tabla-celda-sub" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {c.telefono}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      clave: 'correo',
      etiqueta: 'Correo',
      render: (c) => (
        <span style={{
          fontFamily: 'var(--fuente-acento)',
          fontSize: 'var(--tamano-sm)',
          color: 'var(--color-texto-suave)',
          letterSpacing: '0.02em',
        }}>
          {c.correo || <span style={{ opacity: 0.3 }}>—</span>}
        </span>
      ),
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (c) => <SelectorEstado cliente={c} />,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <EncabezadoPagina
        titulo="Clientes"
        descripcion="Administra los clientes de la barbería"
        indicador={
          clientes.length > 0 ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', borderRadius: '99px', backgroundColor: 'rgba(5,150,105,0.08)', fontSize: 'var(--tamano-xs)', fontWeight: 600, color: 'var(--color-exito)' }}>
              <Users size={12} />
              {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
            </div>
          ) : undefined
        }
        style={{ padding: 'var(--espacio-lg)', borderBottom: '1px solid var(--color-borde)', backgroundColor: 'var(--color-superficie)' }}
      />

      <div style={{ padding: 'var(--espacio-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-xl)' }}>

        {/* Formulario de registro */}
        <SeccionTarjeta titulo="Registrar cliente" icono={<UserPlus size={14} />} maxAncho={480}>
          <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
            <Campo
              etiqueta="Nombre completo" requerido error={errores.nombre}
              value={formulario.nombre} onChange={(e) => cambiar('nombre')(e.target.value)}
              placeholder="Ej: Juan Pérez"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
                Teléfono <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <SelectorTelefono valor={formulario.telefono} alCambiar={cambiar('telefono')} error={!!errores.telefono} />
              {errores.telefono && <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>{errores.telefono}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
                Correo electrónico <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)' }}>(Opcional)</span>
              </label>
              <CampoEmail valor={formulario.correo_electronico} alCambiar={cambiar('correo_electronico')} />
            </div>
            <Boton type="submit" variante="primario" icono={<UserPlus size={14} />} cargando={registrando} style={{ marginTop: '0.25rem' }}>
              Registrar cliente
            </Boton>
          </form>
        </SeccionTarjeta>

        {/* Tabla */}
        <SeccionTarjeta
          titulo="Clientes registrados"
          sinPaddingCuerpo
          acciones={
            clientes.length > 3 ? (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={13} style={{ position: 'absolute', left: '0.625rem', color: 'var(--color-texto-suave)', pointerEvents: 'none' }} />
                <input
                  value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, teléfono o correo…"
                  className="campo-input" style={{ paddingLeft: '2rem', width: '260px' }}
                />
              </div>
            ) : undefined
          }
        >
          <TablaDatos<Cliente>
            columnas={columnas}
            filas={clientesFiltrados}
            obtenerClave={(c) => c.id}
            cargando={cargando}
            filasCargando={4}
            vacioIcono={<Users size={24} />}
            vacioTitulo={busqueda ? 'Sin resultados' : 'Sin clientes aún'}
            vacioMensaje={busqueda ? `Nadie coincide con "${busqueda}".` : 'Registra el primer cliente de la barbería.'}
            acciones={(c) => (
              <MenuAcciones
                acciones={accionesCliente(c)}
                onAccion={(id) => manejarAccion(id, c)}
                titulo="Acciones del cliente"
              />
            )}
          />
        </SeccionTarjeta>
      </div>

      {/* Modal de edición */}
      <ModalEditarCliente
        cliente={editando}
        alCerrar={() => setEditando(null)}
        alGuardar={() => setEditando(null)}
      />

      {/* Diálogo confirmación de bloqueo */}
      <DialogoConfirmacion
        abierto={!!confirmarBloqueo}
        titulo={`¿Bloquear a ${confirmarBloqueo?.nombre ?? ''}?`}
        descripcion="El cliente no podrá hacer nuevas reservas mientras esté bloqueado. Puedes reactivarlo en cualquier momento desde la tabla."
        variante="advertencia"
        textoConfirmar="Sí, bloquear"
        cargando={mutBloquear.isPending}
        alConfirmar={() => confirmarBloqueo && mutBloquear.mutate(confirmarBloqueo)}
        alCancelar={() => setConfirmarBloqueo(null)}
      />
    </motion.div>
  );
}
