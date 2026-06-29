import { Avatar } from './Avatar';

type PropsCeldaCliente = {
  nombre?: string | null;
  telefono?: string | null;
  /** Texto cuando no hay nombre (ej. cliente no resuelto). */
  fallback?: string;
  tamano?: 'sm' | 'md';
  /** Línea secundaria alternativa al teléfono (ej. correo). */
  secundario?: string | null;
};

// Celda de cliente: avatar (monograma + color por nombre) + nombre + dato de contacto.
// Único lugar donde vive este patrón — antes se reimplementaba inline en reservas,
// clientes, lista de espera y la tarjeta de cliente.
export function CeldaCliente({ nombre, telefono, fallback = 'Cliente', tamano = 'md', secundario }: PropsCeldaCliente) {
  const sub = secundario ?? telefono;
  return (
    <div className="celda-cliente">
      <Avatar nombre={nombre || undefined} tamano={tamano} monograma colorAuto />
      <div className="celda-cliente-info">
        <span className="celda-cliente-nombre">{nombre || fallback}</span>
        {sub && <span className="celda-cliente-sub">{sub}</span>}
      </div>
    </div>
  );
}
