import { clienteHttp } from '@/integraciones/http/cliente';
import type {
  EmpresaResumen,
  SolicitudOnboardearEmpresa,
  RespuestaOnboardearEmpresa,
} from '../contratos/tipos';

type RespuestaListar = { empresas: EmpresaResumen[]; total: number };

export const listarEmpresasPlataforma = () =>
  clienteHttp.get<RespuestaListar>('/superadmin/empresas');

export const onboardearEmpresa = (solicitud: SolicitudOnboardearEmpresa) =>
  clienteHttp.post<RespuestaOnboardearEmpresa>('/superadmin/empresas', solicitud);

// ── compat: el servicio anterior usaba /empresas sin datos de admin ────────────
export type { EmpresaResumen, SolicitudOnboardearEmpresa, RespuestaOnboardearEmpresa };
