"""phase2_rbf_decision_surface.py
====================================================
Visualise the RBF‑SVM decision surface in 2‑D and 3‑D.

Run:  python phase2_rbf_decision_surface.py
"""

import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

import sys, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.data_generator import generate_ring_dataset
from utils.svm_utils import train_svm, make_decision_grid, compute_decision_surface


def main():
    # ── data ────────────────────────────────────────────────────
    X, y = generate_ring_dataset(
        n_inner=35, n_outer=45, noise=0.08, random_seed=7
    )
    model = train_svm(X, y, kernel="rbf", C=10.0, gamma=1.0)
    xx, yy, grid = make_decision_grid((-3, 3), (-3, 3), resolution=120)
    Z = compute_decision_surface(model, grid)

    # ── figure ──────────────────────────────────────────────────
    fig = plt.figure(figsize=(16, 7))

    # ── Plot 1: 2‑D ─────────────────────────────────────────────
    ax1 = fig.add_subplot(1, 2, 1)

    # contours
    ax1.contourf(xx, yy, Z, levels=20, cmap="coolwarm", alpha=0.4)
    ct0 = ax1.contour(xx, yy, Z, levels=[0], colors="yellow", linewidths=2.5)
    ct_m = ax1.contour(
        xx, yy, Z, levels=[-1, 1], colors="yellow", linewidths=1.5, linestyles="dashed"
    )

    # scatter
    ax1.scatter(
        X[:, 0][y == 0],
        X[:, 1][y == 0],
        c="blue",
        s=40,
        edgecolors="k",
        linewidths=0.5,
        label="Inner ring",
    )
    ax1.scatter(
        X[:, 0][y == 1],
        X[:, 1][y == 1],
        c="red",
        s=40,
        edgecolors="k",
        linewidths=0.5,
        label="Outer ring",
    )

    # support vectors
    sv = model.support_vectors_
    ax1.scatter(
        sv[:, 0],
        sv[:, 1],
        s=120,
        facecolors="none",
        edgecolors="cyan",
        linewidths=2,
        label="Support vectors",
    )

    ax1.set_xlim(-3, 3)
    ax1.set_ylim(-3, 3)
    ax1.set_title("2‑D Decision Boundary  (RBF kernel)", fontsize=13)
    ax1.set_xlabel("x")
    ax1.set_ylabel("y")
    ax1.legend(fontsize=8, loc="upper right")
    ax1.set_aspect("equal")

    # ── Plot 2: 3‑D ─────────────────────────────────────────────
    ax2 = fig.add_subplot(1, 2, 2, projection="3d")

    surf = ax2.plot_surface(
        xx,
        yy,
        Z,
        cmap="coolwarm",
        alpha=0.65,
        linewidth=0,
        antialiased=True,
    )
    ax2.contour(xx, yy, Z, levels=[0], colors="yellow", linewidths=2, zdir="z", offset=Z.min() - 0.5)

    # scatter points at height = decision score
    z_points = model.decision_function(X)
    ax2.scatter(
        X[:, 0][y == 0],
        X[:, 1][y == 0],
        z_points[y == 0],
        c="blue",
        s=30,
        edgecolors="k",
        linewidths=0.3,
        label="Inner ring",
    )
    ax2.scatter(
        X[:, 0][y == 1],
        X[:, 1][y == 1],
        z_points[y == 1],
        c="red",
        s=30,
        edgecolors="k",
        linewidths=0.3,
        label="Outer ring",
    )
    ax2.scatter(
        sv[:, 0],
        sv[:, 1],
        model.decision_function(sv),
        s=100,
        facecolors="none",
        edgecolors="cyan",
        linewidths=2,
        label="Support vectors",
    )

    ax2.set_xlim(-3, 3)
    ax2.set_ylim(-3, 3)
    ax2.set_title(
        "3‑D Decision Landscape  $f(x, y)$", fontsize=13
    )
    ax2.set_xlabel("x")
    ax2.set_ylabel("y")
    ax2.set_zlabel("f(x, y)")
    ax2.legend(fontsize=8, loc="upper right")

    plt.tight_layout()

    # ── educational note ────────────────────────────────────────
    print("=" * 64)
    print("EDUCATIONAL NOTE")
    print("=" * 64)
    print(
        "The 3‑D surface above shows the *decision function* f(x, y) of the"
    )
    print(
        "RBF‑kernel SVM.  The RBF kernel maps data into an infinite‑"
    )
    print(
        "dimensional space that we cannot directly visualise."
    )
    print(
        "What you see here is the landscape of f(x, y) — the score the"
    )
    print(
        "SVM assigns to every point in the input plane.  Points with"
    )
    print(
        "f > 0 are classified as class 1, f < 0 as class 0, and"
    )
    print(
        "f = 0 is the decision boundary."
    )
    print(
        "\nIn contrast, the phase‑1 Manim animation uses z = x² + y² as a"
    )
    print(
        "simple DIDACTIC mapping to teach the geometric intuition behind"
    )
    print(
        "the kernel trick — NOT the actual RBF feature space."
    )
    print("=" * 64)
    print(f"\nTraining accuracy: {model.score(X, y):.3f}")
    print(f"Number of support vectors: {len(sv)}")

    plt.show()


if __name__ == "__main__":
    main()
