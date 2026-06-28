import { useQuery } from '@tanstack/react-query';
import { obtenerConversaciones } from '../servicios/servicio-canal-whatsapp';

// Sin tracking de "leído" en el backend todavía: el badge refleja el total de
// conversaciones activas (una señal REAL, no un mock). Cuando el backend exponga
// un conteo de no-leídos, se cambia la fuente aquí sin tocar al consumidor.
export function usarMensajesNoLeidos() {
  const { data } = useQuery({
    queryKey: ['conversaciones'],
    queryFn: obtenerConversaciones,
    staleTime: 30_000,
  });
  return { total: data?.length ?? 0 };
}
