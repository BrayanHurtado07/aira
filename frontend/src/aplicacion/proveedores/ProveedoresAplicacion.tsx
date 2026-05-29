import React from 'react';
import { ProveedorConsultas } from './ProveedorConsultas';

type PropiedadesProveedoresAplicacion = {
  children: React.ReactNode;
};

export function ProveedoresAplicacion({ children }: PropiedadesProveedoresAplicacion) {
  return <ProveedorConsultas>{children}</ProveedorConsultas>;
}
