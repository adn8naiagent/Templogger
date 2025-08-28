# Project Development Rules

## 🛡️ Database Safety First

### Allowed Operations

✅ CREATE TABLE
✅ ADD COLUMN  
✅ CREATE INDEX
✅ INSERT data

### Forbidden Operations

❌ DROP TABLE
❌ DROP COLUMN
❌ DELETE data
❌ TRUNCATE
❌ ALTER COLUMN (type changes)

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
- Migration safety check

### On Every PR (GitHub Actions)

- Full TypeScript build
- Complete lint check
- Security scan
- Test suite execution

## 🤖 AI Assistant Behavior

- After code changes, always run validation
- Fix issues immediately
- Don't proceed if checks fail
- Explain any manual fixes needed
