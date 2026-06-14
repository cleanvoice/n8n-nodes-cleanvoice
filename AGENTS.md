# AGENTS.md

## Cursor Cloud specific instructions

This repo (`@cleanvoice/n8n-nodes-cleanvoice`) is an **n8n community node package** written in
TypeScript. It is a library, not a standalone app: it builds to `dist/` and is loaded by an n8n
instance. There is **no automated test suite** (no `test` script in `package.json`); lint and build
are the programmatic checks.

### Standard commands (see `package.json` scripts)
- Lint: `npm run lint`
- Build: `npm run build` (cleans `dist/`, runs `tsc`, copies icons via gulp)
- Watch/dev: `npm run dev` (`tsc --watch`)
- Format: `npm run format`

Dependencies are installed by the startup update script (`npm install`). Node must be >= 20.15.

### Running / testing the node end-to-end in n8n
The package itself can't "run" alone — exercise it inside n8n:

1. n8n is installed via a user-local npm prefix at `~/.npm-global` (system prefix is not writable;
   `npm install -g` must use this prefix). The `n8n` binary is at `~/.npm-global/bin/n8n`, so ensure
   `~/.npm-global/bin` is on `PATH` (already appended to `~/.bashrc`). If n8n is missing from a fresh
   snapshot, install it with `npm install -g n8n` after setting the prefix.
2. This package is linked into n8n's custom-nodes dir: `npm link` from the repo root, then in
   `~/.n8n/custom` run `npm link @cleanvoice/n8n-nodes-cleanvoice`. The link points at `/workspace`,
   and n8n reads the built files from `dist/` (per the `n8n` block in `package.json`), so **you must
   `npm run build` before starting n8n**.
3. Start n8n (do NOT add this to the update script): `N8N_SECURE_COOKIE=false n8n start`. It serves the
   editor at `http://localhost:5678`. `N8N_SECURE_COOKIE=false` is required so login works over plain
   HTTP in this environment.
4. **n8n loads nodes at startup only.** After `npm run build` (rebuilding the node), restart the n8n
   process to pick up changes — hot reload does not apply to custom nodes.

### Credentials / secrets
- The Cleanvoice API key is provided as the `KEY_CLEANVOICE` secret (env var). Use it as the "API Key"
  for the "Cleanvoice AI API" credential in n8n. The credential test and the node's template dropdown
  both hit `https://api.cleanvoice.ai/v2/configurations`.
- Creating an edit (the node's main operation) submits a real job to the Cleanvoice API and consumes
  account credits — use a tiny sample file (e.g. `https://download.samplelib.com/mp3/sample-3s.mp3`)
  when smoke-testing.
