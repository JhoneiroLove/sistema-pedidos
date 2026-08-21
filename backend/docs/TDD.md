# Documento TDD

## Alcance

La estrategia cubre la lógica de negocio del sistema de pedidos con pruebas unitarias aisladas y datos mockeados. La base de datos no participa en estas pruebas: `PrismaService` y el cliente transaccional se reemplazan por dobles de Jest.

## Ciclo aplicado

1. **Rojo:** definir el comportamiento observable y su fallo: importe incorrecto, artículo duplicado, fecha inválida o transición concurrente.
2. **Verde:** implementar la regla mínima en `PedidosService`.
3. **Refactor:** centralizar construcción de líneas, validación de fechas y transición atómica sin cambiar el contrato HTTP.

## Casos automatizados

| Caso                     | Regla demostrada                                                  |
| ------------------------ | ----------------------------------------------------------------- |
| Importe con descuento    | `cantidad * precio * (1 - descuento / 100)` se calcula en backend |
| Artículo repetido        | Un pedido no admite dos líneas del mismo artículo                 |
| Fecha de entrega         | No puede ser anterior a la fecha del pedido                       |
| Confirmación             | El estado se reclama antes de descontar stock                     |
| Confirmación concurrente | Si otra petición tomó el estado, no se modifica stock             |

Además de pedidos, la suite cubre:

- Registro, hash Argon2, login y errores de autenticación.
- Clientes y artículos, incluyendo restricciones de integridad.
- Guards JWT y CSRF.
- Validación de entorno y puerto.
- Conexión fail-fast de Prisma y health de PostgreSQL.

Los archivos `*.spec.ts` viven junto al feature que verifican.

## Pirámide recomendada

- **Unitarias:** reglas puras y coordinación del servicio, rápidas y mockeadas.
- **Integración:** Prisma contra una PostgreSQL efímera para restricciones, cascadas y transacciones.
- **E2E:** login, cookies, CSRF y ciclo completo del pedido sobre HTTP.

Las pruebas unitarias no pueden demostrar aislamiento real de PostgreSQL. Para producción se debe añadir una suite de integración con dos confirmaciones concurrentes contra una base efímera.

## Ejecución

```bash
npm test
npm run test:cov
```

## Criterio de aceptación

Cada corrección de una regla de negocio debe comenzar con una prueba que falle, pasar con la implementación mínima y conservar cobertura de las ramas de error. No se persiguen porcentajes vacíos: se priorizan importes, estados, stock y autorización.
