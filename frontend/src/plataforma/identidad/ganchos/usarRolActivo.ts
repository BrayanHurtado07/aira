import { usarAlmacenSesion } from '../almacen-sesion';
import { ROL, esAdmin, esBarbero, esCliente, esSuperAdmin, type Rol } from '../roles';

export function usarRolActivo() {
  const nombreRol = usarAlmacenSesion((s) => s.sesion?.nombreRol ?? '');

  return {
    nombreRol,
    rol: (nombreRol.toUpperCase().trim() as Rol) || null,
    esSuperAdmin:     esSuperAdmin(nombreRol),
    esAdmin:          esAdmin(nombreRol),       // ADMIN_BARBERIA o SUPERADMIN
    esAdminPuro:      nombreRol.toUpperCase() === ROL.ADMIN_BARBERIA,
    esBarbero:        esBarbero(nombreRol),
    esCliente:        esCliente(nombreRol),
    tieneAccesoAdmin: esAdmin(nombreRol),
  };
}
