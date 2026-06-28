import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SesionActiva = {
  token: string;
  refreshToken?: string;
  sesionId: string;
  usuarioId: string;
  nombre: string;
  barberiaId: string;
  sedeId: string;
  periodoId: string;
  expiraEn: string;
  nombreRol: string;
};

type AlmacenSesion = {
  sesion: SesionActiva | null;
  cargando: boolean;
  guardarSesion: (s: SesionActiva) => void;
  actualizarToken: (token: string, refreshToken: string, sesionId: string) => void;
  limpiarSesion: () => void;
};

export const usarAlmacenSesion = create<AlmacenSesion>()(
  persist(
    (set) => ({
      sesion: null,
      cargando: false,
      guardarSesion: (sesion) => set({ sesion }),
      actualizarToken: (token, refreshToken, sesionId) =>
        set((estado) =>
          estado.sesion ? { sesion: { ...estado.sesion, token, refreshToken, sesionId } } : {},
        ),
      limpiarSesion: () => set({ sesion: null }),
    }),
    { name: 'aira_sesion' },
  ),
);
