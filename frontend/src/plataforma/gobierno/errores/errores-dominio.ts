export const MENSAJES_ERROR: Record<string, string> = {
  identidad_no_existe: 'El usuario no existe.',
  contrasena_incorrecta: 'Contraseña incorrecta.',
  correo_ya_registrado: 'El correo ya está registrado.',
  sesion_no_existe: 'La sesión no es válida.',
  usuario_inactivo: 'El usuario está inactivo.',
  empresa_no_activa: 'La barbería no está activa.',
  sucursal_no_activa: 'La sede no está activa.',
  periodo_no_abierto: 'El período no está abierto.',
  reserva_no_confirmable: 'La reserva no puede confirmarse en su estado actual.',
  reserva_no_cancelable: 'La reserva no puede cancelarse en su estado actual.',
  reserva_no_completable: 'La reserva no puede completarse en su estado actual.',
  alcance_denegado: 'No tienes acceso a esta barbería.',
  permiso_denegado: 'No tienes permiso para esta operación.',
  operacion_fallida: 'La operación no pudo completarse.',
  error_desconocido: 'Error inesperado. Por favor intenta de nuevo.',
};

export function mensajeDeError(errorOCodigo: unknown): string {
  if (typeof errorOCodigo === 'string') {
    return MENSAJES_ERROR[errorOCodigo] ?? MENSAJES_ERROR['error_desconocido'];
  }
  if (errorOCodigo !== null && typeof errorOCodigo === 'object' && 'codigo' in errorOCodigo) {
    const codigo = (errorOCodigo as { codigo: string }).codigo;
    return MENSAJES_ERROR[codigo] ?? MENSAJES_ERROR['error_desconocido'];
  }
  return MENSAJES_ERROR['error_desconocido'];
}
