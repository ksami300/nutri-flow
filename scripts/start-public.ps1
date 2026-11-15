$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendRoot = Join-Path $projectRoot "backend"
$frontendRoot = Join-Path $projectRoot "frontend"
$backendEnvPath = Join-Path $backendRoot ".env.public-test"
$nextCliPath = Join-Path $frontendRoot "node_modules\next\dist\bin\next"

if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
  throw "ngrok is not installed or is not available on PATH."
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed or is not available on PATH."
}
if (-not (Test-Path $backendEnvPath)) {
  throw "Create backend\.env.public-test from backend\.env.example and configure test-only credentials."
}
if (-not (Test-Path (Join-Path $backendRoot "node_modules")) -or
    -not (Test-Path (Join-Path $frontendRoot "node_modules")) -or
    -not (Test-Path $nextCliPath)) {
  throw "Install backend and frontend dependencies with npm ci before starting NutriFlow."
}

$ngrokCommand = Get-Command ngrok
$ngrokConfigOutput = & $ngrokCommand.Source config check 2>&1
if ($LASTEXITCODE -ne 0) {
  throw "ngrok configuration is invalid. Run 'ngrok config check' and configure your ngrok account locally."
}

$busyPorts = @(
  Get-NetTCPConnection -LocalPort 3000, 4040, 5000 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty LocalPort -Unique
)
if ($busyPorts.Count -gt 0) {
  throw "Required local port(s) already in use: $($busyPorts -join ', '). Stop the existing service and retry."
}

$nodeCommand = Get-Command node
$processes = @()
$savedEnvironment = @{}
$environmentNames = @(
  "PORT",
  "FRONTEND_URL",
  "NEXT_PUBLIC_API_URL",
  "NUTRIFLOW_ENV_FILE",
  "NODE_ENV",
  "MONGO_URI",
  "JWT_SECRET",
  "OPENAI_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_ID",
  "STRIPE_WEBHOOK_SECRET",
  "EMAIL_USER",
  "EMAIL_PASS",
  "NGROK_AUTHTOKEN"
)
foreach ($name in $environmentNames) {
  $savedEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
  Remove-Item "Env:\$name" -ErrorAction SilentlyContinue
}

function Wait-ForHttp {
  param(
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][System.Diagnostics.Process]$Process,
    [Parameter(Mandatory = $true)][string]$ServiceName,
    [Parameter(Mandatory = $true)][int]$TimeoutSeconds
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if ($Process.HasExited) {
      throw "$ServiceName stopped before becoming ready. Check its console for the startup error."
    }

    try {
      Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 3 | Out-Null
      return
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  throw "$ServiceName did not become ready at $Uri within $TimeoutSeconds seconds."
}

try {
  $env:NEXT_PUBLIC_API_URL = "/api"
  $frontendArguments = '"{0}" dev --hostname 127.0.0.1 --port 3000' -f $nextCliPath
  $frontendProcess = Start-Process `
    -FilePath $nodeCommand.Source `
    -ArgumentList $frontendArguments `
    -WorkingDirectory $frontendRoot `
    -PassThru
  $processes += $frontendProcess

  Wait-ForHttp `
    -Uri "http://127.0.0.1:3000" `
    -Process $frontendProcess `
    -ServiceName "NutriFlow frontend" `
    -TimeoutSeconds 90

  $ngrokProcess = Start-Process `
    -FilePath $ngrokCommand.Source `
    -ArgumentList "http 3000" `
    -PassThru
  $processes += $ngrokProcess

  $publicUrl = $null
  $tunnelDeadline = (Get-Date).AddSeconds(30)
  while ((Get-Date) -lt $tunnelDeadline -and -not $publicUrl) {
    if ($ngrokProcess.HasExited) {
      throw "ngrok stopped before creating a tunnel. Check its console and account configuration."
    }

    try {
      $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 2
      $httpsTunnel = $tunnels.tunnels |
        Where-Object { $_.proto -eq "https" } |
        Select-Object -First 1
      if ($httpsTunnel) {
        $publicUrl = $httpsTunnel.public_url
      }
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  if (-not $publicUrl -or ([Uri]$publicUrl).Scheme -ne "https") {
    throw "ngrok did not provide an HTTPS tunnel within 30 seconds."
  }

  $env:PORT = "5000"
  $env:FRONTEND_URL = "http://localhost:3000,http://127.0.0.1:3000,$publicUrl"
  $env:NUTRIFLOW_ENV_FILE = $backendEnvPath
  $backendProcess = Start-Process `
    -FilePath $nodeCommand.Source `
    -ArgumentList "src/server.js" `
    -WorkingDirectory $backendRoot `
    -PassThru
  $processes += $backendProcess

  Wait-ForHttp `
    -Uri "http://127.0.0.1:5000/" `
    -Process $backendProcess `
    -ServiceName "NutriFlow backend" `
    -TimeoutSeconds 90

  Write-Host "NutriFlow public test URL: $publicUrl"
  Write-Host "Keep this PowerShell window and the service consoles open while testing."
  Write-Host "Press Ctrl+C here to stop the frontend, backend, and ngrok tunnel."

  while (-not $frontendProcess.HasExited -and
         -not $backendProcess.HasExited -and
         -not $ngrokProcess.HasExited) {
    Start-Sleep -Seconds 2
  }

  throw "A NutriFlow service or the ngrok tunnel stopped. Check its console for details."
} finally {
  foreach ($process in $processes) {
    if ($null -ne $process -and -not $process.HasExited) {
      Stop-Process -Id $process.Id -ErrorAction SilentlyContinue
    }
  }

  foreach ($name in $savedEnvironment.Keys) {
    if ($null -eq $savedEnvironment[$name]) {
      Remove-Item "Env:\$name" -ErrorAction SilentlyContinue
    } else {
      Set-Item "Env:\$name" $savedEnvironment[$name]
    }
  }
}
