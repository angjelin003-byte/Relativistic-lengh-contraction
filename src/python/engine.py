"""
Relativistic Length Contraction 3D Engine (Python Source)
Special Relativity: Cube flattening up to 0.99999999999 c (Lorentz factor gamma ~ 223,607).

Editable live inside the viewer! Modify parameters, formulas, and presets.
"""

import math

SPEED_OF_LIGHT_KMS = 299792.458  # km/s
REST_LENGTH_METERS = 1.0          # L0 = 1 meter


def calculate_gamma(beta: float, delta: float = None) -> float:
    """
    Computes Lorentz factor gamma = 1 / sqrt(1 - beta^2) with extreme numerical precision.
    Uses algebraic identity 1 - beta^2 = delta * (2 - delta) where delta = 1 - beta.
    Prevents floating point cancellation error as beta approaches 0.99999999999 c.
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


def count_nines(beta: float) -> int:
    """Counts consecutive 9s immediately after decimal point in velocity beta."""
    if beta < 0.9:
        return 0
    dec_part = f"{beta:.14f}".split('.')[1]
    nines = 0
    for ch in dec_part:
        if ch == '9':
            nines += 1
        else:
            break
    return nines


def calculate_metrics(beta: float, delta: float = None, rest_length: float = 1.0) -> dict:
    """
    Computes all special relativistic kinematic & structural metrics:
    - Contracted length: L = L0 / gamma
    - Volume ratio: V / V0 = 1 / gamma
    - Atomic packing density: rho / rho0 = gamma
    - Time dilation ratio: dt' / dt = gamma
    - Kinetic energy ratio: (gamma - 1)
    """
    gamma = calculate_gamma(beta, delta)
    contracted_len = rest_length / gamma
    vol_ratio = 1.0 / gamma
    atom_density = gamma
    time_dilation = gamma
    kinetic_ratio = max(0.0, gamma - 1.0)
    velocity_kms = beta * SPEED_OF_LIGHT_KMS
    num_nines = count_nines(beta)

    return {
        "beta": beta,
        "gamma": gamma,
        "lengthRest": rest_length,
        "lengthContracted": contracted_len,
        "volumeRatio": vol_ratio,
        "atomDensityRatio": atom_density,
        "timeDilationRatio": time_dilation,
        "kineticEnergyRestRatio": kinetic_ratio,
        "velocityKmPerS": velocity_kms,
        "numberOfNines": num_nines,
    }


def compute_doppler_wavelength_shift(beta: float, lambda_0: float = 500.0) -> float:
    """
    Relativistic Doppler effect along the line of sight:
    lambda_observed = lambda_0 * sqrt((1 - beta) / (1 + beta))
    Approaching observer sees severe blueshift (cyan -> violet -> gamma rays).
    """
    if beta <= 0.0:
        return lambda_0
    factor = math.sqrt(max(1e-15, (1.0 - beta) / (1.0 + beta)))
    return lambda_0 * factor


def compute_atom_lattice_coords(grid_size: int, cube_size: float, scale_contracted: float, axis: str = 'x') -> list:
    """
    Generates 3D grid points (X, Y, Z) for the transparent atom grip points,
    contracting spacing along the axis of motion while preserving transverse coordinates.
    """
    half = cube_size / 2.0
    step = cube_size / (grid_size - 1) if grid_size > 1 else 0.0
    points = []

    for ix in range(grid_size):
        x = -half + ix * step
        if axis.lower() == 'x':
            x *= scale_contracted

        for iy in range(grid_size):
            y = -half + iy * step
            if axis.lower() == 'y':
                y *= scale_contracted

            for iz in range(grid_size):
                z = -half + iz * step
                if axis.lower() == 'z':
                    z *= scale_contracted

                points.append((x, y, z))

    return points


# Export main entry point for the browser runner
def run_simulation(beta=0.8660254, delta=None, axis='x', grid_size=5):
    metrics = calculate_metrics(beta, delta, REST_LENGTH_METERS)
    lattice = compute_atom_lattice_coords(grid_size, 2.0, 1.0 / metrics["gamma"], axis)
    return {
        "metrics": metrics,
        "atom_count": len(lattice),
        "status": "success",
    }
