<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## MCPs

- Playwright screenshots and anything related to Playwright must be stored in the
.playwright-mcp folder.
- Use Context7 to retrieve the latest framework documentation.

## Stack

- Next.js 16.3.4 (App Router) + React 19 + TypeScript, Tailwind CSS v4.
- Tailwind v4 is CSS-first: no `tailwind.config.*`; theme lives in `app/globals.css` (`@theme` / `@import "tailwindcss"`).
- `@/*` path alias maps to the repo root (no `src/`).

## Commands

- `npm run dev` — dev server; `npm run build` / `npm run start`; `npm run lint` (eslint).
- No test framework or typecheck script is configured — `next build` is the closest full check.

## Workflow

- The app is in Spanish (childcare screens: niños, avisos, feed). Match UI text and commit messages to that.
- UI design source of truth: `references/pantallas/*.dc.html` (HTML mockups) and `references/screenshots/`. Build screens to match them.
- Spec-driven: use the `spec` skill (specs saved to `specs/`, written in the same language as the request) and `spec-impl` (creates a git branch named after the spec, only after its status means "Approved").
- `CLAUDE.md` just includes `AGENTS.md` — update this file for cross-agent instructions.