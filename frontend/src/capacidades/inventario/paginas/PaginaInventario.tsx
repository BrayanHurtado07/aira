import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Package, Plus, BarChart3, ArrowDownUp, AlertTriangle } from 'lucide-react'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { CampoMoneda } from '@/compartido/interfaz/primitivas/CampoMoneda'
import { Selector } from '@/compartido/interfaz/primitivas/Selector'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import { Modal } from '@/compartido/interfaz/primitivas/Modal'
import { Pestanas } from '@/compartido/interfaz/primitivas/Pestanas'
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia'
import { usarSedes } from '@/capacidades/organizacion/ganchos/usarSedes'
import { usarProductos, usarCrearProducto, usarStockSucursal, usarRegistrarMovimiento } from '../ganchos/usarInventario'
import type { Producto, StockSucursal, TipoProducto, TipoMovimiento } from '../contratos/tipos'

// ── Helpers ───────────────────────────────────────────────────────────────────

function etiquetaTipo(tipo: TipoProducto): string {
  if (tipo === 'INSUMO_BARBERO') return 'Insumo barbero'
  return 'Consumible cliente'
}

const OPCIONES_TIPO_PRODUCTO = [
  { valor: 'INSUMO_BARBERO', etiqueta: 'Insumo barbero' },
  { valor: 'CONSUMIBLE_CLIENTE', etiqueta: 'Consumible cliente' },
]

const OPCIONES_TIPO_MOVIMIENTO = [
  { valor: 'COMPRA', etiqueta: 'Compra' },
  { valor: 'CONSUMO_SERVICIO', etiqueta: 'Consumo de servicio' },
  { valor: 'CONSUMO_COMPLEMENTO', etiqueta: 'Consumo de complemento' },
  { valor: 'AJUSTE', etiqueta: 'Ajuste de inventario' },
  { valor: 'DEVOLUCION', etiqueta: 'Devolución' },
]

const FORM_PRODUCTO_VACIO = {
  nombre: '',
  codigo: '',
  tipo: 'INSUMO_BARBERO' as TipoProducto,
  precio_unitario: '',
  descripcion: '',
}

const FORM_MOVIMIENTO_VACIO = {
  producto_id: '',
  sucursal_id: '',
  tipo_movimiento: 'COMPRA' as TipoMovimiento,
  cantidad: '',
  causa_descripcion: '',
}

// ── Modal Nuevo Producto ──────────────────────────────────────────────────────

function ModalNuevoProducto({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  const mutacionCrear = usarCrearProducto()
  const [form, setForm] = useState(FORM_PRODUCTO_VACIO)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const cambiar = (campo: keyof typeof FORM_PRODUCTO_VACIO, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: '' }))
  }

  const cerrar = () => {
    setForm(FORM_PRODUCTO_VACIO)
    setErrores({})
    alCerrar()
  }

  const enviar = (e: React.FormEvent) => {
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
        descripcion: form.descripcion.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Producto creado', { description: form.nombre })
          cerrar()
        },
        onError: (err) => toast.error(mensajeDeError(err)),
      },
    )
  }

  return (
    <Modal
      abierto={abierto}
      alCerrar={cerrar}
      titulo="Nuevo producto"
      descripcion="Registra un producto en el catálogo de inventario"
      ancho="md"
      sinCerrarAlFondo={mutacionCrear.isPending}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={mutacionCrear.isPending}>
            Cancelar
          </Boton>
          <Boton
            variante="primario"
            icono={<Package size={14} />}
            cargando={mutacionCrear.isPending}
            onClick={enviar as unknown as React.MouseEventHandler}
          >
            Crear producto
          </Boton>
        </>
      }
    >
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacio-md)' }}>
          <Campo
            etiqueta="Nombre"
            requerido
            error={errores.nombre}
            value={form.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
            placeholder="Ej: Cera para cabello"
            style={{ gridColumn: '1 / -1' }}
          />
          <Campo
            etiqueta="Código"
            requerido
            error={errores.codigo}
            value={form.codigo}
            onChange={(e) => cambiar('codigo', e.target.value)}
            placeholder="Ej: PROD-001"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
              Tipo
            </label>
            <Selector
              valor={form.tipo}
              alCambiar={(v) => cambiar('tipo', v)}
              opciones={OPCIONES_TIPO_PRODUCTO}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
            Precio unitario <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <CampoMoneda
            valor={form.precio_unitario}
            alCambiar={(v) => cambiar('precio_unitario', v)}
            error={!!errores.precio_unitario}
          />
          {errores.precio_unitario && (
            <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>
              {errores.precio_unitario}
            </span>
          )}
        </div>

        <Campo
          etiqueta="Descripción (opcional)"
          value={form.descripcion}
          onChange={(e) => cambiar('descripcion', e.target.value)}
          placeholder="Descripción del producto…"
        />

        <button type="submit" style={{ display: 'none' }} />
      </form>
    </Modal>
  )
}

// ── Panel Productos ───────────────────────────────────────────────────────────

function PanelProductos() {
  const { productos, cargando } = usarProductos()
  const [modalAbierto, setModalAbierto] = useState(false)

  const columnas = [
    {
      clave: 'nombre',
      etiqueta: 'Producto',
      render: (p: Producto) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          <span style={{ fontWeight: 500, color: 'var(--color-texto)' }}>{p.nombre}</span>
          <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)', fontFamily: 'monospace' }}>
            {p.codigo}
          </span>
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
        <Insignia variante={p.estado === 'ACTIVO' ? 'exito' : 'neutral'}>
          {p.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
        </Insignia>
      ),
    },
  ]

  return (
    <>
      <SeccionTarjeta
        titulo="Catálogo de productos"
        sinPaddingCuerpo
        acciones={
          <Boton variante="primario" icono={<Plus size={14} />} onClick={() => setModalAbierto(true)}>
            Nuevo producto
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

      <ModalNuevoProducto abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} />
    </>
  )
}

// ── Panel Stock ───────────────────────────────────────────────────────────────

function PanelStock() {
  const { sedes, cargando: cargandoSedes } = usarSedes()
  const [sucursalID, setSucursalID] = useState('')
  const { stock, cargando } = usarStockSucursal(sucursalID)
  const { productos } = usarProductos()

  const opcionesSedes = sedes.map((s) => ({ valor: s.id, etiqueta: s.nombre }))

  const columnas = [
    {
      clave: 'producto_id',
      etiqueta: 'Producto',
      render: (s: StockSucursal) => {
        const producto = productos.find((p) => p.id === s.producto_id)
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            <span style={{ fontWeight: 500, fontSize: 'var(--tamano-sm)' }}>
              {producto?.nombre ?? '—'}
            </span>
            <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)', fontFamily: 'monospace' }}>
              {producto?.codigo ?? s.producto_id.slice(0, 8) + '…'}
            </span>
          </div>
        )
      },
    },
    {
      clave: 'cantidad_actual',
      etiqueta: 'Stock actual',
      render: (s: StockSucursal) => {
        const bajo = s.cantidad_actual <= s.cantidad_minima
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600, color: bajo ? 'var(--color-error)' : 'var(--color-exito)' }}>
              {s.cantidad_actual}
            </span>
            {bajo && (
              <Insignia variante="error">
                <AlertTriangle size={11} style={{ marginRight: '0.2rem' }} />
                Bajo mínimo
              </Insignia>
            )}
          </div>
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
    <SeccionTarjeta titulo="Stock por sede" descripcion="Niveles de inventario en cada sede" sinPaddingCuerpo={!!sucursalID}>
      <div style={{ marginBottom: sucursalID ? 'var(--espacio-md)' : 0, padding: sucursalID ? 'var(--espacio-md) var(--espacio-lg) 0' : 0, maxWidth: 360 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
            Sede
          </label>
          <Selector
            valor={sucursalID}
            alCambiar={setSucursalID}
            opciones={opcionesSedes}
            placeholder="— Selecciona una sede —"
            cargando={cargandoSedes}
          />
        </div>
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
  const { productos } = usarProductos()
  const { sedes, cargando: cargandoSedes } = usarSedes()
  const [form, setForm] = useState(FORM_MOVIMIENTO_VACIO)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const opcionesProducto = productos
    .filter((p) => p.estado === 'ACTIVO')
    .map((p) => ({ valor: p.id, etiqueta: `${p.nombre} (${p.codigo})` }))

  const opcionesSedes = sedes.map((s) => ({ valor: s.id, etiqueta: s.nombre }))

  const cambiar = (campo: keyof typeof FORM_MOVIMIENTO_VACIO, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: '' }))
  }

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const nuevos: Record<string, string> = {}
    if (!form.producto_id) nuevos.producto_id = 'Selecciona un producto'
    if (!form.sucursal_id) nuevos.sucursal_id = 'Selecciona una sede'
    if (!form.cantidad || Number(form.cantidad) === 0) nuevos.cantidad = 'La cantidad no puede ser cero'
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return }

    mutacionMovimiento.mutate(
      {
        producto_id: form.producto_id,
        sucursal_id: form.sucursal_id,
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
      maxAncho={600}
    >
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacio-md)' }}>
          {/* Producto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
              Producto <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <Selector
              valor={form.producto_id}
              alCambiar={(v) => cambiar('producto_id', v)}
              opciones={opcionesProducto}
              placeholder="Selecciona producto"
              error={!!errores.producto_id}
            />
            {errores.producto_id && (
              <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>
                {errores.producto_id}
              </span>
            )}
          </div>

          {/* Sede */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
              Sede <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <Selector
              valor={form.sucursal_id}
              alCambiar={(v) => cambiar('sucursal_id', v)}
              opciones={opcionesSedes}
              placeholder="Selecciona sede"
              cargando={cargandoSedes}
              error={!!errores.sucursal_id}
            />
            {errores.sucursal_id && (
              <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>
                {errores.sucursal_id}
              </span>
            )}
          </div>

          {/* Tipo de movimiento */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
              Tipo de movimiento
            </label>
            <Selector
              valor={form.tipo_movimiento}
              alCambiar={(v) => cambiar('tipo_movimiento', v)}
              opciones={OPCIONES_TIPO_MOVIMIENTO}
            />
          </div>

          {/* Cantidad */}
          <Campo
            etiqueta="Cantidad"
            requerido
            error={errores.cantidad}
            type="number"
            min="0.01"
            step="0.01"
            value={form.cantidad}
            onChange={(e) => cambiar('cantidad', e.target.value)}
            placeholder="Ej: 10"
          />
        </div>

        <Campo
          etiqueta="Descripción de causa (opcional)"
          value={form.causa_descripcion}
          onChange={(e) => cambiar('causa_descripcion', e.target.value)}
          placeholder="Ej: Compra proveedor XYZ, ajuste por inventario físico…"
        />

        <div>
          <Boton
            type="submit"
            variante="primario"
            cargando={mutacionMovimiento.isPending}
            icono={<ArrowDownUp size={14} />}
          >
            Registrar movimiento
          </Boton>
        </div>
      </form>
    </SeccionTarjeta>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

type Tab = 'productos' | 'stock' | 'movimiento'

const PESTANAS_INV = [
  { id: 'productos', etiqueta: 'Productos',     icono: <Package size={14} /> },
  { id: 'stock',     etiqueta: 'Stock por sede', icono: <BarChart3 size={14} /> },
  { id: 'movimiento',etiqueta: 'Movimiento',     icono: <ArrowDownUp size={14} /> },
]

export function PaginaInventario() {
  const [tabActiva, setTabActiva] = useState<Tab>('productos')
  const { productos } = usarProductos()

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <EncabezadoPagina
        titulo="Inventario"
        descripcion="Gestiona los productos, stock e insumos de la barbería"
        indicador={
          productos.length > 0 ? (
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.25rem 0.75rem', borderRadius: '99px',
                backgroundColor: 'rgba(5,150,105,0.08)',
                fontSize: 'var(--tamano-xs)', fontWeight: 600, color: 'var(--color-exito)',
              }}
            >
              <Package size={12} />
              {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
            </div>
          ) : undefined
        }
        style={{
          padding: 'var(--espacio-lg)',
          borderBottom: '1px solid var(--color-borde)',
          backgroundColor: 'var(--color-superficie)',
        }}
      />

      <div style={{ padding: '0 var(--espacio-lg)', borderBottom: '1px solid var(--color-borde)', backgroundColor: 'var(--color-superficie)' }}>
        <Pestanas
          pestanas={PESTANAS_INV}
          activa={tabActiva}
          alCambiar={(id) => setTabActiva(id as Tab)}
          variante="linea"
        />
      </div>

      <div style={{ padding: 'var(--espacio-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-lg)' }}>
        {tabActiva === 'productos'  && <PanelProductos />}
        {tabActiva === 'stock'      && <PanelStock />}
        {tabActiva === 'movimiento' && <PanelMovimiento />}
      </div>
    </motion.div>
  )
}
