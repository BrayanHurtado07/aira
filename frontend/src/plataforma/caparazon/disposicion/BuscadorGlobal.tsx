import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

export function BuscadorGlobal() {
  const [expandido, setExpandido] = useState(false);
  const [consulta, setConsulta] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const abrir = useCallback(() => {
    setExpandido(true);
    // defer to allow CSS transition to start
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const cerrar = useCallback(() => {
    setConsulta('');
    setExpandido(false);
  }, []);

  // Atajos de teclado: ⌘K / Ctrl+K para abrir, Escape para cerrar
  useEffect(() => {
    function manejarTeclado(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        abrir();
      }
      if (e.key === 'Escape' && expandido) {
        cerrar();
      }
    }
    document.addEventListener('keydown', manejarTeclado);
    return () => document.removeEventListener('keydown', manejarTeclado);
  }, [expandido, abrir, cerrar]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!expandido) return;
    function alClickFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        if (!consulta) cerrar();
      }
    }
    document.addEventListener('mousedown', alClickFuera);
    return () => document.removeEventListener('mousedown', alClickFuera);
  }, [expandido, consulta, cerrar]);

  return (
    <div
      ref={contenedorRef}
      className={`buscador-global${expandido ? ' buscador-global--expandido' : ''}`}
      role="search"
    >
      <button
        className="buscador-icono-btn"
        onClick={abrir}
        aria-label="Buscar"
        type="button"
        tabIndex={expandido ? -1 : 0}
      >
        <Search size={15} />
      </button>

      <div className="buscador-campo">
        <Search size={13} className="buscador-campo-icono" aria-hidden="true" />
        <input
          ref={inputRef}
          className="buscador-input"
          type="search"
          placeholder="Buscar en Serbio…"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          aria-label="Buscador global"
          autoComplete="off"
        />
        {consulta ? (
          <button
            className="buscador-limpiar"
            onClick={cerrar}
            type="button"
            aria-label="Limpiar búsqueda"
          >
            <X size={11} />
          </button>
        ) : (
          <kbd className="buscador-atajo" aria-hidden="true">⌘K</kbd>
        )}
      </div>
    </div>
  );
}
