// Helpers de presentación del canal de WhatsApp. Solo formato: nunca inventan
// datos que el backend no provee.

import type { EstadoConversacion } from '../contratos/tipos'

const ESTADO: Record<EstadoConversacion, { etiqueta: string; variante: 'exito' | 'neutral' | 'advertencia' }> = {
  ACTIVA: { etiqueta: 'Activa', variante: 'exito' },
  CERRADA: { etiqueta: 'Cerrada', variante: 'neutral' },
  EXPIRADA: { etiqueta: 'Expirada', variante: 'advertencia' },
}

export function etiquetaEstado(estado: EstadoConversacion): string {
  return ESTADO[estado]?.etiqueta ?? estado
}

export function varianteEstado(estado: EstadoConversacion): 'exito' | 'neutral' | 'advertencia' {
  return ESTADO[estado]?.variante ?? 'neutral'
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// Formatea un número de WhatsApp (E.164 sin signo, p.ej. "51999888777") a una
// forma legible: "+51 999 888 777". Si no reconoce el patrón, lo deja tal cual.
export function formatearTelefono(numero: string): string {
  const limpio = (numero ?? '').replace(/[^\d]/g, '')
  if (!limpio) return numero ?? ''
  // Perú (51) + 9 dígitos → +51 999 888 777
  if (limpio.length === 11 && limpio.startsWith('51')) {
    const n = limpio.slice(2)
    return `+51 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`
  }
  // Genérico: agrupa de a 3 desde el final, con "+" al frente.
  const grupos = limpio.replace(/(\d)(?=(\d{3})+$)/g, '$1 ')
  return `+${grupos}`
}

function mismaFecha(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// "14:30" — hora en formato 24h.
export function horaCorta(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// Etiqueta compacta para la lista: hoy → "14:30", ayer → "Ayer", resto → "23 ene".
export function etiquetaFechaRelativa(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const ahora = new Date()
  if (mismaFecha(d, ahora)) return horaCorta(iso)
  const ayer = new Date(ahora)
  ayer.setDate(ahora.getDate() - 1)
  if (mismaFecha(d, ayer)) return 'Ayer'
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}

// Separador de día dentro del hilo: "Hoy", "Ayer" o "23 ene 2026".
export function separadorDia(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const ahora = new Date()
  if (mismaFecha(d, ahora)) return 'Hoy'
  const ayer = new Date(ahora)
  ayer.setDate(ahora.getDate() - 1)
  if (mismaFecha(d, ayer)) return 'Ayer'
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

// Clave de día estable (YYYY-MM-DD local) para agrupar mensajes por jornada.
export function claveDia(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
