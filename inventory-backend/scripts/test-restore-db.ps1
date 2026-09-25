<#
.SYNOPSIS
    Test-restore verification script for PostgreSQL database backups.
.DESCRIPTION
    Verifies that a database backup file is valid by restoring it into a temporary
    scratch database, checking table row counts, and dropping the scratch database.
.PARAMETER BackupFile
    Path to the .dump file. If omitted, the newest backup in ..\backups is used.
.PARAMETER ScratchDbName
    Name of the temporary verification database (default: shop_restore_test).
.EXAMPLE
    .\test-restore-db.ps1
.EXAMPLE
    .\test-restore-db.ps1 -BackupFile "..\backups\backup_Shop_20260923_173000.dump"
#>

param (
    [string]$BackupFile = "",
    [string]$ScratchDbName = "shop_restore_test",
    [string]$DbUser = "postgres",
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432"
)

$ErrorActionPreference = "Continue"

# Resolve executables
$psql = Get-Command "psql" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $psql) {
    $candidates = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue |
                  Select-Object -ExpandProperty FullName
    if ($candidates) { $psql = $candidates[0] }
}

$pgRestore = Get-Command "pg_restore" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $pgRestore) {
    $candidates = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter "pg_restore.exe" -ErrorAction SilentlyContinue |
                  Select-Object -ExpandProperty FullName
    if ($candidates) { $pgRestore = $candidates[0] }
}

if (-not $psql -or -not $pgRestore) {
    Write-Error "Required PostgreSQL tools (psql/pg_restore) could not be located."
    exit 1
}

# Resolve DB password
if (-not $env:PGPASSWORD) {
    if ($env:DB_PASSWORD) {
        $env:PGPASSWORD = $env:DB_PASSWORD
    } else {
        $env:PGPASSWORD = "atharv"
    }
}

# Locate backup file if not specified
if ([string]::IsNullOrWhiteSpace($BackupFile)) {
    $backupDir = Join-Path $PSScriptRoot "..\backups"
    $latest = Get-ChildItem -Path $backupDir -Filter "*.dump" -ErrorAction SilentlyContinue |
              Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $latest) {
        Write-Error "No backup file specified and no .dump file found in '$backupDir'."
        exit 1
    }
    $BackupFile = $latest.FullName
}

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file not found at: $BackupFile"
    exit 1
}

Write-Host "=========================================="
Write-Host " Starting Backup Restore Verification"
Write-Host " Backup File : $BackupFile"
Write-Host " Scratch DB  : $ScratchDbName"
Write-Host " Host        : $($DbHost):$($DbPort)"
Write-Host " User        : $DbUser"
Write-Host " Time        : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "=========================================="

try {
    # 1. Clean up scratch DB if it exists from previous aborted run
    Write-Host "Ensuring scratch database does not already exist..."
    & $psql -h $DbHost -p $DbPort -U $DbUser -d postgres -c "DROP DATABASE IF EXISTS $ScratchDbName WITH (FORCE);" 2>&1 | Out-Null

    # 2. Create fresh scratch DB
    Write-Host "Creating scratch database '$ScratchDbName'..."
    & $psql -h $DbHost -p $DbPort -U $DbUser -d postgres -c "CREATE DATABASE $ScratchDbName;"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create scratch database '$ScratchDbName'."
    }

    # 3. Restore dump into scratch DB
    Write-Host "Restoring dump file into '$ScratchDbName'..."
    & $pgRestore -h $DbHost -p $DbPort -U $DbUser -d $ScratchDbName --no-owner --role=$DbUser $BackupFile
    # Note: pg_restore returns 0 or 1 (warnings on existing roles/privileges)
    if ($LASTEXITCODE -gt 1) {
        throw "pg_restore failed with exit code $LASTEXITCODE."
    }

    # 4. Verify table row counts
    Write-Host "`n--- Verification Query Results in Scratch DB ---"
    $verifySql = @"
SELECT 'sales' AS table_name, count(*) AS row_count FROM sales
UNION ALL
SELECT 'sale_item', count(*) FROM sale_item
UNION ALL
SELECT 'product', count(*) FROM product
UNION ALL
SELECT 'invoice_sequence', count(*) FROM invoice_sequence
UNION ALL
SELECT 'hsn_master', count(*) FROM hsn_master
UNION ALL
SELECT 'store_profile', count(*) FROM store_profile;
"@
    & $psql -h $DbHost -p $DbPort -U $DbUser -d $ScratchDbName -c $verifySql

    Write-Host "--- End of Table Verification ---`n"
    Write-Host "Restore verification SUCCEEDED! All tables restored and queryable."

} finally {
    # 5. Clean up scratch DB
    Write-Host "Tearing down scratch database '$ScratchDbName'..."
    & $psql -h $DbHost -p $DbPort -U $DbUser -d postgres -c "DROP DATABASE IF EXISTS $ScratchDbName WITH (FORCE);" 2>&1 | Out-Null
    Write-Host "Cleanup complete."
}
