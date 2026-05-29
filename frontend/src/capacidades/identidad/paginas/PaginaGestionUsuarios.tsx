import React from 'react';
import { useState } from 'react';
import { Campo } from '@/compartido/interfaz/primitivas/Campo';
import { Boton } from '@/compartido/interfaz/primitivas/Boton';
import { usarCambiarPassword } from '../ganchos/usarCambiarPassword';

function FormularioCambiarPassword() {
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const { ejecutar, enviando, exito, error } = usarCambiarPassword();

  const enviarFormulario = (e: React.FormEvent) => {
    e.preventDefault();
    ejecutar({ contrasena_actual: contrasenaActual, contrasena_nueva: contrasenaNueva });
  };

  return (
    <form onSubmit={enviarFormulario} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-md)' }}>
        <Campo etiqueta="Contraseña actual">
          <input
            type="password"
            value={contrasenaActual}
            onChange={(e) => setContrasenaActual(e.target.value)}
            placeholder="••••••••"
            required
            style={{
              width: '100%',
              padding: 'var(--espacio-sm) var(--espacio-md)',
              border: '1px solid var(--color-borde)',
              borderRadius: 'var(--radio-md)',
              fontSize: 'var(--texto-md)',
              color: 'var(--color-texto)',
              backgroundColor: 'var(--color-fondo-input)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </Campo>

        <Campo etiqueta="Nueva contraseña">
          <input
            type="password"
            value={contrasenaNueva}
            onChange={(e) => setContrasenaNueva(e.target.value)}
            placeholder="••••••••"
            required
            style={{
              width: '100%',
              padding: 'var(--espacio-sm) var(--espacio-md)',
              border: '1px solid var(--color-borde)',
              borderRadius: 'var(--radio-md)',
              fontSize: 'var(--texto-md)',
              color: 'var(--color-texto)',
              backgroundColor: 'var(--color-fondo-input)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </Campo>

        {error && (
          <p
            style={{
              fontSize: 'var(--texto-sm)',
              color: 'var(--color-error)',
              backgroundColor: 'var(--color-error-suave)',
              padding: 'var(--espacio-sm) var(--espacio-md)',
              borderRadius: 'var(--radio-md)',
              margin: 0,
            }}
          >
            {error}
          </p>
        )}

        {exito && (
          <p
            style={{
              fontSize: 'var(--texto-sm)',
              color: 'var(--color-exito)',
              backgroundColor: 'var(--color-exito-suave)',
              padding: 'var(--espacio-sm) var(--espacio-md)',
              borderRadius: 'var(--radio-md)',
              margin: 0,
            }}
          >
            Contraseña actualizada correctamente.
          </p>
        )}

        <Boton type="submit" variante="primario" tamano="md" cargando={enviando}>
          Actualizar contraseña
        </Boton>
      </div>
    </form>
  );
}

export function PaginaGestionUsuarios() {
  return (
    <div style={{ padding: 'var(--espacio-xl)' }}>
      <h1
        style={{
          fontSize: 'var(--texto-2xl)',
          fontWeight: 700,
          color: 'var(--color-texto)',
          marginBottom: 'var(--espacio-xl)',
        }}
      >
        Gestión de Usuarios
      </h1>

      <div
        style={{
          maxWidth: '480px',
          backgroundColor: 'var(--color-superficie)',
          borderRadius: 'var(--radio-lg)',
          padding: 'var(--espacio-xl)',
          boxShadow: 'var(--sombra-sm)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--texto-lg)',
            fontWeight: 600,
            color: 'var(--color-texto)',
            marginBottom: 'var(--espacio-lg)',
          }}
        >
          Cambiar contraseña
        </h2>

        <FormularioCambiarPassword />
      </div>
    </div>
  );
}
