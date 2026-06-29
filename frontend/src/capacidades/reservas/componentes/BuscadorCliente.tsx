import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'sonner';
import { Search, UserPlus, X, Check, Phone } from 'lucide-react';
import { usarClientes } from '@/capacidades/reservas/ganchos/usarClientes';
import { Avatar } from '@/compartido/interfaz/primitivas/Avatar';
import { Campo } from '@/compartido/interfaz/primitivas/Campo';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { Modal } from '@/compartido/interfaz/primitivas/Modal';
import type { SolicitudRegistrarCliente } from '@/capacidades/reservas/contratos/tipos';

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface ClienteResumen {
  id: string;
  nombre: string;
  telefono: string;
}

interface PropiedadesBuscadorCliente {
  /** UUID del cliente seleccionado (vacío = sin selección) */
  valor: string;
  alCambiar: (clienteId: string) => void;
  error?: string;
}

const FORM_INICIAL: SolicitudRegistrarCliente = {
  nombre: '',
  telefono: '',
  correo_electronico: '',
};

// ── Componente ─────────────────────────────────────────────────────────────────

export function BuscadorCliente({ valor, alCambiar, error }: PropiedadesBuscadorCliente) {
  const { clientes, registrar, registrando } = usarClientes();

  // Estado del dropdown
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(-1);

  // Posición del portal (position:fixed relativa al trigger)
  const [pos, setPos] = useState({ top: 0, left: 0, ancho: 0 });

  // Estado del modal de creación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formNuevo, setFormNuevo] = useState<SolicitudRegistrarCliente>(FORM_INICIAL);
  const [erroresForm, setErroresForm] = useState<Record<string, string>>({});

  // Cliente que acabamos de crear (para mostrar mientras la cache refresca)
  const [clientePendiente, setClientePendiente] = useState<ClienteResumen | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Derivaciones ────────────────────────────────────────────────────────────

  const clienteSeleccionado: ClienteResumen | null =
    clientePendiente?.id === valor
      ? clientePendiente
      : clientes.find((c) => c.id === valor) ?? null;

  const filtrados: ClienteResumen[] =
    busqueda.trim().length > 0
      ? clientes.filter(
          (c) =>
            c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            c.telefono.includes(busqueda),
        )
      : clientes.slice(0, 8);

  // ── Abrir y calcular posición fixed ────────────────────────────────────────

  const abrir = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const alturaDropdown = 320;
    const espacioAbajo = window.innerHeight - rect.bottom;
    const top =
      espacioAbajo >= alturaDropdown
        ? rect.bottom + 4
        : rect.top - alturaDropdown - 4;
    let left = rect.left;
    if (left + rect.width > window.innerWidth - 12) {
      left = window.innerWidth - rect.width - 12;
    }
    setPos({ top, left, ancho: rect.width });
    setAbierto(true);
  }, []);

  // ── Cierre al click fuera o Escape ─────────────────────────────────────────

  useEffect(() => {
    if (!abierto) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setAbierto(false);
      setBusqueda('');
      setIndiceActivo(-1);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setAbierto(false); setBusqueda(''); setIndiceActivo(-1); }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  // ── Acciones ────────────────────────────────────────────────────────────────

  const seleccionar = useCallback(
    (c: ClienteResumen) => {
      alCambiar(c.id);
      setAbierto(false);
      setBusqueda('');
      setIndiceActivo(-1);
    },
    [alCambiar],
  );

  const limpiar = () => {
    alCambiar('');
    setClientePendiente(null);
    setBusqueda('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const abrirModalCrear = () => {
    setFormNuevo({ ...FORM_INICIAL, nombre: busqueda.trim() });
    setErroresForm({});
    setModalAbierto(true);
    setAbierto(false);
  };

  const crearCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevos: Record<string, string> = {};
    if (!formNuevo.nombre.trim()) nuevos.nombre = 'El nombre es requerido';
    if (!formNuevo.telefono.trim()) nuevos.telefono = 'El teléfono es requerido';
    if (Object.keys(nuevos).length > 0) {
      setErroresForm(nuevos);
      return;
    }

    try {
      const resp = await registrar(formNuevo);
      const pendiente: ClienteResumen = {
        id: resp.cliente_id,
        nombre: formNuevo.nombre.trim(),
        telefono: formNuevo.telefono.trim(),
      };
      setClientePendiente(pendiente);
      alCambiar(resp.cliente_id);
      setModalAbierto(false);
      setBusqueda('');
      toast.success('Cliente creado', {
        description: `${pendiente.nombre} · ${pendiente.telefono}`,
      });
    } catch {
      toast.error('No se pudo crear el cliente');
    }
  };

  // ── Teclado en el input ─────────────────────────────────────────────────────

  const manejarTecla = (e: React.KeyboardEvent) => {
    if (!abierto) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIndiceActivo((p) => Math.min(p + 1, filtrados.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIndiceActivo((p) => Math.max(p - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (indiceActivo >= 0 && filtrados[indiceActivo]) {
          seleccionar(filtrados[indiceActivo]);
        }
        break;
      case 'Escape':
        setAbierto(false);
        setBusqueda('');
        setIndiceActivo(-1);
        break;
    }
  };

  // ── Dropdown en portal ──────────────────────────────────────────────────────

  const dropdownNode = (
    <>
      {abierto && (
        <div
          ref={dropdownRef}
          className="buscador-dropdown animar-aparecer"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: pos.ancho,
            zIndex: 9999,
          }}
        >
          {/* Lista de clientes */}
          <div className="buscador-lista">
            {filtrados.length > 0 ? (
              filtrados.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); seleccionar(c); }}
                  className={[
                    'buscador-opcion',
                    i === indiceActivo ? 'buscador-opcion--activa' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <Avatar nombre={c.nombre} tamano="sm" />
                  <div className="buscador-opcion-info">
                    <span className="buscador-opcion-nombre">{c.nombre}</span>
                    <span className="buscador-opcion-telefono">{c.telefono}</span>
                  </div>
                  {c.id === valor && (
                    <Check size={13} style={{ color: 'var(--color-exito)', flexShrink: 0 }} />
                  )}
                </button>
              ))
            ) : (
              <div className="buscador-vacio">
                Sin resultados para <strong>&ldquo;{busqueda}&rdquo;</strong>
              </div>
            )}
          </div>

          {/* Footer: crear nuevo */}
          <div className="buscador-footer">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); abrirModalCrear(); }}
              className="buscador-nuevo"
            >
              <UserPlus size={14} />
              {busqueda.trim()
                ? `Nuevo cliente "${busqueda.trim()}"`
                : 'Nuevo cliente'}
            </button>
          </div>
        </div>
      )}
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Campo etiqueta="Cliente" requerido error={error}>
        <div ref={triggerRef} style={{ position: 'relative' }}>

          {/* ── Modo seleccionado ── */}
          {clienteSeleccionado && !abierto ? (
            <div
              className="buscador-seleccionado"
              onClick={() => {
                abrir();
                setBusqueda('');
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && abrir()}
            >
              <Avatar nombre={clienteSeleccionado.nombre} />
              <div className="buscador-seleccionado-info">
                <span className="buscador-seleccionado-nombre">
                  {clienteSeleccionado.nombre}
                </span>
                <span className="buscador-seleccionado-telefono">
                  <Phone size={10} style={{ marginRight: '0.2rem', verticalAlign: 'middle' }} />
                  {clienteSeleccionado.telefono}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); limpiar(); }}
                className="buscador-limpiar"
                aria-label="Quitar cliente seleccionado"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            /* ── Modo búsqueda ── */
            <div
              className={[
                'buscador-input-wrapper',
                error ? 'buscador-input-wrapper--error' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <Search size={14} className="buscador-search-icon" />
              <input
                ref={inputRef}
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  if (!abierto) abrir();
                  else setPos((p) => p); // reuse position
                  setIndiceActivo(-1);
                }}
                onFocus={() => { if (!abierto) abrir(); }}
                onKeyDown={manejarTecla}
                placeholder="Buscar cliente por nombre o teléfono…"
                className="buscador-input"
                autoComplete="off"
              />
            </div>
          )}
        </div>
      </Campo>

      {/* Portal del dropdown — escapa cualquier overflow */}
      {ReactDOM.createPortal(dropdownNode, document.body)}

      {/* ── Modal crear cliente ── */}
      <Modal
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        titulo="Nuevo cliente"
        descripcion="Se registrará y seleccionará automáticamente en la reserva."
        ancho="sm"
      >
        <form
          onSubmit={crearCliente}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}
        >
          <Campo
            etiqueta="Nombre completo"
            requerido
            error={erroresForm.nombre}
            value={formNuevo.nombre}
            onChange={(e) =>
              setFormNuevo((p) => ({ ...p, nombre: e.target.value }))
            }
            placeholder="Ej: Juan García"
            className="campo-input"
            autoFocus
          />
          <Campo
            etiqueta="Teléfono"
            requerido
            error={erroresForm.telefono}
            value={formNuevo.telefono}
            onChange={(e) =>
              setFormNuevo((p) => ({ ...p, telefono: e.target.value }))
            }
            placeholder="+51 999 000 111"
            className="campo-input"
          />
          <Campo
            etiqueta="Correo electrónico"
            ayuda="Opcional"
            value={formNuevo.correo_electronico ?? ''}
            onChange={(e) =>
              setFormNuevo((p) => ({ ...p, correo_electronico: e.target.value }))
            }
            placeholder="cliente@email.com"
            className="campo-input"
          />

          <div
            style={{
              display: 'flex',
              gap: 'var(--espacio-sm)',
              justifyContent: 'flex-end',
              paddingTop: '0.25rem',
            }}
          >
            <Boton
              type="button"
              variante="secundario"
              onClick={() => setModalAbierto(false)}
            >
              Cancelar
            </Boton>
            <Boton
              type="submit"
              variante="primario"
              cargando={registrando}
              icono={<UserPlus size={14} />}
            >
              Crear y seleccionar
            </Boton>
          </div>
        </form>
      </Modal>
    </>
  );
}
