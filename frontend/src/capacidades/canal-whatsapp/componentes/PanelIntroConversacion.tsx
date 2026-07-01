import { MessageSquare, Bot, Eye, Send } from 'lucide-react'

const PASOS = [
  { icono: Bot, titulo: 'Aira IA atiende sola', texto: 'Responde dudas y agenda citas por WhatsApp 24/7, sin que hagas nada.' },
  { icono: Eye, titulo: 'Tú supervisas', texto: 'Abre cualquier conversación para leer el historial completo con el cliente.' },
  { icono: Send, titulo: 'Tomas el control', texto: 'Si hace falta, escribe tú mismo: tu mensaje se envía al cliente por WhatsApp.' },
]

// Estado inicial del panel derecho (desktop): explica qué es la bandeja y cómo
// funciona el bot, en vez de dejar un vacío sin contexto.
export function PanelIntroConversacion() {
  return (
    <div className="wa-intro">
      <div className="wa-intro-icono">
        <MessageSquare size={32} aria-hidden />
      </div>
      <h2 className="wa-intro-titulo">Bandeja de WhatsApp</h2>
      <p className="wa-intro-texto">
        Aquí viven las conversaciones de tus clientes. Selecciona una de la lista para verla.
      </p>

      <ul className="wa-intro-pasos">
        {PASOS.map((p) => (
          <li key={p.titulo} className="wa-intro-paso">
            <span className="wa-intro-paso-icono"><p.icono size={18} aria-hidden /></span>
            <div>
              <strong className="wa-intro-paso-titulo">{p.titulo}</strong>
              <span className="wa-intro-paso-texto">{p.texto}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
