// Roles del sistema — coinciden exactamente con nombre del rol en la BD.
// El backend devuelve nombre_rol en la respuesta de iniciar_sesion.

// IMPORTANTE: los valores deben coincidir EXACTAMENTE con rol.nombre en la BD.
// El backend usa 'ADMIN' (no 'ADMIN_BARBERIA'); la clave conserva el nombre del
// dominio pero el valor es el real, o el GuardiaRol bloquea al admin en bucle.
export const ROL = {
  SUPERADMIN:     'SUPERADMIN',
  ADMIN_BARBERIA: 'ADMIN',
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

// rutaInicialPorRol: a dónde mandar al usuario tras iniciar sesión. El cliente no
// usa el panel administrativo; el resto entra al tablero.
export function rutaInicialPorRol(nombreRol: string | undefined | null): string {
  if (esCliente(nombreRol)) return '/';
  return '/tablero';
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
