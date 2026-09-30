import os
import subprocess
import zipfile
import shutil
import glob

workspace = r"c:\Users\duddu\Desktop\aws_vs\vs_web_app\shopora-mobile"
os.chdir(workspace)

bundle_path = os.path.join(workspace, "android", "app", "src", "main", "assets", "index.android.bundle")
apk_path = os.path.join(workspace, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk")
temp_apk = os.path.join(workspace, "android", "app", "build", "outputs", "apk", "debug", "app-temp.apk")

os.makedirs(os.path.dirname(bundle_path), exist_ok=True)

print("1. Exporting bundle as Hermes bytecode via Expo...")
cmd_bundle = [
    "npx.cmd", "expo", "export:embed",
    "--entry-file", "index.js",
    "--platform", "android",
    "--dev", "false",
    "--bundle-output", bundle_path,
    "--bytecode",
    "--assets-dest", "./android/app/src/main/res"
]
subprocess.run(cmd_bundle, check=True, shell=True)
print("Bundle exported successfully.")

print("2. Injecting bundle into APK...")
with zipfile.ZipFile(apk_path, 'r') as zin:
    with zipfile.ZipFile(temp_apk, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "assets/index.android.bundle":
                continue
            if item.filename.startswith("META-INF/"):
                continue
            buffer = zin.read(item.filename)
            zout.writestr(item, buffer)
        
        with open(bundle_path, 'rb') as f:
            zout.writestr("assets/index.android.bundle", f.read())

shutil.move(temp_apk, apk_path)
print("Bundle injected successfully.")

print("3. Signing APK with apksigner...")
sdk_dir = r"C:\Users\duddu\AppData\Local\Android\Sdk"
apksigners = glob.glob(os.path.join(sdk_dir, "build-tools", "**", "apksigner.bat"), recursive=True)
if not apksigners:
    raise RuntimeError("apksigner.bat not found in Android SDK")

apksigner = apksigners[0]
keystore = os.path.expanduser(r"~\.android\debug.keystore")

cmd = [
    apksigner, "sign",
    "--ks", keystore,
    "--ks-pass", "pass:android",
    "--key-pass", "pass:android",
    apk_path
]
subprocess.run(cmd, check=True)
print("APK signed successfully.")

print("4. Detecting attached device and installing APK...")
dev_output = subprocess.check_output(["adb", "devices"]).decode("utf-8")
device_id = None
for line in dev_output.strip().split("\n")[1:]:
    parts = line.strip().split()
    if len(parts) >= 2 and parts[1] == "device":
        device_id = parts[0]
        break

if not device_id:
    raise RuntimeError("No ADB device attached!")

print(f"Installing to device {device_id}...")
subprocess.run(["adb", "-s", device_id, "uninstall", "com.vasanthi.shopora"])
subprocess.run(["adb", "-s", device_id, "install", apk_path], check=True)
subprocess.run(["adb", "-s", device_id, "shell", "monkey", "-p", "com.vasanthi.shopora", "-c", "android.intent.category.LAUNCHER", "1"], check=True)
print(f"App launched successfully on device {device_id}!")
