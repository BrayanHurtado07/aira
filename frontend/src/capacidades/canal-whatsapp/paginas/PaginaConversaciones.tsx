import { GuardiaCapacidad } from '@/plataforma/activacion/GuardiaCapacidad'
import { BandejaWhatsApp } from '../componentes/BandejaWhatsApp'

// Bandeja de WhatsApp. La misma página sirve la lista (/canal-whatsapp) y el
// detalle (/canal-whatsapp/:conversacionId): la bandeja lee el id de la URL.
export function PaginaConversaciones() {
  return (
    <GuardiaCapacidad codigo="CANAL_WHATSAPP">
      <BandejaWhatsApp />
    </GuardiaCapacidad>
  )
}
