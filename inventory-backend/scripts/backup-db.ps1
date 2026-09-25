<#
.SYNOPSIS
    Automated backup script for PostgreSQL database (Shop).
.DESCRIPTION
    Creates a timestamped custom-format compressed backup (.dump) using pg_dump.
    Enforces a retention policy (default 14 days) and optionally copies the backup
    to an off-machine / external directory.
.PARAMETER TargetFolder
    Optional secondary destination for off-machine backup (e.g. external drive, network share).
.PARAMETER RetentionDays
    Number of days to keep local backups (default: 14).
.EXAMPLE
    .\backup-db.ps1
.EXAMPLE
    .\backup-db.ps1 -TargetFolder "E:\Backups\ShopDB" -RetentionDays 30
#>

param (
    [string]$DbName = "Shop",
    [string]$DbUser = "postgres",
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$BackupDir = "",
    [string]$TargetFolder = "",
    [int]$RetentionDays = 14
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($BackupDir)) {
    $BackupDir = Join-Path $PSScriptRoot "..\backups"
}

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Resolve pg_dump executable
$pgDump = Get-Command "pg_dump" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $pgDump) {
    $candidates = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter "pg_dump.exe" -ErrorAction SilentlyContinue |
                  Select-Object -ExpandProperty FullName
    if ($candidates) {
        $pgDump = $candidates[0]
    } else {
        Write-Error "pg_dump executable not found in PATH or 'C:\Program Files\PostgreSQL'."
        exit 1
    }
}

# Resolve DB password
if (-not $env:PGPASSWORD) {
    if ($env:DB_PASSWORD) {
        $env:PGPASSWORD = $env:DB_PASSWORD
    } else {
        $env:PGPASSWORD = "atharv"
    }
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFileName = "backup_${DbName}_${timestamp}.dump"
$backupFilePath = Join-Path $BackupDir $backupFileName

Write-Host "=========================================="
Write-Host " Starting PostgreSQL Database Backup"
Write-Host " Database : $DbName"
Write-Host " Host     : $($DbHost):$($DbPort)"
Write-Host " User     : $DbUser"
Write-Host " Target   : $backupFilePath"
Write-Host " Time     : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "=========================================="

# Run pg_dump (-F c = custom compressed format)
& $pgDump -h $DbHost -p $DbPort -U $DbUser -F c -b -v -f $backupFilePath $DbName

if ($LASTEXITCODE -ne 0) {
    Write-Error "pg_dump failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

$fileSize = (Get-Item $backupFilePath).Length
Write-Host "Backup created successfully! Size: $([math]::Round($fileSize / 1KB, 2)) KB"

# Optional off-machine copy
if (-not [string]::IsNullOrWhiteSpace($TargetFolder)) {
    if (Test-Path $TargetFolder) {
        $targetFile = Join-Path $TargetFolder $backupFileName
        Copy-Item -Path $backupFilePath -Destination $targetFile -Force
        Write-Host "Off-machine copy created at: $targetFile"
    } else {
        Write-Warning "Target folder '$TargetFolder' does not exist. Off-machine copy skipped."
    }
}

# Retention cleanup: Remove local backups older than RetentionDays
Write-Host "Cleaning up local backups older than $RetentionDays days..."
$cutoffDate = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "backup_${DbName}_*.dump" | Where-Object {
    $_.LastWriteTime -lt $cutoffDate
} | ForEach-Object {
    Write-Host "Removing expired backup: $($_.Name) (Created: $($_.LastWriteTime))"
    Remove-Item $_.FullName -Force
}

Write-Host "Backup process completed successfully."
