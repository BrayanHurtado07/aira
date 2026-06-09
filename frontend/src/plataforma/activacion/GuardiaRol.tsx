import React from 'react';
import { Navigate } from 'react-router-dom';
import { usarRolActivo } from '@/plataforma/identidad/ganchos/usarRolActivo';
import type { Rol } from '@/plataforma/identidad/roles';

type PropiedadesGuardiaRol = {
  roles: Rol[];                    // roles permitidos
  redirigirA?: string;             // a dónde ir si no tiene acceso (default: /tablero)
  children: React.ReactNode;
};

// GuardiaRol: protege una ruta completa — redirige si el usuario no tiene
// ninguno de los roles permitidos. El backend es siempre la fuente de verdad;
// este componente es solo UX (previene pantallas inútiles, no es seguridad real).
export function GuardiaRol({ roles, redirigirA = '/tablero', children }: PropiedadesGuardiaRol) {
  const { nombreRol } = usarRolActivo();
  const upper = nombreRol.toUpperCase().trim();
  const permitido = roles.some((r) => upper === r);

  if (!permitido) return <Navigate to={redirigirA} replace />;
  return <>{children}</>;
}
