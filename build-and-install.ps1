<#
.SYNOPSIS
    Builds and installs the HOI4 Modern Utils VS Code extension.
.DESCRIPTION
    Runs webpack, packages the extension with vsce, and installs it into
    VS Code.  Exits with a non-zero code on failure.
#>

$ErrorActionPreference = 'Stop'

# Resolve the project root (where this script lives).
$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "=== Step 1: Webpack build ===" -ForegroundColor Cyan
npx webpack --config webpack.config.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Webpack build failed." -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "Webpack build succeeded." -ForegroundColor Green

Write-Host "=== Step 2: Package extension ===" -ForegroundColor Cyan
npx vsce package --allow-star-activation
if ($LASTEXITCODE -ne 0) {
    Write-Host "vsce package failed." -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "Extension packaged." -ForegroundColor Green

# Derive the .vsix filename from package.json
$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$vsixName = "{0}-{1}.vsix" -f $pkg.name, $pkg.version
$vsixPath = Join-Path $ProjectRoot $vsixName

if (-not (Test-Path $vsixPath)) {
    Write-Host "Expected package not found: $vsixPath" -ForegroundColor Red
    exit 1
}

Write-Host "=== Step 3: Install extension ===" -ForegroundColor Cyan
code --install-extension $vsixPath --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "Extension install failed." -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "Extension installed successfully: $vsixName" -ForegroundColor Green
