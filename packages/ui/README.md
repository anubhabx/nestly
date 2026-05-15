# @specord/ui

Static documentation UI workspace for Specord.

This package renders the dependency-free docs shell used by `@specord/nestjs` and `specord serve`.

## Install

```bash
npm install @specord/ui
```

## Status

The UI is currently a customizable API reference scaffold:

- resizable and draggable panels for endpoints, reference, try-it, and schemas
- add/remove panel controls with undo, redo, and reset actions
- endpoint tabs for overview, code snippets, schema summary, and changelog metadata
- a read-only try-it panel that prepares request fields without executing requests
- local layout persistence in the browser

Request execution, credential storage, and changelog authoring are intentionally not implemented yet. Those need explicit product and safety contracts before becoming live behavior.
