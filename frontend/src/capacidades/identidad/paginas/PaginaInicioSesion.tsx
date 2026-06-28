import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Check } from 'lucide-react';
import { Campo } from '@/compartido/interfaz/primitivas/Campo';
import { usarIniciarSesion } from '../ganchos/usarIniciarSesion';
import '../estilos/inicio-sesion.css';

const VENTAJAS = [
  'Reservas automáticas por WhatsApp 24/7',
  'Agenda en tiempo real para cada barbero',
  'Programa de lealtad integrado con sellos',
  'Reportes de ingresos diarios y mensuales',
];

function LogoAira() {
  return (
    <>
      <div className="login__logo-icono" aria-hidden="true">
        <Scissors size={16} />
      </div>
      <span className="login__logo-texto">
        AI<span>RA</span>
      </span>
    </>
  );
}

export function PaginaInicioSesion() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const { ejecutar, enviando, error } = usarIniciarSesion();
  const navegar = useNavigate();

  const enviarFormulario = (e: React.FormEvent) => {
    e.preventDefault();
    ejecutar({ correo_electronico: correo, contrasena });
  };

  return (
    <div className="login">
      {/* ── Panel izquierdo — marca (desktop) ── */}
      <aside className="login__marca">
        <div className="login__glow login__glow--rojo" aria-hidden="true" />
        <div className="login__glow login__glow--azul" aria-hidden="true" />

        <div className="login__logo">
          <LogoAira />
        </div>

        <h1 className="login__titulo">
          Tu barbería,<br />
          <span>automatizada.</span>
        </h1>

        <div className="login__tricolor login__tricolor--marca" aria-hidden="true">
          <span /><span /><span />
        </div>

        <p className="login__sub">
          Gestiona reservas, barberos y clientes desde un solo lugar. 24/7.
        </p>

        <ul className="login__ventajas">
          {VENTAJAS.map((v) => (
            <li key={v} className="login__ventaja">
              <span className="login__ventaja-check" aria-hidden="true">
                <Check size={10} strokeWidth={3} />
              </span>
              <span>{v}</span>
            </li>
          ))}
        </ul>

        <p className="login__pie">Codeplex · SaaS Composable</p>
      </aside>

      {/* ── Panel derecho — formulario ── */}
      <main className="login__panel">
        <div className="login__form">
          <div className="login__logo-movil">
            <LogoAira />
          </div>

          <h2 className="login__bienvenida">Bienvenido de vuelta</h2>
          <p className="login__bienvenida-sub">Ingresa a tu cuenta</p>

          <div className="login__card">
            <div className="login__tricolor" aria-hidden="true">
              <span /><span /><span />
            </div>

            <div className="login__card-cuerpo">
              <form onSubmit={enviarFormulario} noValidate>
                <div className="login__campos">
                  <Campo etiqueta="Correo electrónico">
                    <input
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      placeholder="correo@barberia.com"
                      autoComplete="email"
                      required
                      className="campo-input"
                    />
                  </Campo>

                  <Campo etiqueta="Contraseña">
                    <input
                      type="password"
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className="campo-input"
                    />
                  </Campo>

                  {error && (
                    <p className="login__error" role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={enviando}
                    aria-busy={enviando}
                    className="login__boton"
                  >
                    {enviando ? 'Ingresando…' : 'Ingresar a Aira →'}
                  </button>

                  <button
                    type="button"
                    onClick={() => navegar('/solicitar-reset')}
                    className="login__olvido"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </form>
            </div>
          </div>

          <p className="login__pie-form">Aira · v0.1.0 · Codeplex</p>
        </div>
      </main>
    </div>
  );
}
