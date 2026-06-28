import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Star, Eye, EyeOff, MessageSquareQuote } from 'lucide-react'
import { GuardiaCapacidad } from '@/plataforma/activacion/GuardiaCapacidad'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Selector } from '@/compartido/interfaz/primitivas/Selector'
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion'
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia'
import { usarResenas, usarModeracionResena } from '../ganchos/usarResenas'
import type { EstadoResena, Resena } from '../contratos/tipos'

// ── Utilidades de presentación ────────────────────────────────────────────────

const ESTADO_INSIGNIA: Record<EstadoResena, 'advertencia' | 'exito' | 'neutral'> = {
  PENDIENTE: 'advertencia',
  PUBLICADA: 'exito',
  MODERADA: 'neutral',
}

const ESTADO_ETIQUETA: Record<EstadoResena, string> = {
  PENDIENTE: 'Pendiente',
  PUBLICADA: 'Publicada',
  MODERADA: 'Moderada',
}

const OPCIONES_FILTRO = [
  { valor: 'TODAS', etiqueta: 'Todos los estados' },
  { valor: 'PENDIENTE', etiqueta: 'Pendientes' },
  { valor: 'PUBLICADA', etiqueta: 'Publicadas' },
  { valor: 'MODERADA', etiqueta: 'Moderadas' },
]

function formatearFecha(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function Estrellas({ puntaje }: { puntaje: number }) {
  const total = 5
  const activas = Math.max(0, Math.min(total, Math.round(puntaje)))
  return (
    <span
      style={{ display: 'inline-flex', gap: '0.1rem', alignItems: 'center' }}
      title={`${activas} de ${total}`}
      aria-label={`${activas} de ${total} estrellas`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <Star
          key={i}
          size={14}
          style={{
            color: i < activas ? 'var(--color-advertencia)' : 'var(--color-texto-muted)',
            fill: i < activas ? 'var(--color-advertencia)' : 'none',
          }}
        />
      ))}
    </span>
  )
}

// ── Contenido principal ───────────────────────────────────────────────────────

function ContenidoReputacion() {
  const [filtro, setFiltro] = useState('TODAS')
  const estado = (filtro === 'TODAS' ? '' : filtro) as EstadoResena | ''

  const { resenas, cargando, error } = usarResenas(estado)
  const { publicar, moderar, publicando, moderando } = usarModeracionResena()

  const [aModerar, setAModerar] = useState<Resena | null>(null)

  function manejarPublicar(resena: Resena) {
    publicar(resena.id, {
      onSuccess: () => toast.success('Reseña publicada'),
      onError: () => toast.error('No se pudo publicar la reseña'),
    })
  }

  function confirmarModeracion() {
    if (!aModerar) return
    const resena = aModerar
    moderar(resena.id, {
      onSuccess: () => {
        toast.success('Reseña moderada')
        setAModerar(null)
      },
      onError: () => {
        toast.error('No se pudo moderar la reseña')
        setAModerar(null)
      },
    })
  }

  return (
    <motion.div
      className="pagina-reputacion"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-lg)' }}
    >
      <EncabezadoPagina
        titulo="Reputación"
        descripcion="Modera y publica las reseñas que dejan tus clientes sobre los barberos"
      />

      <SeccionTarjeta
        titulo="Reseñas"
        icono={<MessageSquareQuote size={14} />}
        colorIcono="var(--color-advertencia-suave)"
        sinPaddingCuerpo
        acciones={
          <div style={{ width: '13rem' }}>
            <Selector valor={filtro} alCambiar={setFiltro} opciones={OPCIONES_FILTRO} />
          </div>
        }
      >
        {error ? (
          <div
            style={{
              padding: 'var(--espacio-lg)',
              textAlign: 'center',
              color: 'var(--color-texto-suave)',
              fontSize: 'var(--tamano-sm)',
            }}
          >
            No se pudieron cargar las reseñas. Intenta nuevamente más tarde.
          </div>
        ) : (
          <TablaDatos<Resena>
            columnas={[
              {
                clave: 'barbero_nombre',
                etiqueta: 'Barbero',
                render: (r) => (
                  <span style={{ fontWeight: 600, color: 'var(--color-texto)' }}>
                    {r.barbero_nombre || '—'}
                  </span>
                ),
              },
              {
                clave: 'puntaje_barbero',
                etiqueta: 'Calificación',
                render: (r) => <Estrellas puntaje={r.puntaje_barbero} />,
              },
              {
                clave: 'comentario',
                etiqueta: 'Comentario',
                render: (r) => (
                  <span style={{ color: 'var(--color-texto-suave)', fontSize: 'var(--tamano-sm)' }}>
                    {r.comentario || '—'}
                  </span>
                ),
              },
              {
                clave: 'estado',
                etiqueta: 'Estado',
                render: (r) => (
                  <Insignia variante={ESTADO_INSIGNIA[r.estado]}>
                    {ESTADO_ETIQUETA[r.estado] ?? r.estado}
                  </Insignia>
                ),
              },
              {
                clave: 'creado_en',
                etiqueta: 'Fecha',
                render: (r) => (
                  <span style={{ color: 'var(--color-texto-suave)', fontSize: 'var(--tamano-sm)' }}>
                    {formatearFecha(r.creado_en)}
                  </span>
                ),
              },
            ]}
            filas={resenas}
            obtenerClave={(r) => r.id}
            cargando={cargando}
            vacioIcono={<Star size={28} />}
            vacioTitulo="Sin reseñas"
            vacioMensaje="Aún no hay reseñas para el filtro seleccionado."
            acciones={(r) => (
              <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                {r.estado !== 'PUBLICADA' && (
                  <Boton
                    variante="primario"
                    tamano="sm"
                    type="button"
                    icono={<Eye size={13} />}
                    cargando={publicando}
                    onClick={() => manejarPublicar(r)}
                  >
                    Publicar
                  </Boton>
                )}
                {r.estado !== 'MODERADA' && (
                  <Boton
                    variante="secundario"
                    tamano="sm"
                    type="button"
                    icono={<EyeOff size={13} />}
                    onClick={() => setAModerar(r)}
                  >
                    Moderar
                  </Boton>
                )}
              </div>
            )}
          />
        )}
      </SeccionTarjeta>

      <DialogoConfirmacion
        abierto={aModerar !== null}
        titulo="¿Moderar esta reseña?"
        descripcion={
          aModerar
            ? `La reseña de "${aModerar.barbero_nombre || 'barbero'}" dejará de ser visible al público.`
            : ''
        }
        variante="peligro"
        textoConfirmar="Moderar"
        cargando={moderando}
        alConfirmar={confirmarModeracion}
        alCancelar={() => setAModerar(null)}
      />
    </motion.div>
  )
}

export function PaginaReputacion() {
  return (
    <GuardiaCapacidad codigo="REPUTACION">
      <ContenidoReputacion />
    </GuardiaCapacidad>
  )
}
