import React from 'react';
type PropiedadesGuardiaPermiso = {
  permiso: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function GuardiaPermiso({
  children,
  fallback = null,
}: PropiedadesGuardiaPermiso) {
  // El backend es la fuente de verdad sobre permisos.
  // Aquí se renderiza el contenido; si el backend rechaza la acción,
  // el error se muestra vía el gancho correspondiente.
  // En una versión avanzada, este componente consultaría el alcance activo.
  return <>{children ?? fallback}</>;
}
