# GPG Setup - Pasos Exactos

## 1. Generar clave GPG
```bash
gpg --full-generate-key
```
- Selecciona: `1` (RSA and RSA)
- Keysize: `4096`
- Expiration: `0` (never expires)
- Confirma: `y`
- Nombre: `Tu Nombre`
- Email: `tu@email.com` (el mismo de git config)
- Comment: `ADAF Dashboard` (opcional)
- Passphrase: Elige una contraseña segura

## 2. Listar claves y copiar KEY_ID
```bash
gpg --list-secret-keys --keyid-format=long
```
Output será algo como:
```
sec   rsa4096/ABC123DEF456 2025-10-22 [SC]
```
Copia `ABC123DEF456` (tu KEY_ID)

## 3. Exportar clave pública
```bash
gpg --armor --export ABC123DEF456
```
Copia TODO el output (desde `-----BEGIN PGP PUBLIC KEY BLOCK-----` hasta `-----END PGP PUBLIC KEY BLOCK-----`)

## 4. Agregar clave a GitHub
```bash
# Abre en navegador:
xdg-open https://github.com/settings/keys
```
- Click "New GPG key"
- Pega la clave pública completa
- Click "Add GPG key"

## 5. Configurar Git para firmar
```bash
git config --global user.signingkey ABC123DEF456
git config --global commit.gpgsign true
git config --global tag.gpgsign true
```

## 6. Configurar GPG TTY (para terminal)
```bash
echo 'export GPG_TTY=$(tty)' >> ~/.bashrc
source ~/.bashrc
```

## 7. Test commit firmado
```bash
cd /home/parallels/Desktop/adaf-dashboard-pro
git commit --allow-empty -m "test: verify GPG signing works"
```
Ingresa tu passphrase cuando se solicite

## 8. Verificar firma
```bash
git log --show-signature -1
```
Debe mostrar `gpg: Good signature from...`

## 9. Push de prueba
```bash
SKIP_PUSH_CHECKS=1 git push origin main
```

## 10. Verificar en GitHub
```bash
xdg-open https://github.com/rstnva/adaf-dashboard-demo/commits/main
```
El último commit debe tener badge "Verified" ✅

---

**Tiempo estimado**: 10-15 minutos
**Meta**: Commits firmados = 100% compliance Fortune 500
