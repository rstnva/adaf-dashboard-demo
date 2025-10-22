# Branch Protection - Pasos Exactos

## 1. Abrir configuración de branches
```bash
xdg-open https://github.com/rstnva/adaf-dashboard-demo/settings/branch_protection_rules/new
```

## 2. Branch name pattern
Escribe: `main`

## 3. Marcar checkboxes (en orden):

### Require a pull request before merging
- ✅ Marcar
- Required approvals: `2`
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from Code Owners

### Require status checks to pass before merging
- ✅ Marcar
- ✅ Require branches to be up to date before merging
- Buscar y agregar checks:
  - `build` (del workflow integration)
  - `Build & Test` (del workflow CI Pipeline)

### Require signed commits
- ✅ Marcar

### Require linear history
- ✅ Marcar

### Include administrators
- ✅ Marcar

### Restrict who can push to matching branches
- NO marcar (o solo tú tendrás acceso)

### Allow force pushes
- ❌ NO marcar

### Allow deletions
- ❌ NO marcar

## 4. Click "Create" (botón verde al final)

## 5. Verificar
```bash
xdg-open https://github.com/rstnva/adaf-dashboard-demo/settings/branches
```
Debe aparecer regla para `main`

---

**Tiempo estimado**: 5 minutos
**Meta**: Branch protection = 10/10 compliance Fortune 500
