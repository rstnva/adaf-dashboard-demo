@echo off
chcp 65001 > nul

rem ADAF Dashboard Pro + LAV-ADAF - Inicio Completo
rem Este script inicia ambos dashboards simultáneamente

echo 🚀 Iniciando ADAF Dashboard Pro + LAV-ADAF...
echo.

rem Función para verificar si un puerto está en uso
netstat -an | find "LISTENING" | find ":3000" > nul
if %errorlevel% == 0 (
    echo ⚠️  Puerto 3000 ya está en uso. Por favor, cierre la aplicación que lo está usando.
)

netstat -an | find "LISTENING" | find ":3005" > nul
if %errorlevel% == 0 (
    echo ⚠️  Puerto 3005 ya está en uso. Por favor, cierre la aplicación que lo está usando.
)

echo 📦 Verificando dependencias...
if not exist "node_modules\" (
    echo Instalando dependencias del proyecto principal...
    call pnpm install
)

if not exist "lav-adaf\node_modules\" (
    echo Instalando dependencias de LAV-ADAF...
    cd lav-adaf
    call pnpm install
    cd ..
)

echo.
echo 🎯 Iniciando ADAF Dashboard Pro (Puerto 3000)...
start /B cmd /c "pnpm dev > adaf-dashboard.log 2>&1"

echo 🤖 Iniciando LAV-ADAF Dashboard (Puerto 3005)...
start /B cmd /c "cd lav-adaf\apps\dashboard && pnpm dev > ..\..\..\lav-adaf-dashboard.log 2>&1"

echo.
echo ⏳ Esperando que los servidores estén listos...
timeout /t 8 > nul

echo.
echo ✅ ¡Servidores iniciados exitosamente!
echo.
echo 📊 ADAF Dashboard Pro:
echo    🌐 URL: http://localhost:3000
echo    📝 Log: adaf-dashboard.log
echo.
echo 🤖 LAV-ADAF Sistema:
echo    🌐 URL: http://localhost:3005
echo    📝 Log: lav-adaf-dashboard.log
echo.
echo 🔗 Accesos directos disponibles desde ADAF Dashboard:
echo    • Menú lateral: Click en 'LAV-ADAF'
echo    • Página principal: Botón 'Abrir LAV-ADAF'
echo    • Dashboard main: Tarjeta 'LAV-ADAF Sistema'
echo.
echo 💡 Los servidores están ejecutándose en segundo plano
echo 📖 Para ver logs en tiempo real:
echo    type adaf-dashboard.log
echo    type lav-adaf-dashboard.log
echo.
echo 🛑 Para detener los servidores:
echo    Cierre las ventanas del navegador y ejecute: taskkill /f /im node.exe
echo.

start http://localhost:3000
start http://localhost:3005

pause