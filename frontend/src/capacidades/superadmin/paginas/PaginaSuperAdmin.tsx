import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Building2, Plus, Link2, CheckCircle2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { EncabezadoPagina } from '@/compartido/interfaz/primitivas/EncabezadoPagina';
import { SeccionTarjeta } from '@/compartido/interfaz/primitivas/SeccionTarjeta';
import { Campo } from '@/compartido/interfaz/primitivas/Campo';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { crearEmpresa, type RespuestaCrearEmpresa } from '../servicios/servicio-superadmin';

// ── Tarjeta de empresa creada ─────────────────────────────────────────────────

function TarjetaEmpresaCreada({ empresa }: { empresa: RespuestaCrearEmpresa }) {
  const urlPublica = `${window.location.origin}/reservar/${empresa.slug}`;
  const [copiado, setCopiado] = useState(false);

  const copiar = () => {
    navigator.clipboard.writeText(urlPublica).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="superadmin-empresa-creada"
    >
      <div className="superadmin-empresa-creada__icono">
        <CheckCircle2 size={28} />
      </div>
      <div style={{ flex: 1 }}>
        <p className="superadmin-empresa-creada__nombre">{empresa.nombre}</p>
        <p className="superadmin-empresa-creada__slug">slug: {empresa.slug}</p>
        <div className="superadmin-empresa-creada__url-fila">
          <code className="superadmin-empresa-creada__url">{urlPublica}</code>
          <button
            type="button"
            onClick={copiar}
            className="superadmin-empresa-creada__copiar"
            title="Copiar enlace"
          >
            {copiado ? <CheckCircle2 size={13} /> : <Link2 size={13} />}
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export function PaginaSuperAdmin() {
  const [nombre, setNombre]     = useState('');
  const [error, setError]       = useState('');
  const [creadas, setCreadas]   = useState<RespuestaCrearEmpresa[]>([]);

  const mutCrear = useMutation({
    mutationFn: () => crearEmpresa({ nombre: nombre.trim() }),
    onSuccess: (empresa) => {
      toast.success('Empresa creada', { description: empresa.nombre });
      setCreadas((prev) => [empresa, ...prev]);
      setNombre('');
      setError('');
    },
    onError: () => {
      toast.error('No se pudo crear la empresa');
    },
  });

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('Ingresa el nombre de la empresa'); return; }
    if (nombre.trim().length < 3) { setError('El nombre debe tener al menos 3 caracteres'); return; }
    setError('');
    mutCrear.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-xl)' }}
    >
      <EncabezadoPagina
        titulo="Empresas"
        descripcion="Crea y gestiona las barberias del sistema. Esta sección es exclusiva del Super Admin."
        indicador={
          creadas.length > 0 ? (
            <span className="encabezado-indicador-chip">
              <Building2 size={11} />
              {creadas.length} creada{creadas.length !== 1 ? 's' : ''} esta sesión
            </span>
          ) : undefined
        }
      />

      {/* Formulario de creación */}
      <SeccionTarjeta
        titulo="Nueva empresa"
        icono={<Building2 size={14} />}
        maxAncho={480}
      >
        <form
          onSubmit={enviar}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}
        >
          <Campo
            etiqueta="Nombre de la barbería"
            requerido
            placeholder="Ej: Serbio Barbería Lima"
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); setError(''); }}
            error={error}
            className="campo-input"
            ayuda="El slug de reserva pública se generará automáticamente."
          />
          <Boton
            type="submit"
            variante="primario"
            icono={<Plus size={14} />}
            cargando={mutCrear.isPending}
          >
            Crear empresa
          </Boton>
        </form>
      </SeccionTarjeta>

      {/* Empresas creadas en esta sesión */}
      {creadas.length > 0 && (
        <SeccionTarjeta titulo="Creadas esta sesión" icono={<CheckCircle2 size={14} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
            {creadas.map((e) => (
              <TarjetaEmpresaCreada key={e.id} empresa={e} />
            ))}
          </div>
        </SeccionTarjeta>
      )}
    </motion.div>
  );
}
