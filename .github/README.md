# GitHub Actions CI/CD Setup

This repository includes a comprehensive CI/CD pipeline for the FridgeSafe application. The workflow automatically runs tests, builds the application, and deploys to staging and production environments.

## Required GitHub Secrets

To use this CI/CD pipeline, you need to configure the following secrets in your GitHub repository:

### Database Configuration
- **`DATABASE_URL`** - PostgreSQL connection string for your Supabase database
  ```
  postgresql://username:password@host:port/database
  ```

### Authentication
- **`SESSION_SECRET`** - Secret key for session management (generate a random string)
  ```bash
  # Generate a secure session secret
  openssl rand -hex 32
  ```

### Stripe Payment Processing
- **`STRIPE_SECRET_KEY`** - Your Stripe secret key from the Stripe Dashboard
- **`VITE_STRIPE_PUBLIC_KEY`** - Your Stripe publishable key (used by Vite build)

### AI Integration
- **`CLAUDE_API_KEY`** - Your Claude API key from Anthropic (optional)

## Setting Up Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name shown above

## Environment Setup

### Development Environments

You should set up two environments in GitHub:

1. **staging** - for the `dev` branch deployments
2. **production** - for the `main` branch deployments

To create environments:
1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Name it `staging` or `production`
4. Configure protection rules and additional secrets if needed

## Workflow Overview

The CI/CD pipeline includes the following jobs:

### Quality Assurance
- **ESLint** - Code quality and style checking
- **TypeScript Check** - Type safety validation
- **Jest Tests** - Unit and integration testing
- **Security Audit** - Dependency vulnerability scanning

### Build & Deploy
- **Vite Build** - Frontend application building
- **Database Schema** - Drizzle schema validation
- **Environment Check** - Required secrets validation

### Deployment
- **Staging Deploy** - Automatic deployment on `dev` branch push
- **Production Deploy** - Automatic deployment on `main` branch push
- **Notifications** - Success/failure notifications

## Deployment Platforms

The workflow is configured for **Railway** deployment, but can be easily adapted for other platforms:

### Railway Setup
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login to Railway: `railway login`
3. Connect your project: `railway link`

### Alternative Platforms
To use other platforms, modify the deployment steps in `.github/workflows/ci-cd.yml`:

- **Vercel**: Replace Railway commands with Vercel CLI
- **Netlify**: Use Netlify CLI commands
- **AWS/GCP/Azure**: Use respective CLI tools

## Manual Deployment

You can also trigger deployments manually:

1. Go to **Actions** tab in GitHub
2. Select the workflow
3. Click **Run workflow**
4. Choose your branch and click **Run workflow**

## Troubleshooting

### Common Issues

1. **Secret not configured**: Ensure all required secrets are set in GitHub
2. **Database connection failed**: Check your `DATABASE_URL` format and credentials
3. **Build failed**: Check TypeScript errors and ensure all dependencies are installed
4. **Tests failed**: Review test output and fix failing tests

### Debug Mode

To enable verbose logging, add this to your workflow file:
```yaml
env:
  DEBUG: true
  ACTIONS_STEP_DEBUG: true
```

## Security Considerations

- Never commit secrets to your repository
- Use separate databases for testing, staging, and production
- Regularly rotate your API keys and secrets
- Enable branch protection rules for your main branch
- Use environment-specific secrets where possible

## Contributing

When contributing to this repository:

1. Create feature branches from `dev`
2. Ensure all tests pass locally
3. Create a pull request to `dev` branch
4. The CI pipeline will automatically run tests
5. After approval, merge to `dev` for staging deployment
6. Create a release PR from `dev` to `main` for production deployment

## Support

For issues with the CI/CD pipeline:

1. Check the Actions tab for detailed logs
2. Review the troubleshooting section above
3. Contact the development team
4. Open an issue in the repository