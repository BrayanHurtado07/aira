import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { CalendarDays, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import 'react-day-picker/style.css';

interface PropiedadesSelectorFecha {
  /** Valor en formato "YYYY-MM-DDTHH:MM" (datetime-local) */
  valor: string;
  alCambiar: (valor: string) => void;
  error?: boolean;
  deshabilitado?: boolean;
  id?: string;
  /** Si es true sólo se selecciona la fecha (sin hora). Devuelve "YYYY-MM-DD". */
  soloFecha?: boolean;
}

function valorAFecha(valor: string): Date {
  if (!valor) return new Date();
  const parte = valor.includes('T') ? valor : valor + 'T00:00';
  const [datePart, timePart = '00:00'] = parte.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

function fechaAValor(fecha: Date, soloFecha?: boolean): string {
  const anio = fecha.getFullYear();
  const mes  = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia  = String(fecha.getDate()).padStart(2, '0');
  if (soloFecha) return `${anio}-${mes}-${dia}`;
  const horas   = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  return `${anio}-${mes}-${dia}T${horas}:${minutos}`;
}

export function SelectorFecha({
  valor,
  alCambiar,
  error = false,
  deshabilitado = false,
  id,
  soloFecha = false,
}: PropiedadesSelectorFecha) {
  const [abierto, setAbierto] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const fechaActual = valor ? valorAFecha(valor) : null;
  const horaActual  = (valor && valor.includes('T')) ? valor.slice(11, 16) : '09:00';

  const etiqueta = fechaActual
    ? soloFecha
      ? format(fechaActual, "d 'de' MMMM yyyy", { locale: es })
      : format(fechaActual, "EEEE d 'de' MMMM · HH:mm", { locale: es })
    : 'Seleccionar fecha' + (soloFecha ? '' : ' y hora');

  // ── Bloquear scroll del body mientras el modal está abierto ───────────────
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [abierto]);

  const cambiarDia = (dia: Date | undefined) => {
    if (!dia) return;
    if (soloFecha) {
      alCambiar(fechaAValor(dia, true));
      setAbierto(false);
      return;
    }
    const [hh, mm] = horaActual.split(':').map(Number);
    const nueva = new Date(dia);
    nueva.setHours(hh, mm, 0, 0);
    alCambiar(fechaAValor(nueva));
  };

  const cambiarHora = (e: React.ChangeEvent<HTMLInputElement>) => {
    const base = fechaActual ?? new Date();
    const [hh, mm] = (e.target.value || '00:00').split(':').map(Number);
    const nueva = new Date(base);
    nueva.setHours(hh ?? 0, mm ?? 0, 0, 0);
    alCambiar(fechaAValor(nueva));
  };

  // ── Portal: overlay + modal centrado ─────────────────────────────────────
  const nodo = abierto ? (
    <>
      {/* Overlay — clic cierra el modal */}
      <div
        className="selector-fecha-overlay"
        onClick={() => setAbierto(false)}
        aria-hidden="true"
      />

      {/* Modal centrado en pantalla */}
      <div
        ref={popoverRef}
        className="selector-fecha-modal"
        role="dialog"
        aria-modal="true"
        aria-label={soloFecha ? 'Seleccionar fecha' : 'Seleccionar fecha y hora'}
      >
        {/* Cabecera del modal */}
        <div className="selector-fecha-modal-cabecera">
          <span className="selector-fecha-modal-titulo">
            {soloFecha ? 'Seleccionar fecha' : 'Fecha y hora'}
          </span>
          <button
            type="button"
            className="selector-fecha-modal-cerrar"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar"
          >
            <X size={15} />
          </button>
        </div>

        {/* Calendario */}
        <DayPicker
          mode="single"
          selected={fechaActual ?? undefined}
          onSelect={cambiarDia}
          locale={es}
          weekStartsOn={1}
          showOutsideDays
          components={{
            PreviousMonthButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
              <button {...props} className="rdp-nav-btn"><ChevronLeft size={14} /></button>
            ),
            NextMonthButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
              <button {...props} className="rdp-nav-btn"><ChevronRight size={14} /></button>
            ),
          }}
        />

        {/* Selector de hora (solo cuando no es soloFecha) */}
        {!soloFecha && (
          <div className="selector-fecha-hora">
            <Clock size={14} style={{ color: 'var(--color-texto-suave)', flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--tamano-sm)', color: 'var(--color-texto-suave)', flexShrink: 0 }}>
              Hora
            </span>
            <input
              type="time"
              value={horaActual}
              onChange={cambiarHora}
              className="campo-input"
              style={{ flex: 1, fontSize: 'var(--tamano-sm)', padding: '0.25rem 0.5rem' }}
            />
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="btn-aira"
              style={{
                padding: '0.25rem 0.625rem',
                fontSize: 'var(--tamano-xs)',
                fontWeight: 500,
                backgroundColor: 'var(--color-primario)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radio-md)',
                cursor: 'pointer',
              }}
            >
              Listo
            </button>
          </div>
        )}
      </div>
    </>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={deshabilitado}
        onClick={() => {
          if (deshabilitado) return;
          setAbierto((prev) => !prev);
        }}
        className={[
          'selector-fecha-trigger',
          abierto   ? 'selector-fecha-trigger--abierto'    : '',
          error     ? 'selector-fecha-trigger--error'       : '',
          !valor    ? 'selector-fecha-trigger--placeholder' : '',
        ].filter(Boolean).join(' ')}
      >
        <CalendarDays size={14} style={{ color: 'var(--color-texto-suave)', flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', textTransform: 'capitalize' }}>
          {etiqueta}
        </span>
      </button>

      {ReactDOM.createPortal(nodo, document.body)}
    </>
  );
}
