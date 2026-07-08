# mcp-mediator

Standalone MCP mediator that relays message envelopes between a "builder" agent
(Claude) and a "support/director" agent (Copilot), recording each exchange and
exposing trigger-aware system prompts plus a gated `git_control` tool.

Salvaged out of the `apply` (JobScout) repo on 2026-07-07 — it has no coupling to
JobScout and now lives on its own under `~/Tools/`.

## Run
```
npm install
npm run build      # tsc -> dist/
npm start          # node dist/index.js
npm run dev        # ts-node src/index.ts
```

## Env
- `MEDIATOR_API_KEY` — required for `git_control` (passed via `x-mediator-key`).
- `CLAUDE_API_KEY` / `ANTHROPIC_API_KEY`, `COPILOT_API_KEY` — model backends.
- `SKIP_MODEL=1` — return deterministic mock replies (no network).

## Layout
- `src/index.ts` — Express app: `/tools`, `/send`, git relay.
- `src/clients/` — Claude / Copilot wrappers.
- `src/git_control.ts` — gated git actions.
- `src/storage.ts` — conversation persistence.
- `config/mcp/default.json` — default tool allowlist.
