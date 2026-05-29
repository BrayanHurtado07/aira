-- ============================================================
-- SEED DESARROLLO — Aira / Serbio Barbería
-- Ejecutar DESPUÉS de todos los DDL y funciones
-- Credenciales: admin@aira.com / Aira2026!
-- ============================================================

-- 1. Empresa
INSERT INTO empresa (id_empresa, nombre, pais, moneda, frecuencia_liquidacion, estado)
VALUES ('b24091f6-de99-452e-8201-24322da78052', 'Serbio Barbería', 'PE', 'PEN', 'MENSUAL', 'ACTIVO')
ON CONFLICT DO NOTHING;

-- 2. Usuario admin (bcrypt de "Aira2026!")
INSERT INTO usuario (id_usuario, nombre, correo_electronico, contrasena_hash, estado, correo_verificado)
VALUES (
  'c2c01da8-7c7a-4d6e-99f9-d9a67a6b00f0',
  'Admin',
  'admin@aira.com',
  '$2b$10$VxE3cC4DEkeojR9PTY726.OEL92n3GqrnpuAedL.QRkN3Gp/XVAEe',
  'ACTIVO',
  true
) ON CONFLICT DO NOTHING;

-- 3. Rol ADMIN
INSERT INTO rol (id_rol, nombre, descripcion)
VALUES ('84debee0-1111-4111-8111-111111111111', 'ADMIN', 'Administrador del sistema')
ON CONFLICT DO NOTHING;

-- 4. Sucursal principal
INSERT INTO sucursal (id_sucursal, id_empresa, nombre, direccion, zona_horaria, estado)
VALUES ('18e9802b-bc88-4160-b808-f061cc1c9c0c', 'b24091f6-de99-452e-8201-24322da78052', 'Sede Principal', 'Av. Principal 123', 'America/Lima', 'ACTIVO')
ON CONFLICT DO NOTHING;

-- 5. Alcance: vincula admin con empresa y rol ADMIN
INSERT INTO alcance (id_alcance, id_usuario, id_empresa, id_rol, estado)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c2c01da8-7c7a-4d6e-99f9-d9a67a6b00f0', 'b24091f6-de99-452e-8201-24322da78052', '84debee0-1111-4111-8111-111111111111', 'ACTIVO')
ON CONFLICT DO NOTHING;

-- 6. Permisos del sistema
INSERT INTO permiso (id_permiso, codigo, capacidad, descripcion) VALUES
  ('00000001-0000-4000-8000-000000000001', 'USUARIO_INACTIVAR',   'identidad',       'Inactivar usuarios'),
  ('00000001-0000-4000-8000-000000000002', 'SEDE_CREAR',           'organizacion',    'Crear sedes'),
  ('00000001-0000-4000-8000-000000000003', 'PERIODO_CREAR',        'organizacion',    'Crear periodos'),
  ('00000001-0000-4000-8000-000000000004', 'PERIODO_CERRAR',       'organizacion',    'Cerrar periodos'),
  ('00000001-0000-4000-8000-000000000005', 'ALCANCE_ASIGNAR',      'gobierno_acceso', 'Asignar alcances'),
  ('00000001-0000-4000-8000-000000000006', 'ALCANCE_REVOCAR',      'gobierno_acceso', 'Revocar alcances'),
  ('00000001-0000-4000-8000-000000000007', 'BARBERO_CREAR',        'agenda',          'Registrar barberos'),
  ('00000001-0000-4000-8000-000000000008', 'SERVICIO_CREAR',       'agenda',          'Crear servicios'),
  ('00000001-0000-4000-8000-000000000009', 'DISPONIBILIDAD_CREAR', 'agenda',          'Registrar disponibilidad'),
  ('00000001-0000-4000-8000-000000000010', 'RESERVA_CONFIRMAR',    'reservas',        'Confirmar reservas'),
  ('00000001-0000-4000-8000-000000000011', 'RESERVA_CANCELAR',     'reservas',        'Cancelar reservas'),
  ('00000001-0000-4000-8000-000000000012', 'RESERVA_COMPLETAR',    'reservas',        'Completar reservas')
ON CONFLICT DO NOTHING;

-- 7. Asignar todos los permisos al rol ADMIN
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT '84debee0-1111-4111-8111-111111111111', id_permiso FROM permiso
ON CONFLICT DO NOTHING;

-- 8. Barberos de prueba
INSERT INTO barbero (id_barbero, id_empresa, nombre, telefono, estado) VALUES
  ('bdd46e3a-fc1b-476e-b0fa-07caf5fceca6', 'b24091f6-de99-452e-8201-24322da78052', 'Carlos Mendoza', '999111222', 'ACTIVO'),
  ('8f763100-9724-4e76-8d13-e888da61acf4', 'b24091f6-de99-452e-8201-24322da78052', 'Diego Ríos', '999333444', 'ACTIVO')
ON CONFLICT DO NOTHING;

-- 9. Servicios de prueba
INSERT INTO servicio (id_servicio, id_empresa, nombre, duracion_minutos, precio_base, descripcion, estado) VALUES
  ('133eca18-6ea1-47d1-8c4c-954a917a20bd', 'b24091f6-de99-452e-8201-24322da78052', 'Corte Clásico',  30, 25.00, 'Corte de cabello tradicional',  'ACTIVO'),
  ('c9b5cb19-2f64-4bca-92cb-35b88aadc90d', 'b24091f6-de99-452e-8201-24322da78052', 'Arreglo de Barba', 20, 15.00, 'Perfilado y arreglo de barba', 'ACTIVO'),
  ('e19cb31c-ddd1-4f88-b4e3-dd5f849b1a1c', 'b24091f6-de99-452e-8201-24322da78052', 'Fade Degradado',  45, 35.00, 'Degradado moderno con diseño',  'ACTIVO')
ON CONFLICT DO NOTHING;

-- 10. Asignar todos los servicios a los dos barberos
INSERT INTO barbero_servicio (id_barbero, id_servicio) VALUES
  ('bdd46e3a-fc1b-476e-b0fa-07caf5fceca6', '133eca18-6ea1-47d1-8c4c-954a917a20bd'),
  ('bdd46e3a-fc1b-476e-b0fa-07caf5fceca6', 'c9b5cb19-2f64-4bca-92cb-35b88aadc90d'),
  ('bdd46e3a-fc1b-476e-b0fa-07caf5fceca6', 'e19cb31c-ddd1-4f88-b4e3-dd5f849b1a1c'),
  ('8f763100-9724-4e76-8d13-e888da61acf4', '133eca18-6ea1-47d1-8c4c-954a917a20bd'),
  ('8f763100-9724-4e76-8d13-e888da61acf4', 'c9b5cb19-2f64-4bca-92cb-35b88aadc90d'),
  ('8f763100-9724-4e76-8d13-e888da61acf4', 'e19cb31c-ddd1-4f88-b4e3-dd5f849b1a1c')
ON CONFLICT DO NOTHING;

-- 11. Disponibilidad: ambos barberos disponibles Lu-Vi 09:00-18:00 en Sede Principal
INSERT INTO disponibilidad (id_barbero, id_sucursal, dia_semana, hora_inicio, hora_fin, estado) VALUES
  ('bdd46e3a-fc1b-476e-b0fa-07caf5fceca6', '18e9802b-bc88-4160-b808-f061cc1c9c0c', 1, '09:00', '18:00', 'ACTIVO'),
  ('bdd46e3a-fc1b-476e-b0fa-07caf5fceca6', '18e9802b-bc88-4160-b808-f061cc1c9c0c', 2, '09:00', '18:00', 'ACTIVO'),
  ('bdd46e3a-fc1b-476e-b0fa-07caf5fceca6', '18e9802b-bc88-4160-b808-f061cc1c9c0c', 3, '09:00', '18:00', 'ACTIVO'),
  ('bdd46e3a-fc1b-476e-b0fa-07caf5fceca6', '18e9802b-bc88-4160-b808-f061cc1c9c0c', 4, '09:00', '18:00', 'ACTIVO'),
  ('bdd46e3a-fc1b-476e-b0fa-07caf5fceca6', '18e9802b-bc88-4160-b808-f061cc1c9c0c', 5, '09:00', '18:00', 'ACTIVO'),
  ('8f763100-9724-4e76-8d13-e888da61acf4', '18e9802b-bc88-4160-b808-f061cc1c9c0c', 1, '09:00', '18:00', 'ACTIVO'),
  ('8f763100-9724-4e76-8d13-e888da61acf4', '18e9802b-bc88-4160-b808-f061cc1c9c0c', 2, '09:00', '18:00', 'ACTIVO'),
  ('8f763100-9724-4e76-8d13-e888da61acf4', '18e9802b-bc88-4160-b808-f061cc1c9c0c', 3, '09:00', '18:00', 'ACTIVO'),
  ('8f763100-9724-4e76-8d13-e888da61acf4', '18e9802b-bc88-4160-b808-f061cc1c9c0c', 4, '09:00', '18:00', 'ACTIVO'),
  ('8f763100-9724-4e76-8d13-e888da61acf4', '18e9802b-bc88-4160-b808-f061cc1c9c0c', 5, '09:00', '18:00', 'ACTIVO')
ON CONFLICT DO NOTHING;

-- 12. Periodos de operación (Mayo–Julio 2026)
INSERT INTO periodo (id_empresa, nombre, fecha_inicio, fecha_fin, estado) VALUES
  ('b24091f6-de99-452e-8201-24322da78052', 'Mayo 2026',  '2026-05-01', '2026-05-31', 'ACTIVO'),
  ('b24091f6-de99-452e-8201-24322da78052', 'Junio 2026', '2026-06-01', '2026-06-30', 'ACTIVO'),
  ('b24091f6-de99-452e-8201-24322da78052', 'Julio 2026', '2026-07-01', '2026-07-31', 'ACTIVO')
ON CONFLICT DO NOTHING;

-- 13. Configuración empresa: no requiere confirmación manual
INSERT INTO configuracion_empresa (id_empresa, requiere_confirmacion_manual)
VALUES ('b24091f6-de99-452e-8201-24322da78052', false)
ON CONFLICT (id_empresa) DO NOTHING;
