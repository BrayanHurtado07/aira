import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Scissors } from 'lucide-react'

import '../estilos/reserva-publica.css'

import { IndicadorPasos } from '../componentes/IndicadorPasos'
import { PasoServicio } from '../componentes/PasoServicio'
import { PasoBarberoFecha } from '../componentes/PasoBarberoFecha'
import { PasoClienteDatos } from '../componentes/PasoClienteDatos'
import { PasoConfirmacion } from '../componentes/PasoConfirmacion'

import {
  obtenerServiciosPublicos,
  obtenerBarberosPublicos,
  obtenerSucursalesPublicas,
} from '../servicios/servicio-reserva-publica'

import type { Servicio, Barbero, SeleccionReserva, Sucursal } from '../contratos/tipos'

type Paso = 0 | 1 | 2 | 3

type DatosCliente = { nombre: string; telefono: string; correo: string }

export function PaginaReservaPublica() {
  const { slug } = useParams<{ slug: string }>()
  const empresaID = slug

  const [paso, setPaso] = useState<Paso>(0)
  const [exito, setExito] = useState(false)

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [_sucursales, setSucursales] = useState<Sucursal[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)

  const [seleccion, setSeleccion] = useState<SeleccionReserva>({
    empresaID: empresaID ?? '',
    sucursalID: '',
    servicio: null,
    barbero: null,
    slot: null,
    fecha: '',
  })

  const [cliente, setCliente] = useState<DatosCliente>({ nombre: '', telefono: '', correo: '' })

  const cargarDatos = useCallback(() => {
    if (!empresaID) return
    setCargando(true)
    setErrorCarga(false)
    Promise.all([
      obtenerServiciosPublicos(empresaID),
      obtenerBarberosPublicos(empresaID),
      obtenerSucursalesPublicas(empresaID),
    ])
      .then(([svcs, barbs, sedes]) => {
        setServicios(svcs)
        setBarberos(barbs)
        setSucursales(sedes)
        if (sedes.length > 0) {
          setSeleccion((s) => ({ ...s, sucursalID: sedes[0].id }))
        }
      })
      .catch(() => setErrorCarga(true))
      .finally(() => setCargando(false))
  }, [empresaID])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  if (!empresaID) {
    return (
      <div className="reserva-publica">
        <div className="reserva-publica__contenido" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <p style={{ color: 'var(--color-error)' }}>Enlace de reserva inválido.</p>
        </div>
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className="reserva-publica">
        <Cabecera />
        <div className="reserva-publica__contenido" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <p style={{ color: 'var(--color-error)', marginBottom: 'var(--espacio-md)' }}>
            No pudimos cargar la información de la barbería. Revisa tu conexión e inténtalo de nuevo.
          </p>
          <button type="button" className="reserva-btn reserva-btn--primario" onClick={cargarDatos}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (exito) {
    return (
      <div className="reserva-publica">
        <Cabecera />
        <div className="reserva-publica__contenido">
          <div className="reserva-exito">
            <div className="reserva-exito__icono">
              <CheckCircle size={36} />
            </div>
            <h2 className="reserva-exito__titulo">¡Reserva confirmada!</h2>
            <p className="reserva-exito__descripcion">
              Tu cita ha sido registrada. Te contactaremos por WhatsApp para confirmártela.
              <br />
              <strong>{cliente.nombre}</strong> · {cliente.telefono}
            </p>
            <button
              type="button"
              className="reserva-btn reserva-btn--primario"
              onClick={() => { setExito(false); setPaso(0); setSeleccion((s) => ({ ...s, servicio: null, barbero: null, slot: null, fecha: '' })); setCliente({ nombre: '', telefono: '', correo: '' }) }}
            >
              Hacer otra reserva
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reserva-publica">
      <Cabecera />
      <div className="reserva-publica__contenido">
        <IndicadorPasos pasoActual={paso} />

        {paso === 0 && (
          <PasoServicio
            servicios={servicios}
            seleccionado={seleccion.servicio}
            onSeleccionar={(s) => setSeleccion((prev) => ({ ...prev, servicio: s }))}
            onSiguiente={() => setPaso(1)}
            cargando={cargando}
          />
        )}

        {paso === 1 && seleccion.servicio && (
          <PasoBarberoFecha
            barberos={barberos}
            servicio={seleccion.servicio}
            barberoSeleccionado={seleccion.barbero}
            slotSeleccionado={seleccion.slot}
            fechaSeleccionada={seleccion.fecha}
            onBarbero={(b) => setSeleccion((prev) => ({ ...prev, barbero: b, slot: null }))}
            onSlot={(slot, fecha) => setSeleccion((prev) => ({ ...prev, slot, fecha }))}
            onAnterior={() => setPaso(0)}
            onSiguiente={() => setPaso(2)}
          />
        )}

        {paso === 2 && (
          <PasoClienteDatos
            datos={cliente}
            onChange={setCliente}
            onAnterior={() => setPaso(1)}
            onSiguiente={() => setPaso(3)}
          />
        )}

        {paso === 3 && (
          <PasoConfirmacion
            seleccion={seleccion}
            cliente={cliente}
            onAnterior={() => setPaso(2)}
            onExito={() => setExito(true)}
          />
        )}
      </div>
    </div>
  )
}

function Cabecera() {
  return (
    <header className="reserva-publica__cabecera">
      <div className="reserva-publica__cabecera-inner">
        <Link to="/" className="reserva-publica__logo">
          <Scissors size={16} style={{ display: 'inline', marginRight: 6, color: 'var(--landing-rojo)' }} />
          AI<em>RA</em>
        </Link>
        <span className="reserva-publica__subtitulo-cab">Reserva tu cita</span>
      </div>
    </header>
  )
}
