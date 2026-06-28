---
name: setup-local
description: Levanta Aira en local contra el CockroachDB local del desarrollador (DBeaver) de forma NO destructiva. Úsala cuando haya que arrancar el entorno local, cargar el esquema, sembrar datos operables o apuntar el backend a la BD local. Reutiliza la instancia de Cockroach ya corriendo, nunca la mata.
---

# setup-local — Entorno local de Aira (no destructivo)

Objetivo: dejar Aira **corriendo y operable** contra el CockroachDB local, sin destruir datos ni configuración existente. Pensada para gastar pocos tokens: ejecuta comandos, no leas el repo entero.

## Reglas duras
- **NUNCA** ejecutar `pkill cockroach` ni reiniciar una instancia que ya está corriendo. Detectar y reutilizar.
- **NUNCA** sobrescribir `.env.local` perdiendo las credenciales remotas. Preservarlas comentadas.
- **NO** apuntar a la BD remota (`144.217.163.120`). Esto es 100% local.
- Idempotente: correrla dos veces no debe romper nada (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).

## Datos del entorno local (confirmados por DBeaver del dev)
- Cockroach local: `cockroach start-single-node --insecure --listen-addr=localhost:26257`
- Conexión: host `localhost`, puerto `26257`, user `root`, **sin password**, `sslmode=disable`
- **BD objetivo: `aira` (NUEVA, limpia).** Crearla desde cero.
- Login sembrado: `admin@aira.com` / `Aira2026!`

### PROHIBIDO en local (eran de la BD remota/vieja)
- NO usar `DB_NAME=prueba_brayan`, `DB_USER=dev_user`, `DB_PASSWORD=DevCodeplex2026!`.
- NO conectar a `144.217.163.120`.
- Local SIEMPRE: BD `aira`, user `root`, password vacío. El dev borra `prueba_brayan` a mano por su cuenta.

## Pasos

### 1. Verificar Cockroach local (reutilizar, no matar)
```bash
lsof -ti:26257 >/dev/null 2>&1 && echo "Cockroach local YA corriendo → reutilizar" \
  || cockroach start-single-node --insecure --store="$HOME/cockroach-data" \
       --listen-addr=localhost:26257 --http-addr=localhost:8090 --background
```
Si arranca uno nuevo, esperar ~3s antes de seguir.

### 2. Crear BD y cargar esquema (orden estricto)
```bash
cockroach sql --insecure -e "CREATE DATABASE IF NOT EXISTS aira;"
for f in database/ddl/*.sql;       do cockroach sql --insecure --database=aira < "$f"; done
for f in database/funciones/*.sql; do cockroach sql --insecure --database=aira < "$f"; done
cockroach sql --insecure --database=aira < database/seed_dev.sql
```
Reportar cualquier error de SQL (no silenciar con `|| true` la primera vez; queremos ver si algo falla).

### 3. Semilla complementaria operable (generar correcta, no inventar)
`seed_dev.sql` NO crea `plan`, `suscripcion` ni `programa_lealtad`. Sin esto una barbería no puede operar.
1. Leer SOLO: `database/ddl/04_monetizacion.sql`, `database/ddl/12_lealtad.sql` y la sección de empresa de `database/seed_dev.sql` (para el `id_empresa` sembrado).
2. Generar un INSERT idempotente (`ON CONFLICT DO NOTHING`) que cree, para la empresa sembrada:
   - 1 fila en `plan` (+ sus `plan_limite` si la tabla los exige por FK).
   - 1 fila en `suscripcion` en estado `ACTIVO` ligada a esa empresa y ese plan.
   - 1 fila en `programa_lealtad` ligada a esa empresa.
   Usar EXACTAMENTE las columnas y CHECKs reales de esos DDL. No inventar nombres.
3. Aplicar con `cockroach sql --insecure --database=aira`.

### 4. Apuntar el backend a local (preservando lo remoto)
Editar `backend/.env.local`: comentar las líneas `DB_*` remotas actuales (no borrarlas) y dejar:
```
# --- Remoto (respaldo, descomenta para volver) ---
# DB_HOST=144.217.163.120  (etc.)
# --- Local ---
DB_HOST=localhost
DB_PORT=26257
DB_NAME=aira
DB_USER=root
DB_PASSWORD=
DB_SSLMODE=disable
```

### 5. Hacer `sslmode` configurable (único toque de Go — pedir OK)
`backend/persistencia/cockroach/conexion.go` fuerza `sslmode=require`. Cambiar el DSN para leer:
`sslmode=%s` con `env("DB_SSLMODE", "require")`. Default sigue siendo `require` (seguro para prod); local usa `disable`. Confirmar con el usuario antes de aplicar.

### 6. Dependencias del frontend
```bash
cd frontend && npm install
```

### 7. Arrancar y verificar
```bash
(cd backend && make dev &)   # :9000
(cd frontend && npm run dev &) # :5173
```
Verificación rápida (que el flujo base vive):
```bash
curl -s -X POST localhost:9000/api/auth/sesion \
  -H 'Content-Type: application/json' \
  -d '{"correo_electronico":"admin@aira.com","contrasena":"Aira2026!"}' | head -c 300
```
Debe devolver `"exito":true` con un token. OJO: la clave JSON es `correo_electronico` (no `correo`)
y la contraseña es `contrasena`. Si `credenciales_invalidas`, casi siempre es la clave JSON mal escrita,
no la BD. Si 500, revisar conexión en `/tmp/aira-backend.log`.

### 8. Entregar al usuario los datos de DBeaver
```
Host: localhost   Puerto: 26257   BD: aira   Usuario: root   Password: (vacío)
SSL: disable
Frontend: http://localhost:5173   Login: admin@aira.com / Aira2026!
```

## Salida esperada
Un resumen de 6 líneas: Cockroach (reusado/nuevo) · esquema cargado · semilla operable · backend local OK (token recibido sí/no) · frontend arriba · credenciales DBeaver. Nada más.
