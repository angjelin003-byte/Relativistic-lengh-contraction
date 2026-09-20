#!/usr/bin/env python3
"""
Relativistic Length Contraction 3D Simulator (Python Standalone & Android Engine)
Visualizes Special Relativity: Cube flattening up to 0.99999999999 c (gamma ~ 223,607).

Can be executed standalone on desktop/terminals or run inside Android using Chaquopy.
"""

import sys
import os

# Import the core engine
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app", "src", "main", "python"))
from main import RelativisticCubeApp, calculate_gamma, format_si_length, Camera3D


def run_benchmark_and_table():
    print("=" * 74)
    print("  RELATIVISTIC LENGTH CONTRACTION SIMULATOR (PYTHON STANDALONE & ANDROID)")
    print("  Lorentz Factor & Longitudinal Deformation up to 0.99999999999 c")
    print("=" * 74)

    test_velocities = [
        ("0.00000000000 c", 0.0, 1.0, "Observer Rest Frame"),
        ("0.50000000000 c", 0.5, 0.5, "Threshold Relativistic Speed"),
        ("0.86602540378 c", 0.86602540378, 1.0 - 0.86602540378, "50% Contraction (gamma = 2.0)"),
        ("0.99000000000 c", 0.99, 0.01, "Cosmic Ray Muon Velocity"),
        ("0.99990000000 c", 0.9999, 0.0001, "Relativistic Ion Accelerator"),
        ("0.99999900000 c", 0.999999, 1e-6, "Ultra-Relativistic (6 Nines)"),
        ("0.99999999999 c", 1.0 - 1e-11, 1e-11, "Extreme Velocity Limit (11 Nines)"),
    ]

    for label, beta, delta, desc in test_velocities:
        gamma = calculate_gamma(beta, delta)
        length_contracted = 1.0 / gamma
        density = gamma
        dilation = gamma
        print(f"\n[{label}] - {desc}")
        print(f"  • Lorentz factor γ       : {gamma:,.4f}" if gamma < 10000 else f"  • Lorentz factor γ       : {gamma:,.2f}")
        print(f"  • Contracted Length L    : {format_si_length(length_contracted)} (from 1.0000 m)")
        print(f"  • Atomic Density ρ / ρ₀  : {density:,.2f}× (Compacted along motion axis)")
        print(f"  • Time Dilation Δt'/Δt   : {dilation:,.2f}×")

    print("\n" + "=" * 74)
    print("3D Scene Geometry Verification:")
    app = RelativisticCubeApp()
    app.set_nines(11)
    metrics = app.get_metrics()
    print(f"App Velocity       : {metrics['formatted_speed']}")
    print(f"App Lorentz Gamma  : {metrics['gamma']:,.2f}")
    print(f"Contracted Length  : {metrics['formatted_contracted_length']}")
    print(f"Contraction %      : {metrics['contraction_percentage']}")

    # Test rendering packet generation
    packet = app.render_frame_packets(800, 600)
    import json
    parsed = json.loads(packet)
    print(f"Generated Lines    : {len(parsed['lines'])} lines")
    print(f"Generated Circles  : {len(parsed['circles'])} atom grip points")
    print(f"Generated Polygons : {len(parsed['polygons'])} contracted faces")
    print("=" * 74)
    print("Ready to build for Android with `./gradlew assembleDebug` or GitHub Actions.")
    print("=" * 74)


if __name__ == "__main__":
    run_benchmark_and_table()
