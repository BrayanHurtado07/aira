import React from 'react';
import { usarRolActivo } from '@/plataforma/identidad/ganchos/usarRolActivo';
import type { Rol } from '@/plataforma/identidad/roles';

type PropiedadesGuardiaPermiso = {
  // roles: si se especifican, solo esos roles ven el contenido.
  roles?: Rol[];
  // permiso: prop legacy para backward compat (ignorado — el backend controla los permisos reales).
  permiso?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

// GuardiaPermiso: oculta UI según el rol del usuario.
// El backend es la fuente de verdad; este componente es UX — evita mostrar
// botones que siempre fallarían. No reemplaza la autorización del backend.
export function GuardiaPermiso({
  roles,
  children,
  fallback = null,
}: PropiedadesGuardiaPermiso) {
  const { nombreRol } = usarRolActivo();

  if (roles && roles.length > 0) {
    const upper = nombreRol.toUpperCase().trim();
    const permitido = roles.some((r) => upper === r);
    if (!permitido) return <>{fallback}</>;
  }

  return <>{children}</>;
}
