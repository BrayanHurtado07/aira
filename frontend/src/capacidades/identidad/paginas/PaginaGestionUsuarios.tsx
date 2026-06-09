import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Users, UserX, KeyRound, Shield } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina'
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta'
import { TablaDatos } from '@/compartido/interfaz/primitivas/TablaDatos'
import { MenuAcciones } from '@/compartido/interfaz/primitivas/MenuAcciones'
import { DialogoConfirmacion } from '@/compartido/interfaz/primitivas/DialogoConfirmacion'
import { Campo } from '@/compartido/interfaz/primitivas/Campo'
import { Boton } from '@/compartido/interfaz/primitivas/Boton'
import { Insignia } from '@/compartido/interfaz/retroalimentacion/Insignia'
import { Pestanas } from '@/compartido/interfaz/primitivas/Pestanas'
import { listarUsuarios, inactivarUsuario, cambiarPassword } from '../servicios/servicio-identidad'
import { mensajeDeError } from '@/plataforma/gobierno/errores/errores-dominio'
import type { UsuarioResumen } from '../contratos/tipos'

// ── Helpers ───────────────────────────────────────────────────────────────────

function iniciales(nombre: string): string {
  return nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

// ── Pestaña Usuarios ──────────────────────────────────────────────────────────

function PestanaUsuarios() {
  const clienteConsulta = useQueryClient()
  const [confirmarInactivar, setConfirmarInactivar] = useState<UsuarioResumen | null>(null)

  const consulta = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => listarUsuarios(),
  })

  const mutInactivar = useMutation({
    mutationFn: (u: UsuarioResumen) => inactivarUsuario(u.id),
    onSuccess: (_, u) => {
      clienteConsulta.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuario inactivado', { description: u.nombre })
      setConfirmarInactivar(null)
    },
    onError: (err) => toast.error(mensajeDeError(err)),
  })

  const columnas = [
    {
      clave: 'nombre',
      etiqueta: 'Usuario',
      render: (u: UsuarioResumen) => (
        <div className="tabla-celda-identidad">
          <div className="tabla-celda-avatar">{iniciales(u.nombre)}</div>
          <div>
            <p className="tabla-celda-nombre">{u.nombre}</p>
            <p style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)', margin: 0 }}>
              {u.correo}
            </p>
          </div>
        </div>
      ),
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (u: UsuarioResumen) => (
        <Insignia variante={u.estado === 'ACTIVO' ? 'exito' : 'neutral'}>
          {u.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
        </Insignia>
      ),
    },
  ]

  return (
    <>
      <SeccionTarjeta titulo="Usuarios registrados" sinPaddingCuerpo>
        <TablaDatos<UsuarioResumen>
          columnas={columnas}
          filas={consulta.data ?? []}
          obtenerClave={(u) => u.id}
          cargando={consulta.isLoading}
          vacioIcono={<Users size={28} />}
          vacioTitulo="Sin usuarios"
          vacioMensaje="No hay usuarios activos en el sistema."
          acciones={(u) => (
            <MenuAcciones
              acciones={[
                {
                  id: 'inactivar',
                  etiqueta: 'Inactivar usuario',
                  icono: <UserX size={14} />,
                  variante: 'advertencia',
                  deshabilitada: u.estado !== 'ACTIVO',
                },
              ]}
              onAccion={(id) => { if (id === 'inactivar') setConfirmarInactivar(u) }}
              titulo="Acciones del usuario"
            />
          )}
        />
      </SeccionTarjeta>

      <DialogoConfirmacion
        abierto={!!confirmarInactivar}
        titulo={`¿Inactivar a ${confirmarInactivar?.nombre ?? ''}?`}
        descripcion="El usuario no podrá iniciar sesión. Esta acción puede revertirse reasignando un alcance activo."
        variante="advertencia"
        textoConfirmar="Sí, inactivar"
        cargando={mutInactivar.isPending}
        alConfirmar={() => confirmarInactivar && mutInactivar.mutate(confirmarInactivar)}
        alCancelar={() => setConfirmarInactivar(null)}
      />
    </>
  )
}

// ── Pestaña Cambiar contraseña ────────────────────────────────────────────────

function PestanaCambiarPassword() {
  const [actual, setActual]       = useState('')
  const [nueva, setNueva]         = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [errorLocal, setErrorLocal] = useState('')

  const mutacion = useMutation({
    mutationFn: () => cambiarPassword({ contrasena_actual: actual, contrasena_nueva: nueva }),
    onSuccess: () => {
      toast.success('Contraseña actualizada')
      setActual('')
      setNueva('')
      setConfirmar('')
      setErrorLocal('')
    },
    onError: (err) => setErrorLocal(mensajeDeError(err)),
  })

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    if (nueva.length < 8) { setErrorLocal('La contraseña debe tener al menos 8 caracteres'); return }
    if (nueva !== confirmar) { setErrorLocal('Las contraseñas no coinciden'); return }
    setErrorLocal('')
    mutacion.mutate()
  }

  return (
    <SeccionTarjeta titulo="Cambiar contraseña" icono={<KeyRound size={14} />} maxAncho={480}>
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
        <Campo
          etiqueta="Contraseña actual"
          requerido
          type="password"
          value={actual}
          onChange={(e) => { setActual(e.target.value); setErrorLocal('') }}
          placeholder="••••••••"
        />
        <Campo
          etiqueta="Nueva contraseña"
          requerido
          type="password"
          value={nueva}
          onChange={(e) => { setNueva(e.target.value); setErrorLocal('') }}
          placeholder="Mínimo 8 caracteres"
        />
        <Campo
          etiqueta="Confirmar nueva contraseña"
          requerido
          type="password"
          value={confirmar}
          onChange={(e) => { setConfirmar(e.target.value); setErrorLocal('') }}
          placeholder="Repite la nueva contraseña"
          error={errorLocal || undefined}
        />

        <Boton type="submit" variante="primario" icono={<KeyRound size={14} />} cargando={mutacion.isPending}>
          Actualizar contraseña
        </Boton>
      </form>
    </SeccionTarjeta>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

const PESTANAS = [
  { id: 'usuarios',  etiqueta: 'Usuarios',   icono: <Users size={14} /> },
  { id: 'password',  etiqueta: 'Contraseña', icono: <KeyRound size={14} /> },
]

export function PaginaGestionUsuarios() {
  const [pestanaActiva, setPestanaActiva] = useState('usuarios')

  const consulta = useQuery({ queryKey: ['usuarios'], queryFn: listarUsuarios })
  const total = consulta.data?.length ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Gestión de usuarios del sistema y contraseña"
        indicador={
          total > 0 ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '99px',
                backgroundColor: 'rgba(5,150,105,0.08)',
                fontSize: 'var(--tamano-xs)',
                fontWeight: 600,
                color: 'var(--color-exito)',
              }}
            >
              <Shield size={12} />
              {total} {total === 1 ? 'usuario' : 'usuarios'}
            </div>
          ) : undefined
        }
        style={{
          padding: 'var(--espacio-lg)',
          borderBottom: '1px solid var(--color-borde)',
          backgroundColor: 'var(--color-superficie)',
        }}
      />

      <div style={{ padding: '0 var(--espacio-lg)', borderBottom: '1px solid var(--color-borde)', backgroundColor: 'var(--color-superficie)' }}>
        <Pestanas
          pestanas={PESTANAS}
          activa={pestanaActiva}
          alCambiar={setPestanaActiva}
          variante="linea"
        />
      </div>

      <div style={{ padding: 'var(--espacio-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--espacio-lg)' }}>
        {pestanaActiva === 'usuarios'  && <PestanaUsuarios />}
        {pestanaActiva === 'password'  && <PestanaCambiarPassword />}
      </div>
    </motion.div>
  )
}
