import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Tag, Plus, Trash2, Building2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import { MenuAcciones } from '@/compartido/interfaz/primitivas/MenuAcciones'
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion'
import { SelectorSede } from '@/capacidades/organizacion/componentes/SelectorSede'
import { ModalTarifaEspecial } from '../componentes/ModalTarifaEspecial'
import { usarSedes } from '@/capacidades/organizacion/ganchos/usarSedes'
import { obtenerServicios } from '../servicios/servicio-agenda'
import { usarTarifasSucursal, usarEliminarTarifa } from '../ganchos/usarTarifasEspeciales'
import type { TarifaEspecial, Servicio } from '../contratos/tipos'

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  const { tarifas, cargando, error } = usarTarifasSucursal(sucursalID)
  const mutacionEliminar = usarEliminarTarifa(sucursalID)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState<TarifaEspecial | null>(null)

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
        sinPaddingCuerpo
        acciones={
          <Boton
            variante="primario"
            icono={<Plus size={13} />}
            tamano="sm"
            onClick={() => setModalAbierto(true)}
          >
            Nueva tarifa
          </Boton>
        }
      >
        {!cargando && error && (
          <div style={{ padding: '0 var(--espacio-md) var(--espacio-md)' }}>
            <BannerAlerta variante="error" titulo="No se pudieron cargar las tarifas" mensaje={mensajeDeError(error)} />
          </div>
        )}

        <TablaDatos<TarifaEspecial>
          columnas={columnas}
          filas={tarifas}
          obtenerClave={(t) => t.id}
          cargando={cargando}
          tarjetaMovil
          vacioIcono={<Tag size={28} />}
          vacioTitulo="Sin tarifas especiales"
          vacioMensaje="No hay precios diferenciales configurados para esta sucursal."
          vacioAccion={
            <Boton variante="primario" icono={<Plus size={13} />} tamano="sm" onClick={() => setModalAbierto(true)}>
              Crear la primera
            </Boton>
          }
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

      <ModalTarifaEspecial
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        sucursalID={sucursalID}
      />

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
  const { sedes } = usarSedes()
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('')

  const consultaServicios = useQuery({
    queryKey: ['servicios'],
    queryFn: obtenerServicios,
  })
  const servicios = consultaServicios.data ?? []

  const sedeSel = sedes.find((s) => s.id === sucursalSeleccionada)

  return (
    <motion.div
      className="pagina-contenido"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <EncabezadoPagina
        titulo="Tarifas especiales"
        descripcion="Precios diferenciales para servicios en fechas concretas por sede"
        indicador={sedeSel ? sedeSel.nombre : undefined}
      />

      {consultaServicios.isError && (
        <BannerAlerta variante="error" mensaje="No se pudieron cargar los servicios. Recarga la página." />
      )}

      {/* Selector de sede */}
      <SeccionTarjeta titulo="Sede" icono={<Building2 size={14} />} maxAncho={420}>
        <Campo etiqueta="Selecciona la sede a configurar">
          <SelectorSede valor={sucursalSeleccionada} alCambiar={setSucursalSeleccionada} placeholder="— Elige una sede —" />
        </Campo>
      </SeccionTarjeta>

      {sucursalSeleccionada && (
        <PanelTarifasSucursal sucursalID={sucursalSeleccionada} servicios={servicios} />
      )}
    </motion.div>
  )
}
