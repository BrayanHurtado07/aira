import { useMemo, useState } from 'react'
import { Search, MessageSquare } from 'lucide-react'
import { Cargando } from '@/compartido/interfaz/retroalimentacion/Cargando'
import { Vacio } from '@/compartido/interfaz/retroalimentacion/Vacio'
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta'
import type { Conversacion } from '../contratos/tipos'
import { ItemConversacion } from './ItemConversacion'
import { formatearTelefono } from '../utilidades/formato'

type FiltroEstado = 'TODAS' | 'ACTIVA' | 'CERRADA'

type Props = {
  conversaciones: Conversacion[]
  cargando: boolean
  error: unknown
  idActiva?: string
  onSeleccionar: (id: string) => void
}

const FILTROS: { clave: FiltroEstado; etiqueta: string }[] = [
  { clave: 'TODAS', etiqueta: 'Todas' },
  { clave: 'ACTIVA', etiqueta: 'Activas' },
  { clave: 'CERRADA', etiqueta: 'Cerradas' },
]

// Master de la bandeja: buscador por número, filtro por estado y lista.
export function PanelListaConversaciones({ conversaciones, cargando, error, idActiva, onSeleccionar }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroEstado>('TODAS')

  const filtradas = useMemo(() => {
    const q = busqueda.replace(/[^\d]/g, '')
    return conversaciones.filter((c) => {
      if (filtro !== 'TODAS' && c.estado !== filtro) return false
      if (q && !c.numero_cliente.replace(/[^\d]/g, '').includes(q)) return false
      return true
    })
  }, [conversaciones, busqueda, filtro])

  return (
    <div className="wa-lista">
      <header className="wa-lista-cabecera">
        <h1 className="wa-lista-titulo">Conversaciones</h1>
        <p className="wa-lista-subtitulo">
          Aira IA responde sola 24/7. Abre un chat para ver el historial o tomar el control.
        </p>

        <div className="wa-buscador">
          <Search size={15} aria-hidden className="wa-buscador-icono" />
          <input
            className="wa-buscador-input"
            type="search"
            inputMode="tel"
            placeholder="Buscar por número…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar conversación por número"
          />
        </div>

        <div className="wa-filtros" role="tablist" aria-label="Filtrar por estado">
          {FILTROS.map((f) => (
            <button
              key={f.clave}
              type="button"
              role="tab"
              aria-selected={filtro === f.clave}
              className={`wa-filtro-chip${filtro === f.clave ? ' wa-filtro-chip--activo' : ''}`}
              onClick={() => setFiltro(f.clave)}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>
      </header>

      <div className="wa-lista-cuerpo">
        {cargando && <Cargando mensaje="Cargando conversaciones…" />}

        {!cargando && !!error && (
          <div style={{ padding: 'var(--espacio-md)' }}>
            <BannerAlerta
              variante="error"
              titulo="No se pudieron cargar las conversaciones"
              mensaje="Revisa tu conexión e intenta de nuevo."
            />
          </div>
        )}

        {!cargando && !error && filtradas.length === 0 && (
          <Vacio
            icono={<MessageSquare size={28} />}
            titulo={conversaciones.length === 0 ? 'Sin conversaciones aún' : 'Sin coincidencias'}
            mensaje={
              conversaciones.length === 0
                ? 'Cuando un cliente escriba a tu WhatsApp, la conversación aparecerá aquí.'
                : busqueda
                  ? `Ningún número coincide con "${formatearTelefono(busqueda)}".`
                  : 'No hay conversaciones con ese estado.'
            }
          />
        )}

        {!cargando && !error && filtradas.length > 0 && (
          <ul className="wa-item-lista">
            {filtradas.map((c) => (
              <li key={c.id}>
                <ItemConversacion
                  conversacion={c}
                  activa={c.id === idActiva}
                  onSeleccionar={onSeleccionar}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
