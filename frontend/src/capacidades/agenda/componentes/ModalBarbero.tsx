import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { Modal } from '@/compartido/interfaz/primitivas/Modal'
import { usarBarberos } from '../ganchos/usarBarberos'
import { FormularioBarbero, type DatosBarbero } from './FormularioBarbero'
import type { Barbero } from '@/capacidades/agenda/contratos/tipos'

interface PropsModalBarbero {
  abierto: boolean
  alCerrar: () => void
  /** Tras crear, devuelve el barbero nuevo para continuar con servicios/horario. */
  onCreado?: (barbero: Barbero) => void
}

// Modal de alta de barbero. Al registrar, entrega el barbero recién creado para
// que el flujo continúe directo en su gestión (servicios + horario) sin re-abrir.
export function ModalBarbero({ abierto, alCerrar, onCreado }: PropsModalBarbero) {
  const { registrar, registrando } = usarBarberos()

  const crear = async (d: DatosBarbero) => {
    try {
      const res = await registrar({ nombre: d.nombre, telefono: d.telefono || undefined })
      toast.success('Barbero registrado', { description: d.nombre })
      const nuevo: Barbero = {
        id: res.barbero_id,
        id_empresa: '',
        nombre: d.nombre,
        telefono: d.telefono || undefined,
        estado: 'ACTIVO',
      }
      alCerrar()
      onCreado?.(nuevo)
    } catch {
      toast.error('No se pudo registrar el barbero')
    }
  }

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Nuevo barbero"
      descripcion="Registra al integrante; luego le asignas servicios y horario."
      ancho="sm"
    >
      {abierto && (
        <FormularioBarbero
          onSubmit={crear}
          enviando={registrando}
          textoEnviar="Registrar y configurar"
          iconoEnviar={<UserPlus size={14} />}
        />
      )}
    </Modal>
  )
}
