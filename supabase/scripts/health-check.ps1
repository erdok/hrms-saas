# Post-deploy smoke test

param(
  [string]$BaseUrl = $Env:NEXT_PUBLIC_APP_URL
)

if (-not $BaseUrl) {
  Write-Error "Set NEXT_PUBLIC_APP_URL or pass -BaseUrl"
  exit 1
}

$endpoints = @(
  '/',
  '/login',
  '/signup'
)

$fail = 0
foreach ($ep in $endpoints) {
  try {
    $u = "$BaseUrl$ep"
    $r = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 10 -SkipHttpErrorCheck
    if ($r.StatusCode -lt 200 -or $r.StatusCode -ge 400) {
      Write-Host "[FAIL] $u -> $($r.StatusCode)" -ForegroundColor Red
      $fail++
    } else {
      Write-Host "[OK]   $u -> $($r.StatusCode)" -ForegroundColor Green
    }
  } catch {
    Write-Host "[ERR]  $ep -> $($_.Exception.Message)" -ForegroundColor Red
    $fail++
  }
}

if ($fail -gt 0) {
  Write-Error "$fail endpoints failed"
  exit 2
}
Write-Host "All endpoints healthy" -ForegroundColor Green
