-- =============================================================================
-- AIRA — Agenda: consulta de disponibilidad sede-wide
-- Responde la pregunta real del cliente: "¿qué barberos están disponibles en
-- esta sede, a esta fecha/hora, para este servicio?"
-- Reusa EXACTAMENTE la lógica canónica de reserva_crear (zona horaria, día de la
-- semana, bloque de disponibilidad que cubre el turno completo, EXCEPCIONES
-- -vacaciones/feriados-, y solape con reservas). Devuelve lista vacía si los
-- datos no son válidos (sin tope de errores: es una lectura para pintar opciones).
-- =============================================================================

CREATE OR REPLACE FUNCTION barberos_disponibles_por_sede(
    p_id_empresa        UUID,
    p_id_sucursal       UUID,
    p_id_servicio       UUID,
    p_fecha_hora_inicio TIMESTAMPTZ
)
RETURNS TABLE (id_barbero UUID, nombre STRING)
LANGUAGE plpgsql AS $$
DECLARE
    v_duracion  INT;
    v_fin       TIMESTAMPTZ;
    v_zona      STRING;
    v_fecha     DATE;
    v_dia       INT;
    v_hora_ini  TIME;
    v_hora_fin  TIME;
BEGIN
    -- Servicio activo de la empresa → duración del turno
    SELECT duracion_minutos INTO v_duracion
    FROM servicio
    WHERE id_servicio = p_id_servicio AND id_empresa = p_id_empresa AND estado = 'ACTIVO';
    IF v_duracion IS NULL THEN RETURN; END IF;

    -- Sucursal activa de la empresa → zona horaria
    SELECT zona_horaria INTO v_zona
    FROM sucursal
    WHERE id_sucursal = p_id_sucursal AND id_empresa = p_id_empresa AND estado = 'ACTIVO';
    IF v_zona IS NULL THEN RETURN; END IF;

    v_fin      := p_fecha_hora_inicio + (v_duracion || ' minutes')::INTERVAL;
    v_fecha    := (p_fecha_hora_inicio AT TIME ZONE v_zona)::DATE;
    v_dia      := EXTRACT(DOW FROM (p_fecha_hora_inicio AT TIME ZONE v_zona))::INT;
    v_hora_ini := (p_fecha_hora_inicio AT TIME ZONE v_zona)::TIME;
    v_hora_fin := (v_fin               AT TIME ZONE v_zona)::TIME;

    RETURN QUERY
    SELECT b.id_barbero, b.nombre::STRING
    FROM barbero b
    JOIN barbero_servicio bs ON bs.id_barbero = b.id_barbero AND bs.id_servicio = p_id_servicio
    WHERE b.id_empresa = p_id_empresa
      AND b.estado = 'ACTIVO'
      -- tiene un bloque de disponibilidad que cubre el turno completo en esa sede/día
      AND EXISTS (
          SELECT 1 FROM disponibilidad d
          WHERE d.id_barbero = b.id_barbero
            AND d.id_sucursal = p_id_sucursal
            AND d.estado = 'ACTIVO'
            AND d.dia_semana = v_dia
            AND d.hora_inicio <= v_hora_ini
            AND d.hora_fin    >= v_hora_fin
      )
      -- NO está bloqueado por excepción ese día (vacaciones/feriado)
      AND NOT EXISTS (
          SELECT 1 FROM excepcion_disponibilidad e
          WHERE e.id_barbero = b.id_barbero
            AND e.id_sucursal = p_id_sucursal
            AND e.fecha = v_fecha
      )
      -- NO tiene una reserva que solape el turno
      AND NOT EXISTS (
          SELECT 1 FROM reserva r
          WHERE r.id_barbero = b.id_barbero
            AND r.estado NOT IN ('CANCELADA', 'NO_ASISTIO')
            AND r.fecha_hora_inicio < v_fin
            AND r.fecha_hora_fin    > p_fecha_hora_inicio
      )
    ORDER BY b.nombre;
END;
$$;
