# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- Features are planned with OpenSpec before they are built. Stack changes go through a change too.
- Plans live in GitHub milestones and issues. One issue is one OpenSpec change, and its PR closes the issue. Park split-off or later work as an issue, not as a draft PR.
- TypeScript stays on 6.0 until typescript-eslint supports 7. TypeScript 6 no longer loads `@types/*` packages on its own, so list them in `types`.
- With the Cloudflare Vite plugin, the wrangler environment is picked at build time (`CLOUDFLARE_ENV=preview`). `wrangler --env` does not work on the build output.
- `openspec/config.yaml` sets the writing rules for OpenSpec artifacts. Follow them even when you edit artifacts directly rather than through an `/opsx` command.
- Telemetry is off for this project. Run the CLI with `OPENSPEC_TELEMETRY=0`, since a fresh environment won't have the global setting.
- Skills listed in `skills-lock.json` come from other repos. Don't edit them; `just skills-update` overwrites them. Add new ones with `DO_NOT_TRACK=1 pnpm dlx skills@1.7.2 add <owner/repo@skill> --agent claude-code --yes`.
- The `react-router-framework-mode` skill is written for React Router 7; we use 8. Middleware is always on, so there is no `future.v8_middleware` flag. Loaders and actions get the raw request, so use their `url` argument, not `new URL(request.url)`. The rest of the v8 changes are in `react-router`'s CHANGELOG.
