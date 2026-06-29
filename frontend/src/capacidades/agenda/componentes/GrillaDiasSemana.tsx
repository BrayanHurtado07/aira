import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Clock, Plus, Trash2, X } from 'lucide-react'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta'
import { usarDisponibilidadBarbero } from '@/capacidades/agenda/ganchos/usarDisponibilidadBarbero'

// ── Constantes ────────────────────────────────────────────────────────────────

const DIAS_SEMANA = [
  { valor: 1, abrev: 'Lun', etiqueta: 'Lunes' },
  { valor: 2, abrev: 'Mar', etiqueta: 'Martes' },
  { valor: 3, abrev: 'Mié', etiqueta: 'Miércoles' },
  { valor: 4, abrev: 'Jue', etiqueta: 'Jueves' },
  { valor: 5, abrev: 'Vie', etiqueta: 'Viernes' },
  { valor: 6, abrev: 'Sáb', etiqueta: 'Sábado' },
  { valor: 0, abrev: 'Dom', etiqueta: 'Domingo' },
]

// ── Componente ────────────────────────────────────────────────────────────────

interface PropsGrillaDiasSemana {
  barberoId: string
}

/**
 * GrillaDiasSemana — selector de días con accordion de bloques horarios.
 * Encapsula la lógica de disponibilidad semanal: pills de días + lista de bloques + form agregar.
 * Reutilizable en PaginaGestionBarberos y futuras pantallas de configuración de sede.
 */
export function GrillaDiasSemana({ barberoId }: PropsGrillaDiasSemana) {
  const {
    bloques,
    cargandoBloques,
    errorCarga,
    registrar,
    registrando,
    eliminar,
    eliminando,
  } = usarDisponibilidadBarbero(barberoId)

  const [diaActivo, setDiaActivo] = useState<number | null>(null)
  const [horario, setHorario] = useState({ hora_inicio: '09:00', hora_fin: '18:00' })
  const [errorHora, setErrorHora] = useState('')

  const bloquePorDia = (dia: number) => bloques.filter((b) => b.dia_semana === dia)

  const seleccionarDia = (valor: number) => {
    setDiaActivo((prev) => (prev === valor ? null : valor))
    setErrorHora('')
  }

  const agregarBloque = async () => {
    if (diaActivo === null) return
    if (horario.hora_inicio >= horario.hora_fin) {
      setErrorHora('La hora de fin debe ser posterior a la de inicio')
      return
    }
    setErrorHora('')
    try {
      await registrar({
        barbero_id: barberoId,
        dia_semana: diaActivo,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
      })
      const dia = DIAS_SEMANA.find((d) => d.valor === diaActivo)
      toast.success('Horario registrado', {
        description: `${dia?.etiqueta} · ${horario.hora_inicio} – ${horario.hora_fin}`,
      })
      // Mantener el día activo; limpiar solo el formulario
      setHorario({ hora_inicio: '09:00', hora_fin: '18:00' })
    } catch {
      toast.error('No se pudo registrar el horario')
    }
  }

  const quitarBloque = async (id: string, inicio: string, fin: string) => {
    try {
      await eliminar(id)
      toast.success('Horario eliminado', { description: `${inicio} – ${fin}` })
    } catch {
      toast.error('No se pudo eliminar el horario')
    }
  }

  if (cargandoBloques) {
    return (
      <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)' }}>
        Cargando disponibilidad…
      </p>
    )
  }

  const diaActivoData = DIAS_SEMANA.find((d) => d.valor === diaActivo)
  const bloquesDiaActivo = diaActivo !== null ? bloquePorDia(diaActivo) : []

  return (
    <div className="grilla-dias-semana">
      {errorCarga && (
        <BannerAlerta
          variante="error"
          mensaje="No se pudo cargar la disponibilidad."
          style={{ marginBottom: 'var(--espacio-sm)' }}
        />
      )}

      {/* Fila de pills — scroll horizontal en móvil */}
      <div className="grilla-dias-pills">
        {DIAS_SEMANA.map((dia) => {
          const bloquesDia = bloquePorDia(dia.valor)
          const seleccionado = diaActivo === dia.valor
          const tieneBloques = bloquesDia.length > 0

          return (
            <button
              key={dia.valor}
              type="button"
              onClick={() => seleccionarDia(dia.valor)}
              aria-pressed={seleccionado}
              title={dia.etiqueta}
              className={[
                'grilla-dia-pill',
                seleccionado ? 'grilla-dia-pill--activo' : '',
                tieneBloques && !seleccionado ? 'grilla-dia-pill--con-bloques' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="grilla-dia-pill-abrev">{dia.abrev}</span>
              {tieneBloques && (
                <span className="grilla-dia-pill-count">{bloquesDia.length}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Panel del día seleccionado — accordion */}
      <AnimatePresence>
        {diaActivo !== null && (
          <motion.div
            key={diaActivo}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="grilla-dia-panel">
              {/* Cabecera del panel */}
              <div className="grilla-dia-panel-header">
                <span className="grilla-dia-panel-titulo">{diaActivoData?.etiqueta}</span>
                <button
                  type="button"
                  className="grilla-dia-panel-cerrar"
                  onClick={() => {
                    setDiaActivo(null)
                    setErrorHora('')
                  }}
                  aria-label="Cerrar panel del día"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Lista de bloques existentes */}
              {bloquesDiaActivo.length > 0 ? (
                <div className="grilla-dia-bloques-lista">
                  {bloquesDiaActivo.map((b) => (
                    <div key={b.id} className="grilla-dia-bloque-fila">
                      <Clock
                        size={12}
                        aria-hidden
                        style={{ color: 'var(--color-texto-suave)', flexShrink: 0 }}
                      />
                      <span className="grilla-dia-bloque-horario">
                        {b.hora_inicio} – {b.hora_fin}
                      </span>
                      <button
                        type="button"
                        className="grilla-dia-bloque-quitar"
                        onClick={() => quitarBloque(b.id, b.hora_inicio, b.hora_fin)}
                        disabled={eliminando}
                        aria-label={`Quitar bloque ${b.hora_inicio} a ${b.hora_fin}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="grilla-dia-vacio">Este día no tiene horario aún.</p>
              )}

              <hr className="grilla-dia-separador" />

              {/* Subform — agregar bloque */}
              <div className="grilla-dia-subform">
                <span className="grilla-dia-subform-etiqueta">Agregar horario</span>
                <div className="grilla-dia-subform-inputs">
                  <Campo
                    etiqueta="Desde"
                    type="time"
                    value={horario.hora_inicio}
                    onChange={(e) => {
                      setHorario((p) => ({ ...p, hora_inicio: e.target.value }))
                      setErrorHora('')
                    }}
                  />
                  <Campo
                    etiqueta="Hasta"
                    type="time"
                    value={horario.hora_fin}
                    onChange={(e) => {
                      setHorario((p) => ({ ...p, hora_fin: e.target.value }))
                      setErrorHora('')
                    }}
                  />
                  <Boton
                    type="button"
                    variante="secundario"
                    icono={<Plus size={14} />}
                    cargando={registrando}
                    onClick={agregarBloque}
                    className="grilla-dia-btn-agregar"
                  >
                    Agregar
                  </Boton>
                </div>
                {errorHora && (
                  <BannerAlerta
                    variante="advertencia"
                    mensaje={errorHora}
                    style={{ marginTop: 'var(--espacio-xs)' }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pista cuando ningún día está seleccionado */}
      {diaActivo === null && !errorCarga && (
        <p style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)' }}>
          Selecciona un día para ver o editar su horario.
        </p>
      )}
    </div>
  )
}
