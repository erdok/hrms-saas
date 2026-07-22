# HRMS SaaS - Production Deploy Helper
# =====================================
# Usage (admin PowerShell):
#   .\supabase\scripts\deploy-prod.ps1 -Action db:push
#   .\supabase\scripts\deploy-prod.ps1 -Action db:types
#   .\supabase\scripts\deploy-prod.ps1 -Action deploy:vercel

param(
  [Parameter(Mandatory=$true)]
  [ValidateSet('db:push','db:types','db:dump','deploy:vercel','deploy:preview')]
  [string]$Action,

  [string]$RemoteRef = 'production'
)

$ErrorActionPreference = 'Stop'

function Invoke-Step($msg, $block) {
  Write-Host "==> $msg" -ForegroundColor Cyan
  & $block
  if ($LASTEXITCODE -ne 0) { throw "Step failed: $msg" }
}

switch ($Action) {
  'db:push' {
    Invoke-Step 'Push migrations to production Supabase' {
      supabase db push --linked ($RemoteRef -ne 'production')
    }
  }
  'db:types' {
    Invoke-Step 'Regenerate TypeScript types from production DB' {
      $Env:SUPABASE_ACCESS_TOKEN = $Env:SUPABASE_ACCESS_TOKEN
      supabase gen types typescript --linked --project-id $Env:SUPABASE_PROJECT_ID | Set-Content -Path 'packages\db\src\types-generated.ts' -Encoding UTF8
    }
  }
  'db:dump' {
    Invoke-Step 'Dump production DB' {
      $stamp = (Get-Date).ToString('yyyyMMdd_HHmmss')
      $out = "supabase\dumps\prod_$stamp.sql"
      New-Item -ItemType Directory -Path 'supabase\dumps' -Force | Out-Null
      supabase db dump --linked --data-only | Set-Content -Path $out -Encoding UTF8
      Write-Host "Saved data-only dump: $out" -ForegroundColor Green
    }
  }
  'deploy:vercel' {
    Invoke-Step 'Deploy to Vercel production' {
      npx vercel --prod --yes
    }
  }
  'deploy:preview' {
    Invoke-Step 'Deploy preview to Vercel' {
      npx vercel --yes
    }
  }
}
