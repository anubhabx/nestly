# `specord serve`

`specord serve` starts a local documentation server for the generated OpenAPI document.

Use this when you want to view docs independently of the Nest app bootstrap. The preferred in-app integration is `setupSpecordDocs()` from `@specord/nestjs`.

## Command

```bash
specord serve [project-dir] [--host 127.0.0.1] [--port 4777] [--pretty]
```

Repo-local form:

```bash
pnpm.cmd serve -- examples/nestjs-realworld --pretty
```

Routes:

| Route | Purpose |
| --- | --- |
| `/` | Redirects to `/api` |
| `/api` | Docs UI scaffold |
| `/api/openapi.json` | OpenAPI 3.1 JSON |
| `/health` | Server health JSON |

## Override Routes

```bash
specord serve apps/api --docs-path /reference --json-path /reference/spec.json
```

## Start A Nest Dev Process Beside Docs

```bash
specord serve apps/api --app-command "pnpm start:dev" --app-url http://localhost:3000
```

`--app-command` is a convenience process runner. It does not change how the OpenAPI document is produced.
