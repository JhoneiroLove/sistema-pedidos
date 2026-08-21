# Docker y despliegue en Dokploy

## Arquitectura

```text
Navegador -> frontend:3001 -> backend:3000 -> postgres:5432
                   BFF / SSR       Prisma
```

Solo frontend necesita ser público. Backend puede recibir un segundo dominio si necesitás Swagger o Postman. PostgreSQL nunca debe publicar su puerto en el VPS.

## DATABASE_URL correcta

Formato PostgreSQL aceptado por Prisma:

```text
postgresql://USUARIO:CLAVE@HOST:PUERTO/BASE?schema=public
```

En los contenedores de este proyecto:

```env
DATABASE_URL=postgresql://pedidos_app:clave@postgres:5432/sistema_pedidos?schema=public
DATABASE_SCHEMA=public
```

- `postgres` es el nombre del servicio Compose. `localhost` apuntaría al propio contenedor backend y sería incorrecto.
- `5432` es el puerto interno de PostgreSQL. La base no publica ningún puerto al host.
- La clave debe coincidir con `POSTGRES_PASSWORD`.
- Caracteres reservados de la clave (`@`, `:`, `/`, `%`, `#`, `?`) deben codificarse con percent-encoding dentro de `DATABASE_URL`. Para evitar dos representaciones distintas, conviene generar una clave larga con letras, números, `_` y `-`.
- `?schema=public` lo usa Prisma CLI para migraciones; `DATABASE_SCHEMA=public` se pasa explícitamente a `@prisma/adapter-pg` en runtime.

## Desarrollo local con Docker

Los puertos elegidos no aparecen publicados en el inventario suministrado del VPS:

| Servicio | Host local | Contenedor |
| --- | ---: | ---: |
| Frontend | `3100` | `3001` |
| Backend | `3101` | `3000` |

Los puertos se ligan por defecto a `127.0.0.1`, por lo que no quedan expuestos a la red. PostgreSQL solo es accesible por backend dentro de Docker.

1. Copiá y completá el entorno:

```bash
cp .env.example .env
openssl rand -base64 48
openssl rand -base64 32
```

El primer valor reemplaza `JWT_SECRET`. El segundo reemplaza `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` y debe representar exactamente 32 bytes en base64.

2. Validá la interpolación y levantá el stack:

```bash
docker compose config
docker compose up -d --build --wait
```

El backend ejecuta `prisma migrate deploy` antes de iniciar. Luego comprobá:

```bash
curl http://localhost:3100/api/health
curl http://localhost:3101/api/health
node scripts/verify-integration.mjs
```

Para detener sin borrar datos:

```bash
docker compose down
```

## Despliegue en Dokploy

### Repositorio

La raíz es el único repositorio Git y contiene `compose.yml`, `backend/` y `frontend/`. Dokploy puede clonar un único origen y resolver ambos contextos de build.

### Configuración

1. Creá un servicio **Docker Compose**, no `Stack`: Stack no admite `build`.
2. Seleccioná el repositorio raíz y usá `./compose.yml` como Compose Path.
3. Activá **Isolated Deployments** para que Dokploy agregue la red de Traefik sin mezclar las redes internas.
4. Cargá en Environment las variables de `.env.example` con valores de producción.
5. No agregues variables de binding de IP; el Compose usa únicamente los puertos host `3100` y `3101`.
6. En Domains agregá el dominio web al servicio `frontend`, Container Port `3001`, HTTPS habilitado.
7. Opcionalmente agregá un dominio API al servicio `backend`, Container Port `3000`. No agregues un dominio a `postgres`.

Ejemplo de variables de producción:

```env
POSTGRES_DB=sistema_pedidos
POSTGRES_USER=pedidos_app
POSTGRES_PASSWORD=UNA_CLAVE_LARGA_Y_UNICA
DATABASE_URL=postgresql://pedidos_app:UNA_CLAVE_LARGA_Y_UNICA@postgres:5432/sistema_pedidos?schema=public
DATABASE_SCHEMA=public
JWT_SECRET=RESULTADO_DE_OPENSSL_RAND_BASE64_48
CORS_ORIGINS=https://pedidos.tudominio.com
ENABLE_SWAGGER=false
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=RESULTADO_DE_OPENSSL_RAND_BASE64_32
```

Dokploy escribe las variables de su UI en `.env`, pero no las inyecta automáticamente. `compose.yml` referencia cada variable explícitamente, por lo que sí llegan únicamente al servicio que las necesita.

### Puertos del VPS

El Compose usa los puertos host libres `3100` y `3101`. Dokploy y Traefik alcanzan `expose: 3001` y, opcionalmente, `expose: 3000` por la red Docker. PostgreSQL no se publica. Esto evita conflictos con los puertos ya ocupados (`3000`, `3001`, `3002`, `3003`, `3010`, `8080`, etc.).

### Operación

- Configurá backup del volumen nombrado `postgres_data` desde Volume Backups de Dokploy.
- Mantené una sola réplica de backend durante migraciones o coordiná el despliegue; Prisma usa locks, pero una migración fallida debe detener el rollout.
- Mantené estable `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` entre builds e instancias.
- Verificá después de cada despliegue `https://pedidos.tudominio.com/api/health`.
- Si exponés la API, mantené Swagger deshabilitado en producción salvo necesidad concreta.
