# ================================
# CONFIG
# ================================
$DJANGO_PATH = "$PSScriptRoot\\backend"
$FRONTEND_PATH = "$PSScriptRoot"
$FRONTEND_URL = "http://localhost:5173"

$DJANGO_EXTENSIONS = @("*.py")

# Debounce + cooldown
$DEBOUNCE_TIME = 800
$COOLDOWN_TIME = 2000

# Crash protection
$MAX_RESTARTS = 5
$RESTART_WINDOW = 10000  # 10 seconds

# ================================
# GLOBAL STATE
# ================================
$djangoProcess = $null
$frontendProcess = $null

$lastDjangoTrigger = 0
$restartTimes = @()

# ================================
# LOGGING
# ================================
function Log($tag, $msg, $color) {
    Write-Host "[$tag] $msg" -ForegroundColor $color
}

# ================================
# SAFE RESTART CHECK
# ================================
function Can-Restart {
    $now = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()

    # Remove old restart timestamps
    $script:restartTimes = $restartTimes | Where-Object { ($now - $_) -lt $RESTART_WINDOW }

    if ($restartTimes.Count -ge $MAX_RESTARTS) {
        Log "SYSTEM" "Too many crashes. Stopping auto-restart." Red
        return $false
    }

    $script:restartTimes += $now
    return $true
}

# ================================
# START DJANGO
# ================================
function Start-Django {
    if ($djangoProcess -and !$djangoProcess.HasExited) {
        Stop-Process -Id $djangoProcess.Id -Force
        Log "DJANGO" "Restarting..." Yellow
    }

    $script:djangoProcess = Start-Process "cmd.exe" `
        -ArgumentList "/c cd /d `"$DJANGO_PATH`" && python manage.py runserver" `
        -RedirectStandardOutput "django.out.log" `
        -RedirectStandardError "django.err.log" `
        -WindowStyle Minimized `
        -PassThru

    Log "DJANGO" "Started (PID: $($djangoProcess.Id))" Green
}

# ================================
# START FRONTEND
# ================================
function Start-Frontend {
    if ($frontendProcess -and !$frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force
        Log "VITE" "Restarting..." Yellow
    }

    $script:frontendProcess = Start-Process "cmd.exe" `
        -ArgumentList "/c cd /d `"$FRONTEND_PATH`" && npm run dev" `
        -RedirectStandardOutput "vite.out.log" `
        -RedirectStandardError "vite.err.log" `
        -WindowStyle Minimized `
        -PassThru

    Log "VITE" "Started (PID: $($frontendProcess.Id))" Cyan
}

# ================================ 
# LOG STREAMING
# ================================
function Stream-Logs {
    Start-Job {
        while (!(Test-Path "django.log")) { Start-Sleep 1 }
        Get-Content "django.out.log","django.err.log" -Wait | ForEach-Object {
            Write-Host "[DJANGO] $_" -ForegroundColor Green
        }
    } | Out-Null

    Start-Job {
        while (!(Test-Path "vite.log")) { Start-Sleep 1 }
        Get-Content "vite.out.log","vite.err.log" -Wait | ForEach-Object {
            Write-Host "[VITE] $_" -ForegroundColor Cyan
        }
    } | Out-Null
}

# ================================
# DEBOUNCED WATCHER
# ================================
function Watch-Debounced($path, $extensions, $callback, [ref]$lastTriggerRef) {

    $watcher = New-Object IO.FileSystemWatcher
    $watcher.Path = $path
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true

    $action = {
        $file = $Event.SourceEventArgs.FullPath
        $extMatch = $false

        foreach ($ext in $extensions) {
            if ($file -like $ext) {
                $extMatch = $true
                break
            }
        }

        if (-not $extMatch) { return }

        $now = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()

        if (($now - $lastTriggerRef.Value) -lt $COOLDOWN_TIME) {
            return
        }

        $lastTriggerRef.Value = $now

        Start-Sleep -Milliseconds $DEBOUNCE_TIME
        & $callback
    }

    Register-ObjectEvent $watcher Changed -Action $action | Out-Null
    Register-ObjectEvent $watcher Created -Action $action | Out-Null
    Register-ObjectEvent $watcher Deleted -Action $action | Out-Null
}

# ================================
# CRASH MONITOR
# ================================
function Monitor-Processes {
    while ($true) {

        # Django crash detection
        if ($djangoProcess -and $djangoProcess.HasExited) {
            Log "DJANGO" "Crashed!" Red

            if (Can-Restart) {
                Start-Sleep -Seconds 2
                Start-Django
            }
        }

        # Frontend crash detection
        if ($frontendProcess -and $frontendProcess.HasExited) {
            Log "VITE" "Crashed!" Red
            Start-Sleep -Seconds 2
            Start-Frontend
        }

        Start-Sleep -Seconds 2
    }
}

# ================================
# START SYSTEM
# ================================
Log "SYSTEM" "Starting environment..." White

Start-Django
Start-Frontend
Stream-Logs

Watch-Debounced $DJANGO_PATH $DJANGO_EXTENSIONS { Start-Django } ([ref]$lastDjangoTrigger)

Start-Job { Monitor-Processes } | Out-Null

# ================================
# WAIT FOR FRONTEND
# ================================
Log "SYSTEM" "Waiting for frontend..." White

while ($true) {
    try {
        $res = Invoke-WebRequest $FRONTEND_URL -UseBasicParsing -TimeoutSec 2
        if ($res.StatusCode -eq 200) { break }
    } catch {}
    Start-Sleep 1
}

Log "SYSTEM" "Frontend ready!" White
Start-Process $FRONTEND_URL

Write-Host ""
Write-Host "Press CTRL+C to stop everything..."

# ================================
# CLEANUP
# ================================
$cleanup = {
    Log "SYSTEM" "Shutting down..." Red

    if ($djangoProcess -and !$djangoProcess.HasExited) {
        Stop-Process -Id $djangoProcess.Id -Force
    }

    if ($frontendProcess -and !$frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force
    }

    Get-Job | Stop-Job | Remove-Job

    Log "SYSTEM" "All processes stopped." Red
}

Register-EngineEvent PowerShell.Exiting -Action $cleanup | Out-Null

while ($true) {
    Start-Sleep 1
}