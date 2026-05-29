export type SolicitudIniciarSesion = {
  correo_electronico: string;
  contrasena: string;
};

export type RespuestaIniciarSesion = {
  token: string;
  refresh_token: string;
  sesion_id: string;
  usuario_id: string;
  nombre: string;
  barberia_id: string;
  sede_id: string;
  periodo_id: string;
  expira_en: string;
  nombre_rol: string;
};

export type SolicitudRegistrarUsuario = {
  nombre: string;
  correo_electronico: string;
  contrasena: string;
};

export type SolicitudCambiarPassword = {
  contrasena_actual: string;
  contrasena_nueva: string;
};

export type SolicitudSolicitarVerificacion = {
  correo_electronico: string;
};

export type SolicitudVerificarCorreo = {
  usuario_id: string;
  codigo: string;
};

export type SolicitudSolicitarResetPassword = {
  correo_electronico: string;
};

export type SolicitudRestablecerPassword = {
  usuario_id: string;
  codigo: string;
  nueva_contrasena: string;
};

export type SolicitudRefrescarSesion = {
  refresh_token: string;
  empresa_id?: string;
  sucursal_id?: string;
};

export type RespuestaRefrescarSesion = {
  token: string;
  refresh_token: string;
  sesion_id: string;
  usuario_id: string;
};
