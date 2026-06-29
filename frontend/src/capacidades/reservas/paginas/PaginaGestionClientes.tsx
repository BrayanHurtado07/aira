import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { UserPlus, Users, Search, Pencil, Ban, UserCheck, UserX } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { usarClientes } from '@/capacidades/reservas/ganchos/usarClientes';
import { cambiarEstadoCliente } from '@/capacidades/reservas/servicios/servicio-reservas';
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos';
import type { ColumnaTabla } from '@/compartido/interfaz/primitivas/TablaDatos';
import { MenuAcciones } from '@/compartido/interfaz/primitivas/MenuAcciones';
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina';
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta';
import { CeldaCliente } from '@/compartido/interfaz/primitivas/CeldaCliente';
import { Vacio } from '@/compartido/interfaz/retroalimentacion/Vacio';
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia';
import { ModalCliente } from '@/capacidades/reservas/componentes/ModalCliente';
import type { Cliente } from '@/capacidades/reservas/contratos/tipos';

type EstadoCliente = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

const ESTADO_INSIGNIA: Record<EstadoCliente, { variante: Parameters<typeof Insignia>[0]['variante']; etiqueta: string }> = {
  ACTIVO:    { variante: 'exito',   etiqueta: 'Activo' },
  INACTIVO:  { variante: 'neutral', etiqueta: 'Inactivo' },
  BLOQUEADO: { variante: 'error',   etiqueta: 'Bloqueado' },
};

function InsigniaEstado({ estado }: { estado: EstadoCliente }) {
  const cfg = ESTADO_INSIGNIA[estado] ?? ESTADO_INSIGNIA.INACTIVO;
  return <Insignia variante={cfg.variante}>{cfg.etiqueta}</Insignia>;
}

// ── Página principal ──────────────────────────────────────────────────────────

export function PaginaGestionClientes() {
  const { clientes, cargando } = usarClientes();
  const clienteConsulta = useQueryClient();

  const [busqueda, setBusqueda] = useState('');
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [confirmarBloqueo, setConfirmarBloqueo] = useState<Cliente | null>(null);
  const [bloqueando, setBloqueando] = useState(false);

  const cerrarModal = () => { setCrearAbierto(false); setEditando(null); };

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
      { id: 'editar',     etiqueta: 'Editar datos', icono: <Pencil size={14} /> },
      { id: 'activar',    etiqueta: 'Activar',       icono: <UserCheck size={14} />, separador: true, deshabilitada: estadoActual === 'ACTIVO' },
      { id: 'desactivar', etiqueta: 'Desactivar',    icono: <UserX size={14} />, deshabilitada: estadoActual === 'INACTIVO' },
      { id: 'bloquear',   etiqueta: 'Bloquear',      icono: <Ban size={14} />, variante: 'peligro' as const, deshabilitada: estadoActual === 'BLOQUEADO' },
    ];
  };

  const cambiarEstado = (cliente: Cliente, estado: EstadoCliente, mensaje: string) => {
    cambiarEstadoCliente(cliente.id, estado)
      .then(() => { clienteConsulta.invalidateQueries({ queryKey: ['clientes'] }); toast.success(mensaje, { description: cliente.nombre }); })
      .catch(() => toast.error('No se pudo cambiar el estado'));
  };

  const manejarAccion = (id: string, cliente: Cliente) => {
    if (id === 'editar')     { setEditando(cliente); return; }
    if (id === 'bloquear')   { setConfirmarBloqueo(cliente); return; }
    if (id === 'activar')    { cambiarEstado(cliente, 'ACTIVO', 'Cliente activado'); return; }
    if (id === 'desactivar') { cambiarEstado(cliente, 'INACTIVO', 'Cliente desactivado'); return; }
  };

  const confirmarBloqueoCliente = () => {
    if (!confirmarBloqueo) return;
    setBloqueando(true);
    cambiarEstadoCliente(confirmarBloqueo.id, 'BLOQUEADO')
      .then(() => { clienteConsulta.invalidateQueries({ queryKey: ['clientes'] }); toast.success('Cliente bloqueado', { description: confirmarBloqueo.nombre }); setConfirmarBloqueo(null); })
      .catch(() => toast.error('No se pudo bloquear el cliente'))
      .finally(() => setBloqueando(false));
  };

  // ── Columnas (desktop) ────────────────────────────────────────────────────────
  const columnas: ColumnaTabla<Cliente>[] = [
    {
      clave: 'nombre',
      etiqueta: 'Cliente',
      render: (c) => <CeldaCliente nombre={c.nombre} telefono={c.telefono} />,
    },
    {
      clave: 'correo',
      etiqueta: 'Correo',
      render: (c) => (
        <span style={{ fontFamily: 'var(--fuente-acento)', fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)', letterSpacing: '0.02em' }}>
          {c.correo || <span style={{ opacity: 0.3 }}>—</span>}
        </span>
      ),
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (c) => <InsigniaEstado estado={c.estado as EstadoCliente} />,
    },
  ];

  const menuCliente = (c: Cliente) => (
    <MenuAcciones acciones={accionesCliente(c)} onAccion={(id) => manejarAccion(id, c)} titulo="Acciones del cliente" />
  );

  const vacioTitulo = busqueda ? 'Sin resultados' : 'Sin clientes aún';
  const vacioMensaje = busqueda ? `Nadie coincide con "${busqueda}".` : 'Registra el primer cliente de la barbería.';
  const ctaNuevo = <Boton variante="primario" icono={<UserPlus size={14} />} onClick={() => setCrearAbierto(true)}>Nuevo cliente</Boton>;

  return (
    <motion.div
      className="pagina-contenido"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <EncabezadoPagina
        titulo="Clientes"
        descripcion="Administra los clientes de la barbería"
        indicador={!cargando && clientes.length > 0 ? `${clientes.length} ${clientes.length === 1 ? 'cliente' : 'clientes'}` : undefined}
        acciones={ctaNuevo}
      />

      <SeccionTarjeta
        titulo="Clientes registrados"
        sinPaddingCuerpo
        acciones={
          clientes.length > 3 ? (
            <div className="clientes-busqueda">
              <Search size={13} aria-hidden="true" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, teléfono o correo…"
                aria-label="Buscar clientes"
                className="campo-input"
              />
            </div>
          ) : undefined
        }
      >
        {/* Desktop: tabla */}
        <div className="clientes-tabla-wrap">
          <TablaDatos<Cliente>
            columnas={columnas}
            filas={clientesFiltrados}
            obtenerClave={(c) => c.id}
            cargando={cargando}
            filasCargando={4}
            vacioIcono={<Users size={24} />}
            vacioTitulo={vacioTitulo}
            vacioMensaje={vacioMensaje}
            vacioAccion={!busqueda ? ctaNuevo : undefined}
            acciones={menuCliente}
          />
        </div>

        {/* Móvil: tarjetas */}
        <div className="clientes-tarjetas">
          {cargando ? (
            [0, 1, 2].map((i) => <div key={i} className="cliente-tarjeta-skel" />)
          ) : clientesFiltrados.length === 0 ? (
            <Vacio icono={<Users size={24} />} titulo={vacioTitulo} mensaje={vacioMensaje} accion={!busqueda ? ctaNuevo : undefined} />
          ) : (
            clientesFiltrados.map((c) => (
              <div key={c.id} className="cliente-tarjeta">
                <div className="cliente-tarjeta-cabecera">
                  <CeldaCliente nombre={c.nombre} telefono={c.telefono} secundario={c.correo} />
                  {menuCliente(c)}
                </div>
                <InsigniaEstado estado={c.estado as EstadoCliente} />
              </div>
            ))
          )}
        </div>
      </SeccionTarjeta>

      {/* Modal crear / editar */}
      <ModalCliente
        abierto={crearAbierto || editando !== null}
        cliente={editando}
        alCerrar={cerrarModal}
      />

      {/* Diálogo bloqueo */}
      <DialogoConfirmacion
        abierto={!!confirmarBloqueo}
        titulo={`¿Bloquear a ${confirmarBloqueo?.nombre ?? ''}?`}
        descripcion="El cliente no podrá hacer nuevas reservas mientras esté bloqueado. Puedes reactivarlo en cualquier momento desde la tabla."
        variante="advertencia"
        textoConfirmar="Sí, bloquear"
        cargando={bloqueando}
        alConfirmar={confirmarBloqueoCliente}
        alCancelar={() => setConfirmarBloqueo(null)}
      />
    </motion.div>
  );
}
