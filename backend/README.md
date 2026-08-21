# Sistema de pedidos de venta - Backend

> La ejecución del stack completo y el despliegue en Dokploy están documentados en [`../DEPLOYMENT.md`](../DEPLOYMENT.md).

API REST en NestJS, TypeScript, Prisma y PostgreSQL para gestionar clientes, artículos y pedidos con cabecera y líneas. Incluye autenticación JWT, protección CSRF para cookies, validación de entrada, control de stock y documentación Swagger.

## Requisitos

- Node.js 22 o superior
- PostgreSQL 15 o superior, o Docker Desktop
- npm 10 o superior

## Ejecución recomendada

Desde la raíz del monorepo:

```bash
cp .env.example .env
docker compose up -d --build --wait
```

En este modo la API queda en `http://localhost:3101/api`, las migraciones se aplican automáticamente y PostgreSQL permanece aislada dentro de Docker. Consultá el [`README raíz`](../README.md) para la configuración completa y los comandos Prisma.

## Ejecución nativa del backend

Este modo requiere una PostgreSQL accesible desde el host. No usa el contenedor PostgreSQL del stack porque ese servicio no publica su puerto.

```bash
npm install
cp .env.example .env
```

Cada desarrollador debe crear `backend/.env` con una `DATABASE_URL` que apunte a su PostgreSQL local o remota. Generá un secreto JWT fuera del código fuente:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Asigná el resultado a `JWT_SECRET`. `CORS_ORIGINS` acepta orígenes separados por coma, por ejemplo `http://localhost:3001,https://pedidos.example.com`. Nunca expongas `JWT_SECRET` ni `DATABASE_URL` mediante variables `NEXT_PUBLIC_*` del frontend.

Aplicá migraciones y ejecutá el servidor:

```bash
npx prisma generate
npm run db:migrate
npm run db:status
npm run start:dev
```

La API ejecuta una consulta y verifica la tabla `clientes` al arrancar: credenciales inválidas, base inexistente o migraciones pendientes detienen el proceso con un error explícito. En runtime podés consultar `GET /api/health`.

La API queda en `http://localhost:3000/api`. Swagger queda en `http://localhost:3000/docs` únicamente cuando `ENABLE_SWAGGER=true`.

## Modelo y reglas

- La cabecera contiene número generado por servidor, cliente relacionado, fecha del pedido, fecha de entrega y estado.
- Cada línea relaciona un artículo y conserva cantidad, precio unitario histórico, descuento e importe calculado por servidor.
- Estados: `BORRADOR`, `CONFIRMADO`, `ENTREGADO`, `CANCELADO`.
- Solo un borrador puede editarse o eliminarse.
- Confirmar descuenta stock; cancelar un confirmado lo repone.
- Las transiciones reclaman atómicamente el estado para impedir dobles movimientos de stock.

## Autenticación y CSRF

No existe un administrador hardcodeado. Cualquier persona se registra como cliente; su email se normaliza y la contraseña se guarda únicamente como hash Argon2 en `clientes.password_hash`.

```bash
curl -X POST http://localhost:3000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ada Lovelace","email":"ada@example.com","password":"Clave-Segura-123"}'
```

`POST /api/auth/login` devuelve el bearer para Postman y también establece cookies para el frontend SSR. La cookie JWT es `HttpOnly`; la cookie `csrf_token` debe enviarse en `X-CSRF-Token` para `POST`, `PATCH` y `DELETE` autenticados mediante cookie.

Con `Authorization: Bearer`, CSRF no aplica porque el navegador no agrega ese encabezado automáticamente.

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"Clave-Segura-123"}'
```

La respuesta contiene `accessToken` y `csrfToken`. Para probar una mutación por cookie:

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/clientes \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: PEGAR_CSRF_TOKEN" \
  -d '{"nombre":"Cliente Demo"}'
```

Para Postman guardá `baseUrl`, `accessToken` y `csrfToken`; usá `{{baseUrl}}/api` como base y autorización Bearer `{{accessToken}}`.

## URLs para Postman

| Método           | URL                                           | Uso                         |
| ---------------- | --------------------------------------------- | --------------------------- |
| GET              | `{{baseUrl}}/api/health`                      | Salud de PostgreSQL         |
| POST             | `{{baseUrl}}/api/auth/registro`               | Registrar cliente           |
| POST             | `{{baseUrl}}/api/auth/login`                  | Iniciar sesión              |
| GET              | `{{baseUrl}}/api/auth/me`                     | Usuario autenticado         |
| POST             | `{{baseUrl}}/api/auth/logout`                 | Cerrar sesión               |
| GET/POST         | `{{baseUrl}}/api/clientes`                    | Listar/crear clientes       |
| GET/PATCH/DELETE | `{{baseUrl}}/api/clientes/:id`                | Gestionar cliente           |
| GET/POST         | `{{baseUrl}}/api/articulos`                   | Listar/crear artículos      |
| GET/PATCH/DELETE | `{{baseUrl}}/api/articulos/:id`               | Gestionar artículo          |
| GET/POST         | `{{baseUrl}}/api/pedidos`                     | Listar/crear pedidos        |
| GET/PATCH/DELETE | `{{baseUrl}}/api/pedidos/:id`                 | Gestionar cabecera y líneas |
| POST             | `{{baseUrl}}/api/pedidos/:id/lineas`          | Agregar línea               |
| DELETE           | `{{baseUrl}}/api/pedidos/:id/lineas/:lineaId` | Eliminar línea              |
| PATCH            | `{{baseUrl}}/api/pedidos/:id/confirmar`       | Confirmar y descontar stock |
| PATCH            | `{{baseUrl}}/api/pedidos/:id/entregar`        | Marcar entregado            |
| PATCH            | `{{baseUrl}}/api/pedidos/:id/cancelar`        | Cancelar y reponer stock    |

## Ejemplo de pedido

```bash
curl -X POST http://localhost:3000/api/pedidos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clienteId":1,"fechaEntrega":"2026-08-30","detalles":[{"articuloId":1,"cantidad":2,"descuento":10}]}'
```

```bash
curl -X PATCH http://localhost:3000/api/pedidos/1/confirmar \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Seguridad

- JWT firmado y de corta duración; credenciales verificadas con Argon2.
- Cookies `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
- Doble envío de token CSRF y verificación de origen para autenticación por cookie.
- CORS restringido por configuración, Helmet, rate limit global y límite reforzado en login.
- DTO con lista blanca, rechazo de propiedades desconocidas y consultas parametrizadas por Prisma.
- Swagger se habilita explícitamente por entorno.
- `deepmerge-ts` se fuerza a `8.0.1` mediante `overrides`; `npm audit`, `prisma validate` y `prisma generate` verifican la compatibilidad con Prisma 7.9.1.

No se registran contraseñas, tokens ni secretos. En producción se debe usar HTTPS, rotar secretos, limitar privilegios del usuario PostgreSQL y centralizar logs de auditoría.

## Pruebas y TDD

```bash
npm test
npm run test:cov
npm run lint
```

La estrategia y los casos TDD están documentados en [`docs/TDD.md`](docs/TDD.md). Las pruebas unitarias cubren pedidos, autenticación, clientes, artículos, guards, configuración, Prisma y health con datos mockeados; no requieren PostgreSQL.

## Arquitectura por features

```text
src/
├── auth/       # registro, login, JWT y CSRF
├── clientes/   # gestión y proyección pública del cliente
├── articulos/  # catálogo y stock
├── pedidos/    # cabecera, líneas y estados
├── health/     # disponibilidad de PostgreSQL
├── prisma/     # infraestructura de persistencia
└── config/     # validación del entorno
```

Cada feature expone su `Module`, `Controller`, `Service`, DTO y pruebas. Los controladores manejan HTTP, los servicios contienen reglas/casos de uso y Prisma queda aislado como infraestructura compartida.

## Frontend SSR

El frontend Next.js consume la API mediante una capa BFF server-side y una variable privada `API_URL`. El JWT queda en una cookie `HttpOnly` del frontend y Server Actions lo reenvían como bearer; nunca se expone mediante `NEXT_PUBLIC_*` ni `localStorage`. La protección CSRF por doble token continúa disponible para consumidores que autentiquen directamente contra cookies del backend.
