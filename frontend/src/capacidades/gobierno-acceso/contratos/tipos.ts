export type SolicitudAsignarAlcance = {
  usuario_id: string;
  empresa_id: string;
  rol_id: string;
};

export type Alcance = {
  id: string;
  usuario_id: string;
  empresa_id: string;
  rol_id: string;
  estado: string;
};

export type AlcanceResumen = {
  id: string;
  usuario_id: string;
  nombre_usuario: string;
  empresa_id: string;
  rol_id: string;
  nombre_rol: string;
  estado: string;
  creado_en: string;
};

export type RolResumen = {
  id: string;
  nombre: string;
};

export type UsuarioResumen = {
  id: string;
  nombre: string;
  correo: string;
  estado: string;
};
