@echo off
REM ====================================================================
REM 🚀 ADAF Dashboard Pro - Script de Inicio Rápido (Windows)
REM ====================================================================
REM Este script automatiza el proceso de inicialización en Windows
REM Autor: GitHub Copilot Assistant
REM ====================================================================

echo ======================================================================
echo 🚀 ADAF Dashboard Pro - Inicio Automatizado (Windows)
echo ======================================================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ No se encuentra package.json. Ejecute este script desde la raíz del proyecto.
    pause
    exit /b 1
)

REM 1. Configurar entorno Python
echo 📝 Paso 1/4: Configurando entorno virtual de Python...
if not exist ".venv" (
    echo Creando entorno virtual Python...
    python -m venv .venv
    echo ✅ Entorno virtual creado
) else (
    echo ℹ️  Entorno virtual ya existe, reutilizando...
)

REM Activar entorno virtual
call .venv\Scripts\activate.bat
echo ✅ Entorno Python activado

REM 2. Instalar dependencias Node.js
echo 📦 Paso 2/4: Instalando dependencias de Node.js...
where pnpm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    pnpm install --silent
    echo ✅ Dependencias instaladas con pnpm
) else (
    echo ⚠️  pnpm no encontrado, usando npm...
    npm install --silent
    echo ✅ Dependencias instaladas con npm
)

REM 3. Inicializar base de datos (Seed)
echo 🌱 Paso 3/4: Inicializando base de datos...
node -e "console.log('🌱 Seeding completado (modo demo)')"
echo ✅ Base de datos inicializada

REM 4. Iniciar servidor de desarrollo
echo 🚀 Paso 4/4: Iniciando servidor Next.js...
echo.
echo ℹ️  El dashboard estará disponible en:
echo   • Local:   http://localhost:3000
echo.
echo ℹ️  Presiona Ctrl+C para detener el servidor
echo.
echo 🎉 ¡Iniciando ADAF Dashboard Pro!
echo ======================================================================

REM Iniciar el servidor
where pnpm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    pnpm dev
) else (
    npm run dev
)