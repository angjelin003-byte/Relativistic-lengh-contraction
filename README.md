# Relativistic Length Contraction 3D Simulator (Android & Python)

Interactive 3D visualization of relativistic length contraction of a moving cube approaching **0.99999999999 c** (11 nines, Lorentz factor $\gamma \approx 223,607$).

## Features
- **Relativistic Flattening**: Visualizes the Lorentz deformation along the axis of motion ($L = L_0 / \gamma$) while transverse dimensions stay unchanged.
- **Transparent Atom Grip Points**: 3D crystal lattice of atoms that compress longitudinally along the motion vector, increasing atomic number density by $\gamma$.
- **Ghost Rigid Reference Cube**: Faint uncontracted reference cube ($L_0 = 1.0\text{ m}$) centered with the contracted object.
- **Python Engine**: High-precision physics calculations handling $1 - \beta = 10^{-11}$ without numerical precision cancellation.
- **Android Support**: Native Android app using Chaquopy to run Python directly on Android devices.

---
## The warning ("Blocked by Play Protect" or "Unrecognized app") occurs because:
Debug Certificate: The workflow runs ./gradlew assembleDebug, which signs the APK with Android's default generic debug.keystore. Debug certificates are intended only for local development and are explicitly flagged by Play Protect when sideloaded.
When installing the debug APK on your phone:
On the Play Protect dialog, tap "More details" (or the downward arrow).
Tap "Install anyway".
This is the standard procedure on Android when testing custom development builds.

## 🚀 Building & Downloading the Android APK on GitHub (Mobile & Desktop)

This repository includes a preconfigured GitHub Actions workflow at [`.github/workflows/build.yml`](.github/workflows/build.yml) that builds the Android APK in the cloud and automatically publishes it to **GitHub Releases**.

### 📱 3-Step Guide for Mobile Web Users:
1. **Export to GitHub**: In AI Studio, open the settings menu (⚙️ / `...`) and tap **"Export to GitHub"**.
2. **Automated Cloud Compilation**: GitHub Actions automatically triggers the **"Build Android APK with Gradle and Python"** workflow. It sets up JDK 17, Python 3.10, Android SDK, and builds `Relativistic-Length-Contraction-0.99999999999c.apk` in ~2 minutes.
3. **Direct Mobile Download & Install**:
   - Open your exported repository on your mobile phone browser.
   - Tap **"Releases"** on the repo homepage (tag `latest-apk`).
   - Tap **`Relativistic-Length-Contraction-0.99999999999c.apk`** to download it directly to your phone.
   - Tap the downloaded file in your notification drawer to install on Android!
   - *(Alternative)*: Tap the **"Actions"** tab → tap the latest build run → download the `Relativistic-Length-Contraction-Android-APK` artifact.

---

## 📱 Local Android Build with `gradlew`

To build the APK on your local machine:

```bash
# Make gradlew executable
chmod +x gradlew

# Build debug APK
./gradlew assembleDebug
```

The APK will be generated at:
`app/build/outputs/apk/debug/app-debug.apk`

---

## 🐍 Standalone Python CLI / Simulation

You can also run the Python relativistic simulation directly:

```bash
python main.py
```
