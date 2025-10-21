# CI Integration Tests Setup (Shadow Profile)

GitHub rejected pushing workflow files from this token (missing `workflow` scope). To enable HTTP integration tests in CI:

1. In GitHub, go to: Settings → Actions → General → Workflow permissions → ensure `Read and write` is enabled.
2. Workflow recomendado ya agregado: `.github/workflows/integration.yml` (build + integration). Si requiere crearlo manualmente, use:

```yaml
name: integration

'on':
  push:
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm i --frozen-lockfile
      - run: pnpm -w build
      - run: pnpm -w test

  integration:
    needs: build
    runs-on: ubuntu-latest
    env:
      ORACLE_READER_TOKEN: ${{ secrets.ORACLE_READER_TOKEN }}
      EXECUTION_MODE: 'dry-run'
      ORACLE_SOURCE_MODE: 'shadow'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm i --frozen-lockfile
      - run: pnpm shadow:up
      - run: pnpm -w build
      - run: nohup pnpm -w start -- -p 3000 >/dev/null 2>&1 &
      - run: bash -lc 'for i in {1..60}; do (curl -sf localhost:3000/api/oracle/health && curl -sf localhost:3000/api/oracle/v1/feeds && exit 0) || sleep 2; done; exit 1'
      - run: pnpm -w test:integration
```

1. Alternatively, add a protecting job to your existing CI to execute `pnpm dev:ambos` in background, wait for ports, then run `pnpm test:integration`.

Notes:

- Default `pnpm test` excluye HTTP integration tests; use `pnpm test:integration` para ejecutarlos.
- This aligns with the Fortune 500 directive: fast unit tests on every push and a separate integration suite that boots the app.
