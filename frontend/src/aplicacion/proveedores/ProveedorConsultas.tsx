import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const clienteConsultas = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

type PropiedadesProveedorConsultas = {
  children: React.ReactNode;
};

export function ProveedorConsultas({ children }: PropiedadesProveedorConsultas) {
  return (
    <QueryClientProvider client={clienteConsultas}>{children}</QueryClientProvider>
  );
}
