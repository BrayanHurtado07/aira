import { usarAlmacenContexto } from '../almacen-contexto';

export function usarContextoActivo() {
  return usarAlmacenContexto((s) => s.contexto);
}

export function usarCambiarContexto() {
  return usarAlmacenContexto((s) => s.establecerContexto);
}
