import { Moon, Sun, Menu } from 'lucide-react';
import { SelectorContexto } from '@/plataforma/contexto/SelectorContexto';
import { usarAlmacenSesion } from '@/plataforma/identidad/almacen-sesion';
import { cerrarSesionGlobal } from '@/plataforma/identidad/cliente-autenticacion';
import { usarAlmacenTema } from '@/plataforma/tema/almacen-tema';
import { useNavigate } from 'react-router-dom';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';

interface Props {
  /** Abre la barra lateral en móvil */
  alAbrirBarra: () => void;
}

export function CabeceraCaparazon({ alAbrirBarra }: Props) {
  const { sesion, limpiarSesion } = usarAlmacenSesion();
  const { tema, alternarTema } = usarAlmacenTema();
  const navegar = useNavigate();

  async function manejarCerrarSesion() {
    try { await cerrarSesionGlobal(); } finally {
      limpiarSesion();
      navegar('/iniciar-sesion', { replace: true });
    }
  }

  return (
    <header className="cabecera-caparazon">
      {/* Botón hamburguesa — solo visible en móvil via CSS */}
      <button
        className="btn-hamburguesa"
        onClick={alAbrirBarra}
        aria-label="Abrir menú lateral"
        type="button"
      >
        <Menu size={18} />
      </button>

      <SelectorContexto />

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacio-sm)', marginLeft: 'auto' }}>
        <span style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)' }}>
          {sesion?.nombre}
        </span>

        {/* Toggle de tema */}
        <button
          onClick={alternarTema}
          className="btn-aira"
          title={tema === 'claro' ? 'Activar modo oscuro' : 'Activar modo claro'}
          aria-label={tema === 'claro' ? 'Activar modo oscuro' : 'Activar modo claro'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2rem',
            height: '2rem',
            borderRadius: 'var(--radio-md)',
            border: '1px solid var(--color-borde)',
            backgroundColor: 'var(--color-superficie)',
            color: 'var(--color-texto-suave)',
            cursor: 'pointer',
          }}
        >
          {tema === 'claro' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        <Boton variante="fantasma" tamano="sm" onClick={manejarCerrarSesion}>
          Cerrar sesión
        </Boton>
      </div>
    </header>
  );
}
