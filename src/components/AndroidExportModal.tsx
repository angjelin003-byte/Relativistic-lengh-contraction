import React, { useState } from 'react';
import { X, Smartphone, Terminal, Check, Copy, FileCode, Github, Play } from 'lucide-react';

interface AndroidExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidExportModal: React.FC<AndroidExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'workflow' | 'python' | 'gradle'>('workflow');

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
  workflow_dispatch:

jobs:
  build:
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
      - uses: android-actions/setup-android@v3
      - uses: gradle/actions/setup-gradle@v3
      - run: chmod +x gradlew
      - run: ./gradlew assembleDebug --stacktrace
      - uses: actions/upload-artifact@v4
        with:
          name: RelativisticCube-Android-APK
          path: app/build/outputs/apk/debug/*.apk`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Android & Python Project (GitHub Actions)
              </h3>
              <p className="text-xs text-slate-400">
                Full Android Gradle + Chaquopy Python project & build.yml ready
              </p>
            </div>
          </div>
          <button
            id="btn-close-android-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-slate-950/40 text-xs">
          <button
            id="tab-workflow"
            onClick={() => setActiveTab('workflow')}
            className={`pb-2.5 px-2 font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'workflow'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            .github/workflows/build.yml
          </button>
          <button
            id="tab-python"
            onClick={() => setActiveTab('python')}
            className={`pb-2.5 px-2 font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'python'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Python Engine (main.py)
          </button>
          <button
            id="tab-gradle"
            onClick={() => setActiveTab('gradle')}
            className={`pb-2.5 px-2 font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'gradle'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Build Instructions
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'workflow' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">
                  GitHub Actions workflow file configured in <code>.github/workflows/build.yml</code>:
                </span>
                <button
                  id="btn-copy-workflow"
                  onClick={() => handleCopy(workflowYaml, 'workflow')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
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
                  Python relativistic engine (located at <code>main.py</code> & <code>app/src/main/python/main.py</code>):
                </span>
                <button
                  id="btn-copy-python"
                  onClick={() => handleCopy(pythonSnippet, 'python')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
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

          {activeTab === 'gradle' && (
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <h4 className="font-bold text-slate-100 text-sm">How to run on Android</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>Export / Push to GitHub:</strong> Export your repository to GitHub using the AI Studio settings menu, or push to your repository.
                </li>
                <li>
                  <strong>Automatic APK Build:</strong> GitHub Actions will automatically detect <code>.github/workflows/build.yml</code> and build the Android APK.
                </li>
                <li>
                  <strong>Local Build with Gradle:</strong>
                  <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-cyan-300 border border-slate-800 my-1">
                    chmod +x gradlew<br />
                    ./gradlew assembleDebug
                  </div>
                  The APK is generated at <code>app/build/outputs/apk/debug/app-debug.apk</code>.
                </li>
                <li>
                  <strong>Install on Android:</strong> Run <code>adb install app/build/outputs/apk/debug/app-debug.apk</code> or transfer the APK to your phone!
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            id="btn-close-android-modal-bottom"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
