# CI Integration Tests Setup (Shadow Profile)

GitHub rejected pushing workflow files from this token (missing `workflow` scope). To enable HTTP integration tests in CI:

1. In GitHub, go to: Settings → Actions → General → Workflow permissions → ensure `Read and write` is enabled.
2. Add a new workflow `.github/workflows/integration-tests.yml` with content:

```yaml
name: Integration Tests (Shadow Profile)

on:
  pull_request:
    branches: ['*']
  push:
    branches: [backup/**, feature/**]

jobs:
  integration:
    runs-on: ubuntu-latest
    env:
      CI: true
      EXECUTION_MODE: dry-run
      ORACLE_SOURCE_MODE: mock
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Start dev servers (ADAF + LAV)
        run: pnpm dev:ambos &

      - name: Wait for ports 3000 and 3005
        run: |
          timeout 120 bash -c 'until nc -z localhost 3000; do sleep 2; done'
          timeout 120 bash -c 'until nc -z localhost 3005; do sleep 2; done'

      - name: Run integration tests
        run: pnpm test:integration
```

1. Alternatively, add a protecting job to your existing CI to execute `pnpm dev:ambos` in background, wait for ports, then run `pnpm test:integration`.

Notes:

- Default `pnpm test` now excludes HTTP integration tests; use `pnpm test:integration` to run them.
- This aligns with the Fortune 500 directive: fast unit tests on every push and a separate integration suite that boots the app.
