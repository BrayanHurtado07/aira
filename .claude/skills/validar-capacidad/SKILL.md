---
name: validar-capacidad
description: Valida una capacidad de Aira contra flujos de negocio REALES (no CRUD) de abajo hacia arriba — BD, funciones almacenadas, backend y contexto/permisos — y reporta huecos con la acción mínima + un test corto. Úsala antes de construir o tocar el frontend de una capacidad, para no descubrir tarde que falta una columna, relación, validación o función. Trabaja UNA capacidad a la vez para gastar pocos tokens.
---

# validar-capacidad — ¿La BD soporta el negocio REAL? (token-eficiente)

Pregunta central: **"¿esta capacidad puede responder a lo que el cliente/empresa realmente necesita, o solo tiene mantenedores CRUD que solo un dev entiende?"**

Entrada: el nombre de UNA capacidad (ej. `agenda`, `reservas`, `organizacion`, `monetizacion`, `lealtad`, `gobierno_acceso`).

## Reglas de tokens (obligatorias)
- **Una capacidad por corrida.** No barrer el repo.
- Leer SOLO:
  - el/los DDL de esa capacidad en `database/ddl/`
  - el/los archivos de `database/funciones/` de esa capacidad
  - `backend/capacidades/<cap>/` y su repo en `backend/persistencia/cockroach/`
  - sus rutas en `backend/aplicacion/entrada/http/rutas.go` (solo las líneas de esa capacidad)
- No leer frontend salvo que el flujo lo exija.
- **No exigir auditoría** en esta fase (decisión de producto: diferida). No reportarla como hueco.

## Procedimiento

### 1. Cargar los flujos de negocio reales
Leer `catalogo-flujos.md` (junto a esta skill) y tomar los flujos de la capacidad pedida. Si la capacidad no está en el catálogo, derivar 3–5 flujos reales desde la perspectiva del dueño de barbería / cliente (no desde la tabla).

### 2. Por cada flujo, hacer las PREGUNTAS CORRECTAS
Para cada flujo evaluar, en este orden de abajo hacia arriba:

**BD (estructura):**
- ¿Existen las tablas/columnas para responder el flujo? ¿Falta alguna columna, relación o índice?
- ¿Las FK son `ON DELETE RESTRICT` y hay soft-delete (`estado`)?

**Función almacenada (lógica):**
- ¿Existe una función que RESUELVE el flujo (ej. comprobar disponibilidad real), o el backend la arma a mano con queries sueltas?
- ¿Devuelve el contrato `{exito, error, datos}` en JSONB?
- ¿Considera el negocio completo? (duración del servicio + excepciones + reservas existentes + sucursal activa + suscripción vigente + contexto empresa/sede/periodo).

**Backend (exposición):**
- ¿Hay caso de uso + endpoint? ¿El manejador está libre de lógica de negocio?
- ¿La respuesta está pensada para el negocio ("barberos disponibles a las 3pm") y no datos crudos?

**Acceso (siempre):**
- ¿El endpoint valida **rol + alcance + permiso** vía `autorizarOResponder`? ¿El código de permiso existe en `gobierno_acceso/permisos/codigos.go`?
- ¿Valida el **contexto operativo** (empresa + sede + periodo) antes de operar?

### 3. Test corto pero efectivo (contra BD local)
Para los 1–2 flujos críticos, ejecutar la función real contra la BD local y confirmar que devuelve algo con **sentido de negocio**:
```bash
cockroach sql --insecure --database=aira -e "SELECT <funcion>(<args del flujo>);"
```
Marcar ✅ si el `datos` devuelto responde la pregunta del flujo; ❌ si devuelve vacío o sin sentido. (Requiere `setup-local` aplicada antes).

### 4. Reporte compacto (este formato exacto)
```
CAPACIDAD: <nombre>
Flujo 1: <descripción real>          BD ✅ | Func ⚠️ | Back ❌ | Acceso ✅
  → Acción mínima: <crear columna / función / validación / endpoint>
  → Test: <comando> → <resultado>
Flujo 2: ...
RESUMEN: N flujos · X listos · Y con hueco. Bloqueante para frontend: <sí/no + qué>.
```
Cerrar con: **"¿Construyo lo faltante con `nueva-capacidad`, o ajustamos flujos primero?"** No implementar nada en esta skill: solo diagnosticar.

## Criterio de "negocio, no CRUD"
Un ✅ real significa que el dueño de la barbería entendería la pregunta y obtendría la respuesta. "Listar tabla servicio" NO es un flujo válido; "qué servicios puede ofrecer Carlos el sábado y cuánto cuestan" SÍ lo es.
