import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

import { toast } from 'sonner';
import {
  Shield, UserPlus, UserMinus, CheckCircle2, XCircle, Search,
} from 'lucide-react';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina';
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta';
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos';
import { MenuAcciones } from '@/compartido/interfaz/primitivas/MenuAcciones';
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion';
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia';
import { Pestanas } from '@/compartido/interfaz/primitivas/Pestanas';
import { usarAlcances } from '../ganchos/usarAlcances';
import { usarAlmacenSesion } from '@/plataforma/identidad/almacen-sesion';
import type { AlcanceResumen, SolicitudAsignarAlcance } from '../contratos/tipos';

// ── Helpers ───────────────────────────────────────────────────────────────────

function varianteEstadoAlcance(estado: string): 'exito' | 'neutral' | 'error' {
  if (estado === 'ACTIVO')   return 'exito';
  if (estado === 'INACTIVO') return 'neutral';
  return 'error';
}

function formatearFecha(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Pestaña 1: Lista de alcances ──────────────────────────────────────────────

function PestanaAlcances() {
  const { alcances, cargando, revocar, revocando } = usarAlcances();
  const [alcanceARevocar, setAlcanceARevocar] = useState<AlcanceResumen | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const alcancesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return alcances;
    const q = busqueda.toLowerCase();
    return alcances.filter(
      (a) =>
        a.nombre_usuario.toLowerCase().includes(q) ||
        a.nombre_rol.toLowerCase().includes(q),
    );
  }, [alcances, busqueda]);

  const activos = alcances.filter((a) => a.estado === 'ACTIVO').length;

  const confirmarRevocacion = () => {
    if (!alcanceARevocar) return;
    revocar(alcanceARevocar.id, {
      onSuccess: () => {
        toast.success('Alcance revocado', { description: alcanceARevocar.nombre_usuario });
        setAlcanceARevocar(null);
      },
      onError: () => {
        toast.error('No se pudo revocar el alcance');
        setAlcanceARevocar(null);
      },
    });
  };

  const columnas = [
    {
      clave: 'usuario',
      etiqueta: 'Usuario',
      render: (a: AlcanceResumen) => (
        <div className="alcance-celda-usuario">
          <div className="tabla-celda-avatar">
            {(a.nombre_usuario ?? '?').split(' ').map((p: string) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'}
          </div>
          <div>
            <p className="alcance-usuario-nombre">{a.nombre_usuario}</p>
          </div>
        </div>
      ),
    },
    {
      clave: 'rol',
      etiqueta: 'Rol asignado',
      render: (a: AlcanceResumen) => (
        <div className="alcance-celda-rol">
          <Shield size={12} style={{ color: 'var(--color-primario)', flexShrink: 0 }} />
          <span>{a.nombre_rol}</span>
        </div>
      ),
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (a: AlcanceResumen) => (
        <Insignia variante={varianteEstadoAlcance(a.estado)}>
          {a.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
        </Insignia>
      ),
    },
    {
      clave: 'fecha',
      etiqueta: 'Asignado el',
      render: (a: AlcanceResumen) => (
        <span className="alcance-fecha">{formatearFecha(a.creado_en)}</span>
      ),
    },
    {
      clave: 'acciones',
      etiqueta: '',
      render: (a: AlcanceResumen) => (
        <MenuAcciones
          acciones={[
            {
              id: 'revocar',
              etiqueta: 'Revocar acceso',
              icono: <UserMinus size={13} />,
              variante: 'peligro' as const,
              deshabilitada: a.estado !== 'ACTIVO',
            },
          ]}
          onAccion={() => setAlcanceARevocar(a)}
        />
      ),
    },
  ];

  return (
    <>
      {/* Buscador */}
      {alcances.length > 0 && (
        <div className="alcance-buscador-wrapper">
          <div className="alcance-buscador">
            <Search size={14} style={{ color: 'var(--color-texto-suave)', flexShrink: 0 }} />
            <input
              className="alcance-buscador-input"
              placeholder="Buscar por usuario o rol…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button type="button" className="alcance-buscador-limpiar" onClick={() => setBusqueda('')}>
                <XCircle size={13} />
              </button>
            )}
          </div>
          <span className="alcance-contador">
            <CheckCircle2 size={11} /> {activos} activo{activos !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <SeccionTarjeta titulo="Alcances registrados" sinPaddingCuerpo>
        <TablaDatos<AlcanceResumen>
          columnas={columnas}
          filas={alcancesFiltrados}
          obtenerClave={(a) => a.id}
          cargando={cargando}
          vacioIcono={<Shield size={28} />}
          vacioTitulo="Sin alcances asignados"
          vacioMensaje="Asigna el primer acceso desde la pestaña Asignar."
        />
      </SeccionTarjeta>

      <DialogoConfirmacion
        abierto={!!alcanceARevocar}
        titulo="Revocar acceso"
        descripcion={
          alcanceARevocar
            ? `¿Confirmas revocar el acceso de "${alcanceARevocar.nombre_usuario}" con el rol "${alcanceARevocar.nombre_rol}"? El usuario perderá sus permisos de inmediato.`
            : ''
        }
        textoConfirmar="Revocar acceso"
        variante="peligro"
        cargando={revocando}
        alConfirmar={confirmarRevocacion}
        alCancelar={() => setAlcanceARevocar(null)}
      />
    </>
  );
}

// ── Pestaña 2: Asignar alcance ─────────────────────────────────────────────────

const ESTADO_INICIAL: SolicitudAsignarAlcance = {
  usuario_id: '',
  empresa_id: '',
  rol_id: '',
};

function PestanaAsignar() {
  const { roles, usuarios, asignar, asignando, exitoAsignar } = usarAlcances();
  const sesion = usarAlmacenSesion((s) => s.sesion);

  const [formulario, setFormulario] = useState<SolicitudAsignarAlcance>({
    ...ESTADO_INICIAL,
    empresa_id: sesion?.barberiaId ?? '',
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [buscarUsuario, setBuscarUsuario] = useState('');

  const usuariosFiltrados = useMemo(() => {
    if (!buscarUsuario.trim()) return usuarios;
    const q = buscarUsuario.toLowerCase();
    return usuarios.filter(
      (u) => u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q),
    );
  }, [usuarios, buscarUsuario]);

  const usuarioSeleccionado = usuarios.find((u) => u.id === formulario.usuario_id);
  const rolSeleccionado     = roles.find((r) => r.id === formulario.rol_id);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevos: Record<string, string> = {};
    if (!formulario.usuario_id) nuevos.usuario_id = 'Selecciona un usuario';
    if (!formulario.rol_id)     nuevos.rol_id     = 'Selecciona un rol';
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return; }

    asignar(
      { ...formulario, empresa_id: sesion?.barberiaId ?? '' },
      {
        onSuccess: () => {
          toast.success('Alcance asignado', {
            description: `${usuarioSeleccionado?.nombre} → ${rolSeleccionado?.nombre}`,
          });
          setFormulario({ ...ESTADO_INICIAL, empresa_id: sesion?.barberiaId ?? '' });
          setBuscarUsuario('');
          setErrores({});
        },
        onError: () => toast.error('No se pudo asignar el alcance'),
      },
    );
  };

  return (
    <SeccionTarjeta
      titulo="Asignar acceso"
      descripcion="Otorga a un usuario acceso a la barbería con un rol específico."
      icono={<UserPlus size={14} />}
      maxAncho={540}
    >
      <form onSubmit={enviar} className="alcance-form">

        {/* Selector de usuario */}
        <div className="campo-grupo">
          <label className="campo-etiqueta">
            Usuario <span className="campo-requerido">*</span>
          </label>
          <div className="alcance-usuario-buscador">
            <div className="alcance-usuario-buscador-input-wrap">
              <Search size={13} style={{ color: 'var(--color-texto-suave)', flexShrink: 0 }} />
              <input
                className="alcance-buscador-input"
                placeholder="Buscar usuario por nombre o correo…"
                value={buscarUsuario}
                onChange={(e) => setBuscarUsuario(e.target.value)}
              />
            </div>

            {usuariosFiltrados.length > 0 && (
              <div className="alcance-usuario-lista">
                {usuariosFiltrados.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setFormulario((p) => ({ ...p, usuario_id: u.id }));
                      setBuscarUsuario('');
                      setErrores((p) => ({ ...p, usuario_id: '' }));
                    }}
                    className={[
                      'alcance-usuario-opcion',
                      formulario.usuario_id === u.id ? 'alcance-usuario-opcion--activa' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <div className="tabla-celda-avatar" style={{ width: '2rem', height: '2rem', fontSize: '0.65rem', flexShrink: 0 }}>
                      {(u.nombre ?? '?').split(' ').map((p: string) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{
                        margin: 0,
                        fontFamily: 'var(--fuente-display-sc)',
                        fontSize: 'var(--tamano-sm)',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        color: 'var(--color-texto)',
                        lineHeight: 1.3,
                      }}>
                        {u.nombre || u.correo.split('@')[0]}
                      </p>
                      <p style={{
                        margin: 0,
                        fontFamily: 'var(--fuente-acento)',
                        fontSize: '0.65rem',
                        fontWeight: 500,
                        letterSpacing: '0.04em',
                        color: 'var(--color-texto-suave)',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {u.correo}
                      </p>
                    </div>
                    {formulario.usuario_id === u.id && (
                      <CheckCircle2 size={14} style={{ flexShrink: 0, color: 'var(--color-exito)' }} />
                    )}
                  </button>
                ))}
              </div>
            )}

            {usuarioSeleccionado && !buscarUsuario && (
              <div className="alcance-seleccionado-chip">
                <CheckCircle2 size={12} style={{ color: 'var(--color-exito)', flexShrink: 0 }} />
                <span style={{
                  fontFamily: 'var(--fuente-display-sc)',
                  fontSize: 'var(--tamano-sm)',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  color: 'var(--color-texto)',
                  flex: 1,
                }}>
                  {usuarioSeleccionado.nombre || usuarioSeleccionado.correo}
                </span>
                <button
                  type="button"
                  onClick={() => setFormulario((p) => ({ ...p, usuario_id: '' }))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-texto-suave)', padding: 0, display: 'flex' }}
                >
                  <XCircle size={13} />
                </button>
              </div>
            )}
          </div>
          {errores.usuario_id && <span className="campo-error-inline">{errores.usuario_id}</span>}
        </div>

        {/* Selector de rol */}
        <div className="campo-grupo">
          <label className="campo-etiqueta">
            Rol <span className="campo-requerido">*</span>
          </label>
          <div className="alcance-roles-lista">
            {roles.length === 0 ? (
              <p style={{ fontFamily: 'var(--fuente-acento)', fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)', margin: 0 }}>
                Cargando roles…
              </p>
            ) : (
              roles.map((rol) => (
                <button
                  key={rol.id}
                  type="button"
                  onClick={() => { setFormulario((p) => ({ ...p, rol_id: rol.id })); setErrores((p) => ({ ...p, rol_id: '' })); }}
                  className={[
                    'alcance-rol-opcion',
                    formulario.rol_id === rol.id ? 'alcance-rol-opcion--activa' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <Shield size={13} style={{ flexShrink: 0, color: formulario.rol_id === rol.id ? 'var(--color-primario)' : 'var(--color-texto-suave)' }} />
                  <span style={{
                    fontFamily: 'var(--fuente-acento)',
                    fontSize: 'var(--tamano-sm)',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    color: 'var(--color-texto)',
                    textTransform: 'uppercase' as const,
                  }}>
                    {rol.nombre}
                  </span>
                  {formulario.rol_id === rol.id && (
                    <CheckCircle2 size={13} style={{ marginLeft: 'auto', color: 'var(--color-exito)', flexShrink: 0 }} />
                  )}
                </button>
              ))
            )}
          </div>
          {errores.rol_id && <span className="campo-error-inline">{errores.rol_id}</span>}
        </div>

        {/* Preview de asignación */}
        {formulario.usuario_id && formulario.rol_id && (
          <div className="alcance-preview">
            <Shield size={13} style={{ color: 'var(--color-primario)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--fuente-acento)', fontSize: 'var(--tamano-sm)', color: 'var(--color-texto)', letterSpacing: '0.02em' }}>
              <span style={{ fontFamily: 'var(--fuente-display-sc)', fontWeight: 700 }}>
                {usuarioSeleccionado?.nombre || usuarioSeleccionado?.correo}
              </span>
              {' '}tendrá acceso como{' '}
              <span style={{ fontFamily: 'var(--fuente-acento)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {rolSeleccionado?.nombre}
              </span>
            </span>
          </div>
        )}

        {exitoAsignar && (
          <div className="alcance-exito-banner">
            <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--fuente-acento)', letterSpacing: '0.02em' }}>
              Acceso asignado correctamente.
            </span>
          </div>
        )}

        <Boton type="submit" variante="primario" cargando={asignando} icono={<UserPlus size={14} />}>
          Asignar acceso
        </Boton>
      </form>
    </SeccionTarjeta>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

const PESTANAS = [
  { id: 'alcances', etiqueta: 'Alcances activos', icono: <Shield size={14} /> },
  { id: 'asignar',  etiqueta: 'Asignar',          icono: <UserPlus size={14} /> },
];

export function PaginaAlcances() {
  const [pestanaActiva, setPestanaActiva] = useState('alcances');
  const { alcances } = usarAlcances();
  const activos = alcances.filter((a) => a.estado === 'ACTIVO').length;

  return (
    <motion.div
      className="pagina-gobierno-acceso"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <EncabezadoPagina
        titulo="Gobierno de Acceso"
        descripcion="Gestiona los permisos y roles de acceso del equipo"
        indicador={
          activos > 0 ? (
            <span className="encabezado-indicador-chip">
              <Shield size={11} />
              {activos} activo{activos !== 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      />

      <div className="gobierno-acceso-pestanas-wrapper">
        <Pestanas
          pestanas={PESTANAS}
          activa={pestanaActiva}
          alCambiar={setPestanaActiva}
          variante="linea"
        />
      </div>

      <div className="gobierno-acceso-contenido">
        {pestanaActiva === 'alcances' && <PestanaAlcances />}
        {pestanaActiva === 'asignar'  && <PestanaAsignar />}
      </div>
    </motion.div>
  );
}
