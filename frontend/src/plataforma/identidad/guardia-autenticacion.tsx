import React from 'react';
import { Navigate } from 'react-router-dom';
import { PantallaCarga } from '@/compartido/interfaz/retroalimentacion/PantallaCarga';
import { usarSesionActiva } from './ganchos/usarSesionActiva';

type PropiedadesGuardiaAutenticacion = {
  children: React.ReactNode;
};

export function GuardiaAutenticacion({ children }: PropiedadesGuardiaAutenticacion) {
  const sesion = usarSesionActiva();

  if (sesion.cargando) return <PantallaCarga mensaje="Verificando sesión" />;
  if (!sesion.activa) return <Navigate to="/iniciar-sesion" replace />;

  return <>{children}</>;
}
