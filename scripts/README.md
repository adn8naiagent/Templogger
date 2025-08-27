# Development Scripts

Since package.json cannot be directly modified in this environment, here are equivalent shell scripts for all the requested npm scripts:

## Development Scripts
- `./scripts/dev.sh` - Run both client and server concurrently
- `./scripts/dev-client.sh` - Run Vite for frontend only
- `./scripts/dev-server.sh` - Run ts-node-dev for backend only

## Build Scripts  
- `./scripts/build.sh` - Build both client and server
- `./scripts/build-client.sh` - Vite build for frontend
- `./scripts/build-server.sh` - TypeScript compile for server

## Code Quality Scripts
- `npm run lint` - ESLint for all ts,tsx,js,jsx files (existing)
- `./scripts/lint-fix.sh` - ESLint with auto-fix
- `./scripts/format.sh` - Prettier write all files
- `./scripts/format-check.sh` - Prettier check without writing
- `./scripts/type-check.sh` - TypeScript checking with tsc --noEmit

## Testing Scripts
- `npm run test` - Run Jest tests (existing)
- `./scripts/test-watch.sh` - Jest in watch mode
- `npm run test:coverage` - Jest with coverage report (existing)

## Security Scripts
- `npm run security:test` - snyk test (existing, or use `./scripts/run-security.sh`)
- `./scripts/security-fix.sh` - snyk wizard
- `npm run security:monitor` - snyk monitor (existing)

## Setup Script
- `npm run prepare` would run `husky install` (Husky is already configured)

## Usage Examples

```bash
# Start development with hot reloading for both client and server
./scripts/dev.sh

# Build for production
./scripts/build.sh

# Check code formatting
./scripts/format-check.sh

# Fix linting issues
./scripts/lint-fix.sh

# Run tests in watch mode
./scripts/test-watch.sh
```

All scripts are executable and ready to use!