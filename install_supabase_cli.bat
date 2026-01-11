@echo off
echo 🚀 Instalando Supabase CLI no Windows...
echo.

:: Método 1: Download direto (mais confiável)
echo 📦 Baixando Supabase CLI...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.exe' -OutFile 'supabase.exe'"

if exist supabase.exe (
    echo ✅ Download concluído!
    
    echo 📁 Movendo para System32...
    move supabase.exe C:\Windows\System32\ >nul 2>&1
    
    echo 🔍 Verificando instalação...
    supabase --version
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ Supabase CLI instalado com sucesso!
        echo.
        echo 📋 Para usar:
        echo    supabase --help
        echo    supabase login
        echo    supabase projects list
    ) else (
        echo ❌ Erro na instalação
    )
) else (
    echo ❌ Falha no download
    echo.
    echo 🔄 Alternativa: Baixe manualmente de
    echo https://github.com/supabase/cli/releases
)

pause
