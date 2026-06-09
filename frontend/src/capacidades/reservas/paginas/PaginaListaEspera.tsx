import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Clock, Plus, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { Selector } from '@/compartido/interfaz/primitivas/Selector'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import { Modal } from '@/compartido/interfaz/primitivas/Modal'
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia'
import { BuscadorCliente } from '@/capacidades/reservas/componentes/BuscadorCliente'
import { usarClientes } from '@/capacidades/reservas/ganchos/usarClientes'
import { usarBarberos } from '@/capacidades/agenda/ganchos/usarBarberos'
import { usarSedes } from '@/capacidades/organizacion/ganchos/usarSedes'
import { obtenerServicios } from '@/capacidades/agenda/servicios/servicio-agenda'
import { usarListaEspera, usarIngresarListaEspera } from '../ganchos/usarListaEspera'
import type { EntradaListaEspera, EstadoListaEspera } from '../contratos/tipos'

// ── Helpers ───────────────────────────────────────────────────────────────────

function varianteEstado(estado: EstadoListaEspera): 'advertencia' | 'info' | 'exito' | 'error' {
  if (estado === 'ESPERANDO') return 'advertencia'
  if (estado === 'NOTIFICADO') return 'info'
  if (estado === 'ATENDIDO') return 'exito'
  return 'error'
}

const ETIQUETAS_ESTADO: Record<EstadoListaEspera, string> = {
  ESPERANDO: 'Esperando',
  NOTIFICADO: 'Notificado',
  ATENDIDO: 'Atendido',
  CANCELADO: 'Cancelado',
}

function formatearFecha(fechaHora: string): string {
  if (!fechaHora) return '—'
  try {
    return new Date(fechaHora).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return fechaHora }
}

// ── Modal ingresar a lista ────────────────────────────────────────────────────

const FORM_VACIO = {
  cliente_id: '',
  sucursal_id: '',
  servicio_id: '',
  barbero_id: '',
  fecha_hora_deseada: '',
}

interface PropsModalIngresar {
  abierto: boolean
  alCerrar: () => void
}

function ModalIngresarListaEspera({ abierto, alCerrar }: PropsModalIngresar) {
  const mutacionIngresar = usarIngresarListaEspera()
  const { sedes, cargando: cargandoSedes } = usarSedes()
  const { barberos, cargando: cargandoBarberos } = usarBarberos()
  const consultaServicios = useQuery({ queryKey: ['servicios'], queryFn: obtenerServicios })
  const servicios = consultaServicios.data ?? []

  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const cambiar = (campo: keyof typeof FORM_VACIO, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: '' }))
  }

  const cerrar = () => {
    setForm(FORM_VACIO)
    setErrores({})
    alCerrar()
  }

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const nuevos: Record<string, string> = {}
    if (!form.cliente_id) nuevos.cliente_id = 'Selecciona un cliente'
    if (!form.sucursal_id) nuevos.sucursal_id = 'Selecciona una sede'
    if (!form.servicio_id) nuevos.servicio_id = 'Selecciona un servicio'
    if (!form.fecha_hora_deseada) nuevos.fecha_hora_deseada = 'Selecciona la fecha deseada'
    if (Object.keys(nuevos).length > 0) { setErrores(nuevos); return }

    mutacionIngresar.mutate(
      {
        cliente_id: form.cliente_id,
        sucursal_id: form.sucursal_id,
        servicio_id: form.servicio_id,
        barbero_id: form.barbero_id || undefined,
        fecha_hora_deseada: new Date(form.fecha_hora_deseada).toISOString(),
      },
      {
        onSuccess: () => {
          toast.success('Cliente agregado a la lista de espera')
          cerrar()
        },
        onError: (err) => toast.error(mensajeDeError(err)),
      },
    )
  }

  const opcionesSedes = sedes.map((s) => ({ valor: s.id, etiqueta: s.nombre }))
  const opcionesServicios = servicios
    .filter((s) => s.estado === 'ACTIVO')
    .map((s) => ({ valor: s.id, etiqueta: `${s.nombre} — ${s.duracion_minutos} min` }))
  const opcionesBarberos = [
    { valor: '', etiqueta: 'Cualquier barbero disponible' },
    ...barberos.filter((b) => b.estado === 'ACTIVO').map((b) => ({ valor: b.id, etiqueta: b.nombre })),
  ]

  return (
    <Modal
      abierto={abierto}
      alCerrar={cerrar}
      titulo="Agregar a lista de espera"
      descripcion="El cliente será notificado cuando haya disponibilidad"
      ancho="md"
      sinCerrarAlFondo={mutacionIngresar.isPending}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={mutacionIngresar.isPending}>
            Cancelar
          </Boton>
          <Boton
            variante="primario"
            icono={<Clock size={14} />}
            cargando={mutacionIngresar.isPending}
            onClick={enviar as unknown as React.MouseEventHandler}
          >
            Agregar
          </Boton>
        </>
      }
    >
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
        {/* Cliente */}
        <BuscadorCliente
          valor={form.cliente_id}
          alCambiar={(id) => cambiar('cliente_id', id)}
          error={errores.cliente_id}
        />

        {/* Sede */}
        <Campo etiqueta="Sede" requerido error={errores.sucursal_id}>
          <Selector
            valor={form.sucursal_id}
            alCambiar={(v) => cambiar('sucursal_id', v)}
            opciones={opcionesSedes}
            placeholder="Selecciona una sede"
            cargando={cargandoSedes}
            error={!!errores.sucursal_id}
          />
        </Campo>

        {/* Servicio */}
        <Campo etiqueta="Servicio" requerido error={errores.servicio_id}>
          <Selector
            valor={form.servicio_id}
            alCambiar={(v) => cambiar('servicio_id', v)}
            opciones={opcionesServicios}
            placeholder="Selecciona un servicio"
            cargando={consultaServicios.isLoading}
            error={!!errores.servicio_id}
          />
        </Campo>

        {/* Barbero (opcional) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
            Barbero <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)' }}>(Opcional)</span>
          </label>
          <Selector
            valor={form.barbero_id}
            alCambiar={(v) => cambiar('barbero_id', v)}
            opciones={opcionesBarberos}
            cargando={cargandoBarberos}
          />
        </div>

        {/* Fecha y hora deseada */}
        <Campo etiqueta="Fecha y hora deseada" requerido error={errores.fecha_hora_deseada}>
          <input
            type="datetime-local"
            className={`campo-input${errores.fecha_hora_deseada ? ' campo-input--error' : ''}`}
            value={form.fecha_hora_deseada}
            onChange={(e) => cambiar('fecha_hora_deseada', e.target.value)}
          />
        </Campo>

        <button type="submit" style={{ display: 'none' }} />
      </form>
    </Modal>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export function PaginaListaEspera() {
  const { listaEspera, cargando } = usarListaEspera()
  const { clientes } = usarClientes()
  const consultaServicios = useQuery({ queryKey: ['servicios'], queryFn: obtenerServicios })
  const servicios = consultaServicios.data ?? []

  const [modalAbierto, setModalAbierto] = useState(false)

  const nombreCliente = (clienteId: string) =>
    clientes.find((c) => c.id === clienteId)?.nombre ?? clienteId.slice(0, 8) + '…'

  const nombreServicio = (servicioId: string) =>
    servicios.find((s) => s.id === servicioId)?.nombre ?? servicioId.slice(0, 8) + '…'

  const esperando = listaEspera.filter((e) => e.estado === 'ESPERANDO').length

  const columnas = [
    {
      clave: 'cliente_id',
      etiqueta: 'Cliente',
      render: (e: EntradaListaEspera) => (
        <div className="tabla-celda-identidad">
          <div className="tabla-celda-avatar">
            {nombreCliente(e.cliente_id).split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <p className="tabla-celda-nombre">{nombreCliente(e.cliente_id)}</p>
        </div>
      ),
    },
    {
      clave: 'servicio_id',
      etiqueta: 'Servicio',
      render: (e: EntradaListaEspera) => (
        <span style={{ fontFamily: 'var(--fuente-acento)', fontSize: 'var(--tamano-sm)', letterSpacing: '0.02em' }}>
          {nombreServicio(e.servicio_id)}
        </span>
      ),
    },
    {
      clave: 'fecha_hora_deseada',
      etiqueta: 'Fecha deseada',
      render: (e: EntradaListaEspera) => (
        <span style={{ fontFamily: 'var(--fuente-acento)', fontSize: 'var(--tamano-sm)', letterSpacing: '0.02em' }}>
          {formatearFecha(e.fecha_hora_deseada)}
        </span>
      ),
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (e: EntradaListaEspera) => (
        <Insignia variante={varianteEstado(e.estado)}>
          {ETIQUETAS_ESTADO[e.estado]}
        </Insignia>
      ),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <EncabezadoPagina
        titulo="Lista de espera"
        descripcion="Clientes en espera cuando no hay disponibilidad inmediata"
        indicador={
          esperando > 0 ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.25rem 0.75rem', borderRadius: '99px',
              backgroundColor: 'rgba(217,119,6,0.08)',
              fontSize: 'var(--tamano-xs)', fontWeight: 600, color: 'var(--color-advertencia)',
            }}>
              <Users size={12} />
              {esperando} esperando
            </div>
          ) : undefined
        }
        acciones={
          <Boton variante="primario" icono={<Plus size={14} />} onClick={() => setModalAbierto(true)}>
            Agregar a lista
          </Boton>
        }
        style={{ padding: 'var(--espacio-lg)', borderBottom: '1px solid var(--color-borde)', backgroundColor: 'var(--color-superficie)' }}
      />

      <div style={{ padding: 'var(--espacio-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-lg)' }}>
        <SeccionTarjeta titulo="Clientes en espera" sinPaddingCuerpo>
          <TablaDatos<EntradaListaEspera>
            columnas={columnas}
            filas={listaEspera}
            obtenerClave={(e) => e.id}
            cargando={cargando}
            vacioIcono={<Clock size={28} />}
            vacioTitulo="Lista de espera vacía"
            vacioMensaje="No hay clientes en lista de espera en este momento."
          />
        </SeccionTarjeta>
      </div>

      <ModalIngresarListaEspera abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} />
    </motion.div>
  )
}
