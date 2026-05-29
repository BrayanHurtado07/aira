import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Tag, Plus, X, Trash2 } from 'lucide-react'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import { usarSedes } from '@/capacidades/organizacion/ganchos/usarSedes'
import { usarTarifasSucursal, usarCrearTarifa, usarEliminarTarifa } from '../ganchos/usarTarifasEspeciales'
import type { TarifaEspecial } from '../contratos/tipos'

// ── Panel de tarifas por sucursal ─────────────────────────────────────────────

const FORM_VACIO = {
  servicio_id: '',
  fecha: '',
  precio_especial: '',
  motivo: '',
}

function PanelTarifasSucursal({ sucursalID }: { sucursalID: string }) {
  const { tarifas, cargando } = usarTarifasSucursal(sucursalID)
  const mutacionCrear = usarCrearTarifa(sucursalID)
  const mutacionEliminar = usarEliminarTarifa(sucursalID)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const manejarCambio = (campo: keyof typeof FORM_VACIO, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: '' }))
  }

  const manejarEnviar = (e: React.FormEvent) => {
    e.preventDefault()
    const nuevos: Record<string, string> = {}
    if (!form.servicio_id.trim()) nuevos.servicio_id = 'El ID de servicio es obligatorio'
    if (!form.fecha) nuevos.fecha = 'La fecha es obligatoria'
    if (!form.precio_especial || Number(form.precio_especial) < 0)
      nuevos.precio_especial = 'Ingresa un precio válido'
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return }

    mutacionCrear.mutate(
      {
        servicio_id: form.servicio_id.trim(),
        fecha: form.fecha,
        precio_especial: Number(form.precio_especial),
        motivo: form.motivo.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Tarifa especial creada')
          setForm(FORM_VACIO)
          setMostrarFormulario(false)
          setErrores({})
        },
        onError: (err) => toast.error(mensajeDeError(err)),
      },
    )
  }

  const manejarEliminar = (tarifaID: string) => {
    mutacionEliminar.mutate(tarifaID, {
      onSuccess: () => toast.success('Tarifa eliminada'),
      onError: (err) => toast.error(mensajeDeError(err)),
    })
  }

  const columnas = [
    {
      clave: 'fecha',
      etiqueta: 'Fecha',
      render: (t: TarifaEspecial) => (
        <span style={{ fontWeight: 500 }}>{t.fecha}</span>
      ),
    },
    {
      clave: 'servicio_id',
      etiqueta: 'Servicio',
      render: (t: TarifaEspecial) => (
        <span style={{ fontFamily: 'monospace', fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)' }}>
          {t.servicio_id.slice(0, 8)}…
        </span>
      ),
    },
    {
      clave: 'precio_especial',
      etiqueta: 'Precio especial',
      render: (t: TarifaEspecial) => (
        <span style={{ fontWeight: 600, color: 'var(--color-primario)' }}>
          S/ {t.precio_especial.toFixed(2)}
        </span>
      ),
    },
    {
      clave: 'motivo',
      etiqueta: 'Motivo',
      render: (t: TarifaEspecial) => (
        <span style={{ color: 'var(--color-texto-suave)', fontStyle: t.motivo ? 'normal' : 'italic' }}>
          {t.motivo || 'Sin motivo'}
        </span>
      ),
    },
    {
      clave: 'acciones',
      etiqueta: '',
      render: (t: TarifaEspecial) => (
        <Boton
          variante="fantasma"
          icono={<Trash2 size={13} />}
          tamano="sm"
          onClick={() => manejarEliminar(t.id)}
          cargando={mutacionEliminar.isPending}
        >
          Eliminar
        </Boton>
      ),
    },
  ]

  return (
    <SeccionTarjeta
      titulo="Tarifas especiales"
      descripcion="Precios diferenciales para servicios en fechas concretas"
      icono={<Tag size={14} />}
      acciones={
        <Boton
          variante="secundario"
          icono={<Plus size={13} />}
          tamano="sm"
          onClick={() => setMostrarFormulario((v) => !v)}
        >
          {mostrarFormulario ? 'Cancelar' : 'Nueva tarifa'}
        </Boton>
      }
    >
      {mostrarFormulario && (
        <form
          onSubmit={manejarEnviar}
          style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacio-md)',
            padding: 'var(--espacio-md)',
            background: 'var(--color-superficie-elevada)',
            borderRadius: 'var(--radio-lg)',
            marginBottom: 'var(--espacio-md)',
          }}
        >
          <div className="campo-grupo">
            <label className="campo-etiqueta">ID Servicio <span className="campo-requerido">*</span></label>
            <input
              className={`campo-entrada${errores.servicio_id ? ' campo-entrada--error' : ''}`}
              value={form.servicio_id}
              onChange={(e) => manejarCambio('servicio_id', e.target.value)}
              placeholder="UUID del servicio"
            />
            {errores.servicio_id && <span className="campo-error-inline">{errores.servicio_id}</span>}
          </div>

          <div className="campo-grupo">
            <label className="campo-etiqueta">Fecha <span className="campo-requerido">*</span></label>
            <input
              type="date"
              className={`campo-entrada${errores.fecha ? ' campo-entrada--error' : ''}`}
              value={form.fecha}
              onChange={(e) => manejarCambio('fecha', e.target.value)}
            />
            {errores.fecha && <span className="campo-error-inline">{errores.fecha}</span>}
          </div>

          <div className="campo-grupo">
            <label className="campo-etiqueta">Precio especial (S/) <span className="campo-requerido">*</span></label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={`campo-entrada${errores.precio_especial ? ' campo-entrada--error' : ''}`}
              value={form.precio_especial}
              onChange={(e) => manejarCambio('precio_especial', e.target.value)}
              placeholder="0.00"
            />
            {errores.precio_especial && <span className="campo-error-inline">{errores.precio_especial}</span>}
          </div>

          <div className="campo-grupo">
            <label className="campo-etiqueta">Motivo</label>
            <input
              className="campo-entrada"
              value={form.motivo}
              onChange={(e) => manejarCambio('motivo', e.target.value)}
              placeholder="Ej: Feriado, Promoción..."
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--espacio-sm)' }}>
            <Boton type="submit" variante="primario" cargando={mutacionCrear.isPending} icono={<Tag size={13} />}>
              Crear tarifa
            </Boton>
            <Boton
              type="button"
              variante="fantasma"
              icono={<X size={13} />}
              onClick={() => { setMostrarFormulario(false); setForm(FORM_VACIO); setErrores({}) }}
            >
              Cancelar
            </Boton>
          </div>
        </form>
      )}

      <TablaDatos<TarifaEspecial>
        columnas={columnas}
        filas={tarifas}
        obtenerClave={(t) => t.id}
        cargando={cargando}
        vacioIcono={<Tag size={28} />}
        vacioTitulo="Sin tarifas especiales"
        vacioMensaje="No hay precios diferenciales configurados para esta sucursal."
      />
    </SeccionTarjeta>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export function PaginaTarifasEspeciales() {
  const { sedes, cargando: cargandoSedes } = usarSedes()
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ padding: 'var(--espacio-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-lg)' }}
    >
      <EncabezadoPagina
        titulo="Tarifas especiales"
        descripcion="Precios diferenciales para servicios en fechas concretas por sede"
      />

      {/* Selector de sucursal */}
      <SeccionTarjeta titulo="Seleccionar sede" maxAncho={480}>
        <div className="campo-grupo">
          <label className="campo-etiqueta">Sede</label>
          <select
            className="campo-entrada"
            value={sucursalSeleccionada}
            onChange={(e) => setSucursalSeleccionada(e.target.value)}
            disabled={cargandoSedes}
          >
            <option value="">— Selecciona una sede —</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>
      </SeccionTarjeta>

      {/* Panel de tarifas */}
      {sucursalSeleccionada && (
        <PanelTarifasSucursal sucursalID={sucursalSeleccionada} />
      )}
    </motion.div>
  )
}
