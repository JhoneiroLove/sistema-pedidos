# Trama - Frontend de pedidos

> La ejecución del stack completo y el despliegue en Dokploy están documentados en [`../DEPLOYMENT.md`](../DEPLOYMENT.md).

Aplicación web responsive construida con Next.js 16, React 19 y TypeScript. Consume el backend NestJS mediante una capa BFF server-side: las páginas leen datos con Server Components y las mutaciones usan Server Actions.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local
npm run dev
```

El frontend escucha en `http://localhost:3001`; la API debe escuchar en `http://localhost:3101` cuando se usa el Compose raíz.

`API_URL` es privada y solo puede ser leída por la capa DAL. No debe llevar el prefijo `NEXT_PUBLIC_`. En despliegues con varias instancias también debe configurarse `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` con el mismo valor seguro en todas ellas.

## Funcionalidad

- Registro y login de clientes.
- Sesión JWT almacenada en cookie `HttpOnly`, `Secure` en producción y `SameSite=Strict`.
- Listado SSR de pedidos, clientes y artículos.
- Creación y modificación de cabecera y líneas del pedido.
- Confirmación, entrega, cancelación y eliminación según el estado.
- Gestión básica del catálogo y directorio comercial.
- Interfaz responsive para escritorio, tablet y móvil.
- Estados de carga, errores y ausencia de datos.
- Health integrado en `GET /api/health`, que comprueba frontend, backend y PostgreSQL.

## Arquitectura

```text
src/
├── app/                  # rutas, layouts y límites de error
├── features/
│   ├── auth/             # sesión, registro y login
│   ├── pedidos/          # casos de uso y editor de pedidos
│   ├── clientes/         # listado y alta
│   └── articulos/        # catálogo y alta
└── shared/
    ├── components/       # UI reutilizable sin reglas de dominio
    ├── lib/              # DAL, sesión, formato y contratos de formulario
    └── types/            # DTO mínimos recibidos desde la API
```

### Decisiones

- **BFF:** el navegador nunca conoce `API_URL` ni recibe el JWT desde JavaScript.
- **Repository/Gateway:** `apiRequest` centraliza transporte, timeout, autenticación y errores.
- **Feature modules:** cada dominio contiene sus servicios, acciones, esquemas y componentes.
- **Server-first:** solo los formularios interactivos son Client Components; listados y layouts usan SSR.
- **Single source of truth:** los totales del editor son orientativos; el backend recalcula precios, descuentos e importes.
- **Validación en fronteras:** Zod valida toda entrada de Server Actions y el backend vuelve a validar sus DTO.

## Seguridad

- JWT en cookie inaccesible para `document.cookie`; no se usa `localStorage`.
- Server Actions autentican nuevamente al llamar a la API y Next verifica `Origin` contra `Host` para CSRF.
- Límite de `256kb` por Server Action y límite adicional para JSON de líneas.
- URL de backend validada, rutas internas restringidas y timeout de ocho segundos.
- Headers contra MIME sniffing, framing, fuga de referrer y permisos innecesarios.
- No se renderizan secretos ni objetos completos del backend en Client Components.
- Los importes y estados se autorizan y calculan nuevamente en backend.

## Verificación

```bash
npm test
npm run typecheck
npm run lint
npm audit
```

No se necesita una API activa para las pruebas unitarias. Para pruebas funcionales, PostgreSQL debe estar migrada y `GET http://localhost:3000/api/health` debe responder correctamente.
