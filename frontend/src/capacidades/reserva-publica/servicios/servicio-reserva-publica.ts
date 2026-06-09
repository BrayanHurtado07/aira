import type { Barbero, Servicio, Sucursal, BloqueDisponibilidad, SolicitudReservaPublica, RespuestaReservaPublica } from '../contratos/tipos'

const BASE = '/api/publico'

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return json.datos as T
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error ?? `HTTP ${res.status}`)
  }
  const json = await res.json()
  return json.datos as T
}

// Las rutas públicas aceptan slug legible ("mi-barberia") o UUID de empresa.
export const obtenerServiciosPublicos = (slug: string) =>
  get<Servicio[]>(`${BASE}/empresas/${slug}/servicios`)

export const obtenerBarberosPublicos = (slug: string) =>
  get<Barbero[]>(`${BASE}/empresas/${slug}/barberos`)

export const obtenerSucursalesPublicas = (slug: string) =>
  get<Sucursal[]>(`${BASE}/empresas/${slug}/sucursales`)

export const obtenerSlotsPublicos = (barberoID: string, servicioID: string, fecha: string) =>
  get<BloqueDisponibilidad[]>(
    `${BASE}/agenda/slots?barbero_id=${barberoID}&servicio_id=${servicioID}&fecha=${fecha}`,
  )

export const crearReservaPublica = (solicitud: SolicitudReservaPublica) =>
  post<RespuestaReservaPublica>(`${BASE}/reservas`, solicitud)
