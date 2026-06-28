-- =============================================================================
-- AIRA — Semilla local COMPLEMENTARIA (solo entorno local)
-- Da a la(s) empresa(s) sembrada(s) lo mínimo para OPERAR: plan + límites +
-- suscripción ACTIVA + programa de lealtad. seed_dev.sql no los crea.
-- Idempotente: se puede correr varias veces sin duplicar.
-- =============================================================================

-- Plan BASICO
INSERT INTO plan (nombre, precio_mensual, moneda_plan, descripcion)
SELECT 'BASICO', 49.00, 'PEN', 'Plan basico para barberias'
WHERE NOT EXISTS (SELECT 1 FROM plan WHERE nombre = 'BASICO');

-- Límites del plan BASICO
INSERT INTO plan_limite (id_plan, concepto, valor)
SELECT p.id_plan, c.concepto, c.valor
FROM plan p
CROSS JOIN (VALUES
  ('MAX_SUCURSALES', 3),
  ('MAX_BARBEROS', 10),
  ('MAX_RESERVAS_MES', 1000),
  ('MAX_WHATSAPP_NUMEROS', 1),
  ('MAX_CAMPANAS_MES', 10)
) AS c(concepto, valor)
WHERE p.nombre = 'BASICO'
  AND NOT EXISTS (
    SELECT 1 FROM plan_limite pl WHERE pl.id_plan = p.id_plan AND pl.concepto = c.concepto
  );

-- Suscripción ACTIVA por empresa (una activa por empresa: índice parcial)
INSERT INTO suscripcion (id_empresa, id_plan, fecha_inicio, fecha_renovacion, estado)
SELECT e.id_empresa, p.id_plan, current_date, (current_date + INTERVAL '1 month')::date, 'ACTIVA'
FROM empresa e CROSS JOIN plan p
WHERE p.nombre = 'BASICO'
  AND NOT EXISTS (
    SELECT 1 FROM suscripcion s WHERE s.id_empresa = e.id_empresa AND s.estado = 'ACTIVA'
  );

-- Programa de lealtad por empresa
INSERT INTO programa_lealtad (id_empresa, nombre, sellos_para_recompensa, descripcion_recompensa)
SELECT e.id_empresa, 'Programa Sellos', 5, 'Corte gratis al juntar 5 sellos'
FROM empresa e
WHERE NOT EXISTS (
  SELECT 1 FROM programa_lealtad pl WHERE pl.id_empresa = e.id_empresa
);
