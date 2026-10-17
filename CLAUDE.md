# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- Features are planned with OpenSpec before they are built. Stack changes go through a change too.
- TypeScript stays on 6.0 until typescript-eslint supports 7. TypeScript 6 no longer loads `@types/*` packages on its own, so list them in `types`.
- `openspec/config.yaml` sets the writing rules for OpenSpec artifacts. Follow them even when you edit artifacts directly rather than through an `/opsx` command.
- Telemetry is off for this project. Run the CLI with `OPENSPEC_TELEMETRY=0`, since a fresh environment won't have the global setting.
