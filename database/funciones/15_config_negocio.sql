-- =============================================================================
-- AIRA — Funciones de dominio: Configuración de negocio
-- esquema_comision_crear · programa_lealtad_crear · plantilla_mensaje_crear
-- producto_crear · tarifa_especial_crear
-- =============================================================================

CREATE OR REPLACE FUNCTION esquema_comision_crear(
    p_id_empresa              UUID,
    p_nombre                  STRING,
    p_tipo                    STRING   DEFAULT 'PORCENTAJE',
    p_sueldo_base             DECIMAL  DEFAULT 0,
    p_porcentaje_por_servicio DECIMAL  DEFAULT 0,
    p_descripcion             STRING   DEFAULT NULL,
    p_creado_por              UUID     DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_esquema UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM empresa WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ACTIVA');
    END IF;

    IF p_sueldo_base < 0 THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SUELDO_BASE_NO_PUEDE_SER_NEGATIVO');
    END IF;

    IF p_porcentaje_por_servicio < 0 OR p_porcentaje_por_servicio > 100 THEN
        RETURN jsonb_build_object('exito', false, 'error', 'PORCENTAJE_FUERA_DE_RANGO');
    END IF;

    INSERT INTO esquema_comision (
        id_empresa, nombre, tipo, sueldo_base, porcentaje_por_servicio, descripcion, estado
    )
    VALUES (
        p_id_empresa, p_nombre, p_tipo, p_sueldo_base,
        p_porcentaje_por_servicio::DECIMAL(5,2), p_descripcion, 'ACTIVO'
    )
    RETURNING id_esquema INTO v_id_esquema;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, p_id_empresa, 'esquema_comision', v_id_esquema, 'CREAR',
        jsonb_build_object('nombre', p_nombre, 'tipo', p_tipo,
                           'porcentaje', p_porcentaje_por_servicio));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_esquema', v_id_esquema)
    );
END;
$$;

-- -----------------------------------------------------------------------------

-- Solo un programa ACTIVO por empresa. Desactivar el anterior antes de crear uno nuevo.
CREATE OR REPLACE FUNCTION programa_lealtad_crear(
    p_id_empresa             UUID,
    p_nombre                 STRING,
    p_sellos_para_recompensa INT,
    p_descripcion_recompensa STRING,
    p_creado_por             UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_programa UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM empresa WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ACTIVA');
    END IF;

    IF p_sellos_para_recompensa <= 0 THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SELLOS_DEBE_SER_POSITIVO');
    END IF;

    IF EXISTS (SELECT 1 FROM programa_lealtad WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_YA_TIENE_PROGRAMA_ACTIVO');
    END IF;

    INSERT INTO programa_lealtad (
        id_empresa, nombre, sellos_para_recompensa, descripcion_recompensa, estado, creado_por
    )
    VALUES (
        p_id_empresa, p_nombre, p_sellos_para_recompensa::INT2,
        p_descripcion_recompensa, 'ACTIVO', p_creado_por
    )
    RETURNING id_programa INTO v_id_programa;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, p_id_empresa, 'programa_lealtad', v_id_programa, 'CREAR',
        jsonb_build_object('nombre', p_nombre,
                           'sellos_para_recompensa', p_sellos_para_recompensa));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_programa', v_id_programa)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION plantilla_mensaje_crear(
    p_id_empresa          UUID,
    p_nombre              STRING,
    p_canal               STRING,
    p_contenido_plantilla STRING,
    p_variables_json      JSONB   DEFAULT NULL,
    p_creado_por          UUID    DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_plantilla UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM empresa WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ACTIVA');
    END IF;

    INSERT INTO plantilla_mensaje (
        id_empresa, nombre, canal, contenido_plantilla, variables_json, estado
    )
    VALUES (p_id_empresa, p_nombre, p_canal, p_contenido_plantilla, p_variables_json, 'ACTIVO')
    RETURNING id_plantilla INTO v_id_plantilla;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, p_id_empresa, 'plantilla_mensaje', v_id_plantilla, 'CREAR',
        jsonb_build_object('nombre', p_nombre, 'canal', p_canal));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_plantilla', v_id_plantilla)
    );
END;
$$;

-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION producto_crear(
    p_id_empresa      UUID,
    p_nombre          STRING,
    p_codigo          STRING,
    p_tipo            STRING,
    p_precio_unitario DECIMAL DEFAULT 0,
    p_descripcion     STRING  DEFAULT NULL,
    p_creado_por      UUID    DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_producto UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM empresa WHERE id_empresa = p_id_empresa AND estado = 'ACTIVO') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'EMPRESA_NO_ACTIVA');
    END IF;

    IF p_precio_unitario < 0 THEN
        RETURN jsonb_build_object('exito', false, 'error', 'PRECIO_NO_PUEDE_SER_NEGATIVO');
    END IF;

    -- UNIQUE (id_empresa, codigo)
    IF EXISTS (SELECT 1 FROM producto WHERE id_empresa = p_id_empresa AND codigo = p_codigo) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'CODIGO_PRODUCTO_YA_EXISTE_EN_EMPRESA');
    END IF;

    INSERT INTO producto (
        id_empresa, nombre, codigo, tipo, precio_unitario, descripcion, estado, creado_por
    )
    VALUES (
        p_id_empresa, p_nombre, p_codigo, p_tipo, p_precio_unitario, p_descripcion,
        'ACTIVO', p_creado_por
    )
    RETURNING id_producto INTO v_id_producto;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, p_id_empresa, 'producto', v_id_producto, 'CREAR',
        jsonb_build_object('nombre', p_nombre, 'codigo', p_codigo, 'tipo', p_tipo));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_producto', v_id_producto)
    );
END;
$$;

-- -----------------------------------------------------------------------------

-- UNIQUE (id_sucursal, id_servicio, fecha): un precio especial por combinación.
CREATE OR REPLACE FUNCTION tarifa_especial_crear(
    p_id_sucursal     UUID,
    p_id_servicio     UUID,
    p_fecha           DATE,
    p_precio_especial DECIMAL,
    p_motivo          STRING  DEFAULT NULL,
    p_creado_por      UUID    DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    v_id_tarifa  UUID;
    v_id_empresa UUID;
BEGIN
    SELECT id_empresa INTO v_id_empresa
    FROM sucursal WHERE id_sucursal = p_id_sucursal AND estado = 'ACTIVO';
    IF v_id_empresa IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SUCURSAL_NO_ACTIVA');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM servicio
        WHERE id_servicio = p_id_servicio AND id_empresa = v_id_empresa AND estado = 'ACTIVO'
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'SERVICIO_NO_VALIDO');
    END IF;

    IF p_precio_especial < 0 THEN
        RETURN jsonb_build_object('exito', false, 'error', 'PRECIO_NO_PUEDE_SER_NEGATIVO');
    END IF;

    IF EXISTS (
        SELECT 1 FROM tarifa_especial
        WHERE id_sucursal = p_id_sucursal AND id_servicio = p_id_servicio AND fecha = p_fecha
    ) THEN
        RETURN jsonb_build_object('exito', false, 'error', 'TARIFA_ESPECIAL_YA_EXISTE_PARA_ESA_FECHA');
    END IF;

    INSERT INTO tarifa_especial (id_sucursal, id_servicio, fecha, precio_especial, motivo, creado_por)
    VALUES (p_id_sucursal, p_id_servicio, p_fecha, p_precio_especial, p_motivo, p_creado_por)
    RETURNING id_tarifa INTO v_id_tarifa;

    INSERT INTO auditoria_accion (id_usuario, id_empresa, entidad, entidad_id, accion,
        detalle_json)
    VALUES (p_creado_por, v_id_empresa, 'tarifa_especial', v_id_tarifa, 'CREAR',
        jsonb_build_object('fecha', p_fecha, 'precio_especial', p_precio_especial,
                           'id_servicio', p_id_servicio));

    RETURN jsonb_build_object(
        'exito', true,
        'datos', jsonb_build_object('id_tarifa', v_id_tarifa)
    );
END;
$$;
