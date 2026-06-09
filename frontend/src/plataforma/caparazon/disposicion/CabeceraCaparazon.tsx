import { Moon, Sun, Menu, HelpCircle } from 'lucide-react';
import { SelectorContexto } from '@/plataforma/contexto/SelectorContexto';
import { usarAlmacenSesion } from '@/plataforma/identidad/almacen-sesion';
import { cerrarSesionGlobal } from '@/plataforma/identidad/cliente-autenticacion';
import { usarAlmacenTema } from '@/plataforma/tema/almacen-tema';
import { useNavigate } from 'react-router-dom';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { MigasDePan } from './MigasDePan';
import { BuscadorGlobal } from './BuscadorGlobal';
import { usarAlmacenTour } from '@/plataforma/tour/almacen-tour';

interface Props {
  alAbrirBarra: () => void;
}

export function CabeceraCaparazon({ alAbrirBarra }: Props) {
  const { sesion, limpiarSesion } = usarAlmacenSesion();
  const { tema, alternarTema } = usarAlmacenTema();
  const navegar = useNavigate();
  const { iniciarTour } = usarAlmacenTour();

  async function manejarCerrarSesion() {
    try { await cerrarSesionGlobal(); } finally {
      limpiarSesion();
      navegar('/iniciar-sesion', { replace: true });
    }
  }

  return (
    <header className="cabecera-caparazon">
      {/* ── Sección izquierda: hamburguesa + migas de pan ── */}
      <div className="cabecera-izquierda">
        <button
          className="btn-hamburguesa"
          onClick={alAbrirBarra}
          aria-label="Abrir menú lateral"
          type="button"
        >
          <Menu size={18} />
        </button>
        <MigasDePan />
      </div>

      {/* ── Sección derecha: buscador + contexto + usuario + acciones ── */}
      <div className="cabecera-derecha">
        <BuscadorGlobal />

        <span className="cabecera-divisor" aria-hidden="true" />

        <div className="cabecera-contexto" data-tour="selector-contexto">
          <SelectorContexto />
        </div>

        <span className="cabecera-nombre-usuario" data-tour="usuario">{sesion?.nombre}</span>

        <button
          onClick={iniciarTour}
          className="btn-aira cabecera-btn-tour"
          title="Ver tour de bienvenida"
          aria-label="Ver tour de bienvenida"
        >
          <HelpCircle size={14} />
        </button>

        <button
          onClick={alternarTema}
          className="btn-aira cabecera-btn-tema"
          title={tema === 'claro' ? 'Activar modo oscuro' : 'Activar modo claro'}
          aria-label={tema === 'claro' ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
          {tema === 'claro' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        <Boton
          variante="fantasma"
          tamano="sm"
          onClick={manejarCerrarSesion}
          className="cabecera-btn-sesion"
        >
          Cerrar sesión
        </Boton>
      </div>
    </header>
  );
}
