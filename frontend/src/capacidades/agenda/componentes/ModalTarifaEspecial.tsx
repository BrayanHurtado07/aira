import { toast } from 'sonner'
import { Modal } from '@/compartido/interfaz/primitivas/Modal'
import { FormularioTarifaEspecial, type DatosTarifaEspecial } from './FormularioTarifaEspecial'
import { usarCrearTarifa } from '../ganchos/usarTarifasEspeciales'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'

interface PropsModalTarifaEspecial {
  abierto: boolean
  alCerrar: () => void
  sucursalID: string
}

// Único modal de tarifa especial. Crea una tarifa para la sucursal activa.
export function ModalTarifaEspecial({ abierto, alCerrar, sucursalID }: PropsModalTarifaEspecial) {
  const mutacion = usarCrearTarifa(sucursalID)

  const crear = (d: DatosTarifaEspecial) => {
    mutacion.mutate(d, {
      onSuccess: () => {
        toast.success('Tarifa especial creada')
        alCerrar()
      },
      onError: (err) => toast.error(mensajeDeError(err)),
    })
  }

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Nueva tarifa especial"
      descripcion="Precio diferencial para un servicio en una fecha concreta."
      ancho="sm"
      sinCerrarAlFondo={mutacion.isPending}
    >
      {abierto && (
        <FormularioTarifaEspecial
          key={abierto ? 'abierto' : 'cerrado'}
          onSubmit={crear}
          enviando={mutacion.isPending}
          error={mutacion.error ? mensajeDeError(mutacion.error) : null}
        />
      )}
    </Modal>
  )
}
