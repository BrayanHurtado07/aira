import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SesionActiva = {
  token: string;
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
  limpiarSesion: () => void;
};

export const usarAlmacenSesion = create<AlmacenSesion>()(
  persist(
    (set) => ({
      sesion: null,
      cargando: false,
      guardarSesion: (sesion) => set({ sesion }),
      limpiarSesion: () => set({ sesion: null }),
    }),
    { name: 'aira_sesion' },
  ),
);
