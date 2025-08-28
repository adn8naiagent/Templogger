# Claude Code Instructions for This Project

## Core Rules - ALWAYS FOLLOW

### Database Safety

- NEVER execute SQL directly on the database
- ALWAYS create migration files for any schema changes
- NEVER use: DROP TABLE, DROP COLUMN, DELETE, TRUNCATE, ALTER COLUMN TYPE
- ONLY use additive operations: CREATE TABLE, ADD COLUMN, CREATE INDEX

### Code Quality - Continuous Checks

- Run TypeScript checking after every change: `npm run type-check`
- Run ESLint after file modifications: `npm run lint`
- Run Prettier before committing: `npm run format`
- Fix all errors immediately, don't accumulate technical debt

### Security Scanning

- Run Snyk check weekly: `npm run security-check`
- Update dependencies when security issues found
- Never ignore security warnings

### Development Workflow

1. Before implementing features:
   - Check types compile
   - Ensure linting passes
   - Format code properly

2. After implementing features:
   - Run: `npm run validate-all` (types, lint, format, tests)
   - Create migrations for DB changes
   - Run security scan if dependencies changed

3. Before committing:
   - All checks must pass
   - No TypeScript errors
   - No lint warnings
   - Code properly formatted

## Automated Validation

When user asks for any feature, after implementation:

1. Auto-run: `npm run type-check`
2. Auto-run: `npm run lint:fix`
3. Auto-run: `npm run format`
4. Report any issues that can't be auto-fixed
