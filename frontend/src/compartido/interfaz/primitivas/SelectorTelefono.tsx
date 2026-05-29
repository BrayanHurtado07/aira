import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'

// ── Catálogo de países con reglas de validación ───────────────────────────────

export type PaisTelefono = {
  codigo: string
  bandera: string
  nombre: string
  prefijo: string
  /** Dígitos mínimos del número nacional (sin prefijo) */
  minDigitos: number
  /** Dígitos máximos del número nacional (sin prefijo) */
  maxDigitos: number
  /** Hint que se muestra al usuario, p.ej. "9 dígitos · 9XX XXX XXX" */
  formato: string
}

export const PAISES_TELEFONO: PaisTelefono[] = [
  { codigo: 'PE', bandera: '🇵🇪', nombre: 'Perú',           prefijo: '+51',  minDigitos: 9,  maxDigitos: 9,  formato: '9 dígitos · 9XX XXX XXX' },
  { codigo: 'AR', bandera: '🇦🇷', nombre: 'Argentina',       prefijo: '+54',  minDigitos: 10, maxDigitos: 11, formato: '10-11 dígitos' },
  { codigo: 'BO', bandera: '🇧🇴', nombre: 'Bolivia',         prefijo: '+591', minDigitos: 8,  maxDigitos: 8,  formato: '8 dígitos' },
  { codigo: 'BR', bandera: '🇧🇷', nombre: 'Brasil',          prefijo: '+55',  minDigitos: 10, maxDigitos: 11, formato: '10-11 dígitos' },
  { codigo: 'CL', bandera: '🇨🇱', nombre: 'Chile',           prefijo: '+56',  minDigitos: 9,  maxDigitos: 9,  formato: '9 dígitos · 9XXXXXXXX' },
  { codigo: 'CO', bandera: '🇨🇴', nombre: 'Colombia',        prefijo: '+57',  minDigitos: 10, maxDigitos: 10, formato: '10 dígitos · 3XX XXX XXXX' },
  { codigo: 'CR', bandera: '🇨🇷', nombre: 'Costa Rica',      prefijo: '+506', minDigitos: 8,  maxDigitos: 8,  formato: '8 dígitos · XXXX XXXX' },
  { codigo: 'CU', bandera: '🇨🇺', nombre: 'Cuba',            prefijo: '+53',  minDigitos: 8,  maxDigitos: 8,  formato: '8 dígitos' },
  { codigo: 'DO', bandera: '🇩🇴', nombre: 'Rep. Dominicana', prefijo: '+1',   minDigitos: 10, maxDigitos: 10, formato: '10 dígitos · 809/829/849-XXX-XXXX' },
  { codigo: 'EC', bandera: '🇪🇨', nombre: 'Ecuador',         prefijo: '+593', minDigitos: 9,  maxDigitos: 9,  formato: '9 dígitos · 09XXXXXXX' },
  { codigo: 'ES', bandera: '🇪🇸', nombre: 'España',          prefijo: '+34',  minDigitos: 9,  maxDigitos: 9,  formato: '9 dígitos · 6XX/7XX XXX XXX' },
  { codigo: 'GT', bandera: '🇬🇹', nombre: 'Guatemala',       prefijo: '+502', minDigitos: 8,  maxDigitos: 8,  formato: '8 dígitos · XXXX XXXX' },
  { codigo: 'HN', bandera: '🇭🇳', nombre: 'Honduras',        prefijo: '+504', minDigitos: 8,  maxDigitos: 8,  formato: '8 dígitos · XXXX XXXX' },
  { codigo: 'MX', bandera: '🇲🇽', nombre: 'México',          prefijo: '+52',  minDigitos: 10, maxDigitos: 10, formato: '10 dígitos · 55 XXXX XXXX' },
  { codigo: 'NI', bandera: '🇳🇮', nombre: 'Nicaragua',       prefijo: '+505', minDigitos: 8,  maxDigitos: 8,  formato: '8 dígitos · 8XXX XXXX' },
  { codigo: 'PA', bandera: '🇵🇦', nombre: 'Panamá',          prefijo: '+507', minDigitos: 7,  maxDigitos: 8,  formato: '7-8 dígitos' },
  { codigo: 'PY', bandera: '🇵🇾', nombre: 'Paraguay',        prefijo: '+595', minDigitos: 9,  maxDigitos: 9,  formato: '9 dígitos · 09X XXX XXX' },
  { codigo: 'SV', bandera: '🇸🇻', nombre: 'El Salvador',     prefijo: '+503', minDigitos: 8,  maxDigitos: 8,  formato: '8 dígitos · XXXX XXXX' },
  { codigo: 'US', bandera: '🇺🇸', nombre: 'EE.UU.',          prefijo: '+1',   minDigitos: 10, maxDigitos: 10, formato: '10 dígitos · (XXX) XXX-XXXX' },
  { codigo: 'UY', bandera: '🇺🇾', nombre: 'Uruguay',         prefijo: '+598', minDigitos: 8,  maxDigitos: 9,  formato: '8-9 dígitos · 09X XXX XXX' },
  { codigo: 'VE', bandera: '🇻🇪', nombre: 'Venezuela',       prefijo: '+58',  minDigitos: 10, maxDigitos: 10, formato: '10 dígitos · 04XX XXX XXXX' },
]

const PAIS_POR_DEFECTO = PAISES_TELEFONO[0] // Perú

function normalizarBusqueda(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function soloDigitos(s: string): string {
  return s.replace(/\D/g, '')
}

function descomponerValor(valor: string): { pais: PaisTelefono; numero: string } {
  if (!valor) return { pais: PAIS_POR_DEFECTO, numero: '' }
  // ordenar por prefijo más largo primero para evitar falsos positivos (+1 vs +591)
  const ordenados = [...PAISES_TELEFONO].sort((a, b) => b.prefijo.length - a.prefijo.length)
  for (const p of ordenados) {
    if (valor.startsWith(p.prefijo + ' ') || valor.startsWith(p.prefijo)) {
      const numero = valor.startsWith(p.prefijo + ' ')
        ? valor.slice(p.prefijo.length + 1)
        : valor.slice(p.prefijo.length)
      return { pais: p, numero }
    }
  }
  return { pais: PAIS_POR_DEFECTO, numero: valor }
}

function validarNumero(numero: string, pais: PaisTelefono): string | null {
  const digitos = soloDigitos(numero)
  if (!digitos) return null // vacío → no mostrar error (campo opcional)
  if (digitos.length < pais.minDigitos)
    return `Mínimo ${pais.minDigitos} dígitos (${pais.formato})`
  if (digitos.length > pais.maxDigitos)
    return `Máximo ${pais.maxDigitos} dígitos (${pais.formato})`
  return null
}

// ── Interfaz ──────────────────────────────────────────────────────────────────

interface PropsSelectorTelefono {
  valor: string
  alCambiar: (telefonoCompleto: string) => void
  error?: boolean
  deshabilitado?: boolean
  id?: string
  placeholder?: string
}

// ── Componente ────────────────────────────────────────────────────────────────

export function SelectorTelefono({
  valor,
  alCambiar,
  error = false,
  deshabilitado = false,
  id,
}: PropsSelectorTelefono) {
  const { pais: paisInicial, numero: numeroInicial } = descomponerValor(valor)
  const [paisSeleccionado, setPaisSeleccionado] = useState<PaisTelefono>(paisInicial)
  const [numero, setNumero] = useState(numeroInicial)
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [tocado, setTocado] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const inputBusquedaRef = useRef<HTMLInputElement>(null)

  // Sincronizar desde prop externa
  useEffect(() => {
    const { pais, numero: num } = descomponerValor(valor)
    setPaisSeleccionado(pais)
    setNumero(num)
  }, [valor])

  // Cerrar al clic exterior
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false)
        setBusqueda('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Enfocar búsqueda al abrir
  useEffect(() => {
    if (abierto) setTimeout(() => inputBusquedaRef.current?.focus(), 50)
  }, [abierto])

  const paisesFiltrados = busqueda
    ? PAISES_TELEFONO.filter((p) => {
        const q = normalizarBusqueda(busqueda)
        return (
          normalizarBusqueda(p.nombre).includes(q) ||
          p.prefijo.includes(q) ||
          p.codigo.toLowerCase().includes(q)
        )
      })
    : PAISES_TELEFONO

  const seleccionarPais = (p: PaisTelefono) => {
    setPaisSeleccionado(p)
    setAbierto(false)
    setBusqueda('')
    setTocado(false)
    const telefonoCompleto = numero ? `${p.prefijo} ${numero.trim()}` : ''
    alCambiar(telefonoCompleto)
  }

  const cambiarNumero = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir SOLO dígitos (filtrar letras y símbolos en tiempo real)
    const soloNum = e.target.value.replace(/[^\d]/g, '')
    // Respetar límite de dígitos del país
    if (soloNum.length > paisSeleccionado.maxDigitos) return
    setNumero(soloNum)
    const telefonoCompleto = soloNum ? `${paisSeleccionado.prefijo} ${soloNum}` : ''
    alCambiar(telefonoCompleto)
  }

  const errorValidacion = tocado ? validarNumero(numero, paisSeleccionado) : null
  const digitosActuales = soloDigitos(numero).length
  const mostrarContador = !!numero && !abierto
  const dentroDelRango =
    digitosActuales >= paisSeleccionado.minDigitos &&
    digitosActuales <= paisSeleccionado.maxDigitos

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3125rem' }}>
      <div
        ref={contenedorRef}
        className={[
          'sel-telefono-wrapper',
          error || errorValidacion ? 'sel-telefono-wrapper--error' : '',
        ].filter(Boolean).join(' ')}
      >
        {/* Botón prefijo */}
        <button
          type="button"
          disabled={deshabilitado}
          onClick={() => setAbierto((v) => !v)}
          className={['sel-telefono-prefijo', abierto ? 'sel-telefono-prefijo--abierto' : ''].filter(Boolean).join(' ')}
          aria-haspopup="listbox"
          aria-expanded={abierto}
        >
          <span className="sel-telefono-bandera">{paisSeleccionado.bandera}</span>
          <span className="sel-telefono-codigo">{paisSeleccionado.prefijo}</span>
          <ChevronDown
            size={12}
            style={{
              color: 'var(--color-texto-suave)',
              transition: 'transform 150ms',
              transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0,
            }}
          />
        </button>

        {/* Input de número */}
        <input
          id={id}
          type="tel"
          value={numero}
          onChange={cambiarNumero}
          onBlur={() => { if (numero) setTocado(true) }}
          disabled={deshabilitado}
          placeholder={`Ej: ${paisSeleccionado.formato.split('·')[0].trim()}`}
          className="sel-telefono-input"
          autoComplete="tel-national"
        />

        {/* Contador de dígitos */}
        {mostrarContador && (
          <span
            className={['sel-telefono-contador', dentroDelRango ? 'sel-telefono-contador--ok' : 'sel-telefono-contador--mal'].filter(Boolean).join(' ')}
          >
            {digitosActuales}/{paisSeleccionado.maxDigitos}
          </span>
        )}

        {/* Dropdown de países */}
        {abierto && (
          <div className="sel-telefono-dropdown" role="listbox">
            <div className="sel-telefono-busqueda-wrap">
              <Search size={12} style={{ color: 'var(--color-texto-suave)', flexShrink: 0 }} />
              <input
                ref={inputBusquedaRef}
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar país…"
                className="sel-telefono-busqueda-input"
                onKeyDown={(e) => { if (e.key === 'Escape') { setAbierto(false); setBusqueda('') } }}
              />
            </div>
            <ul className="sel-telefono-lista">
              {paisesFiltrados.length === 0 ? (
                <li className="sel-telefono-vacio">Sin resultados</li>
              ) : (
                paisesFiltrados.map((p) => (
                  <li key={p.codigo}>
                    <button
                      type="button"
                      onClick={() => seleccionarPais(p)}
                      className={[
                        'sel-telefono-opcion',
                        p.codigo === paisSeleccionado.codigo ? 'sel-telefono-opcion--seleccionada' : '',
                      ].filter(Boolean).join(' ')}
                      role="option"
                      aria-selected={p.codigo === paisSeleccionado.codigo}
                    >
                      <span className="sel-telefono-bandera">{p.bandera}</span>
                      <span className="sel-telefono-opcion-nombre">{p.nombre}</span>
                      <span className="sel-telefono-opcion-prefijo">{p.prefijo}</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-texto-suave)', flexShrink: 0 }}>
                        {p.minDigitos === p.maxDigitos ? `${p.minDigitos}d` : `${p.minDigitos}-${p.maxDigitos}d`}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Hint de formato (cuando no hay error aún) */}
      {!errorValidacion && !tocado && numero && (
        <span className="sel-telefono-hint">
          {paisSeleccionado.formato}
        </span>
      )}

      {/* Error de validación */}
      {errorValidacion && (
        <span className="sel-telefono-error-msg">
          {errorValidacion}
        </span>
      )}
    </div>
  )
}
