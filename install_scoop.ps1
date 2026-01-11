# Instalar Scoop e Supabase CLI
# Execute este script no PowerShell como Administrador

# 1. Instalar Scoop
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
irm get.scoop.sh | iex

# 2. Adicionar ao PATH
$env:PATH = "$($env:USERPROFILE)\scoop\shims;$($env:PATH)"

# 3. Instalar Git (pré-requisito)
scoop install git

# 4. Instalar Supabase CLI
scoop install supabase

# 5. Verificar instalação
supabase --version

Write-Host "✅ Scoop e Supabase CLI instalados com sucesso!" -ForegroundColor Green
