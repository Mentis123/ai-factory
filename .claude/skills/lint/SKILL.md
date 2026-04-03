# /lint

Run ESLint and Prettier to fix code style issues.

## Steps

1. Run ESLint with auto-fix: `npx eslint . --fix`
2. Run Prettier to format all files: `npx prettier --write .`
3. Report any remaining issues that could not be auto-fixed

## Command

```bash
npx eslint . --fix && npx prettier --write .
```
