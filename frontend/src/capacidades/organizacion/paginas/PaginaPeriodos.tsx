import React, { useState } from 'react';

import { toast } from 'sonner';
import { CalendarDays, Lock, CheckCircle2 } from 'lucide-react';
import { Campo } from '@/compartido/interfaz/primitivas/Campo';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina';
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta';
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos';
import { MenuAcciones } from '@/compartido/interfaz/primitivas/MenuAcciones';
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion';
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia';
import { usarPeriodos } from '../ganchos/usarPeriodos';
import type { Periodo, SolicitudCrearPeriodo } from '../contratos/tipos';

const ESTADO_INICIAL: SolicitudCrearPeriodo = { nombre: '', fecha_inicio: '', fecha_fin: '' };

function etiquetaEstadoPeriodo(estado: string): string {
  if (estado === 'ACTIVO') return 'Activo';
  if (estado === 'CERRADO') return 'Cerrado';
  return estado;
}

function variantePeriodo(estado: string): 'exito' | 'neutral' | 'info' {
  if (estado === 'ACTIVO') return 'exito';
  if (estado === 'CERRADO') return 'neutral';
  return 'info';
}

function formatearFecha(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Página ────────────────────────────────────────────────────────────────────

export function PaginaPeriodos() {
  const { periodos, cargando, crearPeriodo, cerrarPeriodo, creando, cerrando } = usarPeriodos();

  // Formulario crear
  const [formulario, setFormulario] = useState<SolicitudCrearPeriodo>(ESTADO_INICIAL);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Diálogo cerrar
  const [periodoCerrar, setPeriodoCerrar] = useState<Periodo | null>(null);

  const cambiar = (campo: keyof SolicitudCrearPeriodo) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormulario((prev) => ({ ...prev, [campo]: e.target.value }));
      setErrores((prev) => ({ ...prev, [campo]: '' }));
    };

  const enviarCrear = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevos: Record<string, string> = {};
    if (!formulario.nombre.trim()) nuevos.nombre = 'Ingresa el nombre del período';
    if (!formulario.fecha_inicio) nuevos.fecha_inicio = 'Selecciona la fecha de inicio';
    if (!formulario.fecha_fin) nuevos.fecha_fin = 'Selecciona la fecha de fin';
    if (
      formulario.fecha_inicio &&
      formulario.fecha_fin &&
      formulario.fecha_inicio >= formulario.fecha_fin
    ) nuevos.fecha_fin = 'La fecha de fin debe ser posterior al inicio';
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return; }

    crearPeriodo(formulario, {
      onSuccess: () => {
        toast.success('Período creado', { description: formulario.nombre.trim() });
        setFormulario(ESTADO_INICIAL);
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

  const periodosActivos = periodos.filter((p) => p.estado === 'ACTIVO').length;

  const columnas = [
    {
      clave: 'nombre',
      etiqueta: 'Período',
      render: (p: Periodo) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="tabla-datos-avatar tabla-datos-avatar--icono">
            <CalendarDays size={14} />
          </div>
          <span style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
            {p.nombre}
          </span>
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
    <div
      className="pagina-contenido"
    >
      <EncabezadoPagina
        titulo="Períodos"
        descripcion="Administra los períodos de operación de la barbería"
        indicador={
          periodosActivos > 0 ? (
            <span className="encabezado-indicador-chip">
              <CheckCircle2 size={11} />
              {periodosActivos} activo{periodosActivos !== 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      />

      {/* Formulario crear período */}
      <SeccionTarjeta
        titulo="Nuevo período"
        icono={<CalendarDays size={14} />}
        maxAncho={560}
      >
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--espacio-md)' }}>
            <Campo
              etiqueta="Fecha de inicio"
              requerido
              type="date"
              error={errores.fecha_inicio}
              value={formulario.fecha_inicio}
              onChange={cambiar('fecha_inicio')}
              className="campo-input"
            />
            <Campo
              etiqueta="Fecha de fin"
              requerido
              type="date"
              error={errores.fecha_fin}
              value={formulario.fecha_fin}
              onChange={cambiar('fecha_fin')}
              className="campo-input"
            />
          </div>
          <Boton type="submit" variante="primario" cargando={creando}>
            Crear período
          </Boton>
        </form>
      </SeccionTarjeta>

      {/* Tabla de períodos */}
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

      {/* Diálogo confirmar cierre */}
      {periodoCerrar && (
        <DialogoConfirmacion
          abierto
          titulo="Cerrar período"
          descripcion={`¿Confirmas cerrar el período "${periodoCerrar.nombre}"? Esta acción impide nuevas operaciones en él y no puede deshacerse.`}
          textoConfirmar="Cerrar período"
          variante="peligro"
          cargando={cerrando}
          alConfirmar={confirmarCierre}
          alCancelar={() => setPeriodoCerrar(null)}
        />
      )}
    </div>
  );
}
