# Examples

## Active Fixtures

### `nestjs-api`

The baseline fixture for V1 inspect behavior.

- Conventional NestJS REST application with controllers, DTOs, guards, and entities.
- Uses `class-validator` for DTO validation.
- Has `@nestjs/swagger` installed but **no `@Api*` decorators** in controllers or DTOs — this illustrates the "before Specord" state where Swagger produces low-quality docs without annotations.

### `nestjs-realworld`

The Phase 2 production-ish fixture for V1 generate behavior.

- Uses common NestJS Swagger decorators in controllers and DTOs.
- Covers `@ApiTags`, `@ApiOperation`, response decorators, `@ApiBearerAuth`, `@ApiSecurity`, and property decorators.
- Covers static `_OPENAPI_METADATA_FACTORY()` metadata and mapped type compositions.
- Intentionally keeps a few unresolved cases so default warnings and strict CI behavior stay tested.

## Future Targets (Out of Scope for V1)

### `express-js-app`

Plain JavaScript Express application. Not used by the V1 extractor.

### `express-ts-app`

TypeScript Express application. Not used by the V1 extractor.
