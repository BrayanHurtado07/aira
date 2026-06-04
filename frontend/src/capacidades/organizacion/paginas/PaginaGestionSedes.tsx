import React, { useState } from 'react';

import { toast } from 'sonner';
import { Building2, MapPin, Power, PowerOff } from 'lucide-react';
import { Campo } from '@/compartido/interfaz/primitivas/Campo';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina';
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta';
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos';
import { MenuAcciones } from '@/compartido/interfaz/primitivas/MenuAcciones';
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion';
import { Insignia, insigniaPorEstado } from '@/compartido/interfaz/retroalimentacion/Insignia';
import { usarSedes } from '../ganchos/usarSedes';
import type { Sucursal } from '../contratos/tipos';

// ── Página ────────────────────────────────────────────────────────────────────

export function PaginaGestionSedes() {
  const { sedes, cargando, crearSede, creando, actualizarEstado } = usarSedes();

  // Formulario nueva sede
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');

  // Diálogo cambio estado
  const [sedeAccion, setSedeAccion] = useState<{ sede: Sucursal; nuevo: 'ACTIVO' | 'INACTIVO' } | null>(null);
  const [ejecutandoEstado, setEjecutandoEstado] = useState(false);

  const sedesActivas = sedes.filter((s) => s.estado === 'ACTIVO').length;

  const enviarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Ingresa el nombre de la sede');
      return;
    }
    try {
      await crearSede({ nombre: nombre.trim() });
      toast.success('Sede registrada', { description: nombre.trim() });
      setNombre('');
      setError('');
    } catch {
      toast.error('No se pudo registrar la sede');
    }
  };

  const confirmarCambioEstado = async () => {
    if (!sedeAccion) return;
    setEjecutandoEstado(true);
    try {
      await actualizarEstado({ id: sedeAccion.sede.id, estado: sedeAccion.nuevo });
      toast.success(
        sedeAccion.nuevo === 'ACTIVO' ? 'Sede activada' : 'Sede desactivada',
        { description: sedeAccion.sede.nombre },
      );
      setSedeAccion(null);
    } catch {
      toast.error('No se pudo cambiar el estado de la sede');
    } finally {
      setEjecutandoEstado(false);
    }
  };

  const columnas = [
    {
      clave: 'nombre',
      etiqueta: 'Sede',
      render: (sede: Sucursal) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="tabla-datos-avatar tabla-datos-avatar--icono">
            <MapPin size={14} />
          </div>
          <span style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
            {sede.nombre}
          </span>
        </div>
      ),
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (sede: Sucursal) => (
        <Insignia variante={insigniaPorEstado(sede.estado)}>
          {sede.estado === 'ACTIVO' ? 'Activa' : 'Inactiva'}
        </Insignia>
      ),
    },
    {
      clave: 'acciones',
      etiqueta: '',
      render: (sede: Sucursal) => (
        <MenuAcciones
          acciones={[
            {
              id: 'activar',
              etiqueta: 'Activar',
              icono: <Power size={13} />,
              deshabilitada: sede.estado === 'ACTIVO',
            },
            {
              id: 'desactivar',
              etiqueta: 'Desactivar',
              icono: <PowerOff size={13} />,
              variante: 'advertencia' as const,
              deshabilitada: sede.estado === 'INACTIVO',
            },
          ]}
          onAccion={(id) => {
            if (id === 'activar') setSedeAccion({ sede, nuevo: 'ACTIVO' });
            if (id === 'desactivar') setSedeAccion({ sede, nuevo: 'INACTIVO' });
          }}
        />
      ),
    },
  ];

  return (
    <div
      className="pagina-contenido"
    >
      <EncabezadoPagina
        titulo="Sedes"
        descripcion="Registra y administra las sedes de la barbería"
        indicador={
          sedesActivas > 0 ? (
            <span className="encabezado-indicador-chip">
              <Building2 size={11} />
              {sedesActivas} activa{sedesActivas !== 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      />

      {/* Formulario nueva sede */}
      <SeccionTarjeta
        titulo="Nueva sede"
        icono={<Building2 size={14} />}
        maxAncho={480}
      >
        <form onSubmit={enviarFormulario} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
          <Campo
            etiqueta="Nombre de la sede"
            requerido
            error={error}
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); setError(''); }}
            placeholder="Ej: Sede Principal"
            className="campo-input"
          />
          <Boton type="submit" variante="primario" cargando={creando}>
            Registrar sede
          </Boton>
        </form>
      </SeccionTarjeta>

      {/* Tabla de sedes */}
      <SeccionTarjeta titulo="Sedes registradas" sinPaddingCuerpo>
        <TablaDatos<Sucursal>
          columnas={columnas}
          filas={sedes}
          obtenerClave={(s) => s.id}
          cargando={cargando}
          vacioIcono={<Building2 size={24} />}
          vacioTitulo="Sin sedes aún"
          vacioMensaje="Registra la primera sede de la barbería."
        />
      </SeccionTarjeta>

      {/* Diálogo confirmar cambio estado */}
      {sedeAccion && (
        <DialogoConfirmacion
          abierto
          titulo={sedeAccion.nuevo === 'ACTIVO' ? 'Activar sede' : 'Desactivar sede'}
          descripcion={
            sedeAccion.nuevo === 'ACTIVO'
              ? `¿Confirmas activar la sede "${sedeAccion.sede.nombre}"? Volverá a estar disponible para operaciones.`
              : `¿Confirmas desactivar la sede "${sedeAccion.sede.nombre}"? No podrá recibir nuevas reservas.`
          }
          textoConfirmar={sedeAccion.nuevo === 'ACTIVO' ? 'Activar' : 'Desactivar'}
          variante={sedeAccion.nuevo === 'INACTIVO' ? 'advertencia' : 'normal'}
          cargando={ejecutandoEstado}
          alConfirmar={confirmarCambioEstado}
          alCancelar={() => setSedeAccion(null)}
        />
      )}
    </div>
  );
}
