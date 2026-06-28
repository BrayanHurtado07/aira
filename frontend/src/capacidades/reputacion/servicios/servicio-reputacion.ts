import { clienteHttp } from '@/integraciones/http/cliente'
import type { EstadoResena, Resena } from '../contratos/tipos'

// listarResenas obtiene las reseñas de la empresa, opcionalmente filtradas por estado.
export const listarResenas = (estado?: EstadoResena | ''): Promise<Resena[]> => {
  const consulta = estado ? `?estado=${estado}` : ''
  return clienteHttp.get<Resena[]>(`/resenas${consulta}`)
}

// publicarResena marca una reseña como PUBLICADA (visible al público).
export const publicarResena = (resenaId: string): Promise<void> =>
  clienteHttp.post<void>(`/resenas/${resenaId}/publicar`)

// moderarResena oculta una reseña marcándola como MODERADA.
export const moderarResena = (resenaId: string): Promise<void> =>
  clienteHttp.post<void>(`/resenas/${resenaId}/moderar`)
