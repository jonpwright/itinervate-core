# @itinervate/core

Pure TypeScript logic shared by the itinervate website (Next.js) and mobile app
(Expo). No React / Next / React Native / Firebase imports — anything here must
run identically in both.

## Why
The two apps used to carry their own copies of these files. Copies drift: a bug
fixed in one silently survives in the other. This package is the single source.

## Consuming
Both apps depend on a pinned commit:
```
npm i github:jonpwright/itinervate-core#<sha>
```
Each app keeps a one-line shim at `lib/<module>.ts`:
```ts
export * from '@itinervate/core/contactFilters';
```
so existing `@/lib/...` imports keep working.

## Changing something
1. Edit `src/<module>.ts`, add/adjust tests in `test/`.
2. `npm test` (builds, then runs tests).
3. Commit **including the compiled `*.js` / `*.d.ts`** at the package root — consumers install straight from git, there is no build on install.
4. Bump the pinned sha in both apps' `package.json` and `npm install`.

## Rules
- No platform imports. If a module needs one, it doesn't belong here.
- Keep modules self-contained (no cross-module imports) so each is usable alone.
