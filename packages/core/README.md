# @specord/core

Core source-analysis pipeline for Specord.

This package creates the TypeScript program, discovers NestJS controllers and DTOs, extracts the internal inspection model, applies `specord.config.ts`, and serializes deterministic inspection output.

## Install

```bash
npm install @specord/core
```

## Usage

Most users should start with `@specord/cli`. Use `@specord/core` directly when building custom tooling around Specord's inspection model.
