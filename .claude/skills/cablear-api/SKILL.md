---
name: cablear-api
description: Conecta una página o componente del frontend a los endpoints REALES del backend Aira (reemplaza datos mock). Úsala cuando una pantalla deba leer/escribir datos de verdad. Garantiza el patrón correcto: clienteHttp + ganchos react-query + GuardiaAutenticacion + mapeo de errores de dominio. Nada de fetch suelto ni token desde localStorage.
---

# cablear-api — Conectar pantallas a datos reales

> Objetivo: que el frontend hable con el backend real con UN solo patrón, seguro y consistente.
> El backend ya expone todo (16 capacidades + bot + pagos). Aquí solo se cablea bien.

## Las piezas reales (no inventes otras)

- **Cliente HTTP único**: `frontend/src/integraciones/http/cliente.ts` → `clienteHttp` (ya pone `Authorization: Bearer`
  desde `almacen-sesion`). NUNCA uses `fetch` directo ni leas el token a mano.
- **Errores de dominio**: `integraciones/http/errores.ts` → `esErrorDominio(error, 'codigo')`. El backend devuelve
  códigos como `empresa_sin_suscripcion_activa`, `reserva_no_confirmable`, `suscripcion_cancelada` (HTTP 402/404/409).
- **Sesión / auth**: `plataforma/identidad/almacen-sesion.ts` (zustand) + `guardia-autenticacion.tsx`
  (`GuardiaAutenticacion`). Las páginas privadas NO deciden auth: las envuelve el guardia.
- **Estado servidor**: `@tanstack/react-query`. Toda llamada vive en un **gancho** por capacidad:
  `capacidades/<x>/ganchos/usarAlgo.ts` (ver `usarClientes.ts`, `usarAccionesReserva.ts` como referencia).

## Patrón obligatorio

1. **Lectura** → `useQuery` dentro de un gancho de la capacidad. La página consume el gancho, no llama HTTP.
2. **Escritura** → `useMutation` + invalidar las queries afectadas (`queryClient.invalidateQueries`).
3. **Forma del backend** → las respuestas vienen `{ exito, datos }` o `{ exito:false, error }`. Desempaqueta `datos`.
4. **Errores** → en el `onError`/catch, mapea con `esErrorDominio` a un mensaje humano y muéstralo con `BannerAlerta`
   (no `alert()`, no string crudo). Ej: `esErrorDominio(e,'empresa_sin_suscripcion_activa')` → "Tu plan venció…".
5. **Auth** → la ruta privada va detrás de `GuardiaAutenticacion`; el permiso lo valida el backend (403). El front
   solo OCULTA acciones que el rol no tiene; nunca AUTORIZA por su cuenta.

## Antipatrones prohibidos

- `fetch()` / `axios` sueltos fuera de `clienteHttp`.
- `localStorage.getItem('token')` directo.
- Llamadas HTTP dentro del componente de página (van en el gancho).
- `if (rol === 'admin')` para decidir acceso (eso lo dice el backend).
- Datos mock dejados "temporalmente". Si cableas, cableas de verdad.

## Flujo de trabajo

1. Identifica el/los endpoint(s) reales (revisa `backend/aplicacion/entrada/http/rutas.go`).
2. Crea/edita el gancho en `capacidades/<x>/ganchos/`.
3. Conecta la página al gancho; agrega estados carga/vacío/error (ver skill `sistema-diseno`).
4. Verifica contra el backend local (`:9000`, ver memoria `proyecto-aira-setup-local`).

## Checklist

- [ ] Toda llamada pasa por `clienteHttp`
- [ ] La llamada vive en un gancho react-query, no en la página
- [ ] Mutaciones invalidan las queries correctas
- [ ] Errores de dominio mapeados a mensajes humanos
- [ ] Sin token a mano, sin decisiones de auth en el front
- [ ] Probado contra el backend real, no mock
