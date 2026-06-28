-- =============================================================================
-- AIRA — Roles del sistema: SUPERADMIN, ADMIN, BARBERO, CLIENTE
-- SUPERADMIN: nivel plataforma (crea empresas, gestiona todo)
-- ADMIN:      administrador de una empresa (rol existente)
-- BARBERO:    ve su propia agenda y reservas asignadas
-- CLIENTE:    ve sus propias reservas y tarjeta de lealtad
-- =============================================================================

-- Rol: SUPERADMIN (ya tiene todos los permisos, más creación de empresa)
INSERT INTO rol (id_rol, nombre, descripcion)
VALUES ('00000001-0001-4001-8001-000000000001', 'SUPERADMIN', 'Superadministrador de la plataforma')
ON CONFLICT DO NOTHING;

-- Rol: BARBERO
INSERT INTO rol (id_rol, nombre, descripcion)
VALUES ('00000001-0001-4001-8001-000000000002', 'BARBERO', 'Barbero con acceso a su propia agenda y reservas')
ON CONFLICT DO NOTHING;

-- Rol: CLIENTE
INSERT INTO rol (id_rol, nombre, descripcion)
VALUES ('00000001-0001-4001-8001-000000000003', 'CLIENTE', 'Cliente con acceso a sus reservas y lealtad')
ON CONFLICT DO NOTHING;

-- Permisos adicionales
INSERT INTO permiso (id_permiso, codigo, capacidad, descripcion) VALUES
  ('00000001-0000-4000-8000-000000000013', 'EMPRESA_CREAR',          'organizacion',    'Crear nuevas empresas en la plataforma'),
  ('00000001-0000-4000-8000-000000000014', 'CONFIGURACION_GESTIONAR','organizacion',    'Gestionar configuración operativa'),
  ('00000001-0000-4000-8000-000000000015', 'BARBERO_ACTUALIZAR',      'agenda',          'Actualizar datos de barberos'),
  ('00000001-0000-4000-8000-000000000016', 'SERVICIO_ACTUALIZAR',     'agenda',          'Actualizar servicios'),
  ('00000001-0000-4000-8000-000000000017', 'RESERVA_ACTUALIZAR',      'reservas',        'Actualizar reservas'),
  ('00000001-0000-4000-8000-000000000018', 'CLIENTE_ACTUALIZAR',      'reservas',        'Actualizar clientes'),
  ('00000001-0000-4000-8000-000000000019', 'SUSCRIPCION_GESTIONAR',   'monetizacion',    'Gestionar suscripciones'),
  ('00000001-0000-4000-8000-000000000020', 'SELLO_GESTIONAR',         'lealtad',         'Gestionar sellos de lealtad'),
  ('00000001-0000-4000-8000-000000000021', 'PROGRAMA_LEALTAD_GESTIONAR','lealtad',       'Gestionar programa de lealtad'),
  ('00000001-0000-4000-8000-000000000022', 'RECORDATORIO_GESTIONAR',  'notificaciones',  'Gestionar recordatorios'),
  ('00000001-0000-4000-8000-000000000023', 'INVENTARIO_GESTIONAR',    'inventario',      'Gestionar inventario'),
  ('00000001-0000-4000-8000-000000000024', 'TARIFA_ESPECIAL_CREAR',   'agenda',          'Crear tarifas especiales'),
  ('00000001-0000-4000-8000-000000000025', 'PLANTILLA_GESTIONAR',     'notificaciones',  'Gestionar plantillas de mensaje'),
  ('00000001-0000-4000-8000-000000000026', 'EXCEPCION_DISPONIBILIDAD_REGISTRAR','agenda','Registrar excepciones de disponibilidad'),
  ('00000001-0000-4000-8000-000000000027', 'BARBERO_SERVICIO_ASIGNAR','agenda',          'Asignar servicios a barberos'),
  ('00000001-0000-4000-8000-000000000028', 'COMISION_GESTIONAR',      'comisiones',      'Gestionar comisiones y liquidaciones'),
  ('00000001-0000-4000-8000-000000000029', 'REPUTACION_GESTIONAR',    'reputacion',      'Moderar reseñas y calificaciones'),
  ('00000001-0000-4000-8000-000000000030', 'INTEGRACION_GESTIONAR',   'integraciones',   'Gestionar integraciones (Google Calendar)'),
  ('00000001-0000-4000-8000-000000000031', 'CAMPANA_GESTIONAR',       'campanias',       'Gestionar campañas de marketing')
ON CONFLICT DO NOTHING;

-- SUPERADMIN: todos los permisos
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT '00000001-0001-4001-8001-000000000001', id_permiso FROM permiso
ON CONFLICT DO NOTHING;

-- BARBERO: ver agenda + completar/cancelar reservas propias
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT '00000001-0001-4001-8001-000000000002', id_permiso
FROM permiso
WHERE codigo IN (
  'RESERVA_CONFIRMAR',
  'RESERVA_CANCELAR',
  'RESERVA_COMPLETAR',
  'DISPONIBILIDAD_CREAR',
  'EXCEPCION_DISPONIBILIDAD_REGISTRAR'
)
ON CONFLICT DO NOTHING;

-- CLIENTE: solo ver (sin permisos de escritura)
-- Los clientes acceden en modo lectura; el backend filtra por id_cliente
