import { create } from 'zustand';

type EstadoCapacidad = 'cargando' | 'habilitada' | 'bloqueada';

type AlmacenCapacidades = {
  capacidades: Record<string, EstadoCapacidad>;
  establecerCapacidad: (codigo: string, estado: EstadoCapacidad) => void;
  inicializar: (codigos: string[]) => void;
};

export const usarAlmacenCapacidades = create<AlmacenCapacidades>((set) => ({
  capacidades: {},
  establecerCapacidad: (codigo, estado) =>
    set((s) => ({ capacidades: { ...s.capacidades, [codigo]: estado } })),
  inicializar: (codigos) => {
    const mapa: Record<string, EstadoCapacidad> = {};
    codigos.forEach((c) => (mapa[c] = 'habilitada'));
    set({ capacidades: mapa });
  },
}));
