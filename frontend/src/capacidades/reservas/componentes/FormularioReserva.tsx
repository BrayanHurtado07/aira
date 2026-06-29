import React, { useCallback, useState } from 'react'
import { Boton }         from '@/compartido/interfaz/primitivas/Boton'
import { Campo }         from '@/compartido/interfaz/primitivas/Campo'
import { Selector }      from '@/compartido/interfaz/primitivas/Selector'
import { SelectorSlot }  from '@/compartido/interfaz/primitivas/SelectorSlot'
import { BannerAlerta }  from '@/compartido/interfaz/primitivas/BannerAlerta'
import { BuscadorCliente } from '@/capacidades/reservas/componentes/BuscadorCliente'
import { usarBarberos }    from '@/capacidades/agenda/ganchos/usarBarberos'
import { usarServiciosBarbero } from '@/capacidades/agenda/ganchos/usarServiciosBarbero'
import type { SolicitudRegistrarReserva, OrigenReserva } from '@/capacidades/reservas/contratos/tipos'

interface PropsFormularioReserva {
  onSubmit: (solicitud: SolicitudRegistrarReserva) => void
  enviando: boolean
  error?: string | null
  /** Valores de arranque (modo edición). Si se omite, el formulario nace vacío. */
  valoresIniciales?: Partial<EstadoFormulario>
  /** Texto del botón de envío (default "Registrar reserva"). */
  textoEnviar?: string
}

interface EstadoFormulario {
  cliente_id: string
  barbero_id: string
  servicio_id: string
  sucursal_id: string
  fecha_hora_inicio: string
  origen: OrigenReserva
}

const ORIGENES: { valor: OrigenReserva; etiqueta: string }[] = [
  { valor: 'MANUAL',   etiqueta: 'Presencial' },
  { valor: 'WHATSAPP', etiqueta: 'WhatsApp' },
  { valor: 'WEB',      etiqueta: 'Web' },
]

const ESTADO_INICIAL: EstadoFormulario = {
  cliente_id: '',
  barbero_id: '',
  servicio_id: '',
  sucursal_id: '',
  fecha_hora_inicio: '',
  origen: 'MANUAL',
}

export function FormularioReserva({ onSubmit, enviando, error, valoresIniciales, textoEnviar = 'Registrar reserva' }: PropsFormularioReserva) {
  const [formulario, setFormulario] = useState<EstadoFormulario>(() => ({ ...ESTADO_INICIAL, ...valoresIniciales }))
  const [errores, setErrores] = useState<Record<string, string>>({})

  const { barberos, cargando: cargandoBarberos } = usarBarberos()
  const { servicios, cargando: cargandoServicios } = usarServiciosBarbero(
    formulario.barbero_id || undefined,
  )

  const opcionesBarberos = barberos.map((b) => ({
    valor: b.id,
    etiqueta: b.especialidad ? `${b.nombre} · ${b.especialidad}` : b.nombre,
  }))

  const opcionesServicios = servicios.map((s) => ({
    valor: s.id,
    etiqueta: `${s.nombre} · ${s.duracion_minutos} min`,
  }))

  const validar = (): boolean => {
    const nuevos: Record<string, string> = {}
    if (!formulario.cliente_id) nuevos.cliente_id = 'Selecciona o crea un cliente'
    if (!formulario.barbero_id) nuevos.barbero_id = 'Selecciona un barbero'
    if (!formulario.servicio_id) nuevos.servicio_id = 'Selecciona un servicio'
    if (!formulario.fecha_hora_inicio) nuevos.fecha_hora_inicio = 'Selecciona la fecha y hora'
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validar()) return
    onSubmit({
      cliente_id: formulario.cliente_id,
      barbero_id: formulario.barbero_id,
      servicio_id: formulario.servicio_id,
      sucursal_id: formulario.sucursal_id || undefined,
      origen: formulario.origen,
      // Convertir "YYYY-MM-DDTHH:MM" → ISO string UTC
      fecha_hora_inicio: new Date(formulario.fecha_hora_inicio).toISOString(),
    })
  }

  const alCambiarSucursal = useCallback((sucursalId: string) => {
    setFormulario((p) => ({ ...p, sucursal_id: sucursalId }))
  }, [])

  return (
    <form
      onSubmit={manejarEnvio}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-lg)' }}
    >
      {/* ── Cliente ── */}
      <BuscadorCliente
        valor={formulario.cliente_id}
        alCambiar={(id) => {
          setFormulario((p) => ({ ...p, cliente_id: id }))
          setErrores((p) => ({ ...p, cliente_id: '' }))
        }}
        error={errores.cliente_id}
      />

      {/* ── Barbero ── */}
      <Campo etiqueta="Barbero" requerido error={errores.barbero_id}>
        <Selector
          valor={formulario.barbero_id}
          alCambiar={(v) => {
            // Al cambiar barbero → limpiar servicio y slot
            setFormulario((p) => ({
              ...p,
              barbero_id: v,
              servicio_id: '',
              sucursal_id: '',
              fecha_hora_inicio: '',
            }))
            setErrores((p) => ({ ...p, barbero_id: '' }))
          }}
          opciones={opcionesBarberos}
          placeholder={cargandoBarberos ? 'Cargando barberos…' : 'Seleccionar barbero'}
          cargando={cargandoBarberos}
          error={!!errores.barbero_id}
        />
      </Campo>

      {/* ── Servicio ── */}
      <Campo etiqueta="Servicio" requerido error={errores.servicio_id}>
        <Selector
          valor={formulario.servicio_id}
          alCambiar={(v) => {
            // Al cambiar servicio → limpiar slot
            setFormulario((p) => ({
              ...p,
              servicio_id: v,
              sucursal_id: '',
              fecha_hora_inicio: '',
            }))
            setErrores((p) => ({ ...p, servicio_id: '' }))
          }}
          opciones={opcionesServicios}
          placeholder={
            !formulario.barbero_id
              ? 'Selecciona un barbero primero'
              : cargandoServicios
                ? 'Cargando servicios…'
                : opcionesServicios.length === 0
                  ? 'Sin servicios asignados'
                  : 'Seleccionar servicio'
          }
          deshabilitado={!formulario.barbero_id}
          cargando={cargandoServicios}
          error={!!errores.servicio_id}
        />
      </Campo>

      {/* ── Fecha y hora (slots disponibles) ── */}
      <Campo etiqueta="Fecha y hora" requerido error={errores.fecha_hora_inicio}>
        <SelectorSlot
          barberoId={formulario.barbero_id}
          servicioId={formulario.servicio_id}
          valor={formulario.fecha_hora_inicio}
          alCambiar={(v) => {
            setFormulario((p) => ({ ...p, fecha_hora_inicio: v }))
            setErrores((p) => ({ ...p, fecha_hora_inicio: '' }))
          }}
          alCambiarSucursal={alCambiarSucursal}
          error={!!errores.fecha_hora_inicio}
        />
      </Campo>

      {/* ── Canal de origen ── */}
      <Campo etiqueta="Canal de origen">
        <Selector
          valor={formulario.origen}
          alCambiar={(v) => setFormulario((p) => ({ ...p, origen: v as OrigenReserva }))}
          opciones={ORIGENES}
        />
      </Campo>

      {/* ── Error global ── */}
      {error && (
        <BannerAlerta
          variante="error"
          titulo="No se pudo registrar la reserva"
          mensaje={error}
        />
      )}

      <Boton
        type="submit"
        variante="primario"
        cargando={enviando}
        style={{ marginTop: '0.25rem' }}
      >
        {textoEnviar}
      </Boton>
    </form>
  )
}
