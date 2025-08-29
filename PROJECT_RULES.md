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

## 🔄 Continuous Validation Workflow

### On Every File Save (Editor)
- TypeScript incremental compilation
- ESLint auto-fix
- Prettier format

### Before Every Commit (Git Hooks)
- Type checking must pass
- Linting must pass
- Formatting must be correct

### On Every PR (GitHub Actions)
- Full TypeScript build
- Complete lint check
- Security scan
- Test suite execution

## 🤖 AI Assistant Behavior
- After code changes, always run validation
- Use only additive database operations
- Check .database-safety-rules.md before DB operations
- Fix issues immediately
- Don't proceed if checks fail
- Explain any manual fixes needed
