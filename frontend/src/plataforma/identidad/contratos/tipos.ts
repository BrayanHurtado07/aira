export type SolicitudIniciarSesion = {
  correo_electronico: string;
  contrasena: string;
};

export type RespuestaIniciarSesion = {
  token: string;
  sesion_id: string;
  usuario_id: string;
  nombre: string;
  barberia_id: string;
  sede_id: string;
  periodo_id: string;
  expira_en: string;
};

export type SolicitudRegistrarUsuario = {
  nombre: string;
  correo_electronico: string;
  contrasena: string;
};

export type RespuestaRegistrar = {
  id: string;
};
