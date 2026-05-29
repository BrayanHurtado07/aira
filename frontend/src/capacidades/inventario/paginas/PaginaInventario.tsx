import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Package, Plus, X, BarChart3, ArrowDownUp } from 'lucide-react'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia'
import { usarSedes } from '@/capacidades/organizacion/ganchos/usarSedes'
import { usarProductos, usarCrearProducto, usarStockSucursal, usarRegistrarMovimiento } from '../ganchos/usarInventario'
import type { Producto, StockSucursal, TipoProducto, TipoMovimiento } from '../contratos/tipos'

// ── Helpers ───────────────────────────────────────────────────────────────────

function etiquetaTipo(tipo: TipoProducto): string {
  if (tipo === 'INSUMO_BARBERO') return 'Insumo barbero'
  if (tipo === 'CONSUMIBLE_CLIENTE') return 'Consumible cliente'
  return tipo
}

function varianteEstado(estado: string): 'exito' | 'neutral' | 'error' {
  if (estado === 'ACTIVO') return 'exito'
  if (estado === 'INACTIVO') return 'neutral'
  return 'error'
}

function etiquetaEstado(estado: string): string {
  const mapa: Record<string, string> = { ACTIVO: 'Activo', INACTIVO: 'Inactivo', ELIMINADO: 'Eliminado' }
  return mapa[estado] ?? estado
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'productos' | 'stock' | 'movimiento'

// ── Estado inicial del formulario productos ───────────────────────────────────

const FORM_PRODUCTO_VACIO = {
  nombre: '',
  codigo: '',
  tipo: 'INSUMO_BARBERO' as TipoProducto,
  precio_unitario: '',
}

// ── Estado inicial del formulario movimiento ──────────────────────────────────

const FORM_MOVIMIENTO_VACIO = {
  producto_id: '',
  sucursal_id: '',
  tipo_movimiento: 'COMPRA' as TipoMovimiento,
  cantidad: '',
  causa_descripcion: '',
}

// ── Panel Productos ───────────────────────────────────────────────────────────

function PanelProductos() {
  const { productos, cargando } = usarProductos()
  const mutacionCrear = usarCrearProducto()

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [form, setForm] = useState(FORM_PRODUCTO_VACIO)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const manejarCambio = (campo: keyof typeof FORM_PRODUCTO_VACIO, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: '' }))
  }

  const manejarEnviar = (e: React.FormEvent) => {
    e.preventDefault()
    const nuevos: Record<string, string> = {}
    if (!form.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio'
    if (!form.codigo.trim()) nuevos.codigo = 'El código es obligatorio'
    if (!form.precio_unitario || Number(form.precio_unitario) < 0)
      nuevos.precio_unitario = 'Ingresa un precio válido'
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return }

    mutacionCrear.mutate(
      {
        nombre: form.nombre.trim(),
        codigo: form.codigo.trim(),
        tipo: form.tipo,
        precio_unitario: Number(form.precio_unitario),
      },
      {
        onSuccess: () => {
          toast.success('Producto creado', { description: form.nombre })
          setForm(FORM_PRODUCTO_VACIO)
          setMostrarFormulario(false)
          setErrores({})
        },
        onError: (err) => toast.error(mensajeDeError(err)),
      },
    )
  }

  const columnas = [
    {
      clave: 'nombre',
      etiqueta: 'Producto',
      render: (p: Producto) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          <span style={{ fontWeight: 500, color: 'var(--color-texto)' }}>{p.nombre}</span>
          <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)' }}>{p.codigo}</span>
        </div>
      ),
    },
    {
      clave: 'tipo',
      etiqueta: 'Tipo',
      render: (p: Producto) => <Insignia variante="info">{etiquetaTipo(p.tipo)}</Insignia>,
    },
    {
      clave: 'precio_unitario',
      etiqueta: 'Precio unitario',
      render: (p: Producto) => (
        <span style={{ fontWeight: 500 }}>S/ {p.precio_unitario.toFixed(2)}</span>
      ),
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (p: Producto) => (
        <Insignia variante={varianteEstado(p.estado)}>{etiquetaEstado(p.estado)}</Insignia>
      ),
    },
  ]

  return (
    <>
      {/* Formulario nuevo producto */}
      {mostrarFormulario && (
        <SeccionTarjeta
          titulo="Nuevo producto"
          descripcion="Registra un producto en el catálogo"
          icono={<Package size={14} />}
          maxAncho={540}
        >
          <form onSubmit={manejarEnviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
            <div className="campo-grupo">
              <label className="campo-etiqueta">Nombre <span className="campo-requerido">*</span></label>
              <input
                className={`campo-entrada${errores.nombre ? ' campo-entrada--error' : ''}`}
                value={form.nombre}
                onChange={(e) => manejarCambio('nombre', e.target.value)}
                placeholder="Ej: Cera para cabello"
              />
              {errores.nombre && <span className="campo-error-inline">{errores.nombre}</span>}
            </div>
            <div className="campo-grupo">
              <label className="campo-etiqueta">Código <span className="campo-requerido">*</span></label>
              <input
                className={`campo-entrada${errores.codigo ? ' campo-entrada--error' : ''}`}
                value={form.codigo}
                onChange={(e) => manejarCambio('codigo', e.target.value)}
                placeholder="Ej: PROD-001"
              />
              {errores.codigo && <span className="campo-error-inline">{errores.codigo}</span>}
            </div>
            <div className="campo-grupo">
              <label className="campo-etiqueta">Tipo</label>
              <select className="campo-entrada" value={form.tipo} onChange={(e) => manejarCambio('tipo', e.target.value)}>
                <option value="INSUMO_BARBERO">Insumo barbero</option>
                <option value="CONSUMIBLE_CLIENTE">Consumible cliente</option>
              </select>
            </div>
            <div className="campo-grupo">
              <label className="campo-etiqueta">Precio unitario (S/) <span className="campo-requerido">*</span></label>
              <input
                type="number" min="0" step="0.01"
                className={`campo-entrada${errores.precio_unitario ? ' campo-entrada--error' : ''}`}
                value={form.precio_unitario}
                onChange={(e) => manejarCambio('precio_unitario', e.target.value)}
                placeholder="0.00"
              />
              {errores.precio_unitario && <span className="campo-error-inline">{errores.precio_unitario}</span>}
            </div>
            <div style={{ display: 'flex', gap: 'var(--espacio-sm)' }}>
              <Boton type="submit" variante="primario" cargando={mutacionCrear.isPending} icono={<Package size={14} />}>
                Crear producto
              </Boton>
              <Boton type="button" variante="fantasma" icono={<X size={14} />}
                onClick={() => { setMostrarFormulario(false); setForm(FORM_PRODUCTO_VACIO); setErrores({}) }}>
                Cancelar
              </Boton>
            </div>
          </form>
        </SeccionTarjeta>
      )}

      <SeccionTarjeta
        titulo="Catálogo de productos"
        sinPaddingCuerpo
        acciones={
          <Boton variante="primario" icono={<Plus size={14} />} onClick={() => setMostrarFormulario((v) => !v)}>
            {mostrarFormulario ? 'Cancelar' : 'Nuevo producto'}
          </Boton>
        }
      >
        <TablaDatos<Producto>
          columnas={columnas}
          filas={productos}
          obtenerClave={(p) => p.id}
          cargando={cargando}
          vacioIcono={<Package size={28} />}
          vacioTitulo="Sin productos aún"
          vacioMensaje="Crea el primer producto usando el botón de arriba."
        />
      </SeccionTarjeta>
    </>
  )
}

// ── Panel Stock ───────────────────────────────────────────────────────────────

function PanelStock() {
  const { sedes, cargando: cargandoSedes } = usarSedes()
  const [sucursalID, setSucursalID] = useState('')
  const { stock, cargando } = usarStockSucursal(sucursalID)

  const columnas = [
    {
      clave: 'producto_id',
      etiqueta: 'Producto',
      render: (s: StockSucursal) => (
        <span style={{ fontFamily: 'monospace', fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)' }}>
          {s.producto_id.slice(0, 8)}…
        </span>
      ),
    },
    {
      clave: 'cantidad_actual',
      etiqueta: 'Stock actual',
      render: (s: StockSucursal) => {
        const bajo = s.cantidad_actual <= s.cantidad_minima
        return (
          <span style={{ fontWeight: 600, color: bajo ? 'var(--color-error)' : 'var(--color-exito)' }}>
            {s.cantidad_actual}
            {bajo && <span style={{ marginLeft: '0.375rem', fontSize: 'var(--tamano-xs)', fontWeight: 400 }}>⚠ bajo mínimo</span>}
          </span>
        )
      },
    },
    {
      clave: 'cantidad_minima',
      etiqueta: 'Mínimo',
      render: (s: StockSucursal) => (
        <span style={{ color: 'var(--color-texto-suave)' }}>{s.cantidad_minima}</span>
      ),
    },
  ]

  return (
    <SeccionTarjeta titulo="Stock por sede" descripcion="Niveles de inventario en cada sede">
      <div className="campo-grupo" style={{ marginBottom: 'var(--espacio-md)', maxWidth: 360 }}>
        <label className="campo-etiqueta">Sede</label>
        <select
          className="campo-entrada"
          value={sucursalID}
          onChange={(e) => setSucursalID(e.target.value)}
          disabled={cargandoSedes}
        >
          <option value="">— Selecciona una sede —</option>
          {sedes.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>

      {sucursalID && (
        <TablaDatos<StockSucursal>
          columnas={columnas}
          filas={stock}
          obtenerClave={(s) => s.producto_id}
          cargando={cargando}
          vacioIcono={<BarChart3 size={28} />}
          vacioTitulo="Sin registros de stock"
          vacioMensaje="No hay movimientos de inventario registrados para esta sede."
        />
      )}
    </SeccionTarjeta>
  )
}

// ── Panel Movimiento ──────────────────────────────────────────────────────────

function PanelMovimiento() {
  const mutacionMovimiento = usarRegistrarMovimiento()
  const [form, setForm] = useState(FORM_MOVIMIENTO_VACIO)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const manejarCambio = (campo: keyof typeof FORM_MOVIMIENTO_VACIO, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: '' }))
  }

  const manejarEnviar = (e: React.FormEvent) => {
    e.preventDefault()
    const nuevos: Record<string, string> = {}
    if (!form.producto_id.trim()) nuevos.producto_id = 'El ID de producto es obligatorio'
    if (!form.sucursal_id.trim()) nuevos.sucursal_id = 'El ID de sucursal es obligatorio'
    if (!form.cantidad || Number(form.cantidad) === 0) nuevos.cantidad = 'La cantidad no puede ser cero'
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return }

    mutacionMovimiento.mutate(
      {
        producto_id: form.producto_id.trim(),
        sucursal_id: form.sucursal_id.trim(),
        tipo_movimiento: form.tipo_movimiento,
        cantidad: Number(form.cantidad),
        causa_descripcion: form.causa_descripcion.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Movimiento registrado correctamente')
          setForm(FORM_MOVIMIENTO_VACIO)
          setErrores({})
        },
        onError: (err) => toast.error(mensajeDeError(err)),
      },
    )
  }

  return (
    <SeccionTarjeta
      titulo="Registrar movimiento"
      descripcion="Compras, consumos, ajustes y devoluciones de inventario"
      icono={<ArrowDownUp size={14} />}
      maxAncho={540}
    >
      <form onSubmit={manejarEnviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
        <div className="campo-grupo">
          <label className="campo-etiqueta">ID Producto <span className="campo-requerido">*</span></label>
          <input
            className={`campo-entrada${errores.producto_id ? ' campo-entrada--error' : ''}`}
            value={form.producto_id}
            onChange={(e) => manejarCambio('producto_id', e.target.value)}
            placeholder="UUID del producto"
          />
          {errores.producto_id && <span className="campo-error-inline">{errores.producto_id}</span>}
        </div>

        <div className="campo-grupo">
          <label className="campo-etiqueta">ID Sucursal <span className="campo-requerido">*</span></label>
          <input
            className={`campo-entrada${errores.sucursal_id ? ' campo-entrada--error' : ''}`}
            value={form.sucursal_id}
            onChange={(e) => manejarCambio('sucursal_id', e.target.value)}
            placeholder="UUID de la sucursal"
          />
          {errores.sucursal_id && <span className="campo-error-inline">{errores.sucursal_id}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacio-md)' }}>
          <div className="campo-grupo">
            <label className="campo-etiqueta">Tipo de movimiento</label>
            <select className="campo-entrada" value={form.tipo_movimiento} onChange={(e) => manejarCambio('tipo_movimiento', e.target.value)}>
              <option value="COMPRA">Compra</option>
              <option value="CONSUMO_SERVICIO">Consumo servicio</option>
              <option value="CONSUMO_COMPLEMENTO">Consumo complemento</option>
              <option value="AJUSTE">Ajuste</option>
              <option value="DEVOLUCION">Devolución</option>
            </select>
          </div>

          <div className="campo-grupo">
            <label className="campo-etiqueta">Cantidad <span className="campo-requerido">*</span></label>
            <input
              type="number" step="0.01"
              className={`campo-entrada${errores.cantidad ? ' campo-entrada--error' : ''}`}
              value={form.cantidad}
              onChange={(e) => manejarCambio('cantidad', e.target.value)}
              placeholder="Ej: 10"
            />
            {errores.cantidad && <span className="campo-error-inline">{errores.cantidad}</span>}
          </div>
        </div>

        <div className="campo-grupo">
          <label className="campo-etiqueta">Descripción de causa (opcional)</label>
          <input
            className="campo-entrada"
            value={form.causa_descripcion}
            onChange={(e) => manejarCambio('causa_descripcion', e.target.value)}
            placeholder="Ej: Compra proveedor XYZ"
          />
        </div>

        <div>
          <Boton type="submit" variante="primario" cargando={mutacionMovimiento.isPending} icono={<ArrowDownUp size={14} />}>
            Registrar movimiento
          </Boton>
        </div>
      </form>
    </SeccionTarjeta>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

const TABS: { id: Tab; etiqueta: string; icono: React.ReactNode }[] = [
  { id: 'productos', etiqueta: 'Productos', icono: <Package size={14} /> },
  { id: 'stock', etiqueta: 'Stock por sede', icono: <BarChart3 size={14} /> },
  { id: 'movimiento', etiqueta: 'Registrar movimiento', icono: <ArrowDownUp size={14} /> },
]

export function PaginaInventario() {
  const [tabActiva, setTabActiva] = useState<Tab>('productos')

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ padding: 'var(--espacio-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-lg)' }}
    >
      <EncabezadoPagina
        titulo="Inventario"
        descripcion="Gestiona los productos, stock e insumos de la barbería"
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--espacio-xs)', borderBottom: '1px solid var(--color-borde)', paddingBottom: '0' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.5rem 1rem',
              fontSize: 'var(--tamano-sm)',
              fontWeight: tabActiva === tab.id ? 600 : 400,
              color: tabActiva === tab.id ? 'var(--color-primario)' : 'var(--color-texto-suave)',
              background: 'none',
              border: 'none',
              borderBottom: tabActiva === tab.id ? '2px solid var(--color-primario)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab.icono}
            {tab.etiqueta}
          </button>
        ))}
      </div>

      {/* Contenido del tab */}
      {tabActiva === 'productos' && <PanelProductos />}
      {tabActiva === 'stock' && <PanelStock />}
      {tabActiva === 'movimiento' && <PanelMovimiento />}
    </motion.div>
  )
}
