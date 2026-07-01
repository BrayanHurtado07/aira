-- =============================================================================
-- AIRA — Capacidad: Canal WhatsApp
-- Tablas: sesion_whatsapp_empresa · conversacion · mensaje · sesion_chat
--         indicacion_bot
-- Orden de ejecución: 08 / 15
-- Dependencias externas: empresa (02) · sucursal (02)
-- Nota: conversacion.id_cliente es nullable pero se FK-ea a cliente (09).
--       Para evitar dependencia circular, esta FK se añade en 09_reservas.sql
--       como ALTER TABLE, o se acepta que conversacion se crea sin cliente
--       y el stored proc lo relaciona. Aquí se crea sin FK a cliente.
-- Motor: CockroachDB
-- =============================================================================

-- sesion_whatsapp_empresa: credencial de conexión de la empresa con WhatsApp.
-- token_acceso_cifrado usa AES-256 en capa de aplicación (no hash, porque
-- se necesita el valor real para llamar a la API de Meta/Twilio).
CREATE TABLE IF NOT EXISTS sesion_whatsapp_empresa (
    id_sesion_wa          UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_empresa            UUID        NOT NULL,
    numero_telefono       STRING(20)  NOT NULL,
    token_acceso_cifrado  STRING      NOT NULL,
    proveedor             STRING(30)  NOT NULL DEFAULT 'META_CLOUD',
    estado                STRING(20)  NOT NULL DEFAULT 'DESCONECTADO',
    creado_en             TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en        TIMESTAMPTZ,

    CONSTRAINT pk_sesion_whatsapp_empresa           PRIMARY KEY (id_sesion_wa),
    CONSTRAINT fk_sesion_whatsapp_empresa_empresa   FOREIGN KEY (id_empresa)
                                                    REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT chk_sesion_wa_proveedor              CHECK (proveedor IN ('META_CLOUD', 'TWILIO', 'BAILEYS')),
    CONSTRAINT chk_sesion_wa_estado                 CHECK (estado IN ('CONECTADO', 'DESCONECTADO', 'ERROR')),
    CONSTRAINT uq_sesion_wa_empresa_numero          UNIQUE (id_empresa, numero_telefono)
);

-- -----------------------------------------------------------------------------

-- conversacion: sesión de chat entre un número de WhatsApp y la empresa.
-- id_cliente es nullable: al primer mensaje el bot no sabe quién es.
-- Se relaciona al cliente una vez identificado por el stored proc.
-- FK a cliente se añade en 09_reservas.sql con ALTER TABLE (cliente se crea ahí).
CREATE TABLE IF NOT EXISTS conversacion (
    id_conversacion   UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_empresa        UUID        NOT NULL,
    id_cliente        UUID,
    numero_cliente_wa STRING(20)  NOT NULL,
    estado            STRING(20)  NOT NULL DEFAULT 'ACTIVA',
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en    TIMESTAMPTZ,

    CONSTRAINT pk_conversacion          PRIMARY KEY (id_conversacion),
    CONSTRAINT fk_conversacion_empresa  FOREIGN KEY (id_empresa)
                                        REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT chk_conversacion_estado  CHECK (estado IN ('ACTIVA', 'CERRADA', 'EXPIRADA'))
);

CREATE INDEX idx_conversacion_empresa_estado ON conversacion (id_empresa, estado);
CREATE INDEX idx_conversacion_numero         ON conversacion (id_empresa, numero_cliente_wa);

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS mensaje (
    id_mensaje      UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_conversacion UUID        NOT NULL,
    contenido       STRING      NOT NULL,
    tipo            STRING(20)  NOT NULL DEFAULT 'TEXTO',
    direccion       STRING(10)  NOT NULL,
    id_externo_wa   STRING(100),
    estado_entrega  STRING(20),
    enviado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_mensaje                 PRIMARY KEY (id_mensaje),
    CONSTRAINT fk_mensaje_conversacion    FOREIGN KEY (id_conversacion)
                                          REFERENCES conversacion(id_conversacion) ON DELETE RESTRICT,
    CONSTRAINT chk_mensaje_tipo           CHECK (tipo IN ('TEXTO', 'IMAGEN', 'AUDIO', 'DOCUMENTO', 'UBICACION')),
    CONSTRAINT chk_mensaje_direccion      CHECK (direccion IN ('ENTRADA', 'SALIDA')),
    CONSTRAINT chk_mensaje_estado_entrega CHECK (estado_entrega IN ('ENVIADO', 'ENTREGADO', 'LEIDO', 'FALLIDO'))
);

CREATE INDEX idx_mensaje_conversacion ON mensaje (id_conversacion, enviado_en);

-- -----------------------------------------------------------------------------

-- sesion_chat: estado del bot para esta conversación.
-- UNIQUE (id_conversacion): una conversación tiene un solo estado de bot activo.
-- contexto_json guarda el estado del flujo (paso actual, datos recopilados).
CREATE TABLE IF NOT EXISTS sesion_chat (
    id_sesion_chat  UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_conversacion UUID        NOT NULL,
    paso_actual     STRING(100) NOT NULL,
    contexto_json   JSONB,
    expira_en       TIMESTAMPTZ NOT NULL,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ,

    CONSTRAINT pk_sesion_chat              PRIMARY KEY (id_sesion_chat),
    CONSTRAINT fk_sesion_chat_conversacion FOREIGN KEY (id_conversacion)
                                           REFERENCES conversacion(id_conversacion) ON DELETE RESTRICT,
    CONSTRAINT uq_sesion_chat_conversacion UNIQUE (id_conversacion)
);

-- -----------------------------------------------------------------------------

-- indicacion_bot: mensajes predefinidos del bot por empresa.
-- El dueño puede personalizar los textos del bot (saludo, menú, etc.)
CREATE TABLE IF NOT EXISTS indicacion_bot (
    id_indicacion  UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_empresa     UUID        NOT NULL,
    nombre         STRING(100) NOT NULL,
    tipo           STRING(30)  NOT NULL,
    contenido      STRING      NOT NULL,
    activa         BOOL        NOT NULL DEFAULT true,
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
    creado_por     UUID,

    CONSTRAINT pk_indicacion_bot          PRIMARY KEY (id_indicacion),
    CONSTRAINT fk_indicacion_bot_empresa  FOREIGN KEY (id_empresa)
                                          REFERENCES empresa(id_empresa) ON DELETE RESTRICT,
    CONSTRAINT chk_indicacion_bot_tipo    CHECK (tipo IN (
        'SALUDO', 'MENU_PRINCIPAL', 'CONFIRMACION', 'RECORDATORIO', 'RECHAZO', 'DESPEDIDA'
    ))
);

CREATE INDEX idx_indicacion_bot_empresa ON indicacion_bot (id_empresa, activa);

-- -----------------------------------------------------------------------------

-- atajo_respuesta: respuestas rápidas que el operador inserta con 1 toque en el
-- composer del chat ("nuestra línea de atajos"). Por empresa, ordenables.
-- Baja lógica (activa=false), nunca DELETE físico de registro de negocio.
CREATE TABLE IF NOT EXISTS atajo_respuesta (
    id_atajo    UUID        NOT NULL DEFAULT gen_random_uuid(),
    id_empresa  UUID        NOT NULL,
    titulo      STRING(60)  NOT NULL,
    contenido   STRING      NOT NULL,
    orden       INT2        NOT NULL DEFAULT 0,
    activa      BOOL        NOT NULL DEFAULT true,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
    creado_por  UUID,

    CONSTRAINT pk_atajo_respuesta          PRIMARY KEY (id_atajo),
    CONSTRAINT fk_atajo_respuesta_empresa  FOREIGN KEY (id_empresa)
                                           REFERENCES empresa(id_empresa) ON DELETE RESTRICT
);

CREATE INDEX idx_atajo_respuesta_empresa ON atajo_respuesta (id_empresa, activa, orden);
