# @specord/openapi

OpenAPI 3.1 emission and validation for Specord inspection models.

This package translates Specord's internal `InspectionModel` into validated OpenAPI JSON. It preserves valid output even when some source facts remain unresolved, so teams can iterate with diagnostics and config overrides.

## Install

```bash
npm install @specord/openapi
```

## Usage

Most projects should call this through `specord generate` from `@specord/cli`.
