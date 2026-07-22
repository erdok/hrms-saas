# Warm up Stripe price products in production DB
# Usage:
#   .\supabase\scripts\warmup-stripe.ps1 -Plan pro -StripePriceId price_real_xxx -Amount 490

param(
  [Parameter(Mandatory=$true)]
  [string]$Plan,
  [Parameter(Mandatory=$true)]
  [string]$StripePriceId,
  [Parameter(Mandatory=$true)]
  [decimal]$Amount,
  [string]$Interval = 'month',
  [bool]$Active = $true
)

# Update via Supabase admin API. Simpliest path: use the python HTTP lib inline.
# Better: invoke via supabase CLI once https://github.com/supabase/cli/issues/1421 is closed.
Write-Host "Insert into billing_prices:" -ForegroundColor Cyan
Write-Host "  plan: $Plan, stripe_price_id: $StripePriceId, amount: $Amount, interval: $Interval"
Write-Host "Use the studio SQL editor or supabase db execute."

$insert = "insert into public.billing_prices(plan, stripe_price_id, amount_try, interval, is_active) values ('$Plan', '$StripePriceId', $Amount, '$Interval', $($Active.ToString().ToLowerInvariant())) on conflict (stripe_price_id) do update set amount_try = excluded.amount_try, is_active = excluded.is_active;"
Set-Content -Path "supabase\dumps\warmup-stripe.sql" -Value $insert -Encoding UTF8
Write-Host "Wrote supabase\dumps\warmup-stripe.sql" -ForegroundColor Green
Write-Host "Run: pnpm supabase db execute --linked --file supabase\dumps\warmup-stripe.sql"
