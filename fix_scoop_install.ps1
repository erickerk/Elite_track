# Script para instalar Scoop e Supabase CLI
# Execute: powershell -ExecutionPolicy Bypass -File fix_scoop_install.ps1

Write-Host "🔧 Configurando Scoop e Supabase CLI..." -ForegroundColor Cyan

# 1. Adicionar Scoop ao PATH temporariamente
$scoopPath = "$env:USERPROFILE\scoop\shims"
if (Test-Path $scoopPath) {
    $env:PATH = "$scoopPath;$env:PATH"
    Write-Host "✅ Scoop adicionado ao PATH" -ForegroundColor Green
} else {
    Write-Host "❌ Scoop não encontrado em: $scoopPath" -ForegroundColor Red
    exit 1
}

# 2. Verificar se scoop funciona
try {
    scoop version | Out-Null
    Write-Host "✅ Scoop está funcionando" -ForegroundColor Green
} catch {
    Write-Host "❌ Scoop não está funcionando" -ForegroundColor Red
    exit 1
}

# 3. Instalar Git
Write-Host "📦 Instalando Git..." -ForegroundColor Yellow
try {
    scoop install git
    Write-Host "✅ Git instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao instalar Git" -ForegroundColor Red
}

# 4. Instalar Supabase CLI
Write-Host "📦 Instalando Supabase CLI..." -ForegroundColor Yellow
try {
    scoop install supabase
    Write-Host "✅ Supabase CLI instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao instalar Supabase CLI" -ForegroundColor Red
    Write-Host "🔄 Tentando download manual..." -ForegroundColor Yellow
    
    # Download manual como fallback
    try {
        Invoke-WebRequest -Uri "https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.exe" -OutFile "supabase.exe"
        Move-Item supabase.exe C:\Windows\System32\ -Force
        Write-Host "✅ Supabase CLI instalado manualmente" -ForegroundColor Green
    } catch {
        Write-Host "❌ Falha no download manual" -ForegroundColor Red
    }
}

# 5. Verificar instalação
Write-Host "🔍 Verificando instalação..." -ForegroundColor Yellow
try {
    $version = supabase --version
    Write-Host "✅ Supabase CLI versão: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI não está funcionando" -ForegroundColor Red
}

Write-Host "🎉 Processo concluído!" -ForegroundColor Cyan
