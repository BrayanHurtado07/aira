import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AlmacenTour = {
  completado: boolean;      // true = ya hizo el tour al menos una vez
  activo: boolean;          // true = tour corriendo ahora mismo
  iniciarTour: () => void;
  detenerTour: () => void;
  marcarCompletado: () => void;
};

export const usarAlmacenTour = create<AlmacenTour>()(
  persist(
    (set) => ({
      completado: false,
      activo: false,
      iniciarTour:      () => set({ activo: true }),
      detenerTour:      () => set({ activo: false }),
      marcarCompletado: () => set({ completado: true, activo: false }),
    }),
    {
      name: 'aira_tour',
      partialize: (s) => ({ completado: s.completado }),
    },
  ),
);
