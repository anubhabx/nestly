# @specord/cli

Command-line interface for Specord.

## Install

```bash
npm install --save-dev @specord/cli
```

## Commands

```bash
specord inspect [project-dir]
specord generate [project-dir] [--output openapi.json] [--pretty]
specord serve [project-dir] [--host 127.0.0.1] [--port 4777]
```

Specord defaults to `tsconfig.json` and `src/` in the current directory or project directory argument. Use `--project` and `--root` for custom layouts.
