# AGENTS.md

## Cursor Cloud specific instructions

MorseBrowser is a static single-page application (no backend). All commands are documented in `CLAUDE.md` and `README.md`.

### Services

| Service | Command | Port | Notes |
|---|---|---|---|
| Webpack Dev Server | `npm run dev` | 3000 | The only service needed for local development. Hot-reloads on file changes. |

### Lint / Test / Build

- **Lint**: `npx eslint src/` — the `.eslintignore` does not exclude `dist/`, so always target `src/` explicitly.
- **Test**: `npm test` — runs 88 Vitest unit tests (~150ms).
- **Build**: `npm run build` — runs prebuild scripts (lesson/preset generation via `tsx`), then Webpack production build to `dist/`. Build warnings about unreferenced wordfiles are expected and harmless.

### Gotchas

- The `prebuild` step (`tsx ./prebuildLessons.ts && tsx ./prebuildPresetSets.ts && tsx ./prebuildPresets.ts`) runs automatically before `npm run build`. It generates `src/wordfiles/wordlists.json` and preset files from source data. If these generated files are missing, the build and dev server will fail.
- Audio playback and text-to-speech require a real browser with Web Audio API — they cannot be tested headlessly or via unit tests.
- The app stores settings in cookies/localStorage, so clearing browser data resets all user preferences.
