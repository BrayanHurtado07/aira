// Roles del sistema — coinciden exactamente con nombre del rol en la BD.
// El backend devuelve nombre_rol en la respuesta de iniciar_sesion.

export const ROL = {
  SUPERADMIN:     'SUPERADMIN',
  ADMIN_BARBERIA: 'ADMIN_BARBERIA',
  BARBERO:        'BARBERO',
  CLIENTE:        'CLIENTE',
} as const;

export type Rol = (typeof ROL)[keyof typeof ROL];

export function esRol(nombreRol: string | undefined | null, ...roles: Rol[]): boolean {
  if (!nombreRol) return false;
  const upper = nombreRol.toUpperCase().trim();
  return roles.some((r) => upper === r);
}

export function esSuperAdmin(nombreRol: string | undefined | null): boolean {
  return esRol(nombreRol, ROL.SUPERADMIN);
}

// esAdmin: true si tiene acceso administrativo (ADMIN_BARBERIA o SUPERADMIN)
export function esAdmin(nombreRol: string | undefined | null): boolean {
  return esRol(nombreRol, ROL.ADMIN_BARBERIA, ROL.SUPERADMIN);
}

export function esBarbero(nombreRol: string | undefined | null): boolean {
  return esRol(nombreRol, ROL.BARBERO);
}

export function esCliente(nombreRol: string | undefined | null): boolean {
  return esRol(nombreRol, ROL.CLIENTE);
}

// Devuelve la etiqueta legible del rol para mostrar en la UI
export function etiquetaRol(nombreRol: string | undefined | null): string {
  switch (nombreRol?.toUpperCase().trim()) {
    case ROL.SUPERADMIN:     return 'Super Admin';
    case ROL.ADMIN_BARBERIA: return 'Administrador';
    case ROL.BARBERO:        return 'Barbero';
    case ROL.CLIENTE:        return 'Cliente';
    default:                 return nombreRol ?? '';
  }
}
