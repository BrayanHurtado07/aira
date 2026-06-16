export type EmpresaResumen = {
  ID:                  string;
  Nombre:              string;
  Slug:                string;
  Estado:              string;
  CreadoEn:            string;
  BarberosActivos:     number;
  SucursalesActivas:   number;
  ReservasUltimoMes:   number;
  EstadoSuscripcion:   string;
};

export type SolicitudOnboardearEmpresa = {
  nombre_empresa: string;
  nombre_admin:   string;
  correo_admin:   string;
  password_admin: string;
};

export type RespuestaOnboardearEmpresa = {
  empresa_id:   string;
  slug:         string;
  usuario_id:   string;
  correo_admin: string;
};
