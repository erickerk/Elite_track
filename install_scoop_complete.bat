@echo off
echo 🚀 Instalando Scoop e Supabase CLI...
echo.

:: 1. Instalar Scoop
echo 📦 Instalando Scoop...
powershell -Command "Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"
powershell -Command "irm get.scoop.sh | iex"

:: 2. Adicionar Scoop ao PATH
echo 📁 Configurando PATH...
powershell -Command "$env:PATH = '$env:USERPROFILE\scoop\shims;$env:PATH'"

:: 3. Instalar Git
echo 📦 Instalando Git...
powershell -Command "& '$env:USERPROFILE\scoop\shims\scoop.exe' install git"

:: 4. Instalar Supabase CLI
echo 📦 Instalando Supabase CLI...
powershell -Command "& '$env:USERPROFILE\scoop\shims\scoop.exe' install supabase"

:: 5. Verificar
echo 🔍 Verificando instalações...
powershell -Command "& '$env:USERPROFILE\scoop\shims\scoop.exe' --version"
powershell -Command "& '$env:USERPROFILE\scoop\shims\supabase.exe' --version"

echo.
echo ✅ Instalação concluída!
echo.
echo 📋 Para usar o Supabase CLI:
echo    supabase login
echo    supabase projects list
echo    supabase db push
pause
