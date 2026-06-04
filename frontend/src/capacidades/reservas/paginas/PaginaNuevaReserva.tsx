
import { toast } from 'sonner'
import { ArrowLeft, CalendarPlus } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'

import { registrarReserva } from '@/capacidades/reservas/servicios/servicio-reservas'
import { FormularioReserva } from '@/capacidades/reservas/componentes/FormularioReserva'
import { SeccionTarjeta }    from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { mensajeDeError }    from '@/plataforma/gobierno/errores/errores-dominio'
import type { SolicitudRegistrarReserva } from '@/capacidades/reservas/contratos/tipos'

export function PaginaNuevaReserva() {
  const navegar = useNavigate()

  const mutacion = useMutation({
    mutationFn: (solicitud: SolicitudRegistrarReserva) => registrarReserva(solicitud),
    onSuccess: () => {
      toast.success('Reserva registrada correctamente')
      navegar('/reservas')
    },
    onError: () => toast.error('No se pudo registrar la reserva'),
  })

  return (
    <div
      className="pagina-contenido pagina-contenido--estrecha"
    >
      {/* Volver */}
      <Link to="/reservas" className="enlace-volver">
        <ArrowLeft size={14} />
        Volver a reservas
      </Link>

      {/* Título de página */}
      <div className="nueva-reserva-titulo-fila">
        <div className="nueva-reserva-icono">
          <CalendarPlus size={16} />
        </div>
        <h1 className="nueva-reserva-titulo">Nueva reserva</h1>
      </div>

      {/* Formulario en tarjeta */}
      <SeccionTarjeta>
        <FormularioReserva
          onSubmit={(solicitud) => mutacion.mutate(solicitud)}
          enviando={mutacion.isPending}
          error={mutacion.error ? mensajeDeError(mutacion.error) : null}
        />
      </SeccionTarjeta>
    </div>
  )
}
