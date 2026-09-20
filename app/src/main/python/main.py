#!/usr/bin/env python3
"""
Relativistic Length Contraction 3D Simulator - Python Core Engine & Controller
Special Relativity: Cube deformation approaching 0.99999999999 c (Lorentz factor gamma ~ 223,607).

This module contains the complete application logic:
- Physics computation with ultra-high precision (up to 11 nines without cancellation)
- 3D vector geometry, camera matrices, perspective projection & depth sorting
- Transparent atom grip points lattice & longitudinal lattice compaction
- Relativistic Doppler color shifting
- Touch orbit gesture handling & UI slider/preset state management
- Frame rendering pipeline returning structured drawing commands to Android Canvas
"""

import math
import json

SPEED_OF_LIGHT_MS = 299792458.0  # m/s
SPEED_OF_LIGHT_KMS = 299792.458   # km/s


def calculate_gamma(beta: float, delta: float = None) -> float:
    """
    Calculate Lorentz factor gamma = 1 / sqrt(1 - beta^2) with extreme numerical precision.
    Uses algebraic identity 1 - beta^2 = (1 - beta)(1 + beta) = delta * (2 - delta)
    where delta = 1 - beta, preventing floating-point cancellation for beta -> 1.
    """
    if beta <= 0.0:
        return 1.0
    if delta is None or delta <= 0.0:
        delta = max(0.0, 1.0 - beta)
    delta = max(1e-15, delta)
    denom_sq = delta * (2.0 - delta)
    if denom_sq <= 0.0:
        return 1e8
    return 1.0 / math.sqrt(denom_sq)


def format_si_length(meters: float) -> str:
    """Format length in meters with appropriate SI unit prefix."""
    if meters >= 1.0:
        return f"{meters:.4f} m"
    elif meters >= 0.01:
        return f"{meters * 100.0:.2f} cm"
    elif meters >= 0.001:
        return f"{meters * 1000.0:.2f} mm"
    elif meters >= 1e-6:
        return f"{meters * 1e6:.2f} µm (microns)"
    elif meters >= 1e-9:
        return f"{meters * 1e9:.2f} nm (nanometers)"
    elif meters >= 1e-12:
        return f"{meters * 1e12:.2f} pm (picometers)"
    else:
        return f"{meters:.4e} m"


class Camera3D:
    """Interactive 3D orbit camera with perspective projection."""
    def __init__(self, rot_x: float = 24.0, rot_y: float = -34.0, distance: float = 6.0):
        self.rot_x = rot_x
        self.rot_y = rot_y
        self.distance = distance

    def orbit(self, dx: float, dy: float, sensitivity: float = 0.45):
        self.rot_y += dx * sensitivity
        self.rot_x -= dy * sensitivity
        # Clamp pitch to prevent gimbal flip
        self.rot_x = max(-89.0, min(89.0, self.rot_x))

    def project_point(self, x: float, y: float, z: float, cx: float, cy: float, scale: float):
        """
        Rotates (x, y, z) by Euler angles (rot_y, rot_x) and applies perspective division.
        Returns: (screen_x, screen_y, depth_z)
        """
        rad_y = math.radians(self.rot_y)
        cos_y = math.cos(rad_y)
        sin_y = math.sin(rad_y)
        x1 = x * cos_y + z * sin_y
        z1 = -x * sin_y + z * cos_y

        rad_x = math.radians(self.rot_x)
        cos_x = math.cos(rad_x)
        sin_x = math.sin(rad_x)
        y2 = y * cos_x - z1 * sin_x
        z2 = y * sin_x + z1 * cos_x

        # Perspective division
        p_scale = scale * self.distance / (self.distance + z2)
        screen_x = cx + x1 * p_scale
        screen_y = cy - y2 * p_scale
        return screen_x, screen_y, z2


class RelativisticCubeApp:
    """Complete application state, physics engine, and scene renderer."""
    def __init__(self, rest_size: float = 2.0, atom_grid: int = 5):
        self.rest_size = rest_size
        self.atom_grid = atom_grid
        self.beta = 0.86602540378  # Default: 50% length contraction (gamma = 2.0)
        self.delta = 1.0 - self.beta
        self.motion_axis = 'x'
        self.show_ghost = True
        self.show_atoms = True
        self.show_faces = True
        self.camera = Camera3D()

        # Touch tracking
        self.last_touch_x = 0.0
        self.last_touch_y = 0.0

        # Geometry cube definition (8 vertices cube signs)
        self.box_signs = [
            (-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1),
            (-1, -1,  1), (1, -1,  1), (1, 1,  1), (-1, 1,  1)
        ]
        self.edges = [
            (0, 1), (1, 2), (2, 3), (3, 0),
            (4, 5), (5, 6), (6, 7), (7, 4),
            (0, 4), (1, 5), (2, 6), (3, 7)
        ]
        # 6 faces defined by vertex indices (with normal pointing outward)
        self.faces = [
            (0, 1, 2, 3, (0, 0, -1)),  # Back (-Z)
            (4, 5, 6, 7, (0, 0, 1)),   # Front (+Z)
            (0, 4, 7, 3, (-1, 0, 0)),  # Left (-X)
            (1, 5, 6, 2, (1, 0, 0)),   # Right (+X)
            (3, 2, 6, 7, (0, 1, 0)),   # Top (+Y)
            (0, 1, 5, 4, (0, -1, 0)),  # Bottom (-Y)
        ]

    # -------------------------------------------------------------------------
    # Physics & Metrics
    # -------------------------------------------------------------------------
    def get_gamma(self) -> float:
        return calculate_gamma(self.beta, self.delta)

    def set_speed(self, beta: float, delta: float = None):
        self.beta = max(0.0, min(0.99999999999, float(beta)))
        if delta is not None:
            self.delta = float(delta)
        else:
            self.delta = max(1e-15, 1.0 - self.beta)

    def set_nines(self, nines: int):
        n = int(nines)
        if n <= 0:
            self.set_speed(0.0, 1.0)
        else:
            delta = 10.0 ** (-n)
            beta = 1.0 - delta
            self.set_speed(beta, delta)

    def apply_preset(self, preset_name: str):
        preset = preset_name.lower().strip()
        if preset in ("rest", "zero"):
            self.set_speed(0.0, 1.0)
        elif preset in ("half", "50%"):
            self.set_speed(0.86602540378)  # gamma = 2.0
        elif preset in ("99", "muon"):
            self.set_speed(0.99)
        elif preset in ("ultra", "4nines"):
            self.set_speed(0.9999)
        elif preset in ("limit", "extreme", "11nines"):
            self.set_nines(11)  # 0.99999999999 c
        return self.get_metrics()

    def set_motion_axis(self, axis: str):
        ax = str(axis).lower()
        if ax in ('x', 'y', 'z'):
            self.motion_axis = ax
        return self.get_metrics()

    def on_slider_progress(self, progress: int) -> dict:
        """
        Maps a 0-1000 UI slider progress non-linearly to velocity beta:
        - 0 -> 0.0 c
        - 1000 -> 0.99999999999 c (11 nines)
        """
        p = max(0, min(1000, int(progress)))
        if p == 0:
            self.set_speed(0.0, 1.0)
        elif p >= 999:
            self.set_nines(11)
        else:
            norm = p / 1000.0
            exponent = 11.0 * math.pow(norm, 2.2)
            delta = math.pow(10.0, -exponent)
            beta = min(1.0 - delta, 0.99999999999)
            self.set_speed(beta, delta)
        return self.get_metrics()

    def get_slider_progress(self) -> int:
        """Convert current beta back to 0-1000 slider progress."""
        if self.beta <= 0.0:
            return 0
        delta = max(1e-11, self.delta)
        exponent = -math.log10(delta)
        norm = math.pow(max(0.0, exponent / 11.0), 1.0 / 2.2)
        return int(round(min(1000, max(0, norm * 1000.0))))

    def get_metrics(self) -> dict:
        gamma = self.get_gamma()
        length_rest = 1.0
        length_contracted = length_rest / gamma
        density_ratio = gamma
        contraction_pct = (1.0 - 1.0 / gamma) * 100.0
        velocity_km_s = self.beta * SPEED_OF_LIGHT_KMS

        # Count 9s
        num_nines = 0
        if self.beta >= 0.9:
            dec_str = f"{self.beta:.14f}".split('.')[1]
            for ch in dec_str:
                if ch == '9':
                    num_nines += 1
                else:
                    break

        if gamma >= 10000:
            formatted_gamma = f"{gamma:.2e}"
        else:
            formatted_gamma = f"{gamma:.4f}"

        if self.beta >= 0.9999:
            formatted_speed = f"0.{'9' * num_nines} c ({self.beta:.11f} c)"
        else:
            formatted_speed = f"{self.beta:.5f} c"

        return {
            "beta": self.beta,
            "gamma": gamma,
            "formatted_speed": formatted_speed,
            "formatted_gamma": formatted_gamma,
            "formatted_contracted_length": format_si_length(length_contracted),
            "density_ratio": density_ratio,
            "contraction_percentage": f"{contraction_pct:.2f}%",
            "velocity_km_s": f"{velocity_km_s:,.1f} km/s",
            "num_nines": num_nines,
            "motion_axis": self.motion_axis,
            "slider_progress": self.get_slider_progress(),
        }

    # -------------------------------------------------------------------------
    # Touch Gestures
    # -------------------------------------------------------------------------
    def on_touch_down(self, x: float, y: float):
        self.last_touch_x = float(x)
        self.last_touch_y = float(y)

    def on_touch_move(self, x: float, y: float):
        dx = float(x) - self.last_touch_x
        dy = float(y) - self.last_touch_y
        self.camera.orbit(dx, dy)
        self.last_touch_x = float(x)
        self.last_touch_y = float(y)

    # -------------------------------------------------------------------------
    # 3D Geometry Computation
    # -------------------------------------------------------------------------
    def _compute_cube_vertices(self, scale_contracted: float) -> list:
        h = self.rest_size / 2.0
        sx = scale_contracted if self.motion_axis == 'x' else 1.0
        sy = scale_contracted if self.motion_axis == 'y' else 1.0
        sz = scale_contracted if self.motion_axis == 'z' else 1.0
        return [
            (s[0] * h * sx, s[1] * h * sy, s[2] * h * sz)
            for s in self.box_signs
        ]

    def _compute_atom_grip_points(self, scale_contracted: float) -> list:
        N = self.atom_grid
        half = self.rest_size / 2.0
        step = self.rest_size / (N - 1) if N > 1 else 0.0

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

                    atoms.append((rx, ry, rz))
        return atoms

    # -------------------------------------------------------------------------
    # Full Frame Rendering Pipeline
    # -------------------------------------------------------------------------
    def render_frame_packets(self, width: float, height: float) -> str:
        """
        Renders the complete 3D scene directly in Python and outputs structured
        graphics drawing packets for Android Canvas:
        {
          "metrics": {...},
          "lines": [[x1, y1, x2, y2, colorHex, strokeWidth, isDashed], ...],
          "circles": [[x, y, radius, colorHex], ...],
          "polygons": [[[x1, y1], [x2, y2], [x3, y3], [x4, y4], colorHex], ...]
        }
        """
        cx = width / 2.0
        cy = height / 2.0
        base_scale = min(cx, cy) * 0.65

        gamma = self.get_gamma()
        # Scale along motion axis: 1 / gamma (clamped for visual display)
        scale_contracted = max(0.001, 1.0 / gamma)

        # Dynamic Doppler color shift:
        # Relativistic velocity shifts emission from cyan -> violet -> magenta
        if gamma >= 50.0:
            cube_edge_color = "#E879F9"   # High-energy magenta/purple
            face_color = "#35133d88"      # Translucent purple
            atom_color = "#F472B6"       # Pink
            bond_color = "#80C084FC"      # Violet line
        elif gamma >= 5.0:
            cube_edge_color = "#818CF8"   # Indigo/Violet
            face_color = "#1e1b4b88"      # Deep indigo
            atom_color = "#A78BFA"
            bond_color = "#80818CF8"
        else:
            cube_edge_color = "#38BDF8"   # Electric Sky Cyan
            face_color = "#0369a155"      # Translucent cyan
            atom_color = "#22D3EE"
            bond_color = "#7006B6D4"

        ghost_edge_color = "#8094A3B8"  # Slate dashed

        lines = []
        circles = []
        polygons = []

        # 1. Project Ghost Rigid Reference Cube (Uncontracted L0 = 1.0m)
        if self.show_ghost:
            ghost_verts_3d = self._compute_cube_vertices(1.0)
            proj_ghost = [
                self.camera.project_point(v[0], v[1], v[2], cx, cy, base_scale)
                for v in ghost_verts_3d
            ]
            for edge in self.edges:
                p1 = proj_ghost[edge[0]]
                p2 = proj_ghost[edge[1]]
                lines.append([p1[0], p1[1], p2[0], p2[1], ghost_edge_color, 2.0, 1])

        # 2. Project Transparent Atom Grip Points & Lattice Bonds
        if self.show_atoms:
            atoms_3d = self._compute_atom_grip_points(scale_contracted)
            proj_atoms = [
                self.camera.project_point(a[0], a[1], a[2], cx, cy, base_scale)
                for a in atoms_3d
            ]

            # Lattice bonds
            N = self.atom_grid
            def get_idx(x, y, z):
                return x * (N * N) + y * N + z

            for x in range(N):
                for y in range(N):
                    for z in range(N):
                        curr = get_idx(x, y, z)
                        if x + 1 < N:
                            nbr = get_idx(x + 1, y, z)
                            p1 = proj_atoms[curr]
                            p2 = proj_atoms[nbr]
                            lines.append([p1[0], p1[1], p2[0], p2[1], bond_color, 1.2, 0])
                        if y + 1 < N:
                            nbr = get_idx(x, y + 1, z)
                            p1 = proj_atoms[curr]
                            p2 = proj_atoms[nbr]
                            lines.append([p1[0], p1[1], p2[0], p2[1], bond_color, 1.2, 0])
                        if z + 1 < N:
                            nbr = get_idx(x, y, z + 1)
                            p1 = proj_atoms[curr]
                            p2 = proj_atoms[nbr]
                            lines.append([p1[0], p1[1], p2[0], p2[1], bond_color, 1.2, 0])

            # Atom grip point spheres
            atom_radius = max(3.0, base_scale * 0.032)
            for p in proj_atoms:
                circles.append([p[0], p[1], atom_radius, atom_color])

        # 3. Project Moving Contracted Cube (Faces & Edges)
        cube_verts_3d = self._compute_cube_vertices(scale_contracted)
        proj_cube = [
            self.camera.project_point(v[0], v[1], v[2], cx, cy, base_scale)
            for v in cube_verts_3d
        ]

        # Draw Contracted Faces (Depth sorted)
        if self.show_faces:
            face_depths = []
            for face in self.faces:
                i0, i1, i2, i3 = face[0], face[1], face[2], face[3]
                avg_z = (proj_cube[i0][2] + proj_cube[i1][2] + proj_cube[i2][2] + proj_cube[i3][2]) / 4.0
                face_depths.append((avg_z, face))

            # Sort back-to-front
            face_depths.sort(key=lambda item: item[0], reverse=True)
            for _, face in face_depths:
                pts = [
                    [proj_cube[face[0]][0], proj_cube[face[0]][1]],
                    [proj_cube[face[1]][0], proj_cube[face[1]][1]],
                    [proj_cube[face[2]][0], proj_cube[face[2]][1]],
                    [proj_cube[face[3]][0], proj_cube[face[3]][1]],
                ]
                polygons.append([pts, face_color])

        # Draw Contracted Cube Edges
        for edge in self.edges:
            p1 = proj_cube[edge[0]]
            p2 = proj_cube[edge[1]]
            lines.append([p1[0], p1[1], p2[0], p2[1], cube_edge_color, 4.0, 0])

        return json.dumps({
            "metrics": self.get_metrics(),
            "lines": lines,
            "circles": circles,
            "polygons": polygons,
        })


# Global application singleton
_app = RelativisticCubeApp()


# =============================================================================
# Chaquopy Android Entry Points
# =============================================================================
def android_on_slider_progress(progress):
    return json.dumps(_app.on_slider_progress(progress))

def android_apply_preset(preset_name):
    return json.dumps(_app.apply_preset(str(preset_name)))

def android_set_motion_axis(axis):
    return json.dumps(_app.set_motion_axis(str(axis)))

def android_on_touch_down(x, y):
    _app.on_touch_down(x, y)
    return "ok"

def android_on_touch_move(x, y):
    _app.on_touch_move(x, y)
    return "ok"

def android_render_scene(width, height):
    """Called by RelativisticSurfaceView onDraw to get complete rendering packet."""
    return _app.render_frame_packets(float(width), float(height))

def android_get_metrics():
    return json.dumps(_app.get_metrics())


if __name__ == "__main__":
    print("Relativistic Physics Engine ready.")
