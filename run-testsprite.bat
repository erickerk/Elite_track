@echo off
REM Script para executar TestSprite CLI no Windows
REM Uso: run-testsprite.bat "Descrição do teste"

set API_KEY=sk-user-tYeUg4wBMJKToQ-JeX4RTll1q-8b0d2m6Yac_wzNkoepeeNcHUuGW1Hafz6AkSXd8YhRAe0ntCb8-J1RziWI2Vq7P04odL8aVUqzaOD2AuLAc8WN0e-Ws7sz_NLgJK_rU4U

echo ========================================
echo TestSprite CLI Runner - Elite Track
echo ========================================
echo.

if "%~1"=="" (
    echo Executando teste padrao...
    node testsprite-runner.js
) else (
    echo Executando teste: %~1
    node testsprite-runner.js "%~1"
)
