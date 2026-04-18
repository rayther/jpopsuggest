$ErrorActionPreference = "Stop"

function Get-DevHost {
  $preferred = Get-NetIPConfiguration |
    Where-Object {
      $_.IPv4Address -and
      $_.IPv4DefaultGateway -and
      $_.NetAdapter.Status -eq "Up"
    } |
    ForEach-Object { $_.IPv4Address.IPAddress } |
    Where-Object { $_ -like "172.30.1.*" } |
    Select-Object -First 1

  if ($preferred) {
    return $preferred
  }

  $fallback = Get-NetIPConfiguration |
    Where-Object {
      $_.IPv4Address -and
      $_.IPv4DefaultGateway -and
      $_.NetAdapter.Status -eq "Up"
    } |
    ForEach-Object { $_.IPv4Address.IPAddress } |
    Where-Object { $_ -notlike "127.*" -and $_ -notlike "169.254.*" } |
    Select-Object -First 1

  if ($fallback) {
    return $fallback
  }

  return "localhost"
}

$env:AIT_DEV_HOST = Get-DevHost
Write-Host "Using Apps in Toss dev host: $env:AIT_DEV_HOST"
Write-Host "Set Sandbox Metro server address to: $env:AIT_DEV_HOST"
Write-Host "Metro bundle URL: http://$env:AIT_DEV_HOST`:8081/index.bundle?platform=ios&dev=true&minify=false"
Write-Host "Sandbox deep link: intoss://jpopsuggest/jpop"

Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -in 5173, 8081 } |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object {
    try {
      Write-Host "Stopping stale dev server process: $_"
      Stop-Process -Id $_ -Force -ErrorAction Stop
    } catch {
      Write-Host "Could not stop process $_. It may have already exited."
    }
  }

npx granite dev
