---
name: guardia-acceso
description: Audita la cobertura de autorización de Aira — roles, alcances y permisos por endpoint. Úsala para verificar que un endpoint (nuevo o tocado) valida permiso+alcance+contexto, que su código de permiso existe en codigos.go y en la tabla permiso, y que el sembrado rol_permiso es coherente. Detecta rutas abiertas y fugas cross-tenant.
---

# guardia-acceso — Auditoría de acceso (roles · alcances · permisos)

En Aira la autorización vive en DOS capas y AMBAS cuentan como válidas:
1. Handler: `rt.autorizarOResponder(w, r, ses, permisos.XXX)` en `aplicacion/entrada/http/rutas.go`.
2. Caso de uso: `validador.ValidarPermiso(...)` (mismo `guardia_politicas.go`).
También existe `exigirSuperAdmin(...)` para rutas de plataforma.

## Entrada
- Por defecto: auditar TODAS las rutas de escritura (`r.Post/Patch/Delete/Put`) en `rutas.go`.
- Si se da un endpoint/capacidad concreta, limitar a eso (barato en tokens).

## Archivos a leer (solo estos)
- `backend/aplicacion/entrada/http/rutas.go` (rutas + handlers)
- `backend/capacidades/gobierno_acceso/permisos/codigos.go` (códigos de permiso)
- `backend/aplicacion/orquestacion/guardia_politicas.go` (la guardia)
- Para los casos de uso tocados: confirmar si llaman `ValidarPermiso`.
- BD viva: `cockroach sql --insecure --host=localhost:26257 --database=aira -e "..."` para tabla `permiso`,
  `rol`, `rol_permiso`.

## Verificaciones
1. **Cobertura:** por cada ruta de escritura, ¿tiene permiso enforced en handler O en caso de uso, o es
   superadmin, o es self/público por diseño? Clasifícala. Lista las que NO tienen NINGÚN control (huecos reales).
2. **Escalada de privilegios:** rutas que crean/mutan recursos de otra empresa o de plataforma sin superadmin
   (ej. `POST /api/empresas`).
3. **Códigos de permiso:** cada `permisos.XXX` usado existe como constante en codigos.go Y como fila en la tabla
   `permiso`. Reporta permisos huérfanos (en BD/código pero sin usar) o usados-pero-inexistentes.
4. **Sembrado rol_permiso:** ¿cada rol operativo tiene los permisos que necesita? (ej. BARBERO debe poder
   RESERVA_CONFIRMAR/CANCELAR/COMPLETAR y DISPONIBILIDAD_CREAR). Verifica contra BD viva.
5. **Contexto operativo:** endpoints que operan sobre sede/periodo, ¿validan empresa+sede+periodo coherente?
6. **Fuga cross-tenant:** handlers que toman un ID de recurso de la URL (sucursalID, etc.) y consultan sin
   verificar que pertenece a la empresa de la sesión.

## Salida (formato exacto)
```
GUARDIA-ACCESO — <alcance auditado>
COBERTURA: X/Y rutas de escritura controladas (Z%).
🔴 Rutas SIN control: <lista archivo:línea + ruta + arreglo (permiso a usar)>
🔴 Escalada de privilegios: <lista>
🔴 Fuga cross-tenant: <lista>
🟡 Sembrado rol_permiso incompleto: <rol → permisos faltantes>
🟡 Permisos huérfanos: <lista>
VEREDICTO: APROBADO / CAMBIOS REQUERIDOS
```
NO exigir auditoría (diferida). No edites archivos; solo dictamina.
