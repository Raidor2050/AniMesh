# Deployment

## Targets

- **Primary**: GitHub Pages `https://raidor2050.github.io/AniMesh/` (branch `gh-pages`).
- **Alt**: Vercel (`base` flips to `/` in `vite.config.ts`).

## Build

`npm run build` = `tsc -b` → shader lint → `vite build` → `dist/`

## Manual deploy (emergency / fallback)

Uses a temp worktree so `gh-pages` never sees the working tree:

```powershell
git worktree add C:\Users\raiya\AppData\Local\Temp\animesh-gh-pages gh-pages
# build dist/ first
Copy-Item -Recurse -Force dist\* C:\Users\raiya\AppData\Local\Temp\animesh-gh-pages
cd C:\Users\raiya\AppData\Local\Temp\animesh-gh-pages
git reset --hard; git clean -fdx; git rm -r -q .   # clear stale
Copy-Item -Recurse -Force dist\* .                # copy fresh (incl. hidden files)
git add -A; git commit -m "deploy: <version>"; git push origin gh-pages
cd G:\AO projects\AniMesh; git worktree remove <tmp>
```

Verify live: `https://raidor2050.github.io/AniMesh/` — boot, first shader render,
immersive, mobile viewport.

## CI deploy (D33, GitHub Actions)

`.github/workflows/ci.yml`:

```yaml
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4 with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v4
        with: { github_token: ${{ secrets.GITHUB_TOKEN }}, publish_dir: ./dist }
```

`GITHUB_TOKEN` has write access to the `gh-pages` branch; no extra secrets needed.
If Pages is served from a branch other than `gh-pages` (e.g. `/docs`), adjust the action
or serve the full repo — keep this doc in sync.

## Cache strategy (existing)

Vite content-hashes assets → immutable caching fine. `index.html` revalidates. No
service worker (PWA out of scope, D35).

## Config notes

- `vite.config.ts`: `base: process.env.VERCEL ? '/' : '/AniMesh/'`.
- No runtime env secrets; audio permission is user-level.
- Check `dist/index.html` asset paths start with `/AniMesh/` before pushing manually.