# AGENTS.md

## Cursor Cloud specific instructions

### Project overview
MorseBrowser is a fully client-side (static) Morse code practice tool. No backend, database, or Docker is required. All commands and dev docs are in `CLAUDE.md` and `package.json` scripts.

### Running the dev server
- `npm run dev` starts webpack-dev-server at **http://localhost:3000** with hot reload.
- The `open` option is set to `false` in `webpack.config.js`, so Chrome must be opened manually.

### Testing
- `npm test` runs all 88 Vitest tests (~135ms). Tests cover pure logic only (no browser/DOM).
- ESLint is integrated into the webpack build via `eslint-webpack-plugin`. Existing lint warnings in `src/morse/lessons/morseLessonPlugin.ts` and test files (Vitest globals like `describe`/`it`/`expect` flagged as undefined) are pre-existing and not blocking.
- To run ESLint standalone: `npx eslint --ext .js,.ts,.tsx src/`

### Building
- `npm run build` runs prebuild scripts (lesson/preset generators via `tsx`), webpack production build, then postbuild (zip + lesson checker). Build warnings about unreferenced wordfiles and asset size limits are pre-existing and expected.

### Gotchas
- The `prebuild` step uses `tsx` to run TypeScript build scripts (`prebuildLessons.ts`, `prebuildPresetSets.ts`, `prebuildPresets.ts`). These generate JSON files consumed by the webpack build. If lesson data looks stale, run `npm run prebuild` manually.
- `webpack.config.js` is CommonJS (`require()` style), not ESM.
- Audio playback requires a real browser with Web Audio API — cannot be tested headlessly.
