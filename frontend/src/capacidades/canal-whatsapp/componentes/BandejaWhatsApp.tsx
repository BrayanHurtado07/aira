import { useParams, useNavigate } from 'react-router-dom'
import { usarConversaciones } from '../ganchos/usarConversaciones'
import { PanelListaConversaciones } from './PanelListaConversaciones'
import { PanelConversacion } from './PanelConversacion'
import { PanelIntroConversacion } from './PanelIntroConversacion'

// Bandeja unificada master-detail. Lee la conversación activa de la URL para que
// el deep-link /canal-whatsapp/:id siga funcionando. En móvil se ve un panel a
// la vez (la clase --con-seleccion lo controla en CSS).
export function BandejaWhatsApp() {
  const { conversacionId } = useParams<{ conversacionId: string }>()
  const navegar = useNavigate()
  const { conversaciones, cargando, error } = usarConversaciones()

  const seleccionada = conversaciones.find((c) => c.id === conversacionId)

  return (
    <div className={`wa-bandeja${conversacionId ? ' wa-bandeja--con-seleccion' : ''}`}>
      <aside className="wa-panel-lista">
        <PanelListaConversaciones
          conversaciones={conversaciones}
          cargando={cargando}
          error={error}
          idActiva={conversacionId}
          onSeleccionar={(id) => navegar(`/canal-whatsapp/${id}`)}
        />
      </aside>

      <section className="wa-panel-conversacion">
        {conversacionId ? (
          <PanelConversacion
            conversacionId={conversacionId}
            conversacion={seleccionada}
            onVolver={() => navegar('/canal-whatsapp')}
          />
        ) : (
          <PanelIntroConversacion />
        )}
      </section>
    </div>
  )
}
