# Workflows Fix - Pasos Exactos

## Opción 1: Editar Manualmente (Recomendado)

### 1. Editar integration.yml
```bash
xdg-open https://github.com/rstnva/adaf-dashboard-demo/edit/main/.github/workflows/integration.yml
```

Cambiar líneas 2-4 de:
```yaml
'on':
  push:
  pull_request:
```

A:
```yaml
'on':
  push:
    paths-ignore:
      - '**.md'
      - '.github/CODEOWNERS'
      - '.gitattributes'
      - '.commitlintrc.json'
      - 'scripts/git-audit.sh'
      - 'GIT_*.md'
  pull_request:
    paths-ignore:
      - '**.md'
      - '.github/CODEOWNERS'
      - '.gitattributes'
      - '.commitlintrc.json'
      - 'scripts/git-audit.sh'
      - 'GIT_*.md'
```

Commit message: `chore(ci): skip integration on git infra changes`

Click "Commit changes" (botón verde)

### 2. Editar ci.yml
```bash
xdg-open https://github.com/rstnva/adaf-dashboard-demo/edit/main/.github/workflows/ci.yml
```

Cambiar líneas 3-7 de:
```yaml
on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master ]
```

A:
```yaml
on:
  push:
    branches: [ main, master, develop ]
    paths-ignore:
      - '**.md'
      - '.github/CODEOWNERS'
      - '.gitattributes'
      - '.commitlintrc.json'
      - 'scripts/git-audit.sh'
      - 'GIT_*.md'
  pull_request:
    branches: [ main, master ]
    paths-ignore:
      - '**.md'
      - '.github/CODEOWNERS'
      - '.gitattributes'
      - '.commitlintrc.json'
      - 'scripts/git-audit.sh'
      - 'GIT_*.md'
```

Commit message: `chore(ci): skip CI Pipeline on git infra changes`

Click "Commit changes" (botón verde)

### 3. Pull cambios
```bash
cd /home/parallels/Desktop/adaf-dashboard-pro
git pull origin main
```

---

## Opción 2: Deshabilitar Temporalmente

### 1. Abrir Actions
```bash
xdg-open https://github.com/rstnva/adaf-dashboard-demo/actions
```

### 2. Deshabilitar integration workflow
- Click en "integration" (lado izquierdo)
- Click en "..." (arriba derecha)
- Click "Disable workflow"
- Confirmar

### 3. Deshabilitar CI Pipeline workflow
- Click en "CI Pipeline" (lado izquierdo)
- Click en "..." (arriba derecha)
- Click "Disable workflow"
- Confirmar

### 4. Re-habilitar cuando tests estén arreglados
Mismo proceso, selecciona "Enable workflow"

---

**Tiempo estimado**: 3 minutos (opción 1) o 2 minutos (opción 2)
**Meta**: Stop workflow spam en commits de docs/git infra
