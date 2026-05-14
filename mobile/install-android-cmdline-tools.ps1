$sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$cmdline = Join-Path $sdk 'cmdline-tools'
$zip = Join-Path $sdk 'cmdline-tools-new.zip'
$tmp = Join-Path $sdk 'cmdline-tools-tmp'

Write-Output "SDK_ROOT=$sdk"
Write-Output "CMDLINE_TOOLS_DIR=$cmdline"
Write-Output "ZIP_PATH=$zip"
Write-Output "TMP_PATH=$tmp"

Remove-Item -Recurse -Force $zip,$tmp -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $cmdline | Out-Null

Write-Output 'Downloading command-line tools zip...'
Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip' -OutFile $zip

Write-Output 'Extracting command-line tools zip...'
Expand-Archive -LiteralPath $zip -DestinationPath $tmp -Force

if (Test-Path (Join-Path $tmp 'cmdline-tools')) {
    Write-Output 'Found extracted cmdline-tools folder.'
    Remove-Item -Recurse -Force (Join-Path $cmdline 'latest') -ErrorAction SilentlyContinue
    Move-Item -Path (Join-Path $tmp 'cmdline-tools') -Destination (Join-Path $cmdline 'latest')
} elseif (Test-Path (Join-Path $tmp 'bin')) {
    Write-Output 'Found extracted folder with bin directly.'
    Remove-Item -Recurse -Force (Join-Path $cmdline 'latest') -ErrorAction SilentlyContinue
    Move-Item -Path $tmp -Destination (Join-Path $cmdline 'latest')
} else {
    Write-Output 'UNKNOWN_LAYOUT'
    Get-ChildItem -Path $tmp -Recurse | Select-Object FullName
}

Remove-Item -Recurse -Force $tmp,$zip -ErrorAction SilentlyContinue
Write-Output 'CMDLINE_TOOLS_INSTALLED'
