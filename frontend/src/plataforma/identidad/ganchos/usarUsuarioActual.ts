import { usarAlmacenSesion } from '../almacen-sesion';

export function usarUsuarioActual() {
  const sesion = usarAlmacenSesion((s) => s.sesion);
  return {
    id: sesion?.usuarioId ?? '',
    nombre: sesion?.nombre ?? '',
    barberiaId: sesion?.barberiaId ?? '',
    sedeId: sesion?.sedeId ?? '',
    periodoId: sesion?.periodoId ?? '',
  };
}
