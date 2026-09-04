$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📦 SHOPORA MOBILE - BUNDLE & INSTALL APK" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$buildToolsDir = "C:\Users\duddu\AppData\Local\Android\Sdk\build-tools\35.0.0"
$zipAlign = Join-Path $buildToolsDir "zipalign.exe"
$apkSigner = Join-Path $buildToolsDir "apksigner.bat"
$keystore = (Resolve-Path ".\android\app\debug.keystore").Path
$sourceApk = (Resolve-Path ".\shopora-mobile-updated.apk").Path
$bundleFile = (Resolve-Path ".\android\app\build\generated\assets\react\release\index.android.bundle").Path

$tempDir = Join-Path $PSScriptRoot "temp_apk_build"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "1. Extracting base APK..." -ForegroundColor Yellow
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($sourceApk, $tempDir)

Write-Host "2. Injecting updated React Native bundle..." -ForegroundColor Yellow
$targetBundlePath = Join-Path $tempDir "assets\index.android.bundle"
Copy-Item -Path $bundleFile -Destination $targetBundlePath -Force
Write-Host "   Updated bundle size: $((Get-Item $targetBundlePath).Length) bytes" -ForegroundColor Green

Write-Host "3. Removing old signature files (META-INF)..." -ForegroundColor Yellow
$metaInfDir = Join-Path $tempDir "META-INF"
if (Test-Path $metaInfDir) {
    Remove-Item -Recurse -Force $metaInfDir
}

Write-Host "4. Repacking APK..." -ForegroundColor Yellow
$unalignedApk = Join-Path $PSScriptRoot "shopora-mobile-unaligned.apk"
if (Test-Path $unalignedApk) { Remove-Item -Force $unalignedApk }
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $unalignedApk)

Write-Host "5. Aligning APK with zipalign..." -ForegroundColor Yellow
$alignedApk = Join-Path $PSScriptRoot "shopora-mobile-aligned.apk"
if (Test-Path $alignedApk) { Remove-Item -Force $alignedApk }
& $zipAlign -p -f 4 $unalignedApk $alignedApk

Write-Host "6. Signing APK with debug keystore..." -ForegroundColor Yellow
& $apkSigner sign --ks $keystore --ks-pass "pass:android" --ks-key-alias "androiddebugkey" --key-pass "pass:android" $alignedApk

Write-Host "7. Verifying APK signature..." -ForegroundColor Yellow
& $apkSigner verify $alignedApk

Copy-Item -Path $alignedApk -Destination ".\shopora-mobile-updated.apk" -Force

Write-Host "8. Installing APK to connected Android device..." -ForegroundColor Yellow
adb install -r $alignedApk

Write-Host "9. Launching Shopora Mobile App on device..." -ForegroundColor Yellow
adb shell am start -n com.vasanthisignature.shoporamobile/.MainActivity

# Clean up temporary directories
Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
Remove-Item -Force $unalignedApk -ErrorAction SilentlyContinue
Remove-Item -Force $alignedApk -ErrorAction SilentlyContinue

Write-Host "=========================================" -ForegroundColor Green
Write-Host "✅ SHOPORA MOBILE SUCCESSFULLY UPDATED & INSTALLED!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
