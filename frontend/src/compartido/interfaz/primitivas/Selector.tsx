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

// Radix prohíbe <Select.Item value="">. Mapeamos internamente el string vacío a
// un sentinel para que una opción "Cualquiera"/"Todos" (valor: '') no rompa la app.
const VALOR_VACIO = '__valor_vacio__';
const haciaRadix = (v: string) => (v === '' ? VALOR_VACIO : v);
const desdeRadix = (v: string) => (v === VALOR_VACIO ? '' : v);

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
  const hayOpcionVacia = opciones.some((op) => op.valor === '');
  // valor='' con una opción explícita vacía → mostrar esa opción; si no, placeholder.
  const valorRadix = valor === '' ? (hayOpcionVacia ? VALOR_VACIO : undefined) : valor;

  return (
    <RadixSelect.Root
      value={valorRadix}
      onValueChange={(v) => alCambiar(desdeRadix(v))}
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
                value={haciaRadix(op.valor)}
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
