import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Clock, Plus, BellRing } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import { Modal } from '@/compartido/interfaz/primitivas/Modal'
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta'
import { CeldaCliente } from '@/compartido/interfaz/primitivas/CeldaCliente'
import { SelectorFecha } from '@/compartido/interfaz/primitivas/SelectorFecha'
import { Vacio } from '@/compartido/interfaz/retroalimentacion/Vacio'
import { BuscadorCliente } from '@/capacidades/reservas/componentes/BuscadorCliente'
import { SelectorSede } from '@/capacidades/organizacion/componentes/SelectorSede'
import { SelectorServicio } from '@/capacidades/agenda/componentes/SelectorServicio'
import { SelectorBarbero } from '@/capacidades/agenda/componentes/SelectorBarbero'
import { usarClientes } from '@/capacidades/reservas/ganchos/usarClientes'
import { obtenerServicios } from '@/capacidades/agenda/servicios/servicio-agenda'
import { usarListaEspera, usarIngresarListaEspera, usarPromoverListaEspera } from '../ganchos/usarListaEspera'
import type { EntradaListaEspera } from '../contratos/tipos'

// ── Helpers ───────────────────────────────────────────────────────────────────
// Nota: el backend solo lista entradas en estado ESPERANDO, por eso no se muestra
// una columna de estado (sería siempre "Esperando"). Al notificar, la entrada sale.

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
          <SelectorSede valor={form.sucursal_id} alCambiar={(v) => cambiar('sucursal_id', v)} error={!!errores.sucursal_id} />
        </Campo>

        {/* Servicio (al cambiarlo se resetea el barbero: la lista depende del servicio) */}
        <Campo etiqueta="Servicio" requerido error={errores.servicio_id}>
          <SelectorServicio
            valor={form.servicio_id}
            alCambiar={(v) => { setForm((p) => ({ ...p, servicio_id: v, barbero_id: '' })); setErrores((p) => ({ ...p, servicio_id: '' })) }}
            error={!!errores.servicio_id}
          />
        </Campo>

        {/* Barbero (opcional) — solo los que saben hacer el servicio elegido */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={{ fontSize: 'var(--tamano-sm)', fontWeight: 500, color: 'var(--color-texto)' }}>
            Barbero <span style={{ fontWeight: 400, color: 'var(--color-texto-suave)' }}>(Opcional)</span>
          </label>
          <SelectorBarbero
            valor={form.barbero_id}
            alCambiar={(v) => cambiar('barbero_id', v)}
            servicioId={form.servicio_id || undefined}
            incluirCualquiera
          />
        </div>

        {/* Fecha y hora deseada — picker propio, no permite fechas pasadas */}
        <Campo etiqueta="Fecha y hora deseada" requerido error={errores.fecha_hora_deseada}>
          <SelectorFecha
            valor={form.fecha_hora_deseada}
            alCambiar={(v) => cambiar('fecha_hora_deseada', v)}
            error={!!errores.fecha_hora_deseada}
            minDate={new Date()}
          />
        </Campo>

        <button type="submit" style={{ display: 'none' }} />
      </form>
    </Modal>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export function PaginaListaEspera() {
  const { listaEspera, cargando, error } = usarListaEspera()
  const { clientes } = usarClientes()
  const consultaServicios = useQuery({ queryKey: ['servicios'], queryFn: obtenerServicios })
  const servicios = consultaServicios.data ?? []
  const promover = usarPromoverListaEspera()

  const [modalAbierto, setModalAbierto] = useState(false)

  const mapaClientes = useMemo(() => Object.fromEntries(clientes.map((c) => [c.id, c])), [clientes])

  const nombreServicio = (servicioId: string) =>
    servicios.find((s) => s.id === servicioId)?.nombre ?? servicioId.slice(0, 8) + '…'

  const esperando = listaEspera.filter((e) => e.estado === 'ESPERANDO').length

  const notificar = (e: EntradaListaEspera) => {
    promover.mutate(e.id, {
      onSuccess: () => toast.success('Cliente notificado', { description: mapaClientes[e.cliente_id]?.nombre }),
      onError: (err) => toast.error(mensajeDeError(err)),
    })
  }

  const accionNotificar = (e: EntradaListaEspera) =>
    e.estado === 'ESPERANDO' ? (
      <Boton variante="secundario" tamano="sm" icono={<BellRing size={13} />} cargando={promover.isPending} onClick={() => notificar(e)}>
        Notificar
      </Boton>
    ) : null

  const columnas = [
    {
      clave: 'cliente_id',
      etiqueta: 'Cliente',
      render: (e: EntradaListaEspera) => {
        const cl = mapaClientes[e.cliente_id]
        return <CeldaCliente nombre={cl?.nombre} telefono={cl?.telefono} />
      },
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
  ]

  const ctaAgregar = (
    <Boton variante="primario" icono={<Plus size={14} />} onClick={() => setModalAbierto(true)}>
      Agregar a lista
    </Boton>
  )

  return (
    <motion.div
      className="pagina-contenido"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <EncabezadoPagina
        titulo="Lista de espera"
        descripcion="Clientes en espera cuando no hay disponibilidad inmediata"
        indicador={!cargando && esperando > 0 ? `${esperando} esperando` : undefined}
        acciones={ctaAgregar}
      />

      {!cargando && error && (
        <BannerAlerta variante="error" titulo="Error al cargar la lista" mensaje={mensajeDeError(error)} />
      )}

      <SeccionTarjeta titulo="Clientes en espera" sinPaddingCuerpo>
        {/* Desktop: tabla */}
        <div className="lista-espera-tabla-wrap">
          <TablaDatos<EntradaListaEspera>
            columnas={columnas}
            filas={listaEspera}
            obtenerClave={(e) => e.id}
            cargando={cargando}
            vacioIcono={<Clock size={28} />}
            vacioTitulo="Lista de espera vacía"
            vacioMensaje="No hay clientes en lista de espera en este momento."
            vacioAccion={ctaAgregar}
            acciones={(e) => accionNotificar(e)}
          />
        </div>

        {/* Móvil: tarjetas */}
        <div className="lista-espera-tarjetas">
          {cargando ? (
            [0, 1, 2].map((i) => <div key={i} className="cliente-tarjeta-skel" />)
          ) : listaEspera.length === 0 ? (
            <Vacio icono={<Clock size={28} />} titulo="Lista de espera vacía" mensaje="No hay clientes en lista de espera en este momento." accion={ctaAgregar} />
          ) : (
            listaEspera.map((e) => {
              const cl = mapaClientes[e.cliente_id]
              return (
                <div key={e.id} className="cliente-tarjeta">
                  <div className="cliente-tarjeta-cabecera">
                    <CeldaCliente nombre={cl?.nombre} telefono={cl?.telefono} />
                  </div>
                  <div style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)' }}>
                    {nombreServicio(e.servicio_id)} · {formatearFecha(e.fecha_hora_deseada)}
                  </div>
                  {accionNotificar(e)}
                </div>
              )
            })
          )}
        </div>
      </SeccionTarjeta>

      <ModalIngresarListaEspera abierto={modalAbierto} alCerrar={() => setModalAbierto(false)} />
    </motion.div>
  )
}
