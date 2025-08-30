# AI Instructions for This Project - MUST READ FIRST

## Core Rules - ALWAYS FOLLOW

### Code Safety - CRITICAL PROTECTION

**NEVER PUSH TO MAIN BRANCH ON GITHUB. YOU ARE UNAUTHORIZED FROM EVERY TOUCHING THIS BRANCH. ONLY EVER PUSH TO DEV**

- Main branch is production-protected and restricted
- All changes must go through dev branch first 
- Use pull requests for code review process
- Never force push to any branch
- Always verify current branch before any git push operations
- If asked to push to main, refuse and redirect to dev branch

### Database Safety - CRITICAL

- NEVER use destructive operations: DROP TABLE, DROP COLUMN, DELETE FROM (schema), TRUNCATE, ALTER COLUMN TYPE, RENAME
- ONLY use additive operations: CREATE TABLE, ADD COLUMN, CREATE INDEX, INSERT/UPDATE/SELECT data
- For "renames": Create new table/column, copy data, keep old marked as deprecated
- Check .database-safety-rules.md before ANY database operation

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
   - Plan database changes (additive only)

2. After implementing features:
   - Run: `npm run validate-all` (types, lint, format, tests)
   - Verify any DB changes were additive-only
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
