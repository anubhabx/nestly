# Examples

## Active Fixtures

### `nestjs-api`

The **fixture of record** for V1 acceptance testing. All `specord inspect` snapshot tests and acceptance matrix validations target this app.

- Conventional NestJS REST application with controllers, DTOs, guards, and entities.
- Uses `class-validator` for DTO validation.
- Has `@nestjs/swagger` installed but **no `@Api*` decorators** in controllers or DTOs — this illustrates the "before Specord" state where Swagger produces low-quality docs without annotations.

## Future Targets (Out of Scope for V1)

### `express-js-app`

Plain JavaScript Express application. Not used by the V1 extractor.

### `express-ts-app`

TypeScript Express application. Not used by the V1 extractor.
