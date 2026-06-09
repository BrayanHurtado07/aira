import { useCallback } from 'react';
import { Joyride, type EventData, type ButtonType, STATUS, EVENTS } from 'react-joyride';
import { usarAlmacenTour } from './almacen-tour';
import { usarRolActivo } from '@/plataforma/identidad/ganchos/usarRolActivo';
import { PASOS_TOUR, PASOS_TOUR_BARBERO } from './pasos-tour';

const OPCIONES_TOUR = {
  primaryColor:     'var(--color-primario, #CC1C2E)',
  backgroundColor:  'var(--color-fondo-elevado, #ffffff)',
  textColor:        'var(--color-texto, #1a1a1a)',
  overlayColor:     'rgba(0, 0, 0, 0.45)',
  showProgress:     true,
  skipBeacon:       true,
  buttons:          ['back', 'close', 'primary', 'skip'] as ButtonType[],
  zIndex:           9999,
};

const ESTILOS_TOUR = {
  tooltip: {
    borderRadius: '0.75rem',
    padding:      '1.25rem',
    boxShadow:    '0 8px 32px rgba(0,0,0,0.12)',
    maxWidth:     '340px',
  } as React.CSSProperties,
  tooltipTitle: {
    fontSize:     '0.9375rem',
    fontWeight:   700,
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  tooltipContent: {
    fontSize:   '0.875rem',
    lineHeight: '1.55',
    padding:    '0',
  } as React.CSSProperties,
  buttonNext: {
    backgroundColor: 'var(--color-primario, #CC1C2E)',
    borderRadius:    '0.5rem',
    fontSize:        '0.8125rem',
    fontWeight:      '600',
    padding:         '0.5rem 1rem',
  } as React.CSSProperties,
  buttonBack: {
    color:       'var(--color-texto-suave, #64748b)',
    fontSize:    '0.8125rem',
    marginRight: '0.5rem',
  } as React.CSSProperties,
  buttonSkip: {
    color:    'var(--color-texto-suave, #64748b)',
    fontSize: '0.8125rem',
  } as React.CSSProperties,
};

const TEXTOS_TOUR = {
  back:  'Atrás',
  close: 'Cerrar',
  last:  '¡Listo!',
  next:  'Siguiente',
  open:  'Abrir tour',
  skip:  'Saltar tour',
};

export function TourAplicativo() {
  const { activo, marcarCompletado } = usarAlmacenTour();
  const { esBarbero } = usarRolActivo();

  const pasos = esBarbero ? PASOS_TOUR_BARBERO : PASOS_TOUR;

  const manejarEvento = useCallback(
    (data: EventData) => {
      const { status, type } = data;

      if (type === EVENTS.TOUR_END) {
        marcarCompletado();
        return;
      }
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        marcarCompletado();
      }
    },
    [marcarCompletado],
  );

  if (!activo) return null;

  return (
    <Joyride
      steps={pasos}
      run={activo}
      continuous
      scrollToFirstStep
      locale={TEXTOS_TOUR}
      options={OPCIONES_TOUR}
      styles={ESTILOS_TOUR}
      onEvent={manejarEvento}
    />
  );
}
