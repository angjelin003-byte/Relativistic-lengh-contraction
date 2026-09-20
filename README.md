# Relativistic Length Contraction 3D Simulator (Android & Python)

Interactive 3D visualization of relativistic length contraction of a moving cube approaching **0.99999999999 c** (11 nines, Lorentz factor $\gamma \approx 223,607$).

## Features
- **Relativistic Flattening**: Visualizes the Lorentz deformation along the axis of motion ($L = L_0 / \gamma$) while transverse dimensions stay unchanged.
- **Transparent Atom Grip Points**: 3D crystal lattice of atoms that compress longitudinally along the motion vector, increasing atomic number density by $\gamma$.
- **Ghost Rigid Reference Cube**: Faint uncontracted reference cube ($L_0 = 1.0\text{ m}$) centered with the contracted object.
- **Python Engine**: High-precision physics calculations handling $1 - \beta = 10^{-11}$ without numerical precision cancellation.
- **Android Support**: Native Android app using Chaquopy to run Python directly on Android devices.

---

## 🚀 Building the Android APK on GitHub (Actions)

This repository includes a preconfigured GitHub Actions workflow at [`.github/workflows/build.yml`](.github/workflows/build.yml).

### Automatic Build on Push:
1. Push or export this repository to GitHub.
2. Navigate to the **Actions** tab on your GitHub repository.
3. The **"Build Android APK with Gradle and Python"** workflow will trigger automatically.
4. Once completed, download the built APK artifact: `RelativisticCube-Android-APK`.

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
