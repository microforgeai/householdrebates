# Prompt 44 – Housekeeping and one brand mark (15 Nov 2026)
Save this prompt as prompts/44-housekeeping-brand-mark.md in your first commit.

Rules: branch feat/p44-housekeeping from main. No figure, source, SEO-field or CSP changes. Don't push, merge or deploy. STOP at the end.

1. Branch cleanup: delete every LOCAL branch already merged into main, using `git branch -d` only (never -D). Don't touch remote branches. List what was deleted.
2. One brand mark: use the house mark from site/public/favicon.svg everywhere.
   - Replace the leaf SVG in site/src/components/Header.astro (.site-brand__mark) with a 24×24 line version of the same house (currentColor, aria-hidden), visually matching the favicon.
   - Regenerate the share images (npm run og) and icons (npm --workspace=site run icons) only if they don't already use the house; keep file names unchanged.
   - Re-capture docs/design/p44/ screenshots of / at 1280×800 and 375×812 (light and dark).
3. CHANGELOG.md: one dated entry.
Acceptance: npm run build, npm run check (17 guards incl. check-seo-unchanged), Vitest and Playwright all pass.
Report: deleted branches, commit list, screenshots, test results. Then STOP.
