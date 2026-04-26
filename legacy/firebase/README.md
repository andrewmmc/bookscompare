# Legacy Firebase Project

This directory contains the original Firebase-based BooksCompare app that existed before the monorepo rewrite.

It is kept only as migration reference for:

- old scraper selectors and parsing logic
- old Firebase Hosting static pages
- old function response shape and routing

The active implementation now lives at the repo root in:

- `apps/api`
- `apps/mobile`
- `packages/contracts`

Do not add new product work here unless it is part of a deliberate migration step.
