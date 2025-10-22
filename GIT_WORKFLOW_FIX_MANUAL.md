# Manual Fix: GitHub Workflows - Skip Git Infrastructure Changes

## Problema
Los workflows de CI/CD (`integration.yml` y `ci.yml`) están corriendo en cada push, incluyendo cambios solo en archivos de Git infrastructure (`.md`, CODEOWNERS, etc.), causando notificaciones innecesarias.

## Solución
Agregar `paths-ignore` a los workflows para skipear archivos de Git infrastructure.

## Limitación GitHub
No puedes editar workflows desde un push normal porque el token OAuth no tiene scope `workflow`. Debes hacerlo manualmente en GitHub.com.

## Pasos Manuales (5 minutos)

### 1. Editar `.github/workflows/integration.yml`

Ve a: https://github.com/rstnva/adaf-dashboard-demo/edit/main/.github/workflows/integration.yml

Cambia:
```yaml
name: integration
'on':
  push:
  pull_request:
concurrency:
```

Por:
```yaml
name: integration
'on':
  push:
    paths-ignore:
      - '**.md'
      - '.github/CODEOWNERS'
      - '.github/pull_request_template.md'
      - '.gitattributes'
      - '.commitlintrc.json'
      - 'scripts/git-audit.sh'
      - 'GIT_*.md'
  pull_request:
    paths-ignore:
      - '**.md'
      - '.github/CODEOWNERS'
      - '.github/pull_request_template.md'
      - '.gitattributes'
      - '.commitlintrc.json'
      - 'scripts/git-audit.sh'
      - 'GIT_*.md'
concurrency:
```

Commit message: `chore(ci): skip integration workflow for git infrastructure files`

### 2. Editar `.github/workflows/ci.yml`

Ve a: https://github.com/rstnva/adaf-dashboard-demo/edit/main/.github/workflows/ci.yml

Cambia:
```yaml
name: CI Pipeline

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master ]

env:
```

Por:
```yaml
name: CI Pipeline

on:
  push:
    branches: [ main, master, develop ]
    paths-ignore:
      - '**.md'
      - '.github/CODEOWNERS'
      - '.github/pull_request_template.md'
      - '.gitattributes'
      - '.commitlintrc.json'
      - 'scripts/git-audit.sh'
      - 'GIT_*.md'
  pull_request:
    branches: [ main, master ]
    paths-ignore:
      - '**.md'
      - '.github/CODEOWNERS'
      - '.github/pull_request_template.md'
      - '.gitattributes'
      - '.commitlintrc.json'
      - 'scripts/git-audit.sh'
      - 'GIT_*.md'

env:
```

Commit message: `chore(ci): skip CI Pipeline workflow for git infrastructure files`

### 3. (Opcional) Deshabilitar Temporalmente los Workflows

Si quieres silenciar las notificaciones mientras arreglas los tests:

1. Ve a: https://github.com/rstnva/adaf-dashboard-demo/actions
2. Click en "integration" workflow
3. Click en "..." (menú) → "Disable workflow"
4. Repite para "CI Pipeline" workflow

Cuando los tests estén arreglados, re-habilita los workflows.

## Alternativa: Token con Scope `workflow`

Si prefieres hacerlo desde la terminal:

1. Ve a: https://github.com/settings/tokens
2. Genera un nuevo token Classic con scope `workflow`
3. En tu máquina:
   ```bash
   git remote set-url origin https://<TOKEN>@github.com/rstnva/adaf-dashboard-demo.git
   ```
4. Ahora puedes push changes a workflows directamente

⚠️ **IMPORTANTE**: Nunca commitees el token al repositorio.

## Estado Actual

✅ **Completado:**
- `test:ci` script agregado a package.json
- Pre-push hook ahora puede correr tests correctamente

⚠️ **Pendiente (Manual):**
- Editar workflows para agregar `paths-ignore`
- O deshabilitar temporalmente los workflows

## Notificaciones GitHub

Para ajustar notificaciones mientras tanto:

1. Ve a: https://github.com/rstnva/adaf-dashboard-demo/settings/notifications
2. O configura filtros en tu email para mover "Actions failed" a una carpeta

---

**Estimado de tiempo**: 5 minutos para editar workflows manualmente
**Prioridad**: Media (es spam pero no crítico)
**Impacto**: Reducirá notificaciones innecesarias de workflows fallando en commits de docs
