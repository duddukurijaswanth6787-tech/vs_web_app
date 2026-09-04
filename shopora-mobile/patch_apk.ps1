$ErrorActionPreference = "Stop"

$buildToolsDir = "C:\Users\duddu\AppData\Local\Android\Sdk\build-tools\35.0.0"
$zipAlign = Join-Path $buildToolsDir "zipalign.exe"
$apkSigner = Join-Path $buildToolsDir "apksigner.bat"
$keystore = (Resolve-Path ".\android\app\debug.keystore").Path
$originalApk = (Resolve-Path ".\shopora-mobile-updated.apk").Path
$bundleFile = (Resolve-Path ".\android\app\build\generated\assets\react\release\index.android.bundle").Path

Write-Host "1. Preparing working copy of APK..."
$workApk = Join-Path $PSScriptRoot "shopora-mobile-work.apk"
Copy-Item -Path $originalApk -Destination $workApk -Force

Write-Host "2. Replacing bundle and removing old signature directly in APK..."
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($workApk, [System.IO.Compression.ZipArchiveMode]::Update)

$bundleEntry = $zip.GetEntry("assets/index.android.bundle")
if ($bundleEntry) {
    $bundleEntry.Delete()
}
[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $bundleFile, "assets/index.android.bundle")

$metaEntries = @($zip.Entries | Where-Object { $_.FullName -like "META-INF/*" })
foreach ($m in $metaEntries) {
    $m.Delete()
}
$zip.Dispose()

Write-Host "3. Aligning APK with zipalign..."
$alignedApk = Join-Path $PSScriptRoot "shopora-mobile-aligned.apk"
if (Test-Path $alignedApk) { Remove-Item -Force $alignedApk }
& $zipAlign -p -f 4 $workApk $alignedApk

Write-Host "4. Signing APK with debug keystore..."
& $apkSigner sign --ks $keystore --ks-pass pass:android --ks-key-alias androiddebugkey --key-pass pass:android $alignedApk

Write-Host "5. Verifying APK signature..."
& $apkSigner verify $alignedApk

Copy-Item -Path $alignedApk -Destination ".\shopora-mobile-updated.apk" -Force

Write-Host "6. Installing APK to connected Android device..."
adb install -r $alignedApk

Write-Host "7. Launching Shopora Mobile App on device..."
adb shell am start -n com.vasanthi.shopora/.MainActivity

Remove-Item -Force $workApk -ErrorAction SilentlyContinue
Remove-Item -Force $alignedApk -ErrorAction SilentlyContinue

Write-Host "SUCCESS: Updated APK installed and launched on device!"
