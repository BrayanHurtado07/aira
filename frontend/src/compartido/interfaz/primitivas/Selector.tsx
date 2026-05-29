import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';

export interface OpcionSelector {
  valor: string;
  etiqueta: string;
  descripcion?: string;
  deshabilitada?: boolean;
}

interface PropiedadesSelector {
  valor: string;
  alCambiar: (valor: string) => void;
  opciones: OpcionSelector[];
  placeholder?: string;
  deshabilitado?: boolean;
  error?: boolean;
  id?: string;
  cargando?: boolean;
}

export function Selector({
  valor,
  alCambiar,
  opciones,
  placeholder = 'Seleccionar...',
  deshabilitado = false,
  error = false,
  id,
  cargando = false,
}: PropiedadesSelector) {
  const estaDeshabilitado = deshabilitado || cargando;

  return (
    <RadixSelect.Root
      value={valor || undefined}
      onValueChange={alCambiar}
      disabled={estaDeshabilitado}
    >
      <RadixSelect.Trigger
        id={id}
        className={[
          'selector-trigger',
          error ? 'selector-trigger--error' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={placeholder}
      >
        <RadixSelect.Value
          placeholder={cargando ? 'Cargando…' : placeholder}
        />
        <RadixSelect.Icon className="selector-icono">
          <ChevronDown size={14} />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className="selector-contenido"
          position="popper"
          sideOffset={4}
          align="start"
        >
          <RadixSelect.Viewport className="selector-viewport">
            {opciones.map((op) => (
              <RadixSelect.Item
                key={op.valor}
                value={op.valor}
                disabled={op.deshabilitada}
                className="selector-opcion"
              >
                <RadixSelect.ItemText>{op.etiqueta}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="selector-opcion-marca">
                  <Check size={12} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
