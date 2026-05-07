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
function CanRestart {
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
# PROCESS TREE KILLER
# Recursively kills a process and its children (closes cmd windows).
# Uses WMI to find child processes by ParentProcessId and kills them depth-first.
# ================================
function KillProcessTree {
    param([int]$processId)

    if (-not $processId) { return }

    try {
        $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $processId" -ErrorAction SilentlyContinue
    } catch {
        $children = @()
    }

    foreach ($child in $children) {
        KillProcessTree -processId $child.ProcessId
    }

    try {
        $p = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($p) {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Log "SYSTEM" "Killed process $processId ($($p.ProcessName))" Yellow
        }
    } catch {}
}

# ================================
# START DJANGO
# ================================
function Start-Django {
    if ($djangoProcess -and !$djangoProcess.HasExited) {
        KillProcessTree -processId $djangoProcess.Id
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
        KillProcessTree -processId $frontendProcess.Id
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
function StreamLogs {
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
function MonitorProcesses {
    while ($true) {

        # Django crash detection
        if ($djangoProcess -and $djangoProcess.HasExited) {
            Log "DJANGO" "Crashed!" Red

            if (CanRestart) {
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
StreamLogs

Watch-Debounced $DJANGO_PATH $DJANGO_EXTENSIONS { Start-Django } ([ref]$lastDjangoTrigger)

Start-Job { MonitorProcesses } | Out-Null

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

    try {
        if ($djangoProcess -and !$djangoProcess.HasExited) {
            Log "SYSTEM" "Killing django PID $($djangoProcess.Id) with taskkill" Yellow
            Start-Process -FilePath "taskkill" -ArgumentList "/PID",$djangoProcess.Id,"/T","/F" -NoNewWindow -Wait -ErrorAction SilentlyContinue | Out-Null
        }
    } catch {
        Log "SYSTEM" "Failed to taskkill django PID $($djangoProcess.Id)" Yellow
    }

    try {
        if ($frontendProcess -and !$frontendProcess.HasExited) {
            Log "SYSTEM" "Killing frontend PID $($frontendProcess.Id) with taskkill" Yellow
            Start-Process -FilePath "taskkill" -ArgumentList "/PID",$frontendProcess.Id,"/T","/F" -NoNewWindow -Wait -ErrorAction SilentlyContinue | Out-Null
        }
    } catch {
        Log "SYSTEM" "Failed to taskkill frontend PID $($frontendProcess.Id)" Yellow
    }

    Log "SYSTEM" "Stopping any remaining background jobs..." Yellow
    try {
        Get-Job | Where-Object { $_.State -ne 'Completed' } | ForEach-Object { Stop-Job -Job $_ -ErrorAction SilentlyContinue }
        Get-Job | Remove-Job -ErrorAction SilentlyContinue
    } catch {}

    Log "SYSTEM" "All processes stopped." Red
}

Register-EngineEvent PowerShell.Exiting -Action $cleanup | Out-Null

try {
    while ($true) {
        Start-Sleep 1
    }
} finally {
    & $cleanup
}