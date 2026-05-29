import { usarAlmacenSesion } from '@/plataforma/identidad/almacen-sesion';
import { ErrorHTTP, ErrorNoAutorizado, ErrorSinConexion } from './errores';

const BASE_URL = '/api';

async function ejecutarSolicitud<T>(
  metodo: string,
  ruta: string,
  cuerpo?: unknown,
): Promise<T> {
  const sesion = usarAlmacenSesion.getState().sesion;

  const cabeceras: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (sesion?.token) {
    cabeceras['Authorization'] = `Bearer ${sesion.token}`;
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorSinConexion();
  }

  if (respuesta.status === 401) {
    usarAlmacenSesion.getState().limpiarSesion();
    throw new ErrorNoAutorizado();
  }

  const cuerpoRespuesta = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new ErrorHTTP(
      cuerpoRespuesta.error ?? 'error_desconocido',
      respuesta.status,
      cuerpoRespuesta.mensaje ?? 'Error en la solicitud',
    );
  }

  // El backend devuelve {exito, datos?}.
  // Si la clave "datos" existe (incluso como null) se extrae; si no, se devuelve la respuesta tal cual.
  const rawDatos = cuerpoRespuesta?.datos;
  const datos = rawDatos !== undefined ? rawDatos : cuerpoRespuesta;
  return datos as T;
}

export const clienteHttp = {
  get: <T>(ruta: string) => ejecutarSolicitud<T>('GET', ruta),
  post: <T>(ruta: string, cuerpo?: unknown) => ejecutarSolicitud<T>('POST', ruta, cuerpo),
  put: <T>(ruta: string, cuerpo?: unknown) => ejecutarSolicitud<T>('PUT', ruta, cuerpo),
  patch: <T>(ruta: string, cuerpo?: unknown) => ejecutarSolicitud<T>('PATCH', ruta, cuerpo),
  delete: <T>(ruta: string) => ejecutarSolicitud<T>('DELETE', ruta),
};
