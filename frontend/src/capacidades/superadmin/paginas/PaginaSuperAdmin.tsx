import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Building2, Plus, Link2, Users, CalendarCheck,
  CreditCard, RefreshCw, ShieldAlert,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EncabezadoPagina }   from '@/compartido/interfaz/primitivas/EncabezadoPagina';
import { SeccionTarjeta }     from '@/compartido/interfaz/primitivas/SeccionTarjeta';
import { Campo }              from '@/compartido/interfaz/primitivas/Campo';
import { Boton }              from '@/compartido/interfaz/primitivas/Boton';
import { Modal }              from '@/compartido/interfaz/primitivas/Modal';
import { TablaDatos }         from '@/compartido/interfaz/primitivas/TablaDatos';
import { Insignia, insigniaPorEstado } from '@/compartido/interfaz/retroalimentacion/Insignia';
import { Esqueleto }          from '@/compartido/interfaz/retroalimentacion/Esqueleto';

import { usarEmpresasPlataforma }       from '../ganchos/usarEmpresasPlataforma';
import { onboardearEmpresa }            from '../servicios/servicio-superadmin';
import type { EmpresaResumen, SolicitudOnboardearEmpresa } from '../contratos/tipos';

// ── Tarjeta KPI ───────────────────────────────────────────────────────────────

function TarjetaKPI({
  icono, etiqueta, valor, sub, color = 'var(--color-primario)',
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <motion.div
      className="superadmin-kpi"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="superadmin-kpi__icono" style={{ color }}>
        {icono}
      </div>
      <div>
        <p className="superadmin-kpi__valor">{valor}</p>
        <p className="superadmin-kpi__etiqueta">{etiqueta}</p>
        {sub && <p className="superadmin-kpi__sub">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Formulario onboarding ─────────────────────────────────────────────────────

const FORM_VACIO: SolicitudOnboardearEmpresa = {
  nombre_empresa: '',
  nombre_admin:   '',
  correo_admin:   '',
  password_admin: '',
};

function FormularioOnboarding({
  alCerrar,
  alExito,
}: {
  alCerrar: () => void;
  alExito:  (slug: string, correo: string) => void;
}) {
  const [form, setForm]     = useState<SolicitudOnboardearEmpresa>(FORM_VACIO);
  const [errores, setErrores] = useState<Partial<Record<keyof SolicitudOnboardearEmpresa, string>>>({});

  const set = (k: keyof SolicitudOnboardearEmpresa) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      setErrores((er) => ({ ...er, [k]: '' }));
    };

  const validar = (): boolean => {
    const e: typeof errores = {};
    if (!form.nombre_empresa.trim())       e.nombre_empresa = 'Ingresa el nombre de la empresa';
    else if (form.nombre_empresa.trim().length < 3) e.nombre_empresa = 'Mínimo 3 caracteres';
    if (!form.nombre_admin.trim())         e.nombre_admin   = 'Ingresa el nombre del administrador';
    if (!form.correo_admin.trim())         e.correo_admin   = 'Ingresa el correo del administrador';
    if (!form.password_admin.trim())       e.password_admin = 'Ingresa una contraseña';
    else if (form.password_admin.length < 8) e.password_admin = 'Mínimo 8 caracteres';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const mutacion = useMutation({
    mutationFn: () => onboardearEmpresa(form),
    onSuccess: (resp) => {
      toast.success(`Empresa "${form.nombre_empresa}" creada`, {
        description: `Admin: ${resp.correo_admin}`,
      });
      alExito(resp.slug, resp.correo_admin);
    },
    onError: (err: Error) => {
      const msg = err.message?.includes('CORREO_ELECTRONICO_YA_REGISTRADO')
        ? 'El correo del administrador ya está registrado'
        : 'No se pudo crear la empresa';
      toast.error(msg);
    },
  });

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (validar()) mutacion.mutate();
  };

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
      {/* Empresa */}
      <div className="superadmin-form-seccion">
        <p className="superadmin-form-seccion__titulo">
          <Building2 size={12} /> Datos de la empresa
        </p>
        <Campo
          etiqueta="Nombre de la barbería"
          requerido
          placeholder="Ej: Nova Barber Lima"
          value={form.nombre_empresa}
          onChange={set('nombre_empresa')}
          error={errores.nombre_empresa}
          ayuda="El slug de reserva pública se genera automáticamente."
        />
      </div>

      {/* Admin */}
      <div className="superadmin-form-seccion">
        <p className="superadmin-form-seccion__titulo">
          <Users size={12} /> Cuenta del administrador
        </p>
        <Campo
          etiqueta="Nombre completo"
          requerido
          placeholder="Ej: Carlos Mendoza"
          value={form.nombre_admin}
          onChange={set('nombre_admin')}
          error={errores.nombre_admin}
        />
        <Campo
          etiqueta="Correo electrónico"
          requerido
          type="email"
          placeholder="admin@novabarber.com"
          value={form.correo_admin}
          onChange={set('correo_admin')}
          error={errores.correo_admin}
        />
        <Campo
          etiqueta="Contraseña inicial"
          requerido
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={form.password_admin}
          onChange={set('password_admin')}
          error={errores.password_admin}
          ayuda="El administrador podrá cambiarla en su primer ingreso."
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--espacio-sm)', justifyContent: 'flex-end', marginTop: 'var(--espacio-sm)' }}>
        <Boton type="button" variante="fantasma" onClick={alCerrar}>Cancelar</Boton>
        <Boton type="submit" variante="primario" icono={<Plus size={14} />} cargando={mutacion.isPending}>
          Crear empresa
        </Boton>
      </div>
    </form>
  );
}

// ── Suscripción badge helper ──────────────────────────────────────────────────

function insigniaSuscripcion(estado: string) {
  if (estado === 'ACTIVA')          return <Insignia variante="exito"    icono={<CreditCard size={10} />}>Activa</Insignia>;
  if (estado === 'SIN_SUSCRIPCION') return <Insignia variante="neutral"  icono={<CreditCard size={10} />}>Sin plan</Insignia>;
  if (estado === 'SUSPENDIDA')      return <Insignia variante="advertencia">Suspendida</Insignia>;
  return <Insignia variante="neutral">{estado}</Insignia>;
}

// ── Página principal ──────────────────────────────────────────────────────────

export function PaginaSuperAdmin() {
  const qc = useQueryClient();
  const { empresas, total, cargando, recargar } = usarEmpresasPlataforma();
  const [modalAbierto, setModalAbierto] = useState(false);

  const totalBarberos  = empresas.reduce((s, e) => s + e.BarberosActivos,   0);
  const totalReservas  = empresas.reduce((s, e) => s + e.ReservasUltimoMes, 0);
  const totalActivas   = empresas.filter((e) => e.EstadoSuscripcion === 'ACTIVA').length;

  const alExitoOnboarding = () => {
    setModalAbierto(false);
    qc.invalidateQueries({ queryKey: ['superadmin', 'empresas'] });
  };

  const urlPublica = (slug: string) =>
    `${window.location.origin}/reservar/${slug}`;

  const copiarUrl = (slug: string) => {
    navigator.clipboard.writeText(urlPublica(slug)).then(() =>
      toast.success('Enlace copiado')
    );
  };

  const columnas = [
    {
      clave: 'empresa',
      etiqueta: 'Empresa',
      render: (e: EmpresaResumen) => (
        <div>
          <p style={{ fontWeight: 600, color: 'var(--color-texto)', fontSize: 'var(--tamano-sm)' }}>
            {e.Nombre}
          </p>
          <p style={{ fontSize: 'var(--tamano-xs)', color: 'var(--color-texto-suave)', marginTop: 2 }}>
            /{e.Slug}
          </p>
        </div>
      ),
    },
    {
      clave: 'suscripcion',
      etiqueta: 'Plan',
      render: (e: EmpresaResumen) => insigniaSuscripcion(e.EstadoSuscripcion),
    },
    {
      clave: 'estado',
      etiqueta: 'Estado',
      render: (e: EmpresaResumen) => (
        <Insignia variante={insigniaPorEstado(e.Estado)}>{e.Estado}</Insignia>
      ),
    },
    {
      clave: 'barberos',
      etiqueta: 'Barberos',
      alinear: 'centro' as const,
      render: (e: EmpresaResumen) => (
        <span style={{ fontSize: 'var(--tamano-sm)', fontWeight: 600 }}>{e.BarberosActivos}</span>
      ),
    },
    {
      clave: 'sucursales',
      etiqueta: 'Sedes',
      alinear: 'centro' as const,
      render: (e: EmpresaResumen) => (
        <span style={{ fontSize: 'var(--tamano-sm)' }}>{e.SucursalesActivas}</span>
      ),
    },
    {
      clave: 'reservas',
      etiqueta: 'Reservas (30d)',
      alinear: 'centro' as const,
      render: (e: EmpresaResumen) => (
        <span style={{ fontSize: 'var(--tamano-sm)', fontWeight: e.ReservasUltimoMes > 0 ? 600 : 400 }}>
          {e.ReservasUltimoMes}
        </span>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="pagina-superadmin"
    >
      {/* Encabezado */}
      <EncabezadoPagina
        titulo="Plataforma AIRA"
        descripcion="Gestiona las empresas registradas. Cada empresa tiene su propio administrador, barberos y clientes."
        indicador={
          !cargando ? (
            <span className="encabezado-indicador-chip">
              <ShieldAlert size={11} />
              {total} empresa{total !== 1 ? 's' : ''}
            </span>
          ) : undefined
        }
        acciones={
          <div style={{ display: 'flex', gap: 'var(--espacio-sm)' }}>
            <Boton
              variante="fantasma"
              tamano="sm"
              icono={<RefreshCw size={13} />}
              onClick={() => recargar()}
            >
              Actualizar
            </Boton>
            <Boton
              variante="primario"
              tamano="sm"
              icono={<Plus size={14} />}
              onClick={() => setModalAbierto(true)}
            >
              Nueva empresa
            </Boton>
          </div>
        }
      />

      {/* KPIs */}
      <div className="superadmin-kpis">
        {cargando ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="superadmin-kpi superadmin-kpi--skeleton">
              <Esqueleto ancho="2.5rem" alto="2.5rem" radio="50%" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Esqueleto ancho="3rem" alto="1.5rem" />
                <Esqueleto ancho="5rem" alto="0.875rem" />
              </div>
            </div>
          ))
        ) : (
          <>
            <TarjetaKPI
              icono={<Building2 size={20} />}
              etiqueta="Empresas registradas"
              valor={total}
              color="var(--color-primario)"
            />
            <TarjetaKPI
              icono={<CreditCard size={20} />}
              etiqueta="Con suscripción activa"
              valor={totalActivas}
              sub={total > 0 ? `${Math.round((totalActivas / total) * 100)}% del total` : undefined}
              color="var(--color-exito)"
            />
            <TarjetaKPI
              icono={<Users size={20} />}
              etiqueta="Barberos activos"
              valor={totalBarberos}
              color="#3B82F6"
            />
            <TarjetaKPI
              icono={<CalendarCheck size={20} />}
              etiqueta="Reservas (últimos 30d)"
              valor={totalReservas}
              color="#8B5CF6"
            />
          </>
        )}
      </div>

      {/* Tabla de empresas */}
      <SeccionTarjeta
        titulo="Empresas registradas"
        icono={<Building2 size={14} />}
        sinPaddingCuerpo
      >
        <TablaDatos<EmpresaResumen>
          columnas={columnas}
          filas={empresas}
          obtenerClave={(e) => e.ID}
          cargando={cargando}
          vacioIcono={<Building2 size={32} />}
          vacioTitulo="Sin empresas registradas"
          vacioMensaje='Haz clic en "Nueva empresa" para onboardear la primera.'
          acciones={(e) => (
            <button
              type="button"
              className="superadmin-btn-enlace"
              title="Copiar enlace de reserva pública"
              onClick={() => copiarUrl(e.Slug)}
            >
              <Link2 size={13} />
              <span>Enlace</span>
            </button>
          )}
        />
      </SeccionTarjeta>

      {/* Modal — onboarding */}
      <Modal
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        titulo="Nueva empresa"
        descripcion="Registra la barbería y crea la cuenta de su administrador en un solo paso."
        ancho="md"
      >
        <FormularioOnboarding
          alCerrar={() => setModalAbierto(false)}
          alExito={alExitoOnboarding}
        />
      </Modal>
    </motion.div>
  );
}
