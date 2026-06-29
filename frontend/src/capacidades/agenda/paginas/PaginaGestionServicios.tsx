import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Scissors, Plus, Pencil, Power, PowerOff, Clock } from 'lucide-react'

import { obtenerServicios, cambiarEstadoServicio } from '@/capacidades/agenda/servicios/servicio-agenda'

import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import type { ColumnaTabla } from '@/compartido/interfaz/primitivas/TablaDatos'
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta'
import { CeldaEntidad } from '@/compartido/interfaz/primitivas/CeldaEntidad'
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia'
import { ModalServicio } from '@/capacidades/agenda/componentes/ModalServicio'

import type { Servicio } from '@/capacidades/agenda/contratos/tipos'

function duracionLegible(min: number): string {
  if (min >= 60) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${h} hr${m > 0 ? ` ${m} min` : ''}`
  }
  return `${min} min`
}

export function PaginaGestionServicios() {
  const clienteConsulta = useQueryClient()

  const [modalNuevo, setModalNuevo] = useState(false)
  const [servicioEditando, setServicioEditando] = useState<Servicio | null>(null)
  const [confirmarDesactivar, setConfirmarDesactivar] = useState<Servicio | null>(null)

  const { data: servicios = [], isLoading, error } = useQuery({
    queryKey: ['servicios'],
    queryFn: () => obtenerServicios(),
  })

  const mutEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'ACTIVO' | 'INACTIVO' }) => cambiarEstadoServicio(id, estado),
    onSuccess: (_, { estado }) => {
      clienteConsulta.invalidateQueries({ queryKey: ['servicios'] })
      toast.success(estado === 'ACTIVO' ? 'Servicio activado' : 'Servicio desactivado')
      setConfirmarDesactivar(null)
    },
    onError: () => toast.error('No se pudo cambiar el estado'),
  })

  const totalActivos = servicios.filter((s) => s.estado === 'ACTIVO').length

  const ctaNuevo = (
    <Boton variante="primario" icono={<Plus size={14} />} onClick={() => setModalNuevo(true)}>
      Nuevo servicio
    </Boton>
  )

  const columnas: ColumnaTabla<Servicio>[] = [
    {
      clave: 'nombre',
      etiqueta: 'Servicio',
      render: (s) => <CeldaEntidad icono={<Scissors size={14} />} nombre={s.nombre} />,
    },
    {
      clave: 'duracion_minutos',
      etiqueta: 'Duración',
      render: (s) => (
        <span className="servicio-duracion-badge">
          <Clock size={12} />
          {duracionLegible(s.duracion_minutos)}
        </span>
      ),
    },
    {
      clave: 'precio',
      etiqueta: 'Precio',
      render: (s) => <span className="servicio-precio">S/ {(s.precio ?? 0).toFixed(2)}</span>,
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (s) => (
        <Insignia variante={s.estado === 'ACTIVO' ? 'exito' : 'neutral'}>
          {s.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
        </Insignia>
      ),
    },
  ]

  const acciones = (s: Servicio) => (
    <div className="reserva-acciones-fila">
      <button
        className="reserva-accion-btn reserva-accion-btn--editar"
        onClick={() => setServicioEditando(s)}
        data-tooltip="Editar servicio"
        type="button"
        aria-label={`Editar ${s.nombre}`}
      >
        <Pencil size={13} />
      </button>
      {s.estado === 'ACTIVO' ? (
        <button
          className="reserva-accion-btn reserva-accion-btn--no-asistio"
          onClick={() => setConfirmarDesactivar(s)}
          data-tooltip="Desactivar"
          type="button"
          aria-label={`Desactivar ${s.nombre}`}
        >
          <PowerOff size={13} />
        </button>
      ) : (
        <button
          className="reserva-accion-btn reserva-accion-btn--confirmar"
          onClick={() => mutEstado.mutate({ id: s.id, estado: 'ACTIVO' })}
          data-tooltip="Activar"
          type="button"
          aria-label={`Activar ${s.nombre}`}
        >
          <Power size={13} />
        </button>
      )}
    </div>
  )

  return (
    <motion.div
      className="pagina-contenido"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <EncabezadoPagina
        titulo="Servicios"
        descripcion="Administra los servicios ofrecidos por la barbería"
        indicador={!isLoading ? `${totalActivos} ${totalActivos === 1 ? 'activo' : 'activos'}` : undefined}
        acciones={ctaNuevo}
      />

      {!isLoading && error && (
        <BannerAlerta variante="error" titulo="Error al cargar servicios" mensaje="Recarga la página." />
      )}

      <SeccionTarjeta sinPaddingCuerpo>
        <TablaDatos<Servicio>
          columnas={columnas}
          filas={servicios}
          obtenerClave={(s) => s.id}
          cargando={isLoading}
          filasCargando={4}
          tarjetaMovil
          vacioIcono={<Scissors size={24} />}
          vacioTitulo="Sin servicios"
          vacioMensaje="Crea el primer servicio de la barbería."
          vacioAccion={ctaNuevo}
          onClickFila={(s) => setServicioEditando(s)}
          acciones={acciones}
        />
      </SeccionTarjeta>

      {/* Modal crear */}
      <ModalServicio abierto={modalNuevo} alCerrar={() => setModalNuevo(false)} />

      {/* Modal editar */}
      <ModalServicio
        abierto={servicioEditando !== null}
        servicio={servicioEditando}
        alCerrar={() => setServicioEditando(null)}
      />

      {/* Confirmar desactivar */}
      <DialogoConfirmacion
        abierto={confirmarDesactivar !== null}
        titulo={`¿Desactivar "${confirmarDesactivar?.nombre ?? ''}"?`}
        descripcion="El servicio dejará de estar disponible para nuevas reservas. Puedes reactivarlo cuando quieras."
        variante="advertencia"
        textoConfirmar="Sí, desactivar"
        cargando={mutEstado.isPending}
        alConfirmar={() => confirmarDesactivar && mutEstado.mutate({ id: confirmarDesactivar.id, estado: 'INACTIVO' })}
        alCancelar={() => setConfirmarDesactivar(null)}
      />
    </motion.div>
  )
}
