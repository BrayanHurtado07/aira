import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Megaphone, Plus, Users, Send, UserMinus, Mail } from 'lucide-react'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import { Modal } from '@/compartido/interfaz/primitivas/Modal'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { CampoNumerico } from '@/compartido/interfaz/primitivas/CampoNumerico'
import { Selector } from '@/compartido/interfaz/primitivas/Selector'
import { BannerAlerta } from '@/compartido/interfaz/primitivas/BannerAlerta'
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion'
import { Insignia, insigniaPorEstado } from '@/compartido/interfaz/retroalimentacion/Insignia'
import { usarPlantillas } from '@/capacidades/notificaciones/ganchos/usarPlantillas'
import {
  usarCampanias,
  usarCrearCampania,
  usarSegmentarInactivos,
  usarDespacharCampania,
} from '../ganchos/usarCampanias'
import type { Campana } from '../contratos/tipos'

// ── Utilidades ────────────────────────────────────────────────────────────────

function formatearFecha(iso: string): string {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (isNaN(fecha.getTime())) return '—'
  return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function permiteSegmentarInactivos(estado: string): boolean {
  return estado.toUpperCase() === 'BORRADOR'
}

function permiteDespachar(estado: string, destinatarios: number): boolean {
  return estado.toUpperCase() === 'BORRADOR' && destinatarios > 0
}

// ── Modal: Nueva campaña ──────────────────────────────────────────────────────

function ModalNuevaCampania({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  const { crear, ejecutando } = usarCrearCampania()
  const { plantillas, cargando: cargandoPlantillas } = usarPlantillas()

  const [nombre, setNombre] = useState('')
  const [plantillaId, setPlantillaId] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})

  function limpiar() {
    setNombre('')
    setPlantillaId('')
    setErrores({})
  }

  function manejarCerrar() {
    limpiar()
    alCerrar()
  }

  function manejarCrear() {
    const nuevos: Record<string, string> = {}
    if (!nombre.trim()) nuevos.nombre = 'El nombre es obligatorio'
    if (!plantillaId) nuevos.plantilla = 'Selecciona una plantilla de mensaje'
    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos)
      return
    }

    crear(
      { nombre: nombre.trim(), plantilla_id: plantillaId, tipo: 'MANUAL' },
      {
        onSuccess: () => {
          toast.success('Campaña creada', { description: nombre.trim() })
          limpiar()
          alCerrar()
        },
        onError: () => toast.error('No se pudo crear la campaña'),
      },
    )
  }

  return (
    <Modal
      abierto={abierto}
      alCerrar={manejarCerrar}
      titulo="Nueva campaña"
      descripcion="Define el nombre y la plantilla de mensaje que recibirán los destinatarios."
      ancho="sm"
      pie={
        <>
          <Boton variante="secundario" type="button" onClick={manejarCerrar}>
            Cancelar
          </Boton>
          <Boton
            variante="primario"
            type="button"
            icono={<Plus size={14} />}
            onClick={manejarCrear}
            cargando={ejecutando}
          >
            Crear campaña
          </Boton>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
        <Campo
          etiqueta="Nombre de la campaña"
          requerido
          error={errores.nombre}
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value)
            setErrores((p) => ({ ...p, nombre: '' }))
          }}
          placeholder="Ej: Reactivación clientes junio"
        />

        <Campo etiqueta="Plantilla de mensaje" requerido error={errores.plantilla}>
          {plantillas.length === 0 && !cargandoPlantillas ? (
            <BannerAlerta
              variante="advertencia"
              mensaje="No hay plantillas de mensaje. Crea una en Notificaciones antes de lanzar una campaña."
            />
          ) : (
            <Selector
              valor={plantillaId}
              alCambiar={(v) => {
                setPlantillaId(v)
                setErrores((p) => ({ ...p, plantilla: '' }))
              }}
              opciones={plantillas.map((p) => ({ valor: p.id, etiqueta: p.nombre }))}
              placeholder="Selecciona una plantilla"
              cargando={cargandoPlantillas}
              error={!!errores.plantilla}
            />
          )}
        </Campo>
      </div>
    </Modal>
  )
}

// ── Modal: Segmentar clientes inactivos ───────────────────────────────────────

function ModalSegmentar({
  campana,
  alCerrar,
}: {
  campana: Campana | null
  alCerrar: () => void
}) {
  const { segmentar, ejecutando } = usarSegmentarInactivos()
  const [dias, setDias] = useState('60')

  function manejarSegmentar() {
    if (!campana) return
    const valor = parseInt(dias, 10)
    const diasFinal = isNaN(valor) || valor <= 0 ? 60 : valor
    segmentar(
      { campanaId: campana.id, dias: diasFinal },
      {
        onSuccess: (resp) => {
          toast.success('Destinatarios cargados', {
            description: `${resp.total_destinatarios} clientes inactivos agregados.`,
          })
          alCerrar()
        },
        onError: () => toast.error('No se pudieron cargar los destinatarios'),
      },
    )
  }

  return (
    <Modal
      abierto={!!campana}
      alCerrar={alCerrar}
      titulo="Segmentar clientes inactivos"
      descripcion={
        campana
          ? `Agrega como destinatarios de "${campana.nombre}" los clientes sin reservas recientes.`
          : ''
      }
      ancho="sm"
      pie={
        <>
          <Boton variante="secundario" type="button" onClick={alCerrar}>
            Cancelar
          </Boton>
          <Boton
            variante="primario"
            type="button"
            icono={<Users size={14} />}
            onClick={manejarSegmentar}
            cargando={ejecutando}
          >
            Cargar destinatarios
          </Boton>
        </>
      }
    >
      <Campo
        etiqueta="Días de inactividad"
        ayuda="Se incluirán clientes cuya última reserva sea anterior a esta cantidad de días."
      >
        <CampoNumerico
          valor={dias}
          alCambiar={setDias}
          min={1}
          maxDigitosEnteros={3}
          placeholder="60"
        />
      </Campo>
    </Modal>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export function PaginaCampanias() {
  const { campanias, cargando, error } = usarCampanias()
  const { despachar, ejecutando: despachando } = usarDespacharCampania()

  const [modalNueva, setModalNueva] = useState(false)
  const [campanaSegmentar, setCampanaSegmentar] = useState<Campana | null>(null)
  const [campanaDespachar, setCampanaDespachar] = useState<Campana | null>(null)

  function confirmarDespacho() {
    if (!campanaDespachar) return
    despachar(campanaDespachar.id, {
      onSuccess: (resp) => {
        toast.success('Campaña despachada', {
          description: `${resp.enviados} mensajes enviados.`,
        })
        setCampanaDespachar(null)
      },
      onError: () => {
        toast.error('No se pudo despachar la campaña')
        setCampanaDespachar(null)
      },
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <EncabezadoPagina
        titulo="Campañas"
        descripcion="Crea campañas de mensajes, segmenta clientes inactivos y despáchalas por WhatsApp"
        indicador={
          !cargando && !error ? (
            <span>{campanias.length} {campanias.length === 1 ? 'campaña' : 'campañas'}</span>
          ) : undefined
        }
        acciones={
          <Boton
            variante="primario"
            type="button"
            icono={<Plus size={14} />}
            onClick={() => setModalNueva(true)}
          >
            Nueva campaña
          </Boton>
        }
      />

      <ModalNuevaCampania abierto={modalNueva} alCerrar={() => setModalNueva(false)} />
      <ModalSegmentar campana={campanaSegmentar} alCerrar={() => setCampanaSegmentar(null)} />

      <DialogoConfirmacion
        abierto={!!campanaDespachar}
        titulo="¿Despachar esta campaña?"
        descripcion={
          campanaDespachar
            ? `Se enviarán los mensajes a los ${campanaDespachar.destinatarios} destinatarios de "${campanaDespachar.nombre}". Esta acción no se puede deshacer.`
            : ''
        }
        textoConfirmar="Despachar"
        cargando={despachando}
        alConfirmar={confirmarDespacho}
        alCancelar={() => setCampanaDespachar(null)}
      />

      <SeccionTarjeta titulo="Campañas" icono={<Megaphone size={14} />} sinPaddingCuerpo>
        {error ? (
          <div style={{ padding: 'var(--espacio-lg)' }}>
            <BannerAlerta
              variante="error"
              mensaje="No se pudieron cargar las campañas. Revisa tu conexión e intenta de nuevo."
            />
          </div>
        ) : (
          <TablaDatos<Campana>
            columnas={[
              {
                clave: 'nombre',
                etiqueta: 'Campaña',
                render: (c) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-texto)' }}>{c.nombre || '—'}</span>
                    <span style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)' }}>
                      {formatearFecha(c.creado_en)}
                    </span>
                  </div>
                ),
              },
              {
                clave: 'estado',
                etiqueta: 'Estado',
                render: (c) => (
                  <Insignia variante={insigniaPorEstado(c.estado)}>{c.estado || 'BORRADOR'}</Insignia>
                ),
              },
              {
                clave: 'destinatarios',
                etiqueta: 'Destinatarios',
                alinear: 'centro',
                render: (c) => (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={12} style={{ color: 'var(--color-texto-suave)' }} />
                    {c.destinatarios}
                  </span>
                ),
              },
              {
                clave: 'enviados',
                etiqueta: 'Enviados',
                alinear: 'centro',
                render: (c) => (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Mail size={12} style={{ color: 'var(--color-texto-suave)' }} />
                    {c.enviados}
                  </span>
                ),
              },
            ]}
            filas={campanias}
            obtenerClave={(c) => c.id}
            cargando={cargando}
            vacioIcono={<Megaphone size={32} />}
            vacioTitulo="Sin campañas aún"
            vacioMensaje="Crea tu primera campaña para enviar mensajes a tus clientes."
            acciones={(c) => (
              <div style={{ display: 'inline-flex', gap: 'var(--espacio-sm)', justifyContent: 'flex-end' }}>
                <Boton
                  variante="secundario"
                  tamano="sm"
                  type="button"
                  icono={<UserMinus size={13} />}
                  onClick={() => setCampanaSegmentar(c)}
                  disabled={!permiteSegmentarInactivos(c.estado)}
                >
                  Inactivos
                </Boton>
                <Boton
                  variante="primario"
                  tamano="sm"
                  type="button"
                  icono={<Send size={13} />}
                  onClick={() => setCampanaDespachar(c)}
                  disabled={!permiteDespachar(c.estado, c.destinatarios)}
                >
                  Despachar
                </Boton>
              </div>
            )}
          />
        )}
      </SeccionTarjeta>
    </motion.div>
  )
}
