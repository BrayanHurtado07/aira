import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        backgroundColor: '#0F0F0F',
      }}
    >
      {/* Panel izquierdo — marca */}
      <div
        style={{
          flex: '0 0 44%',
          backgroundColor: '#111111',
          borderRight: '1px solid #1E1E1E',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '4rem 3.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow ambient */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.625rem',
              background: 'linear-gradient(135deg, #C9A84C 0%, #8B6A1F 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 800,
              color: '#111',
            }}
          >
            S
          </div>
          <span style={{ fontSize: '1.375rem', fontWeight: 700, color: '#C9A84C', letterSpacing: '-0.02em' }}>
            Serbio
          </span>
        </div>

        {/* Tagline */}
        <h1
          style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            color: '#EFEFEF',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
          }}
        >
          Tu barbería,<br />
          <span style={{ color: '#C9A84C' }}>automatizada.</span>
        </h1>

        <div
          style={{
            width: '3rem',
            height: '3px',
            backgroundColor: '#C9A84C',
            borderRadius: '2px',
            marginBottom: '1.25rem',
          }}
        />

        <p
          style={{
            fontSize: '0.9375rem',
            color: '#7A7A7A',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          Gestiona reservas, barberos y clientes
          desde un solo lugar. 24/7.
        </p>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {VENTAJAS.map((v) => (
            <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'rgba(201,168,76,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.6875rem',
                  color: '#C9A84C',
                  fontWeight: 700,
                }}
              >
                ✓
              </div>
              <span style={{ fontSize: '0.875rem', color: '#EFEFEF' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Footer marca */}
        <p style={{ marginTop: 'auto', paddingTop: '3rem', fontSize: '0.6875rem', color: '#3D3D3D' }}>
          Codeplex · SaaS Composable
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#EFEFEF',
              marginBottom: '0.375rem',
            }}
          >
            Bienvenido de vuelta
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#7A7A7A',
              marginBottom: '2rem',
            }}
          >
            Ingresa a tu cuenta de administrador
          </p>

          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '1rem',
              border: '1px solid #2A2A2A',
              padding: '2rem',
              boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
            }}
          >
            {/* Barra gold superior */}
            <div
              style={{
                height: '3px',
                background: 'linear-gradient(90deg, #C9A84C 0%, #8B6A1F 100%)',
                borderRadius: '2px',
                marginBottom: '1.75rem',
                marginLeft: '-2rem',
                marginRight: '-2rem',
                marginTop: '-2rem',
                borderTopLeftRadius: '1rem',
                borderTopRightRadius: '1rem',
              }}
            />

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
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #2A2A2A',
                      borderRadius: '0.625rem',
                      fontSize: '0.9375rem',
                      color: '#EFEFEF',
                      backgroundColor: '#222222',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
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
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #2A2A2A',
                      borderRadius: '0.625rem',
                      fontSize: '0.9375rem',
                      color: '#EFEFEF',
                      backgroundColor: '#222222',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
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
                    backgroundColor: '#C9A84C',
                    color: '#111111',
                    border: 'none',
                    borderRadius: '0.625rem',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    cursor: enviando ? 'not-allowed' : 'pointer',
                    opacity: enviando ? 0.7 : 1,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {enviando ? 'Ingresando...' : 'Ingresar a Serbio →'}
                </button>

                <button
                  type="button"
                  onClick={() => navegar('/solicitar-reset')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#7A7A7A',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    paddingTop: '0.25rem',
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          </div>

          <p
            style={{
              marginTop: '1.25rem',
              fontSize: '0.75rem',
              color: '#3D3D3D',
              textAlign: 'center',
            }}
          >
            Serbio Admin v0.1.0 · Codeplex
          </p>
        </div>
      </div>
    </div>
  );
}
