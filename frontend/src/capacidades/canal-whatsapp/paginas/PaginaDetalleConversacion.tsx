import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Cargando } from '@/compartido/interfaz/retroalimentacion/Cargando'
import { Vacio } from '@/compartido/interfaz/retroalimentacion/Vacio'
import { obtenerMensajes, registrarMensaje } from '../servicios/servicio-canal-whatsapp'
import { BurbujaMensaje } from '../componentes/BurbujaMensaje'
import { CajaRespuesta } from '../componentes/CajaRespuesta'
import type { Mensaje } from '../contratos/tipos'

export function PaginaDetalleConversacion() {
  const { conversacionId } = useParams<{ conversacionId: string }>()
  const clienteConsulta = useQueryClient()

  const { data: mensajes = [], isLoading, error } = useQuery<Mensaje[]>({
    queryKey: ['mensajes', conversacionId],
    queryFn: () => obtenerMensajes(conversacionId!),
    enabled: Boolean(conversacionId),
    refetchInterval: 10_000,
  })

  const { mutate: enviarMensaje, isPending: enviando } = useMutation({
    mutationFn: (contenido: string) =>
      registrarMensaje({
        conversacion_id: conversacionId!,
        contenido,
        tipo: 'TEXTO',
        direccion: 'SALIENTE',
      }),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['mensajes', conversacionId] })
    },
  })

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      {/* Cabecera */}
      <div
        style={{
          padding: 'var(--espacio-md)',
          borderBottom: '1px solid var(--color-borde)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--espacio-md)',
        }}
      >
        <Link
          to="/canal-whatsapp"
          style={{ color: 'var(--color-acento)', textDecoration: 'none', fontWeight: 500 }}
        >
          ← Volver
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-texto)' }}>
          Conversacion #{conversacionId?.slice(0, 8)}
        </h2>
      </div>

      {/* Area de mensajes */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--espacio-md)',
        }}
      >
        {isLoading && <Cargando />}

        {error && (
          <p style={{ color: 'red' }}>No se pudieron cargar los mensajes.</p>
        )}

        {!isLoading && mensajes.length === 0 && (
          <Vacio mensaje="No hay mensajes en esta conversacion aun." />
        )}

        {mensajes.map((mensaje) => (
          <BurbujaMensaje key={mensaje.id} mensaje={mensaje} />
        ))}
      </div>

      {/* Caja de respuesta */}
      <CajaRespuesta
        onEnviar={(contenido) => enviarMensaje(contenido)}
        enviando={enviando}
      />
    </div>
  )
}
