# Sistema de pedidos

Monorepo de un sistema web de pedidos de venta con autenticación, clientes, artículos, control de stock y ciclo de estados del pedido.

## Tecnologías

- Frontend: Next.js 16, React 19, TypeScript, Server Components y Server Actions.
- Backend: NestJS 11, TypeScript, Prisma ORM 7 y JWT.
- Base de datos: PostgreSQL 17.
- Infraestructura: Docker Compose y despliegue compatible con Dokploy.
- Pruebas: Jest para backend y Vitest para frontend.

## Estructura

```text
.
├── backend/              API NestJS y esquema Prisma
├── frontend/             Aplicación Next.js SSR y BFF
├── postman/              Colecciones y entornos Postman
├── scripts/              Verificación automatizada de integración
├── compose.yml           Stack completo local y Dokploy
├── .env.example          Contrato de variables de entorno
└── DEPLOYMENT.md         Guía específica de Dokploy y VPS
```

## Requisitos

Para la ejecución recomendada solo necesitás:

- Git.
- Docker Desktop en Windows/macOS o Docker Engine en Linux.
- Docker Compose v2, disponible como `docker compose`.
- Puertos locales `3100`, `3101` y opcionalmente `5555` libres.

Node.js 22 y npm 10 son opcionales para ejecutar pruebas o desarrollar fuera de los contenedores.

Verificá Docker antes de continuar:

```bash
docker version
docker compose version
```

## Configuración inicial

### 1. Clonar y entrar al monorepo

```bash
git clone URL_DEL_REPOSITORIO sistema-pedidos
cd sistema-pedidos
```

### 2. Crear el archivo de entorno

Linux, macOS o Git Bash:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

`.env` está ignorado por Git y NUNCA debe subirse al repositorio.

### 3. Generar secretos locales

Linux, macOS o Git Bash:

```bash
openssl rand -base64 48
openssl rand -base64 32
```

PowerShell:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Usá el primer resultado como `JWT_SECRET`. Usá el segundo como `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`; debe representar exactamente 32 bytes en base64.

### 4. Revisar las variables

| Variable | Descripción | Valor local esperado |
| --- | --- | --- |
| `POSTGRES_DB` | Nombre de la base | `sistema_pedidos` |
| `POSTGRES_USER` | Usuario PostgreSQL | `pedidos_app` |
| `POSTGRES_PASSWORD` | Clave PostgreSQL | Una clave local larga |
| `DATABASE_URL` | URL usada por Prisma | Ver sección siguiente |
| `DATABASE_SCHEMA` | Schema PostgreSQL | `public` |
| `JWT_SECRET` | Firma de tokens JWT | Resultado aleatorio de 48 bytes |
| `CORS_ORIGINS` | Orígenes web admitidos | `http://localhost:3100` |
| `ENABLE_SWAGGER` | Habilita Swagger | `true` para desarrollo |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Cifrado estable de Server Actions | Resultado aleatorio de 32 bytes |
| `APP_BIND_ADDRESS` | Dirección de publicación local | `127.0.0.1` |
| `FRONTEND_HOST_PORT` | Puerto web local | `3100` |
| `BACKEND_HOST_PORT` | Puerto API local | `3101` |
| `PRISMA_STUDIO_HOST_PORT` | Puerto opcional de Prisma Studio | `5555` |

## DATABASE_URL y PostgreSQL

El formato es:

```text
postgresql://USUARIO:CLAVE@HOST:PUERTO/BASE?schema=public
```

Dentro de Docker, PostgreSQL se encuentra por el nombre del servicio `postgres`, no por `localhost`:

```env
POSTGRES_DB=sistema_pedidos
POSTGRES_USER=pedidos_app
POSTGRES_PASSWORD=clave_local_segura_2026
DATABASE_URL=postgresql://pedidos_app:clave_local_segura_2026@postgres:5432/sistema_pedidos?schema=public
DATABASE_SCHEMA=public
```

Las siguientes partes deben coincidir:

- Usuario de `DATABASE_URL` con `POSTGRES_USER`.
- Clave de `DATABASE_URL` con `POSTGRES_PASSWORD`.
- Base de `DATABASE_URL` con `POSTGRES_DB`.
- Host `postgres`, que es el DNS interno de Docker Compose.
- Puerto `5432`, que es el puerto interno de PostgreSQL.

Si la contraseña contiene `@`, `:`, `/`, `%`, `#` o `?`, esos caracteres deben codificarse con percent-encoding en `DATABASE_URL`. Para desarrollo resulta más sencillo usar una clave larga formada por letras, números, `_` y `-`.

PostgreSQL no publica su puerto al host. Backend y las herramientas Prisma acceden exclusivamente por la red interna `database`.

## Levantar la aplicación

### 1. Validar Compose

Este comando detecta variables ausentes y errores de sintaxis sin iniciar contenedores:

```bash
docker compose config
```

### 2. Iniciar el stack completo

```bash
docker compose up -d --build --wait
```

En el primer arranque Docker debe descargar PostgreSQL, instalar dependencias y construir frontend y backend. Los siguientes arranques reutilizan las capas disponibles.

El orden automático es:

1. PostgreSQL inicia y pasa su healthcheck.
2. Backend ejecuta `prisma migrate deploy`.
3. Backend inicia y verifica conexión, schema y tabla `clientes`.
4. Frontend inicia cuando backend está saludable.
5. El healthcheck de frontend confirma la cadena frontend → backend → PostgreSQL.

### 3. Revisar el estado

```bash
docker compose ps
docker compose logs --tail=100 backend
docker compose logs --tail=100 frontend
```

Servicios disponibles:

| Servicio | URL |
| --- | --- |
| Frontend | `http://localhost:3100` |
| API | `http://localhost:3101/api` |
| Health backend | `http://localhost:3101/api/health` |
| Health integrado | `http://localhost:3100/api/health` |
| Swagger, si está habilitado | `http://localhost:3101/docs` |

El health integrado debe devolver `status: "ok"`, `frontend: "connected"` y `backend.database: "connected"`.

### 4. Crear el primer usuario

Abrí `http://localhost:3100/registro`. Cualquier cliente puede registrarse con nombre, email y una contraseña de al menos 12 caracteres. La contraseña se almacena como hash Argon2; nunca se persiste en texto plano.

### 5. Verificar integración completa

El script crea un cliente temporal, inicia sesión, valida el JWT y elimina el registro al terminar:

```bash
npm run verify:integration
```

También podés verificar manualmente:

```bash
curl http://localhost:3100/api/health
curl http://localhost:3101/api/health
```

## Operación diaria con Docker

Iniciar servicios ya construidos:

```bash
docker compose up -d --wait
```

Reconstruir después de cambiar código o dependencias:

```bash
docker compose up -d --build --wait
```

Reconstruir un único servicio:

```bash
docker compose up -d --build --wait backend
docker compose up -d --build --wait frontend
```

Seguir logs:

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

Reiniciar un servicio:

```bash
docker compose restart backend
```

Detener sin borrar datos:

```bash
docker compose down
```

## Prisma ORM

El schema está en `backend/prisma/schema.prisma` y las migraciones versionadas en `backend/prisma/migrations/`.

### Comportamiento automático

Cada vez que inicia el contenedor backend ejecuta:

```bash
npx prisma migrate deploy
```

`migrate deploy` aplica únicamente migraciones pendientes y es el comando correcto para Docker y producción. No genera migraciones nuevas ni elimina datos.

### Consultar estado de migraciones

```bash
docker compose run --rm prisma-tools npx prisma migrate status
```

### Aplicar migraciones manualmente

Normalmente no hace falta porque backend lo hace al iniciar:

```bash
docker compose run --rm prisma-tools npx prisma migrate deploy
```

### Crear una migración durante desarrollo

1. Modificá `backend/prisma/schema.prisma`.
2. Creá la migración con un nombre descriptivo:

```bash
docker compose run --rm prisma-tools npx prisma migrate dev --name agregar_campo_cliente
```

La carpeta `backend/prisma` se monta en el contenedor de herramientas, por lo que el nuevo SQL queda guardado en el monorepo y debe versionarse junto con el cambio de schema.

3. Reconstruí backend para regenerar Prisma Client:

```bash
docker compose up -d --build --wait backend
```

### Abrir Prisma Studio

```bash
docker compose run --rm --service-ports prisma-tools \
  npx prisma studio --browser none --hostname 0.0.0.0 --port 5555
```

Abrí `http://localhost:5555`. Studio queda ligado a `127.0.0.1`, no a toda la red.

En PowerShell podés ejecutar el comando en una sola línea:

```powershell
docker compose run --rm --service-ports prisma-tools npx prisma studio --browser none --hostname 0.0.0.0 --port 5555
```

### Regenerar Prisma Client fuera de Docker

Solo si instalaste dependencias localmente:

```bash
cd backend
npm install
npx prisma generate
```

### Reiniciar la base de desarrollo

ATENCIÓN: esto elimina todo el volumen PostgreSQL, incluidos usuarios, pedidos y catálogo.

```bash
docker compose down -v
docker compose up -d --build --wait
```

No uses `down -v` en producción.

## Pruebas y calidad

Instalá dependencias locales si todavía no existen:

```bash
npm --prefix backend install
npm --prefix frontend install
```

Ejecutar todas las pruebas desde la raíz:

```bash
npm test
```

Comandos individuales:

```bash
npm run test:backend
npm run test:frontend
npm --prefix backend run test:cov
npm --prefix frontend run typecheck
npm --prefix frontend run lint
npm --prefix backend run lint
```

Estado actual esperado:

- Backend: 8 suites y 29 pruebas.
- Frontend: 4 suites y 8 pruebas.
- Auditorías npm sin vulnerabilidades conocidas.

## Solución de problemas

### Docker no responde

Error típico: `Cannot connect to the Docker daemon`.

- Iniciá Docker Desktop.
- En Linux verificá `sudo systemctl status docker`.
- Ejecutá nuevamente `docker version`.

### Puerto ocupado

Modificá `FRONTEND_HOST_PORT`, `BACKEND_HOST_PORT` o `PRISMA_STUDIO_HOST_PORT` en `.env`, y luego recreá servicios:

```bash
docker compose up -d --force-recreate --wait
```

### Prisma P1000: credenciales inválidas

Revisá que `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` y `DATABASE_URL` coincidan. Si cambiaste credenciales después del primer arranque, PostgreSQL conserva las anteriores dentro del volumen.

En desarrollo, si no necesitás conservar datos:

```bash
docker compose down -v
docker compose up -d --build --wait
```

### Prisma P1001: no alcanza PostgreSQL

- Dentro de Docker, `DATABASE_URL` debe usar host `postgres` y puerto `5432`.
- No uses `localhost` en la URL que recibe el contenedor backend.
- Verificá `docker compose ps postgres` y `docker compose logs postgres`.

### Base sin migrar

```bash
docker compose run --rm prisma-tools npx prisma migrate status
docker compose run --rm prisma-tools npx prisma migrate deploy
docker compose restart backend
```

### Frontend devuelve 503 en `/api/health`

```bash
docker compose ps
docker compose logs --tail=200 backend
docker compose logs --tail=200 frontend
```

El frontend usa internamente `API_URL=http://backend:3000/api`. Ese valor no debe cambiarse a `localhost` dentro de Compose.

### Cambios de código no aparecen

Las imágenes son de producción y no usan volúmenes de código. Reconstruí el servicio modificado:

```bash
docker compose up -d --build --wait backend
docker compose up -d --build --wait frontend
```

## Seguridad del entorno

- No subas `.env` ni secretos al repositorio.
- No uses claves de desarrollo en Dokploy.
- No publiques PostgreSQL al host.
- Mantené `APP_BIND_ADDRESS=127.0.0.1` salvo que exista una necesidad local concreta.
- No uses variables `NEXT_PUBLIC_*` para `API_URL`, JWT o credenciales.
- Rotá `JWT_SECRET` de manera planificada: hacerlo invalida sesiones existentes.
- Mantené estable `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` entre builds e instancias.

## Despliegue

Para Dokploy, dominios, HTTPS, backups y puertos del VPS consultá [`DEPLOYMENT.md`](DEPLOYMENT.md).

Para detalles internos de cada aplicación:

- [`backend/README.md`](backend/README.md)
- [`frontend/README.md`](frontend/README.md)
- [`backend/docs/TDD.md`](backend/docs/TDD.md)
