# Estándares de Primitivas UI
> Guía de uso de los componentes compartidos. Todo componente nuevo debe respetar estas convenciones.
> Ubicación: `compartido/interfaz/primitivas/` y `compartido/interfaz/retroalimentacion/`

---

## Primitivas de entrada

### `Campo`
- Uso: texto libre, nombres, descripciones.
- Props clave: `label`, `value`, `onChange`, `error`, `placeholder`.
- El `error` se muestra debajo del campo en rojo.
- Nunca usar para campos numéricos o de moneda.

### `CampoEmail`
- Uso: correos electrónicos.
- Valida automáticamente formato RFC.
- Muestra ícono de email en el campo.

### `CampoMoneda`
- Uso: precios, montos.
- Siempre incluye símbolo de moneda (`S/`).
- Formato con 2 decimales automático.
- No acepta negativos a menos que se indique.

### `CampoNumerico`
- Uso: cantidades, duraciones, conteos.
- Props: `min`, `max`, `step`.
- Para cantidades de inventario que pueden ser decimales, usar `step={0.01}`.

### `SelectorTelefono`
- Uso: números de teléfono.
- Incluye selector de prefijo de país.
- La validación es: mínimo 7 dígitos numéricos.
- El valor guardado en estado: `{ prefijo: "+51", numero: "987654321" }` — el UUID del país nunca se expone.

### `Selector`
- Uso: listas de opciones (estados, roles, tipos, etc.).
- Las opciones siempre tienen `{ valor: string, etiqueta: string }`.
- El `valor` puede ser el código interno pero `etiqueta` es siempre legible en español.

### `SelectorDuracion`
- Uso: duración en minutos (para servicios).
- Muestra opciones en formato legible: `"30 min"`, `"45 min"`, `"1 hr"`, etc.
- El valor interno es el número de minutos.

### `SelectorFecha`
- Uso: fechas y fechas+hora.
- Props: `conHora?: boolean` para activar selección de hora.
- El valor interno es ISO 8601. La visualización siempre es `"23 Ene 2025"` o `"23 Ene 2025 · 14:30"`.

### `SelectorSlot`
- Uso: selección de horario disponible para reservas.
- Consulta la API de slots. Los slots no disponibles son visualmente grises y deshabilitados.
- Formato de visualización: `"09:00"`, `"09:30"`, etc.

### `Interruptor`
- Uso: activar/desactivar opciones booleanas.
- Para cambios de estado críticos (activar/desactivar usuario, servicio, etc.) siempre disparar confirmación primero.

---

## Primitivas de layout

### `Modal`
- Props: `titulo`, `abierto`, `onCerrar`, `tamaño: 'sm' | 'md' | 'lg'`.
- Siempre trap del foco cuando está abierto.
- El título del modal debe ser el nombre de la acción: "Registrar barbero", "Editar servicio".
- Nunca incluir UUIDs en el título del modal.

### `DialogoConfirmacion`
- Props: `variante: 'normal' | 'advertencia' | 'peligro'`.
- El texto del `mensaje` debe describir la consecuencia en términos de negocio, sin UUIDs.
- El texto del botón de acción debe ser el verbo de la acción: "Cancelar reserva", "Revocar", "Anular".
- El botón de cancelar siempre dice: "Volver".

### `SeccionTarjeta`
- Uso: agrupar contenido relacionado dentro de una página.
- Props: `titulo`, `accion` (botón opcional en el encabezado).

### `EncabezadoPagina`
- Uso: encabezado fijo de cada página con título, subtítulo y acciones.
- El `titulo` usa el nombre de la entidad o función, nunca el UUID.
- Ejemplo: "Juan Pérez — Detalle de reserva", no "Reserva #abc-123".

### `Pestanas`
- Uso: múltiples secciones en una misma página.
- Las pestañas tienen etiquetas cortas: "Productos", "Stock", "Movimientos".

---

## Primitivas de retroalimentación

### `Insignia`
- Variantes: `exito` (verde), `error` (rojo), `advertencia` (amarillo), `info` (azul), `neutral` (gris), `primario`.
- Se mapea al estado del negocio según la tabla en `ESTANDARES-UI.md`.
- Nunca mostrar el código interno del estado (`"ACTIVA"`) dentro de una insignia — usar texto legible (`"Activa"`).

### `BannerAlerta`
- Uso: mensajes importantes a nivel de página (no de campo).
- Variantes: `error`, `advertencia`, `info`, `exito`.
- Para errores de red globales.
- Para mensajes de sistema (período sin abrir, programa de lealtad sin configurar, etc.).

### `Vacio`
- Props: `icono`, `mensaje`, `accion` (opcional).
- Cada tabla/listado debe tener su propio mensaje de estado vacío, no genérico.

### `Esqueleto`
- Props: `lineas: number` (default 3-5).
- Usar durante la carga inicial de tablas y listas.
- Nunca mostrar contenido parcial junto con esqueleto — uno u otro.

### `Cargando`
- Spinner pequeño para cargas inline (dentro de un componente).
- Para carga de página completa usar `PantallaCarga`.

### `PantallaCarga`
- Spinner grande centrado en pantalla.
- Solo para carga inicial de la aplicación o navegación entre rutas.

### `TablaDatos`
- Props: `columnas: Columna[]`, `datos: T[]`, `cargando: boolean`, `vacio: ReactNode`.
- Nunca una columna con nombre "ID", "UUID" o "Clave".
- La primera columna identifica la fila de forma humana.

### `MenuAcciones`
- Icono de tres puntos verticales.
- Agrupa acciones secundarias de una fila de tabla.
- Las acciones destructivas van al final, en rojo.
