import zipfile
import subprocess
import os
import shutil

print("0. Exporting and compiling Hermes bundle...")
hermesc_path = r"node_modules\hermes-compiler\hermesc\win64-bin\hermesc.exe"

# Export JS bundle
cmd_export = "npx expo export:embed --platform android --dev false --entry-file node_modules/expo-router/entry.js --bundle-output ./index.android.bundle --assets-dest ./android/app/src/main/res"
subprocess.run(cmd_export, shell=True, check=True)

# Compile Hermes bytecode
cmd_hermes = f'"{hermesc_path}" -emit-binary -out ./index.android.bundle.hbc ./index.android.bundle'
subprocess.run(cmd_hermes, shell=True, check=True)

print("1. Injecting Hermes bundle into APK...")
debug_apk = "android/app/build/outputs/apk/debug/app-debug.apk"
src_apk = debug_apk if os.path.exists(debug_apk) else "shopora-pos.apk"
print(f"Using base APK: {src_apk}")
temp_apk = "shopora-mobile-temp.apk"
out_apk = "shopora-mobile-final.apk"
# Read bundle
with open("index.android.bundle.hbc", "rb") as f:
    bundle_bytes = f.read()

# Copy all files except assets/index.android.bundle and META-INF (signatures)
with zipfile.ZipFile(src_apk, 'r') as zin:
    with zipfile.ZipFile(temp_apk, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename.startswith("META-INF/"):
                continue
            if item.filename == "assets/index.android.bundle":
                continue
            data = zin.read(item.filename)
            zout.writestr(item, data)
        # Write updated bundle
        zout.writestr("assets/index.android.bundle", bundle_bytes)

print("2. Signing APK with debug keystore...")
# Look for apksigner or uber-apk-signer or jarsigner
keystore_path = "android/app/debug.keystore"
jarsigner_path = r'"C:\Program Files\Java\jdk-25\bin\jarsigner.exe"'
apksigner_path = r'"C:\Users\duddu\AppData\Local\Android\Sdk\build-tools\35.0.0\apksigner.bat"'

if os.path.exists(temp_apk):
    if os.path.exists(out_apk):
        try:
            os.remove(out_apk)
        except Exception:
            pass
    cmd_apk = f'{apksigner_path} sign --ks {keystore_path} --ks-pass pass:android --key-pass pass:android --out {out_apk} {temp_apk}'
    res_apk = subprocess.run(cmd_apk, shell=True, capture_output=True, text=True)
    print("apksigner stdout:", res_apk.stdout)
    print("apksigner stderr:", res_apk.stderr)
    if res_apk.returncode == 0:
        print("[OK] APK signed successfully with apksigner!")
    else:
        print("apksigner failed, trying jarsigner fallback...")
        shutil.copy(temp_apk, out_apk)
        cmd = f'{jarsigner_path} -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore {keystore_path} -storepass android -keypass android {out_apk} androiddebugkey'
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        print("jarsigner stdout:", res.stdout[-200:] if res.stdout else "")
        print("jarsigner stderr:", res.stderr)

print("3. Installing to connected device...")
res = subprocess.run("adb install -r shopora-mobile-final.apk", shell=True, capture_output=True, text=True)
print("ADB install stdout:", res.stdout)
print("ADB install stderr:", res.stderr)

print("4. Launching Add Product Screen...")
subprocess.run("adb shell am start -n com.vasanthi.shopora/.MainActivity", shell=True)
print("Done!")

