import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Check } from 'lucide-react';
import { Campo } from '@/compartido/interfaz/primitivas/Campo';
import { usarIniciarSesion } from '../ganchos/usarIniciarSesion';

const VENTAJAS = [
  'Reservas automáticas por WhatsApp 24/7',
  'Agenda en tiempo real para cada barbero',
  'Programa de lealtad integrado con sellos',
  'Reportes de ingresos diarios y mensuales',
];

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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#0A0A0A',
      }}
    >
      {/* ── Panel izquierdo — marca ── */}
      <div
        style={{
          flex: '0 0 44%',
          backgroundColor: '#0D0D0D',
          borderRight: '1px solid rgba(248,245,240,0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '4rem 3.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow rojo ambient */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            width: '65%',
            height: '65%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(204,28,46,0.09) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Glow azul inferior */}
        <div
          style={{
            position: 'absolute',
            bottom: '-5%',
            right: '-5%',
            width: '45%',
            height: '45%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(27,58,140,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.75rem' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.625rem',
              background: '#CC1C2E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Scissors size={16} />
          </div>
          <span
            style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              color: '#F8F5F0',
              letterSpacing: '-0.03em',
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            AI<span style={{ color: '#CC1C2E' }}>RA</span>
          </span>
        </div>

        {/* Tagline */}
        <h1
          style={{
            fontSize: '2.25rem',
            fontWeight: 900,
            color: '#F8F5F0',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          Tu barbería,<br />
          <span style={{ color: '#CC1C2E' }}>automatizada.</span>
        </h1>

        {/* Franja tricolor */}
        <div style={{ display: 'flex', height: '3px', width: '3.5rem', borderRadius: '2px', marginBottom: '1.25rem', overflow: 'hidden' }}>
          <span style={{ flex: 1, background: '#CC1C2E' }} />
          <span style={{ flex: 1, background: '#1B3A8C' }} />
          <span style={{ flex: 1, background: '#F8F5F0' }} />
        </div>

        <p
          style={{
            fontSize: '0.9375rem',
            color: 'rgba(248,245,240,0.45)',
            lineHeight: 1.65,
            marginBottom: '2rem',
          }}
        >
          Gestiona reservas, barberos y clientes
          desde un solo lugar. 24/7.
        </p>

        {/* Ventajas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {VENTAJAS.map((v) => (
            <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'rgba(204,28,46,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#CC1C2E',
                }}
              >
                <Check size={10} strokeWidth={3} />
              </div>
              <span style={{ fontSize: '0.875rem', color: 'rgba(248,245,240,0.7)' }}>{v}</span>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 'auto', paddingTop: '3rem', fontSize: '0.6875rem', color: 'rgba(248,245,240,0.18)', fontFamily: "'Oswald', Impact, sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Codeplex · SaaS Composable
        </p>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          position: 'relative',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h2
            style={{
              fontSize: '1.375rem',
              fontWeight: 700,
              color: '#F8F5F0',
              marginBottom: '0.375rem',
              fontFamily: "'Playfair Display', Georgia, serif",
              letterSpacing: '-0.02em',
            }}
          >
            Bienvenido de vuelta
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'rgba(248,245,240,0.42)',
              marginBottom: '2rem',
            }}
          >
            Ingresa a tu cuenta de administrador
          </p>

          <div
            style={{
              backgroundColor: '#111111',
              borderRadius: '1rem',
              border: '1px solid rgba(248,245,240,0.08)',
              overflow: 'hidden',
              boxShadow: '0 24px 56px rgba(0,0,0,0.6)',
            }}
          >
            {/* Franja tricolor superior */}
            <div style={{ display: 'flex', height: '3px' }}>
              <span style={{ flex: 1, background: '#CC1C2E' }} />
              <span style={{ flex: 1, background: '#1B3A8C' }} />
              <span style={{ flex: 1, background: '#F8F5F0' }} />
            </div>

            <div style={{ padding: '2rem' }}>
              <form onSubmit={enviarFormulario} noValidate>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                  <Campo etiqueta="Correo electrónico">
                    <input
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      placeholder="correo@barberia.com"
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
                      required
                      className="campo-input"
                    />
                  </Campo>

                  {error && (
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: '#EF4444',
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '0.5rem',
                        margin: 0,
                        border: '1px solid rgba(239,68,68,0.2)',
                      }}
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={enviando}
                    className="btn-aira"
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      backgroundColor: '#CC1C2E',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.625rem',
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      cursor: enviando ? 'not-allowed' : 'pointer',
                      opacity: enviando ? 0.7 : 1,
                      letterSpacing: '-0.01em',
                      fontFamily: "'Oswald', Impact, sans-serif",
                    }}
                  >
                    {enviando ? 'Ingresando...' : 'Ingresar a AIRA →'}
                  </button>

                  <button
                    type="button"
                    onClick={() => navegar('/solicitar-reset')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(248,245,240,0.35)',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      paddingTop: '0.25rem',
                      transition: 'color 150ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(248,245,240,0.7)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(248,245,240,0.35)')}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </form>
            </div>
          </div>

          <p
            style={{
              marginTop: '1.25rem',
              fontSize: '0.6875rem',
              color: 'rgba(248,245,240,0.18)',
              textAlign: 'center',
              fontFamily: "'Oswald', Impact, sans-serif",
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Serbio Admin v0.1.0 · Codeplex
          </p>
        </div>
      </div>
    </div>
  );
}
