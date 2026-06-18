import numpy as np


def generate_ring_dataset(
    n_inner=35,
    n_outer=45,
    inner_radius_range=(0.0, 1.0),
    outer_radius_range=(1.6, 2.5),
    noise=0.08,
    random_seed=7,
):
    rng = np.random.default_rng(random_seed)

    # ── inner ring ──────────────────────────────────────────────
    r_inner = rng.uniform(*inner_radius_range, size=n_inner)
    theta_inner = rng.uniform(0, 2 * np.pi, size=n_inner)
    x_inner = r_inner * np.cos(theta_inner)
    y_inner = r_inner * np.sin(theta_inner)

    # ── outer ring ──────────────────────────────────────────────
    r_outer = rng.uniform(*outer_radius_range, size=n_outer)
    theta_outer = rng.uniform(0, 2 * np.pi, size=n_outer)
    x_outer = r_outer * np.cos(theta_outer)
    y_outer = r_outer * np.sin(theta_outer)

    # ── concatenate ─────────────────────────────────────────────
    X = np.vstack(
        [
            np.column_stack([x_inner, y_inner]),
            np.column_stack([x_outer, y_outer]),
        ]
    )
    y = np.hstack([np.zeros(n_inner, dtype=int), np.ones(n_outer, dtype=int)])

    # ── inject Gaussian noise ───────────────────────────────────
    X += rng.normal(0, noise, size=X.shape)

    return X, y
