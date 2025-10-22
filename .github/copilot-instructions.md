
# Copilot Instructions for ADAF Dashboard Pro

## Fortune 500 Directive: Valores y Principios

Todos los agentes AI y desarrolladores deben operar bajo los máximos estándares Fortune 500, priorizando:

### 1. Valores orientados a rentabilidad y crecimiento
- Rentabilidad constante y optimización de operaciones
- Crecimiento sostenido y diversificación
- Innovación continua y diferenciación
- Excelencia operativa y orientación al cliente
- Liderazgo visionario y gestión de riesgos calculados
- Alianzas estratégicas y red de contactos

### 2. Ética y cultura Fortune 500
- Integridad, transparencia y gobernanza sólida
- Ética de trabajo implacable y resiliencia
- Diversidad, inclusión y responsabilidad social
- Compromiso con calidad y mejora continua

### 3. Principios de management
- Objetivos claros y medibles
- Decisiones basadas en datos y métricas
- Capacitación y empoderamiento del talento
- Promoción de liderazgo interno

### 4. Ejemplo de misión Fortune 500
- "Brindar la mejor experiencia de usuario a través de innovación, calidad y excelencia"
- "Ser la empresa más centrada en el cliente del mundo"

**Toda decisión técnica, de producto o código debe alinearse con estos valores: excelencia, rentabilidad, ética y crecimiento constante.**

## 1. System Overview
- **Dual-system architecture:** ADAF Dashboard Pro (Next.js 15, React 19, TypeScript) and LAV-ADAF (quantitative agents, separate port 3005).
- **Major modules:** Markets, Research, Academy, Reports, News, OnChain, Derivatives, Control, DQP, and Lineage (data provenance).
- **App Router:** Uses Next.js App Router with route groups (e.g., `(dashboard)`) for clean, conflict-free navigation and layout inheritance.
- **Component structure:** Core UI in `src/components/`, with domain-specific components in `src/components/dashboard/` and `src/components/ui/`.
- **API integration:** Data flows through Next.js API routes in `src/app/api/`, with endpoints for metrics, lineage, and data quality.

## 2. Developer Workflows
- **Start all systems:** `./inicio-completo.sh` (Linux/macOS) or `inicio-completo.bat` (Windows) to launch both ADAF and LAV-ADAF dashboards.
- **Dev server:** `pnpm dev` (port 3000, ADAF only). Use `./inicio-servidor.sh` for advanced options (see README for flags).
- **Testing:** Run `pnpm test` for >850 tests (Vitest, Playwright). Coverage >95% in critical modules.
  - **CI mode:** `pnpm test:ci` (for CI/CD pipelines, no watch mode)
- **Linting:** ESLint with strict config, enforced globally. Zero errors tolerated in production code.
- **CI/CD:** GitHub Actions, Docker, and Nginx for deployment. See `ARCHITECTURE.md` for pipeline details.
- **Git Workflow (Fortune 500)**:
  - **Conventional commits enforced:** All commits must follow `type(scope): message` format (commitlint active)
  - **Branch naming enforced:** `feature/*`, `bugfix/*`, `hotfix/*`, `chore/*`, `docs/*`, etc.
  - **Pre-commit:** Smart code detection, branch naming validation
  - **Pre-push:** Full test suite, security audit, large file detection, unsigned commit warnings
  - **Compliance audit:** `./scripts/git-audit.sh 90` for monthly Fortune 500 compliance report
  - **Override for emergencies:** `SKIP_PUSH_CHECKS=1 git push` (use sparingly)

## 3. Project Conventions & Patterns
- **Route groups:** All main dashboard pages live under `src/app/(dashboard)/`. Use `layout.tsx` for shared providers and navigation.
- **PageGuide:** Each main route can define a contextual guide in `src/components/learn/PageGuide.tsx`.
- **Data lineage:** Use `/dashboard/lineage` to visualize data provenance, powered by `/api/read/lineage/trace`.
- **Data quality:** `/dashboard/dqp` and related API endpoints for DQP (Data Quality & Provenance).
- **State management:** Zustand for global state, React Query for server state.
- **UI:** shadcn/ui, Tailwind CSS, Radix UI for consistent, accessible design.
- **Error handling:** Use `ErrorState` component for user-facing errors.
- **Testing patterns:** Use mocks for Redis, APIs, and DB in tests. See `tests/` for examples.

## 4. Integration & Extensibility
- **External data:** Integrates with SoSoValue, DeFiLlama, Farside, and institutional APIs.
- **Agent system:** LAV-ADAF agents communicate via API and message queues (see `lav-adaf/` for agent logic).
- **Monitoring:** Prometheus and Grafana for metrics; see `/api/metrics/*` endpoints.
- **Security:** Follows Fortune 500 standards—Zero Trust, audit trails, incident response, and compliance (SOX, PCI-DSS, GDPR, etc.).

## 5. Key Files & Directories
- `src/app/(dashboard)/` — Main dashboard routes
- `src/components/` — UI and dashboard components
- `src/app/api/` — API routes for data, metrics, lineage, DQP
- `src/lib/` — Utilities and service logic
- `.github/CODEOWNERS` — Automatic code review assignment for critical paths
- `.github/pull_request_template.md` — Fortune 500 comprehensive PR checklist
- `.husky/` — Git hooks (pre-commit, commit-msg, pre-push) with Fortune 500 standards
- `.commitlintrc.json` — Conventional commit enforcement rules (11 types, 40+ scopes)
- `scripts/git-audit.sh` — Automated Fortune 500 compliance reporting
- `PENDIENTES_FORTUNE500.md` — Manual setup tasks for 10/10 compliance (GPG, branch protection, workflows)
- `README.md`, `ARCHITECTURE.md`, `MEMORIA_GITHUB_COPILOT.md` — System documentation, workflows, and engineering log
- `NAVIGATION.md` — **Master documentation map** with Fortune 500 standards (29+ files, ~12,000 lines indexed)
- `motor-del-dash/documentacion/readmes/README.md` — Central HUB for all READMEs by topic

## 6. Examples
- **Add a new dashboard page:** Create `src/app/(dashboard)/newpage/page.tsx` and add to navigation in `NavLeft.tsx`.
- **Add a new API endpoint:** Create `src/app/api/your-endpoint/route.ts`.
- **Add a contextual guide:** Extend `guides` in `PageGuide.tsx` with your route and help text.
- **Check Git compliance:** Run `./scripts/git-audit.sh 90` to see Fortune 500 compliance score.
- **Make a commit:** Use conventional format: `feat(scope): message` or `fix(scope): message` (commitlint will validate).
- **Emergency push to main:** `SKIP_PUSH_CHECKS=1 git push origin main` (only for critical fixes).

---

## 7. Fortune 500 Git Standards (Current Status)

**Compliance Score:** 9.5/10 (automated checks complete)

**✅ Implemented:**
- CODEOWNERS for automatic code review assignment
- commitlint enforcing conventional commits (11 types, 40+ scopes)
- Pre-commit hook: branch naming validation + smart code detection
- Commit-msg hook: conventional commit validation
- Pre-push hook: tests, security audit, large files, signature checks
- .gitattributes for cross-platform consistency
- git-audit.sh for automated compliance reporting
- Fortune 500 PR template with comprehensive checklist

**⏳ Pending (Manual - 20 min):**
- GPG commit signing setup (10 min) → See `SETUP_GPG_PASOS.md`
- Branch protection rules (5 min) → See `SETUP_BRANCH_PROTECTION_PASOS.md`
- Workflow paths-ignore (3 min) → See `SETUP_WORKFLOWS_FIX_PASOS.md`

**Reference:** `PENDIENTES_FORTUNE500.md` for complete roadmap

---
For more, see the full `README.md` and `ARCHITECTURE.md`. If anything is unclear or missing, please request clarification or suggest improvements.
