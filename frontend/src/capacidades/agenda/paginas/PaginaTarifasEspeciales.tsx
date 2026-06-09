import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Tag, Plus, Trash2, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { CampoMoneda } from '@/compartido/interfaz/primitivas/CampoMoneda'
import { Selector } from '@/compartido/interfaz/primitivas/Selector'
import { SelectorFecha } from '@/compartido/interfaz/primitivas/SelectorFecha'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import { MenuAcciones } from '@/compartido/interfaz/primitivas/MenuAcciones'
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion'
import { usarSedes } from '@/capacidades/organizacion/ganchos/usarSedes'
import { obtenerServicios } from '../servicios/servicio-agenda'
import { usarTarifasSucursal, usarCrearTarifa, usarEliminarTarifa } from '../ganchos/usarTarifasEspeciales'
import type { TarifaEspecial, Servicio } from '../contratos/tipos'

// ── Helpers ───────────────────────────────────────────────────────────────────

const FORM_VACIO = {
  servicio_id: '',
  fecha: '',
  precio_especial: '',
  motivo: '',
}

function nombreServicio(servicioId: string, servicios: Servicio[]): string {
  return servicios.find((s) => s.id === servicioId)?.nombre ?? servicioId.slice(0, 8) + '…'
}

// ── Panel de tarifas por sucursal ─────────────────────────────────────────────

function PanelTarifasSucursal({
  sucursalID,
  servicios,
}: {
  sucursalID: string
  servicios: Servicio[]
}) {
  const { tarifas, cargando } = usarTarifasSucursal(sucursalID)
  const mutacionCrear = usarCrearTarifa(sucursalID)
  const mutacionEliminar = usarEliminarTarifa(sucursalID)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [confirmarEliminar, setConfirmarEliminar] = useState<TarifaEspecial | null>(null)

  const cambiar = (campo: keyof typeof FORM_VACIO, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: '' }))
  }

  const cerrarFormulario = () => {
    setMostrarFormulario(false)
    setForm(FORM_VACIO)
    setErrores({})
  }

  const manejarEnviar = (e: React.FormEvent) => {
    e.preventDefault()
    const nuevos: Record<string, string> = {}
    if (!form.servicio_id) nuevos.servicio_id = 'Selecciona un servicio'
    if (!form.fecha) nuevos.fecha = 'La fecha es obligatoria'
    if (!form.precio_especial || Number(form.precio_especial) <= 0)
      nuevos.precio_especial = 'Ingresa un precio válido'
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return }

    mutacionCrear.mutate(
      {
        servicio_id: form.servicio_id,
        fecha: form.fecha,
        precio_especial: Number(form.precio_especial),
        motivo: form.motivo.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Tarifa especial creada')
          cerrarFormulario()
        },
        onError: (err) => toast.error(mensajeDeError(err)),
      },
    )
  }

  const opcionesServicio = servicios
    .filter((s) => s.estado === 'ACTIVO')
    .map((s) => ({ valor: s.id, etiqueta: `${s.nombre} — S/ ${s.precio.toFixed(2)}` }))

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
        <span style={{ fontSize: 'var(--tamano-sm)' }}>
          {nombreServicio(t.servicio_id, servicios)}
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
          {t.motivo || '—'}
        </span>
      ),
    },
  ]

  return (
    <>
      <SeccionTarjeta
        titulo="Tarifas especiales"
        descripcion="Precios diferenciales para servicios en fechas concretas"
        icono={<Tag size={14} />}
        sinPaddingCuerpo={!mostrarFormulario}
        acciones={
          <Boton
            variante={mostrarFormulario ? 'fantasma' : 'primario'}
            icono={<Plus size={13} />}
            tamano="sm"
            onClick={() => mostrarFormulario ? cerrarFormulario() : setMostrarFormulario(true)}
          >
            {mostrarFormulario ? 'Cancelar' : 'Nueva tarifa'}
          </Boton>
        }
      >
        {mostrarFormulario && (
          <form
            onSubmit={manejarEnviar}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)', marginBottom: 'var(--espacio-lg)' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacio-md)' }}>
              {/* Servicio */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
                  Servicio <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <Selector
                  valor={form.servicio_id}
                  alCambiar={(v) => cambiar('servicio_id', v)}
                  opciones={opcionesServicio}
                  placeholder="Selecciona servicio"
                  error={!!errores.servicio_id}
                />
                {errores.servicio_id && (
                  <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>
                    {errores.servicio_id}
                  </span>
                )}
              </div>

              {/* Fecha */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
                  Fecha <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <SelectorFecha
                  soloFecha
                  valor={form.fecha}
                  alCambiar={(v) => cambiar('fecha', v)}
                  error={!!errores.fecha}
                />
                {errores.fecha && (
                  <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>
                    {errores.fecha}
                  </span>
                )}
              </div>

              {/* Precio especial */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
                  Precio especial <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <CampoMoneda
                  valor={form.precio_especial}
                  alCambiar={(v) => cambiar('precio_especial', v)}
                  error={!!errores.precio_especial}
                />
                {errores.precio_especial && (
                  <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-error)' }}>
                    {errores.precio_especial}
                  </span>
                )}
              </div>

              {/* Motivo */}
              <Campo
                etiqueta="Motivo (opcional)"
                value={form.motivo}
                onChange={(e) => cambiar('motivo', e.target.value)}
                placeholder="Ej: Feriado, Promoción…"
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--espacio-sm)' }}>
              <Boton type="submit" variante="primario" cargando={mutacionCrear.isPending} icono={<Tag size={13} />}>
                Crear tarifa
              </Boton>
              <Boton type="button" variante="fantasma" onClick={cerrarFormulario}>
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
          acciones={(t) => (
            <MenuAcciones
              acciones={[
                { id: 'eliminar', etiqueta: 'Eliminar tarifa', icono: <Trash2 size={14} />, variante: 'peligro' },
              ]}
              onAccion={() => setConfirmarEliminar(t)}
              titulo="Acciones de tarifa"
            />
          )}
        />
      </SeccionTarjeta>

      <DialogoConfirmacion
        abierto={!!confirmarEliminar}
        titulo="¿Eliminar tarifa especial?"
        descripcion={
          confirmarEliminar
            ? `Se eliminará la tarifa del ${confirmarEliminar.fecha} para "${nombreServicio(confirmarEliminar.servicio_id, servicios)}".`
            : ''
        }
        variante="peligro"
        textoConfirmar="Eliminar"
        cargando={mutacionEliminar.isPending}
        alConfirmar={() => {
          if (!confirmarEliminar) return
          mutacionEliminar.mutate(confirmarEliminar.id, {
            onSuccess: () => {
              toast.success('Tarifa eliminada')
              setConfirmarEliminar(null)
            },
            onError: (err) => toast.error(mensajeDeError(err)),
          })
        }}
        alCancelar={() => setConfirmarEliminar(null)}
      />
    </>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export function PaginaTarifasEspeciales() {
  const { sedes, cargando: cargandoSedes } = usarSedes()
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('')

  const consultaServicios = useQuery({
    queryKey: ['servicios'],
    queryFn: obtenerServicios,
  })
  const servicios = consultaServicios.data ?? []

  const opcionesSedes = sedes.map((s) => ({ valor: s.id, etiqueta: s.nombre }))
  const sedeSel = sedes.find((s) => s.id === sucursalSeleccionada)

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <EncabezadoPagina
        titulo="Tarifas especiales"
        descripcion="Precios diferenciales para servicios en fechas concretas por sede"
        indicador={
          sucursalSeleccionada && sedeSel ? (
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.25rem 0.75rem', borderRadius: '99px',
                backgroundColor: 'rgba(204,28,46,0.08)',
                fontSize: 'var(--tamano-xs)', fontWeight: 600, color: 'var(--color-primario)',
              }}
            >
              <Tag size={11} />
              {sedeSel.nombre}
            </div>
          ) : undefined
        }
        style={{
          padding: 'var(--espacio-lg)',
          borderBottom: '1px solid var(--color-borde)',
          backgroundColor: 'var(--color-superficie)',
        }}
      />

      <div style={{ padding: 'var(--espacio-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-lg)' }}>

        {/* Selector de sede */}
        <SeccionTarjeta titulo="Sede" icono={<AlertCircle size={14} />} maxAncho={420}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
              Selecciona la sede a configurar
            </label>
            <Selector
              valor={sucursalSeleccionada}
              alCambiar={setSucursalSeleccionada}
              opciones={opcionesSedes}
              placeholder="— Elige una sede —"
              cargando={cargandoSedes}
            />
          </div>
        </SeccionTarjeta>

        {sucursalSeleccionada && (
          <PanelTarifasSucursal
            sucursalID={sucursalSeleccionada}
            servicios={servicios}
          />
        )}
      </div>
    </motion.div>
  )
}
