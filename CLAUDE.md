# mcp-mediator

Standalone TypeScript MCP server (`package.json` name `job-engine-mcp-mediator`)
that relays message envelopes between a "builder" agent (Claude) and a
"support/director" agent (Copilot), records each exchange, and exposes
trigger-aware system prompts plus a gated `git_control` tool.

Salvaged out of the `apply` (JobScout) repo on 2026-07-07 — no coupling to
JobScout; lives on its own under `~/Tools/`. See `README.md` for the full API.

## Run

```bash
npm install
npm run build      # tsc -> dist/
npm start          # node dist/index.js
npm run dev        # ts-node src/index.ts
```

## Env

- `MEDIATOR_API_KEY` — required for the `git_control` tool (sent as `x-mediator-key`).
- `CLAUDE_API_KEY` / `ANTHROPIC_API_KEY`, `COPILOT_API_KEY` — model backends.

## Layout

- `src/` — TypeScript source. `dist/` — `tsc` build output (git-ignored).
- `config/` — mediator config. `data/` — recorded exchanges.
