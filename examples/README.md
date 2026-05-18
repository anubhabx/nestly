# Examples

## Active Fixtures

### `nestjs-api`

The canonical NestJS benchmark fixture for V1 inspect, generate, and serve behavior.

- Fresh Nest CLI scaffold expanded into a production-shaped modular REST API.
- Includes accounts, auth, projects, tasks, billing, webhooks, health, TypeORM entities, DTOs, guards, middleware, filters, and interceptors.
- Uses common NestJS Swagger decorators for tags, operation IDs, responses, security, params, and DTO properties.
- Covers `PartialType`, `PickType`, nested response shapes, enums, arrays, query DTOs, nested path params, and deliberately unresolved dynamic export/security cases.
- Includes `compose.yaml` for local Postgres and Redis services.

## Future Targets (Out of Scope for V1)

### `express-js-app`

Plain JavaScript Express application. Not used by the V1 extractor.

### `express-ts-app`

TypeScript Express application. Not used by the V1 extractor.
