import type { Step } from 'react-joyride';

// Los pasos apuntan a atributos data-tour añadidos en los componentes del caparazón.
// Si el target no existe en el DOM en ese momento, joyride lo omite.

export const PASOS_TOUR: Step[] = [
  {
    target: '[data-tour="logo"]',
    title: '¡Bienvenido a AIRA!',
    content:
      'Tu plataforma de gestión para barberias. En este recorrido te mostramos las secciones principales para que te orientes desde el primer día.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-tablero"]',
    title: 'Tablero',
    content:
      'Vista general de tu negocio: reservas del día, ingresos, rendimiento de barberos y alertas de inventario. Tu punto de partida cada mañana.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-reservas"]',
    title: 'Reservas',
    content:
      'Gestiona todas las citas. Puedes confirmar, completar o cancelar reservas, y crear nuevas directamente desde el panel.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-clientes"]',
    title: 'Clientes',
    content:
      'Directorio de clientes: nombre, teléfono, historial de reservas. Úsalo para buscar clientes al crear una cita nueva.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-barberos"]',
    title: 'Barberos',
    content:
      'Registra y gestiona tu equipo. Asigna servicios a cada barbero y configura su disponibilidad semanal.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-servicios"]',
    title: 'Servicios',
    content:
      'Define el catálogo de servicios con nombre, duración y precio. Cada servicio se asigna a los barberos que lo ofrecen.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-whatsapp"]',
    title: 'Canal WhatsApp',
    content:
      'Aquí viven las conversaciones entrantes por WhatsApp. El bot Serbio atiende consultas y crea reservas automáticamente.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-lealtad"]',
    title: 'Programa de Lealtad',
    content:
      'Acumula sellos por cada servicio y canjéalos por beneficios. Fideliza a tus clientes con recompensas automatizadas.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-organizacion"]',
    title: 'Organización',
    content:
      'Gestiona las sedes, períodos de operación y configuración general de tu barbería.',
    placement: 'right',
  },
  {
    target: '[data-tour="selector-contexto"]',
    title: 'Contexto activo',
    content:
      'Aquí ves y cambias la sede y el período activo. Todos los datos (reservas, barberos, reportes) se muestran según este contexto.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="usuario"]',
    title: 'Tu cuenta',
    content:
      'Tu nombre aparece aquí. Usa el botón "Cerrar sesión" cuando termines. Puedes repetir este tour cuando quieras desde el icono de ayuda.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="nav-accesos"]',
    title: 'Accesos y roles',
    content:
      'Asigna roles a tu equipo: Administrador, Barbero o Cliente. Cada rol tiene acceso exactamente a lo que necesita.',
    placement: 'right',
  },
];

// Pasos específicos para el rol BARBERO (menú reducido)
export const PASOS_TOUR_BARBERO: Step[] = [
  {
    target: '[data-tour="logo"]',
    title: '¡Bienvenido a AIRA!',
    content: 'Tu panel personal como barbero. Aquí gestionas tu agenda y tus reservas.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-tablero"]',
    title: 'Tu tablero',
    content: 'Resumen de tus métricas personales: reservas del día, completadas y pendientes.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-reservas"]',
    title: 'Tus reservas',
    content: 'Aquí ves las citas asignadas a ti. Puedes confirmar, completar o cancelar.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-mi-agenda"]',
    title: 'Mi agenda',
    content: 'Configura tus horarios de disponibilidad semanal y registra excepciones (vacaciones, feriados).',
    placement: 'right',
  },
  {
    target: '[data-tour="selector-contexto"]',
    title: 'Tu contexto',
    content: 'La sede y el período activo. Los datos que ves corresponden a este contexto.',
    placement: 'bottom',
  },
];
