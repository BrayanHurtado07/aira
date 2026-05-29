import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ContextoActivo = {
  barberiaId: string;
  barberiaNombre: string;
  sedeId: string;
  sedeNombre: string;
  periodoId: string;
  periodoLabel: string;
};

type AlmacenContexto = {
  contexto: ContextoActivo | null;
  establecerContexto: (c: ContextoActivo) => void;
  limpiarContexto: () => void;
};

export const usarAlmacenContexto = create<AlmacenContexto>()(
  persist(
    (set) => ({
      contexto: null,
      establecerContexto: (contexto) => set({ contexto }),
      limpiarContexto: () => set({ contexto: null }),
    }),
    { name: 'aira_contexto' },
  ),
);
