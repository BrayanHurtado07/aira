import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { obtenerMensajes, registrarMensaje } from '../servicios/servicio-canal-whatsapp'
import type { Mensaje } from '../contratos/tipos'

// Hilo de mensajes de una conversación + envío de respuesta manual del negocio.
// Refresca cada 10s para reflejar lo que Aira IA (el bot) va respondiendo en vivo.
export function usarMensajes(conversacionId: string | undefined) {
  const clienteConsulta = useQueryClient()

  const consulta = useQuery<Mensaje[]>({
    queryKey: ['mensajes', conversacionId],
    queryFn: () => obtenerMensajes(conversacionId!),
    enabled: Boolean(conversacionId),
    refetchInterval: 10_000,
  })

  const mutacion = useMutation({
    mutationFn: (contenido: string) =>
      registrarMensaje({
        conversacion_id: conversacionId!,
        contenido,
        tipo: 'TEXTO',
        direccion: 'SALIDA',
      }),
    onSuccess: () => {
      clienteConsulta.invalidateQueries({ queryKey: ['mensajes', conversacionId] })
    },
  })

  return {
    mensajes: consulta.data ?? [],
    cargando: consulta.isLoading,
    error: consulta.error,
    enviar: mutacion.mutate,
    enviando: mutacion.isPending,
    errorEnviar: mutacion.error,
  }
}
