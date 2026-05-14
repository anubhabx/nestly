# @specord/nestjs

NestJS adapter for Specord docs route injection.

This package exports `setupSpecordDocs(app)`, a Swagger-like bootstrap helper that mounts Specord's docs UI at `/api` and OpenAPI JSON at `/api/openapi.json` by default.

## Install

```bash
npm install @specord/nestjs
```

## Usage

```ts
import { setupSpecordDocs } from "@specord/nestjs";

setupSpecordDocs(app);
```

Specord still generates from static source analysis; it does not boot the Nest app, execute decorators, or call `SwaggerModule.createDocument()`.
