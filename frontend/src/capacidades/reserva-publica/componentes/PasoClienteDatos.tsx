import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

type DatosCliente = {
  nombre: string
  telefono: string
  correo: string
}

type Props = {
  datos: DatosCliente
  onChange: (d: DatosCliente) => void
  onAnterior: () => void
  onSiguiente: () => void
}

export function PasoClienteDatos({ datos, onChange, onAnterior, onSiguiente }: Props) {
  const [errores, setErrores] = useState<Partial<DatosCliente>>({})

  const validar = () => {
    const e: Partial<DatosCliente> = {}
    if (!datos.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!datos.telefono.trim()) e.telefono = 'El teléfono es obligatorio'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleSiguiente = () => {
    if (validar()) onSiguiente()
  }

  const actualizar = (campo: keyof DatosCliente, valor: string) => {
    onChange({ ...datos, [campo]: valor })
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  return (
    <div>
      <h2 className="reserva-paso__titulo">Tus datos</h2>
      <p className="reserva-paso__descripcion">
        Te enviaremos la confirmación de tu reserva.
      </p>

      <div className="cliente-form">
        <div className="cliente-form__campo">
          <label className="cliente-form__label" htmlFor="rp-nombre">
            Nombre completo *
          </label>
          <input
            id="rp-nombre"
            type="text"
            className="cliente-form__input"
            placeholder="Ej: Carlos Ramírez"
            value={datos.nombre}
            onChange={(e) => actualizar('nombre', e.target.value)}
            autoComplete="name"
          />
          {errores.nombre && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-error)' }}>
              {errores.nombre}
            </span>
          )}
        </div>

        <div className="cliente-form__campo">
          <label className="cliente-form__label" htmlFor="rp-telefono">
            Número de WhatsApp *
          </label>
          <input
            id="rp-telefono"
            type="tel"
            className="cliente-form__input"
            placeholder="Ej: 999 888 777"
            value={datos.telefono}
            onChange={(e) => actualizar('telefono', e.target.value)}
            autoComplete="tel"
          />
          <span className="cliente-form__hint">Lo usaremos para enviarte recordatorios.</span>
          {errores.telefono && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-error)' }}>
              {errores.telefono}
            </span>
          )}
        </div>

        <div className="cliente-form__campo">
          <label className="cliente-form__label" htmlFor="rp-correo">
            Correo electrónico <span style={{ fontWeight: 400, opacity: 0.6 }}>(opcional)</span>
          </label>
          <input
            id="rp-correo"
            type="email"
            className="cliente-form__input"
            placeholder="tu@correo.com"
            value={datos.correo}
            onChange={(e) => actualizar('correo', e.target.value)}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="reserva-navegacion">
        <button type="button" className="reserva-btn reserva-btn--secundario" onClick={onAnterior}>
          <ArrowLeft size={16} />
          Anterior
        </button>
        <button type="button" className="reserva-btn reserva-btn--primario" onClick={handleSiguiente}>
          Revisar reserva
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
