#!/usr/bin/env python3
"""
Chaquopy Python module for Relativistic Length Contraction Android App.
"""
import math
import json

SPEED_OF_LIGHT = 299792.458  # km/s

def calculate_gamma(beta, delta=None):
    if beta <= 0:
        return 1.0
    if delta is None or delta <= 0:
        delta = max(0.0, 1.0 - beta)
    delta = max(1e-15, delta)
    denom_sq = delta * (2.0 - delta)
    if denom_sq <= 0:
        return 1e8
    return 1.0 / math.sqrt(denom_sq)

def format_length(meters):
    if meters >= 1.0:
        return f"{meters:.4f} m"
    elif meters >= 0.01:
        return f"{meters * 100:.2f} cm"
    elif meters >= 0.001:
        return f"{meters * 1000:.2f} mm"
    elif meters >= 1e-6:
        return f"{meters * 1e6:.2f} µm (microns)"
    elif meters >= 1e-9:
        return f"{meters * 1e9:.2f} nm (nanometers)"
    elif meters >= 1e-12:
        return f"{meters * 1e12:.2f} pm (picometers)"
    else:
        return f"{meters:.4e} m"

class RelativisticCubeSimulator:
    def __init__(self, rest_size=2.0, atom_grid=5):
        self.rest_size = rest_size
        self.atom_grid = atom_grid
        self.beta = 0.8660254
        self.delta = 1.0 - self.beta
        self.motion_axis = 'x'
        self.show_ghost = True

    def set_speed(self, beta, delta=None):
        self.beta = max(0.0, min(0.99999999999, float(beta)))
        if delta is not None:
            self.delta = float(delta)
        else:
            self.delta = max(1e-15, 1.0 - self.beta)

    def set_nines(self, num_nines):
        n = int(num_nines)
        if n <= 0:
            self.set_speed(0.0, 1.0)
        else:
            delta = 10.0 ** (-n)
            beta = 1.0 - delta
            self.set_speed(beta, delta)

    def get_metrics(self):
        gamma = calculate_gamma(self.beta, self.delta)
        length_rest = 1.0
        length_contracted = length_rest / gamma
        density_ratio = gamma
        volume_ratio = 1.0 / gamma
        time_dilation = gamma
        ke_ratio = gamma - 1.0
        velocity_km_s = self.beta * SPEED_OF_LIGHT

        num_nines = 0
        if self.beta >= 0.9:
            s = f"{self.beta:.14f}".split('.')[1]
            for ch in s:
                if ch == '9':
                    num_nines += 1
                else:
                    break

        return {
            "beta": self.beta,
            "gamma": gamma,
            "length_rest": length_rest,
            "length_contracted": length_contracted,
            "formatted_contracted_length": format_length(length_contracted),
            "density_ratio": density_ratio,
            "volume_ratio": volume_ratio,
            "time_dilation": time_dilation,
            "ke_ratio": ke_ratio,
            "velocity_km_s": velocity_km_s,
            "num_nines": num_nines,
            "motion_axis": self.motion_axis,
        }

    def get_cube_vertices(self):
        gamma = calculate_gamma(self.beta, self.delta)
        scale_contracted = max(0.001, 1.0 / gamma)

        scale_x = scale_contracted if self.motion_axis == 'x' else 1.0
        scale_y = scale_contracted if self.motion_axis == 'y' else 1.0
        scale_z = scale_contracted if self.motion_axis == 'z' else 1.0

        h = self.rest_size / 2.0
        hx = h * scale_x
        hy = h * scale_y
        hz = h * scale_z

        return [
            [-hx, -hy, -hz], [ hx, -hy, -hz], [ hx,  hy, -hz], [-hx,  hy, -hz],
            [-hx, -hy,  hz], [ hx, -hy,  hz], [ hx,  hy,  hz], [-hx,  hy,  hz],
        ]

    def get_ghost_cube_vertices(self):
        h = self.rest_size / 2.0
        return [
            [-h, -h, -h], [ h, -h, -h], [ h,  h, -h], [-h,  h, -h],
            [-h, -h,  h], [ h, -h,  h], [ h,  h,  h], [-h,  h,  h],
        ]

    def get_atom_grip_points(self):
        gamma = calculate_gamma(self.beta, self.delta)
        scale_contracted = max(0.001, 1.0 / gamma)

        N = self.atom_grid
        half = self.rest_size / 2.0
        step = self.rest_size / (N - 1) if N > 1 else 0

        atoms = []
        for ix in range(N):
            rx = -half + ix * step
            if self.motion_axis == 'x':
                rx *= scale_contracted

            for iy in range(N):
                ry = -half + iy * step
                if self.motion_axis == 'y':
                    ry *= scale_contracted

                for iz in range(N):
                    rz = -half + iz * step
                    if self.motion_axis == 'z':
                        rz *= scale_contracted

                    atoms.append([rx, ry, rz])
        return atoms

    def get_lattice_bonds(self):
        N = self.atom_grid
        bonds = []
        def idx(x, y, z):
            return x * (N * N) + y * N + z

        for x in range(N):
            for y in range(N):
                for z in range(N):
                    curr = idx(x, y, z)
                    if x + 1 < N:
                        bonds.append([curr, idx(x + 1, y, z)])
                    if y + 1 < N:
                        bonds.append([curr, idx(x, y + 1, z)])
                    if z + 1 < N:
                        bonds.append([curr, idx(x, y, z + 1)])
        return bonds

    def get_state_json(self):
        return json.dumps({
            "metrics": self.get_metrics(),
            "cube_vertices": self.get_cube_vertices(),
            "ghost_vertices": self.get_ghost_cube_vertices(),
            "atoms": self.get_atom_grip_points(),
            "bonds": self.get_lattice_bonds(),
        })

_sim = RelativisticCubeSimulator()

def android_set_speed(beta):
    _sim.set_speed(beta)
    return _sim.get_state_json()

def android_set_nines(nines):
    _sim.set_nines(nines)
    return _sim.get_state_json()

def android_set_axis(axis):
    _sim.motion_axis = str(axis).lower()
    return _sim.get_state_json()

def android_get_state():
    return _sim.get_state_json()
