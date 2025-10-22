# Manual Workflow Setup Instructions

## Issue

The GitHub integration workflow file (`.github/workflows/integration.yml`) could not be pushed due to OAuth token limitations (missing `workflow` scope). This is a GitHub security restriction for workflow files.

## Solution

The workflow file is available locally but must be created manually in the GitHub UI or via a token with appropriate permissions.

## Steps to Enable Integration CI

### Option 1: Create Workflow via GitHub UI (Recommended)

1. **Navigate to GitHub Actions**:
   - Go to: https://github.com/rstnva/adaf-dashboard-demo/actions/new
2. **Create New Workflow**:
   - Click "set up a workflow yourself"
   - Name the file: `integration.yml`

3. **Copy Content from Local File**:
   ```bash
   cat .github/workflows/integration.yml
   ```
4. **Paste into GitHub Editor** and commit directly to your branch

### Option 2: Use Git with Proper Token

1. **Generate New Personal Access Token**:
   - Go to: https://github.com/settings/tokens/new
   - Grant `workflow` scope in addition to existing scopes
2. **Update Remote URL** (temporarily):

   ```bash
   git remote set-url origin https://YOUR_NEW_TOKEN@github.com/rstnva/adaf-dashboard-demo.git
   ```

3. **Add and Push Workflow File**:
   ```bash
   git add .github/workflows/integration.yml
   git commit -m "feat(ci): Add integration workflow"
   git push origin backup/2025-10-15-docs-structure
   ```

## Configure Secrets & Permissions

### Required GitHub Secrets

1. **Navigate to Repository Settings**:
   - Go to: https://github.com/rstnva/adaf-dashboard-demo/settings/secrets/actions
2. **Add New Secret**:
   - Name: `ORACLE_READER_TOKEN`
   - Value: Your Oracle reader API token

### Workflow Permissions

1. **Navigate to Actions Settings**:
   - Go to: https://github.com/rstnva/adaf-dashboard-demo/settings/actions
2. **Set Permissions**:
   - Under "Workflow permissions", select **"Read and write permissions"**
   - Check **"Allow GitHub Actions to create and approve pull requests"**

## Verify Integration Workflow

Once the workflow file is created and secrets are configured:

1. **Check Workflow Status**:

   ```bash
   # List workflows
   gh workflow list

   # View workflow runs
   gh run list --workflow=integration.yml
   ```

2. **Trigger Manual Run** (optional):

   ```bash
   gh workflow run integration.yml
   ```

3. **Monitor Execution**:
   - Navigate to: https://github.com/rstnva/adaf-dashboard-demo/actions
   - Select "Integration Tests" workflow
   - View logs and results

## Workflow Features

The `integration.yml` workflow provides:

- **Build Job**: Install, build, and run fast unit tests
- **Integration Job**: Boot shadow service (port 3005), start dashboard (port 3000), run @integration tagged HTTP tests
- **Automatic Cleanup**: Tears down shadow services after tests complete
- **Environment Variables**:
  - `ORACLE_READER_TOKEN` (secret)
  - `EXECUTION_MODE=dry-run`
  - `ORACLE_SOURCE_MODE=shadow`

## Current Status

✅ **Completed**:

- Test discipline: @integration tags applied to 6 HTTP tests
- Separate configs: `vitest.integration.config.ts` filters by tag
- Package.json scripts: `shadow:up`, `shadow:down`, `test:integration`
- Grafana dashboards versionized: `vox_populi.json`, `oracle_freshness.json`
- Provisioning config and automation scripts created
- Comprehensive observability README
- All quality gates passed: lint (0 errors), typecheck, build, unit tests (1016/1016)
- **Pushed to remote**: `backup/2025-10-15-docs-structure` branch

⚠️ **Pending**:

- Create `.github/workflows/integration.yml` in GitHub UI (blocked by OAuth scope)
- Add `ORACLE_READER_TOKEN` secret in GitHub settings
- Enable "Read and write permissions" for workflows

## Related Documentation

- **CI Integration Setup**: `CI_INTEGRATION_SETUP.md`
- **Grafana Observability**: `observability/grafana/README.md`
- **Test Configuration**: `vitest.integration.config.ts`

---

**Fortune 500 Directive**: This workflow embodies enterprise CI/CD best practices: isolated test environments, automated quality gates, comprehensive observability, and clear separation of concerns (unit vs integration tests). Once enabled, it will provide continuous validation of Oracle Core + Vox integration points.
