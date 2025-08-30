# Project Development Rules

## 🛡️ Database Safety First - CRITICAL RULES

### Allowed Operations

✅ CREATE TABLE - new tables only
✅ ADD COLUMN - new columns only
✅ CREATE INDEX - performance improvements
✅ INSERT/UPDATE/SELECT data - data operations OK
✅ CREATE VIEW - for compatibility layers

### Forbidden Operations - NEVER USE

❌ DROP TABLE - loses all data
❌ DROP COLUMN - loses column data
❌ DELETE FROM <table> - for schema operations
❌ TRUNCATE - wipes all data
❌ ALTER COLUMN TYPE - can corrupt data
❌ RENAME TABLE/COLUMN - use create new + deprecate old

### 🔄 Schema Synchronization - MANDATORY

**CRITICAL: Always keep dev database in sync with schema changes**

- After creating migration files: **IMMEDIATELY run `npx prisma migrate deploy`**
- This prevents schema drift between dev and production
- GitHub Actions only updates production, NOT dev database
- Dev database synchronization is manual and required for every schema change
- Never commit schema changes without applying to dev database first

### Safe Development Patterns

#### For Column "Renames"

```sql
-- Instead of: ALTER TABLE users RENAME COLUMN old_name TO new_name
ALTER TABLE users ADD COLUMN new_name TEXT;
UPDATE users SET new_name = old_name;
-- Mark old column as deprecated in code comments
```

#### For Table "Renames"

```sql
-- Instead of: ALTER TABLE old_table RENAME TO new_table
CREATE TABLE new_table (LIKE old_table INCLUDING ALL);
INSERT INTO new_table SELECT * FROM old_table;
-- Keep old table, mark as deprecated in code
```

## ✅ Code Quality Standards

### TypeScript

- Strict mode enabled
- No `any` types without justification
- All functions must have return types
- Run check: `npm run type-check`

### Linting (ESLint)

- Airbnb style guide base
- React hooks rules enforced
- Auto-fix when possible: `npm run lint:fix`
- No warnings allowed in PR

### Formatting (Prettier)

- Consistent code style enforced
- Format on save in editor
- Pre-commit hook runs formatter
- Manual: `npm run format`

### Security (Snyk)

- Weekly vulnerability scans
- No high/critical vulnerabilities
- Update dependencies promptly
- Run: `npm run security-check`

## 🔒 Code Safety

**NEVER PUSH TO MAIN BRANCH ON GITHUB. YOU ARE UNAUTHORIZED FROM EVERY TOUCHING THIS BRANCH. ONLY EVER PUSH TO DEV**

- Main branch is production-protected
- All changes must go through dev branch
- Use pull requests for code review
- Never force push to any branch
- Always verify branch before pushing

## 🤖 AI Assistant Behavior

- After code changes, always run validation
- Use only additive database operations
- Check `.database-safety-rules.md` before DB operations
- Fix issues immediately
- Don't proceed if checks fail
- Explain any manual fixes needed
