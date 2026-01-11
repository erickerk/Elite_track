@echo off
echo 🎯 SOLUÇÃO DEFINITIVA - Supabase CLI
echo.

echo 📁 Verificando Scoop...
if exist "C:\Users\admin\scoop\shims\scoop.exe" (
    echo ✅ Scoop encontrado!
    echo 📦 Tentando instalar Supabase...
    
    :: Adicionar ao PATH temporariamente
    set PATH=%PATH%;C:\Users\admin\scoop\shims
    
    :: Tentar instalar
    scoop install supabase
    
    if exist "C:\Users\admin\scoop\shims\supabase.exe" (
        echo ✅ Supabase instalado via Scoop!
        C:\Users\admin\scoop\shims\supabase.exe --version
        goto :success
    ) else (
        echo ❌ Falha na instalação via Scoop
    )
) else (
    echo ❌ Scoop não encontrado
)

echo.
echo 🔄 Alternativa: Download manual...
echo 📦 Baixando Supabase CLI...
powershell -Command "try { Invoke-WebRequest -Uri 'https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.exe' -OutFile 'supabase.exe' -ErrorAction Stop } catch { Write-Host 'Download falhou, tentando método alternativo...'; Invoke-WebRequest -Uri 'https://github.com/supabase/cli/releases/download/v2.72.3/supabase_windows_amd64.exe' -OutFile 'supabase.exe' }"

if exist supabase.exe (
    echo ✅ Download concluído!
    echo 📁 Movendo para System32...
    move supabase.exe C:\Windows\System32\ >nul 2>&1
    
    echo 🔍 Verificando...
    supabase --version
    
    if %ERRORLEVEL% EQU 0 (
        goto :success
    )
)

echo.
echo ❌ Todas as tentativas falharam
echo 📋 Soluções manuais:
echo    1. Baixe manualmente de: https://github.com/supabase/cli/releases
echo    2. Use npx: npx supabase --version
echo    3. Use MCP: @[supabase] (já funcionando!)
goto :end

:success
echo.
echo 🎉 SUCESSO! Supabase CLI está instalado e funcionando!
echo.
echo 📋 Comandos úteis:
echo    supabase login
echo    supabase projects list
echo    supabase db push
echo    supabase functions new
echo.
echo ✅ E o MCP continua funcionando: @[supabase]

:end
pause
