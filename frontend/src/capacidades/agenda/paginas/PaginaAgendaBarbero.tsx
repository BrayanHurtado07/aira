import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { CalendarDays, Clock, ChevronDown, ChevronUp, Ban, Trash2 } from 'lucide-react';
import { usarDisponibilidadBarbero } from '@/capacidades/agenda/ganchos/usarDisponibilidadBarbero';
import { usarExcepcionesBarbero } from '@/capacidades/agenda/ganchos/usarExcepcionesBarbero';
import { usarBarberos } from '@/capacidades/agenda/ganchos/usarBarberos';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { Campo } from '@/compartido/interfaz/primitivas/Campo';
import { Vacio } from '@/compartido/interfaz/retroalimentacion/Vacio';
import type {
  SolicitudRegistrarDisponibilidad,
  BloqueDisponibilidad,
  ExcepcionDisponibilidad,
  SolicitudRegistrarExcepcion,
  MotivoExcepcion,
} from '@/capacidades/agenda/contratos/tipos';

const DIAS_SEMANA = [
  { valor: 0, etiqueta: 'Domingo' },
  { valor: 1, etiqueta: 'Lunes' },
  { valor: 2, etiqueta: 'Martes' },
  { valor: 3, etiqueta: 'Miércoles' },
  { valor: 4, etiqueta: 'Jueves' },
  { valor: 5, etiqueta: 'Viernes' },
  { valor: 6, etiqueta: 'Sábado' },
];

const MOTIVOS: { valor: MotivoExcepcion; etiqueta: string }[] = [
  { valor: 'VACACION', etiqueta: 'Vacación' },
  { valor: 'FERIADO', etiqueta: 'Feriado' },
  { valor: 'CIERRE', etiqueta: 'Cierre' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

const ESTADO_INICIAL: SolicitudRegistrarDisponibilidad = {
  barbero_id: '',
  dia_semana: 1,
  hora_inicio: '09:00',
  hora_fin: '18:00',
};

const EXCEPCION_INICIAL: SolicitudRegistrarExcepcion = {
  fecha: '',
  motivo: 'VACACION',
  descripcion: '',
};

const estiloSelect: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--color-borde)',
  borderRadius: 'var(--radio-md)',
  fontSize: 'var(--tamano-sm)',
  color: 'var(--color-texto)',
  backgroundColor: 'var(--color-fondo-input)',
  boxSizing: 'border-box',
  lineHeight: 1.5,
};

function etiquetaDia(numero: number): string {
  return DIAS_SEMANA.find((d) => d.valor === numero)?.etiqueta ?? `Día ${numero}`;
}

function etiquetaMotivo(motivo: string): string {
  return MOTIVOS.find((m) => m.valor === motivo)?.etiqueta ?? motivo;
}

// ── PanelHorarios ─────────────────────────────────────────────────────────────

function PanelHorarios({ bloques }: { bloques: BloqueDisponibilidad[] }) {
  if (bloques.length === 0) {
    return (
      <Vacio
        icono={<Clock size={24} />}
        titulo="Sin horarios registrados"
        mensaje="Usa el formulario de arriba para añadir disponibilidad."
      />
    );
  }

  const porDia = DIAS_SEMANA.map((d) => ({
    ...d,
    bloques: bloques.filter((b) => b.dia_semana === d.valor),
  })).filter((d) => d.bloques.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)', maxWidth: '600px' }}>
      {porDia.map((dia) => (
        <motion.div
          key={dia.valor}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            border: '1px solid var(--color-borde)',
            borderRadius: 'var(--radio-lg)',
            overflow: 'hidden',
            backgroundColor: 'var(--color-superficie)',
          }}
        >
          <div
            style={{
              padding: '0.625rem 1rem',
              backgroundColor: 'var(--color-superficie-2)',
              borderBottom: '1px solid var(--color-borde)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CalendarDays size={13} style={{ color: 'var(--color-primario)' }} />
            <span style={{ fontSize: 'var(--tamano-xs)', fontWeight: 600, color: 'var(--color-texto)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {dia.etiqueta}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)' }}>
              {dia.bloques.length} {dia.bloques.length === 1 ? 'bloque' : 'bloques'}
            </span>
          </div>
          <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {dia.bloques.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.375rem 0', borderBottom: '1px solid var(--color-borde-suave)',
                }}
              >
                <Clock size={12} style={{ color: 'var(--color-texto-suave)', flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto)', fontWeight: 500 }}>
                  {b.hora_inicio} – {b.hora_fin}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── PanelExcepciones ──────────────────────────────────────────────────────────

function PanelExcepciones({
  barberoId,
  barberoNombre,
}: {
  barberoId: string;
  barberoNombre: string;
}) {
  const [excepcionForm, setExcepcionForm] = useState<SolicitudRegistrarExcepcion>(EXCEPCION_INICIAL);
  const { excepciones, cargandoExcepciones, registrar, registrando, eliminar, errorRegistrar } =
    usarExcepcionesBarbero(barberoId);

  const cambiarExcepcion =
    (campo: keyof SolicitudRegistrarExcepcion) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setExcepcionForm((prev) => ({ ...prev, [campo]: e.target.value }));
    };

  const enviarExcepcion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excepcionForm.fecha) {
      toast.error('Selecciona una fecha');
      return;
    }
    try {
      await registrar(excepcionForm);
      setExcepcionForm(EXCEPCION_INICIAL);
      toast.success('Día bloqueado', {
        description: `${excepcionForm.fecha} · ${etiquetaMotivo(excepcionForm.motivo)}`,
      });
    } catch {
      toast.error(errorRegistrar ?? 'No se pudo registrar el bloqueo');
    }
  };

  const manejarEliminar = async (ex: ExcepcionDisponibilidad) => {
    try {
      await eliminar(ex.id);
      toast.success('Bloqueo eliminado', { description: ex.fecha });
    } catch {
      toast.error('No se pudo eliminar el bloqueo');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-lg)', maxWidth: '520px' }}>
      {/* Formulario */}
      <form
        onSubmit={enviarExcepcion}
        style={{
          border: '1px solid var(--color-borde)',
          borderRadius: 'var(--radio-xl)',
          padding: 'var(--espacio-lg)',
          backgroundColor: 'var(--color-superficie)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--espacio-md)',
        }}
      >
        <p style={{ fontSize: 'var(--tamano-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-texto-suave)', margin: 0 }}>
          Bloquear día a {barberoNombre}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacio-md)' }}>
          <Campo etiqueta="Fecha" requerido>
            <input
              type="date"
              value={excepcionForm.fecha}
              onChange={cambiarExcepcion('fecha')}
              required
              className="campo-input"
              style={{ ...estiloSelect }}
            />
          </Campo>

          <Campo etiqueta="Motivo">
            <select
              value={excepcionForm.motivo}
              onChange={cambiarExcepcion('motivo')}
              className="campo-input"
              style={estiloSelect}
            >
              {MOTIVOS.map((m) => (
                <option key={m.valor} value={m.valor}>{m.etiqueta}</option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo etiqueta="Descripción (opcional)">
          <input
            type="text"
            value={excepcionForm.descripcion ?? ''}
            onChange={cambiarExcepcion('descripcion')}
            placeholder="Ej. Semana santa, viaje, etc."
            className="campo-input"
            style={{ ...estiloSelect }}
          />
        </Campo>

        <Boton type="submit" variante="secundario" cargando={registrando}>
          Bloquear día
        </Boton>
      </form>

      {/* Lista de excepciones */}
      {cargandoExcepciones ? (
        <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)' }}>Cargando bloqueos…</p>
      ) : excepciones.length === 0 ? (
        <Vacio
          icono={<Ban size={20} />}
          titulo="Sin días bloqueados"
          mensaje="Cuando bloquees un día aparecerá aquí."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {excepciones.map((ex) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              transition={{ duration: 0.15 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                border: '1px solid var(--color-borde)',
                borderRadius: 'var(--radio-md)',
                backgroundColor: 'var(--color-superficie)',
              }}
            >
              <Ban size={14} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 'var(--tamano-sm)', fontWeight: 600, color: 'var(--color-texto)' }}>
                  {ex.fecha}
                </p>
                <p style={{ margin: 0, fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)' }}>
                  {etiquetaMotivo(ex.motivo)}{ex.descripcion ? ` · ${ex.descripcion}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => manejarEliminar(ex)}
                title="Eliminar bloqueo"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  color: 'var(--color-texto-suave)',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 'var(--radio-sm)',
                }}
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PaginaAgendaBarbero ───────────────────────────────────────────────────────

export function PaginaAgendaBarbero() {
  const { barberos, cargando: cargandoBarberos } = usarBarberos();
  const [formulario, setFormulario] = useState<SolicitudRegistrarDisponibilidad>(ESTADO_INICIAL);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [verHorarios, setVerHorarios] = useState(false);
  const [verExcepciones, setVerExcepciones] = useState(false);

  const { registrar, registrando, bloques, cargandoBloques } = usarDisponibilidadBarbero(
    formulario.barbero_id || undefined,
  );

  const cambiar =
    (campo: keyof SolicitudRegistrarDisponibilidad) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const valor = campo === 'dia_semana' ? parseInt(e.target.value, 10) : e.target.value;
      setFormulario((prev) => ({ ...prev, [campo]: valor }));
      setErrores((prev) => ({ ...prev, [campo]: '' }));
    };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevosErrores: Record<string, string> = {};
    if (!formulario.barbero_id) nuevosErrores.barbero_id = 'Selecciona un barbero';
    if (formulario.hora_inicio >= formulario.hora_fin)
      nuevosErrores.hora_fin = 'La hora de fin debe ser posterior a la de inicio';
    if (Object.keys(nuevosErrores).length > 0) { setErrores(nuevosErrores); return; }

    try {
      await registrar(formulario);
      setFormulario((prev) => ({ ...prev, dia_semana: 1, hora_inicio: '09:00', hora_fin: '18:00' }));
      setVerHorarios(true);
      toast.success('Disponibilidad registrada', {
        description: `${etiquetaDia(formulario.dia_semana)} · ${formulario.hora_inicio} – ${formulario.hora_fin}`,
      });
    } catch {
      toast.error('No se pudo registrar la disponibilidad');
    }
  };

  const barberoSeleccionado = barberos.find((b) => b.id === formulario.barbero_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--espacio-lg)',
          borderBottom: '1px solid var(--color-borde)',
          backgroundColor: 'var(--color-superficie)',
          flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--tamano-xl)', fontWeight: 700, color: 'var(--color-texto)', margin: 0, letterSpacing: '-0.02em' }}>
            Agenda de disponibilidad
          </h1>
          <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)', marginTop: '0.125rem' }}>
            Define horarios semanales y bloquea días no disponibles
          </p>
        </div>
        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radio-lg)', backgroundColor: 'rgba(52,82,204,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primario)' }}>
          <CalendarDays size={18} />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--espacio-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-xl)' }}>

        {/* Formulario de registro de disponibilidad semanal */}
        <div style={{ maxWidth: '480px', border: '1px solid var(--color-borde)', borderRadius: 'var(--radio-xl)', padding: 'var(--espacio-lg)', backgroundColor: 'var(--color-superficie)' }}>
          <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
            <Campo etiqueta="Barbero" requerido error={errores.barbero_id}>
              <select
                value={formulario.barbero_id}
                onChange={cambiar('barbero_id')}
                className="campo-input"
                style={{ ...estiloSelect, borderColor: errores.barbero_id ? 'var(--color-error)' : 'var(--color-borde)' }}
                disabled={cargandoBarberos}
              >
                <option value="">{cargandoBarberos ? 'Cargando…' : 'Seleccionar barbero'}</option>
                {barberos.map((b) => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </Campo>

            <Campo etiqueta="Día de la semana">
              <select
                value={formulario.dia_semana}
                onChange={cambiar('dia_semana')}
                className="campo-input"
                style={estiloSelect}
              >
                {DIAS_SEMANA.map((dia) => (
                  <option key={dia.valor} value={dia.valor}>{dia.etiqueta}</option>
                ))}
              </select>
            </Campo>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacio-md)' }}>
              <Campo etiqueta="Hora de inicio" type="time" value={formulario.hora_inicio} onChange={cambiar('hora_inicio')} className="campo-input" />
              <Campo etiqueta="Hora de fin" type="time" value={formulario.hora_fin} onChange={cambiar('hora_fin')} className="campo-input" error={errores.hora_fin} />
            </div>

            <Boton type="submit" variante="primario" cargando={registrando} style={{ marginTop: '0.25rem' }}>
              Registrar disponibilidad
            </Boton>
          </form>
        </div>

        {/* Horarios del barbero seleccionado */}
        {formulario.barbero_id && (
          <div style={{ maxWidth: '600px' }}>
            <button
              type="button"
              onClick={() => setVerHorarios((v) => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 'var(--espacio-md)' }}
            >
              <p style={{ fontSize: 'var(--tamano-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-texto-suave)', margin: 0 }}>
                Horarios de {barberoSeleccionado?.nombre ?? 'barbero'}
              </p>
              {verHorarios
                ? <ChevronUp size={14} style={{ color: 'var(--color-texto-suave)' }} />
                : <ChevronDown size={14} style={{ color: 'var(--color-texto-suave)' }} />}
            </button>

            <AnimatePresence>
              {verHorarios && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  {cargandoBloques
                    ? <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)' }}>Cargando horarios…</p>
                    : <PanelHorarios bloques={bloques} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Excepciones / días bloqueados */}
        {formulario.barbero_id && (
          <div style={{ maxWidth: '600px' }}>
            <button
              type="button"
              onClick={() => setVerExcepciones((v) => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 'var(--espacio-md)' }}
            >
              <Ban size={13} style={{ color: 'var(--color-error)' }} />
              <p style={{ fontSize: 'var(--tamano-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-texto-suave)', margin: 0 }}>
                Días bloqueados de {barberoSeleccionado?.nombre ?? 'barbero'}
              </p>
              {verExcepciones
                ? <ChevronUp size={14} style={{ color: 'var(--color-texto-suave)' }} />
                : <ChevronDown size={14} style={{ color: 'var(--color-texto-suave)' }} />}
            </button>

            <AnimatePresence>
              {verExcepciones && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <PanelExcepciones
                    barberoId={formulario.barbero_id}
                    barberoNombre={barberoSeleccionado?.nombre ?? ''}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </motion.div>
  );
}
