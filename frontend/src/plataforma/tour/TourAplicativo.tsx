import { useCallback } from 'react';
import { Joyride, type EventData, type ButtonType, STATUS, EVENTS } from 'react-joyride';
import { usarAlmacenTour } from './almacen-tour';
import { usarRolActivo } from '@/plataforma/identidad/ganchos/usarRolActivo';
import { PASOS_TOUR, PASOS_TOUR_BARBERO } from './pasos-tour';

// Colores hardcodeados — el tour siempre se muestra en blanco/oscuro
// sin importar si el usuario está en tema claro u oscuro.
const OPCIONES_TOUR = {
  primaryColor:    '#CC1C2E',
  backgroundColor: '#ffffff',
  textColor:       '#111827',
  overlayColor:    'rgba(0, 0, 0, 0.55)',
  showProgress:    true,
  skipBeacon:      true,
  buttons:         ['back', 'close', 'primary', 'skip'] as ButtonType[],
  zIndex:          10000,
};

const ESTILOS_TOUR = {
  tooltip: {
    borderRadius: '12px',
    padding:      '20px 22px',
    boxShadow:    '0 20px 60px rgba(0,0,0,0.25)',
    maxWidth:     '360px',
    background:   '#ffffff',
  } as React.CSSProperties,
  tooltipTitle: {
    fontSize:     '1rem',
    fontWeight:   700,
    marginBottom: '6px',
    color:        '#111827',
  } as React.CSSProperties,
  tooltipContent: {
    fontSize:   '0.875rem',
    lineHeight: '1.6',
    color:      '#374151',
    padding:    '0',
    margin:     '0',
  } as React.CSSProperties,
  tooltipFooter: {
    marginTop: '16px',
  } as React.CSSProperties,
  buttonNext: {
    backgroundColor: '#CC1C2E',
    borderRadius:    '8px',
    fontSize:        '0.8125rem',
    fontWeight:      600,
    padding:         '8px 16px',
    color:           '#ffffff',
    border:          'none',
  } as React.CSSProperties,
  buttonBack: {
    color:       '#6b7280',
    fontSize:    '0.8125rem',
    marginRight: '8px',
    background:  'transparent',
    border:      'none',
  } as React.CSSProperties,
  buttonSkip: {
    color:      '#9ca3af',
    fontSize:   '0.8125rem',
    background: 'transparent',
    border:     'none',
  } as React.CSSProperties,
  options: {
    zIndex: 10000,
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
      if (type === EVENTS.TOUR_END) { marcarCompletado(); return; }
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) { marcarCompletado(); }
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
