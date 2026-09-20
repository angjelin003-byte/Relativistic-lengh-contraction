import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Terminal,
  Check,
  Copy,
  FileCode,
  Github,
  Download,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Layers
} from 'lucide-react';

interface AndroidExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidExportModal: React.FC<AndroidExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mobile' | 'workflow' | 'python' | 'local'>('mobile');

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const workflowYaml = `name: Build Android APK with Gradle and Python

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build:
    name: Build Android APK
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - uses: actions/setup-python@v5
        with:
          python-version: '3.10'
      - name: Accept Android SDK Licenses
        run: |
          yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses 2>/dev/null || true
      - uses: gradle/actions/setup-gradle@v3
        with:
          gradle-version: '8.2'
      - name: Build Android APK
        run: |
          gradle wrapper
          chmod +x gradlew
          ./gradlew assembleDebug --stacktrace
      - name: Prepare Named APK
        run: |
          mkdir -p build-artifacts
          APK_PATH=$(find app/build/outputs/apk/debug/ -name "*.apk" | head -n 1)
          cp "$APK_PATH" build-artifacts/Relativistic-Length-Contraction-0.99999999999c.apk
      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Relativistic-Length-Contraction-Android-APK
          path: build-artifacts/*.apk
          retention-days: 30
      - name: Publish GitHub Release (Direct Mobile APK Download)
        if: github.event_name == 'push'
        uses: softprops/action-gh-release@v2
        with:
          tag_name: latest-apk
          name: "Relativistic Length Contraction 3D (Android APK)"
          files: build-artifacts/Relativistic-Length-Contraction-0.99999999999c.apk
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        continue-on-error: true`;

  const pythonSnippet = `#!/usr/bin/env python3
# Relativistic Length Contraction Simulator (Python / Android Chaquopy)
import math

def calculate_gamma(beta, delta=None):
    if beta <= 0: return 1.0
    if delta is None: delta = max(0.0, 1.0 - beta)
    delta = max(1e-15, delta)
    return 1.0 / math.sqrt(delta * (2.0 - delta))

# Extreme velocity: 0.99999999999 c (11 nines)
delta = 1e-11
beta = 1.0 - delta
gamma = calculate_gamma(beta, delta)
print(f"Lorentz Factor gamma: {gamma:,.2f}")
# gamma = 223,606.80 -> 1m cube flattens to 4.47 microns!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                <span>Build Android APK with GitHub</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Mobile Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Automated Cloud Build via GitHub Actions (.github/workflows/build.yml)
              </p>
            </div>
          </div>
          <button
            id="btn-close-android-modal"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 pt-2.5 border-b border-slate-800/80 bg-slate-950/50 text-xs overflow-x-auto no-scrollbar">
          <button
            id="tab-mobile"
            onClick={() => setActiveTab('mobile')}
            className={`pb-2.5 px-2.5 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap min-h-[38px] ${
              activeTab === 'mobile'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            📱 3-Step Mobile Build
          </button>
          <button
            id="tab-workflow"
            onClick={() => setActiveTab('workflow')}
            className={`pb-2.5 px-2.5 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap min-h-[38px] ${
              activeTab === 'workflow'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            Actions Workflow
          </button>
          <button
            id="tab-python"
            onClick={() => setActiveTab('python')}
            className={`pb-2.5 px-2.5 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap min-h-[38px] ${
              activeTab === 'python'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Python Engine
          </button>
          <button
            id="tab-local"
            onClick={() => setActiveTab('local')}
            className={`pb-2.5 px-2.5 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap min-h-[38px] ${
              activeTab === 'local'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            CLI / Gradle
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'mobile' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-100 text-sm">
                    Pre-configured for GitHub's Built-in APK Builder
                  </p>
                  <p className="text-xs text-emerald-300/90 leading-relaxed">
                    All Android build scripts (<code>build.gradle</code>, <code>gradlew</code>, Chaquopy Python, and <code>.github/workflows/build.yml</code>) are already in your project. Follow these 3 quick steps on your phone:
                  </p>
                </div>
              </div>

              {/* Step Cards */}
              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-semibold text-slate-100 text-sm">
                      Export to your GitHub Account
                    </h4>
                    <p className="text-slate-300 leading-relaxed text-xs">
                      Tap the <strong>Settings menu (⚙️ or ...)</strong> in the top header of AI Studio and select <strong>"Export to GitHub"</strong>. Choose or create a repository name.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-semibold text-slate-100 text-sm">
                      GitHub Builds the APK in the Cloud
                    </h4>
                    <p className="text-slate-300 leading-relaxed text-xs">
                      The moment it exports, GitHub Actions automatically starts the <strong>"Build Android APK with Gradle and Python"</strong> workflow. It installs Java, Python, compiles with <code>./gradlew assembleDebug</code>, and finishes in ~2 minutes.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800/60 bg-gradient-to-br from-emerald-950/30 to-slate-950 flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-emerald-300 text-sm flex items-center gap-1.5">
                      <span>Download & Install Directly on Phone</span>
                      <Download className="w-3.5 h-3.5" />
                    </h4>
                    <p className="text-slate-300 leading-relaxed text-xs">
                      On your mobile browser, go to your exported GitHub repository:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300 text-xs">
                      <li>
                        Tap <strong>"Releases"</strong> on the repository home page, then tap <strong><code className="text-emerald-300 font-mono">Relativistic-Length-Contraction-0.99999999999c.apk</code></strong> to download directly.
                      </li>
                      <li>
                        <em>Alternative:</em> Tap the <strong>"Actions"</strong> tab → tap the latest green build run → tap the <strong>Relativistic-Length-Contraction-Android-APK</strong> artifact.
                      </li>
                    </ul>
                    <p className="text-[11px] text-slate-400 italic">
                      Tap the downloaded APK notification to install on Android (enable 'Install from this source' if prompted).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">
                  Workflow location: <code>.github/workflows/build.yml</code>
                </span>
                <button
                  id="btn-copy-workflow"
                  onClick={() => handleCopy(workflowYaml, 'workflow')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 min-h-[36px]"
                >
                  {copiedTab === 'workflow' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy YAML</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-950 font-mono text-slate-300 border border-slate-800 overflow-x-auto text-[11px] leading-relaxed">
                {workflowYaml}
              </pre>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">
                  Python engine: <code>main.py</code> & <code>app/src/main/python/main.py</code>
                </span>
                <button
                  id="btn-copy-python"
                  onClick={() => handleCopy(pythonSnippet, 'python')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 min-h-[36px]"
                >
                  {copiedTab === 'python' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Python</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-950 font-mono text-slate-300 border border-slate-800 overflow-x-auto text-[11px] leading-relaxed">
                {pythonSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'local' && (
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <h4 className="font-bold text-slate-100 text-sm">CLI Commands</h4>
              <div className="p-3 rounded-lg bg-slate-950 font-mono text-cyan-300 border border-slate-800 space-y-1 text-xs">
                <p className="text-slate-400"># 1. Run Python simulation</p>
                <p>python3 main.py</p>
                <p className="text-slate-400 pt-2"># 2. Build Android APK locally with Gradle</p>
                <p>chmod +x gradlew</p>
                <p>./gradlew assembleDebug</p>
                <p className="text-slate-400 pt-2"># 3. Install on connected phone</p>
                <p>adb install app/build/outputs/apk/debug/app-debug.apk</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Target: Android 14 (API 34) + Python 3.10
          </span>
          <button
            id="btn-close-android-modal-bottom"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition min-h-[40px]"
          >
            Got it, Let's Build
          </button>
        </div>
      </div>
    </div>
  );
};
