@echo off
echo 🚀 Baixando Supabase CLI para Windows...

:: Baixar a versão mais recente do Supabase CLI
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.exe' -OutFile 'supabase.exe'"

:: Mover para System32 para estar no PATH
move supabase.exe C:\Windows\System32\

:: Verificar instalação
supabase --version

if %ERRORLEVEL% EQU 0 (
    echo ✅ Supabase CLI instalado com sucesso!
) else (
    echo ❌ Erro na instalação
    pause
)
