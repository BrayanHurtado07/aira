import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Tema = 'claro' | 'oscuro';

interface EstadoTema {
  tema: Tema;
  alternarTema: () => void;
  inicializarTema: () => void;
}

function aplicarTema(tema: Tema) {
  document.documentElement.setAttribute('data-tema', tema);
}

export const usarAlmacenTema = create<EstadoTema>()(
  persist(
    (set, get) => ({
      tema: 'oscuro',
      alternarTema() {
        const nuevo: Tema = get().tema === 'claro' ? 'oscuro' : 'claro';
        aplicarTema(nuevo);
        set({ tema: nuevo });
      },
      inicializarTema() {
        aplicarTema(get().tema);
      },
    }),
    { name: 'serbio-tema' }
  )
);
