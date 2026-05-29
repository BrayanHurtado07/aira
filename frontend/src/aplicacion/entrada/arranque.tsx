import { useEffect } from 'react';
import { Toaster } from 'sonner';
import '@/aplicacion/estilos/index.css';
import { ProveedoresAplicacion } from '@/aplicacion/proveedores/ProveedoresAplicacion';
import { Enrutamiento } from '@/aplicacion/enrutamiento';
import { usarAlmacenTema } from '@/plataforma/tema/almacen-tema';

function InicializadorTema() {
  const { inicializarTema } = usarAlmacenTema();
  useEffect(() => { inicializarTema(); }, [inicializarTema]);
  return null;
}

export function Arranque() {
  const tema = usarAlmacenTema((s) => s.tema);

  return (
    <ProveedoresAplicacion>
      <InicializadorTema />
      <Enrutamiento />
      <Toaster
        position="bottom-right"
        richColors
        expand={false}
        duration={4000}
        theme={tema === 'oscuro' ? 'dark' : 'light'}
        toastOptions={{
          style: { fontFamily: 'var(--fuente-base)', fontSize: 'var(--tamano-sm)' },
        }}
      />
    </ProveedoresAplicacion>
  );
}
