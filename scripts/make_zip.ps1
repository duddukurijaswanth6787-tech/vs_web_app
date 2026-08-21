$sourceDir = "c:\Users\jashwanth\Downloads\demo_vs_update_13_07"
$zipPath = "c:\Users\jashwanth\Downloads\demo_23-07.zip"
$rootZipPath = "c:\Users\jashwanth\Downloads\demo_vs_update_13_07\demo_23-07.zip"

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
if (Test-Path $rootZipPath) { Remove-Item $rootZipPath -Force }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

$files = Get-ChildItem -Path $sourceDir -Recurse -File | Where-Object {
    $_.FullName -notmatch '\\node_modules(\\|$)' -and
    $_.FullName -notmatch '\\\.next(\\|$)' -and
    $_.FullName -notmatch '\\dist(\\|$)' -and
    $_.FullName -notmatch '\\\.git(\\|$)' -and
    $_.Name -notmatch '\.zip$'
}

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($sourceDir.Length + 1)
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relativePath)
}

$zip.Dispose()
Copy-Item $zipPath $rootZipPath -Force
Write-Output "ZIP created successfully!"
Get-Item $zipPath | Select-Object Name, @{Name="Size (MB)";Expression={[math]::Round($_.Length/1MB, 2)}}
