import os
import sys
import zipfile
import subprocess
import shutil

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    source_apk = os.path.join(base_dir, "shopora-pos.apk") if os.path.exists(os.path.join(base_dir, "shopora-pos.apk")) else os.path.join(base_dir, "shopora-mobile-updated.apk")
    bundle_path = os.path.join(base_dir, "android", "app", "src", "main", "assets", "index.android.bundle")
    if not os.path.exists(bundle_path):
        bundle_path = os.path.join(base_dir, "android", "app", "build", "generated", "assets", "react", "release", "index.android.bundle")
    unaligned_apk = os.path.join(base_dir, "shopora-unaligned.apk")
    aligned_apk = os.path.join(base_dir, "shopora-aligned.apk")
    
    build_tools = r"C:\Users\duddu\AppData\Local\Android\Sdk\build-tools\35.0.0"
    zipalign_bin = os.path.join(build_tools, "zipalign.exe")
    apksigner_bin = os.path.join(build_tools, "apksigner.bat")
    keystore_path = os.path.join(base_dir, "android", "app", "debug.keystore")
    
    hermesc_bin = os.path.join(base_dir, "node_modules", "hermes-compiler", "hermesc", "win64-bin", "hermesc.exe")
    bundle_to_inject = bundle_path
    if os.path.exists(hermesc_bin):
        hbc_path = os.path.join(base_dir, "android", "app", "src", "main", "assets", "index.android.bundle.hbc")
        print("   Compiling JS bundle to Hermes Bytecode (-O -fstrip-function-names -freorder-registers)...")
        subprocess.check_call([hermesc_bin, "-emit-binary", "-O", "-fstrip-function-names", "-freorder-registers", "-out", hbc_path, bundle_path])
        bundle_to_inject = hbc_path

    print("1. Reading source APK and optimizing for mobile ARM hardware (stripping emulator ABIs)...")
    written_entries = set()
    with zipfile.ZipFile(source_apk, 'r') as src_zip:
        with zipfile.ZipFile(unaligned_apk, 'w') as dst_zip:
            for item in src_zip.infolist():
                if item.filename.startswith("META-INF/"):
                    continue # skip old signatures
                
                # Strip unused PC emulator binaries (x86, x86_64) to cut APK size dramatically and speed up install/load
                if item.filename.startswith("lib/x86/") or item.filename.startswith("lib/x86_64/"):
                    continue
                
                if item.filename in written_entries:
                    continue # avoid duplicates
                
                written_entries.add(item.filename)
                
                if item.filename == "assets/index.android.bundle":
                    print("   Injecting Hermes Bytecode bundle:", bundle_to_inject)
                    with open(bundle_to_inject, 'rb') as bf:
                        bundle_data = bf.read()
                    zinfo = zipfile.ZipInfo(filename=item.filename, date_time=item.date_time)
                    zinfo.compress_type = zipfile.ZIP_DEFLATED
                    dst_zip.writestr(zinfo, bundle_data)
                else:
                    data = src_zip.read(item.filename)
                    zinfo = zipfile.ZipInfo(filename=item.filename, date_time=item.date_time)
                    # Android 11+ requirement: resources.arsc and lib/*.so MUST be stored uncompressed (ZIP_STORED)
                    if item.filename == "resources.arsc" or item.filename.endswith(".so") or item.filename.startswith("lib/"):
                        zinfo.compress_type = zipfile.ZIP_STORED
                    else:
                        zinfo.compress_type = zipfile.ZIP_DEFLATED
                    dst_zip.writestr(zinfo, data)
                    
    print("2. Aligning APK with zipalign (4-byte alignment)...")
    if os.path.exists(aligned_apk):
        os.remove(aligned_apk)
    subprocess.check_call([zipalign_bin, "-p", "-f", "4", unaligned_apk, aligned_apk])
    
    print("3. Signing APK with apksigner...")
    subprocess.check_call([
        apksigner_bin, "sign",
        "--ks", keystore_path,
        "--ks-pass", "pass:android",
        "--ks-key-alias", "androiddebugkey",
        "--key-pass", "pass:android",
        aligned_apk
    ])
    
    print("4. Verifying APK signature...")
    subprocess.check_call([apksigner_bin, "verify", aligned_apk])
    
    # Save as main shopora-mobile-updated.apk
    shutil.copy2(aligned_apk, source_apk)
    
    print("5. Installing APK on connected Android device via ADB...")
    subprocess.check_call(["adb", "install", "-r", aligned_apk])
    
    print("6. Launching Shopora Mobile App on device...")
    subprocess.run(["adb", "shell", "monkey", "-p", "com.vasanthi.shopora", "-c", "android.intent.category.LAUNCHER", "1"])
    
    # Clean up
    try:
        if os.path.exists(unaligned_apk):
            os.remove(unaligned_apk)
    except Exception:
        pass
    try:
        if os.path.exists(aligned_apk):
            os.remove(aligned_apk)
    except Exception:
        pass
        
    print("SUCCESS: App updated, signed, installed, and launched on Android phone!")

if __name__ == "__main__":
    main()
