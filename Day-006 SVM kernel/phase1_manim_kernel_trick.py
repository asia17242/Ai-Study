"""phase1_manim_kernel_trick.py
==================================================
3‑D Manim animation demonstrating the kernel trick.

Run (low quality):   manim -pql phase1_manim_kernel_trick.py SVMKernelTrick3D
Run (high quality):  manim -pqh phase1_manim_kernel_trick.py SVMKernelTrick3D
"""

from manim import *
import numpy as np

# Make local utils importable when running from the repo root.
import sys, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.data_generator import generate_ring_dataset


class SVMKernelTrick3D(ThreeDScene):
    def construct(self):
        # ── camera & axes ───────────────────────────────────────
        self.set_camera_orientation(phi=65 * DEGREES, theta=-45 * DEGREES)
        axes = ThreeDAxes(
            x_range=(-3, 3, 1),
            y_range=(-3, 3, 1),
            z_range=(-0.5, 7, 1),
            x_length=7,
            y_length=7,
            z_length=5,
        )
        self.add(axes)
        axis_labels = axes.get_axis_labels(
            Text("x", font_size=24), Text("y", font_size=24), Text("z", font_size=24)
        )
        self.add(axis_labels)

        # ── generate dataset ─────────────────────────────────────
        X, y = generate_ring_dataset(n_inner=20, n_outer=30, noise=0.08, random_seed=7)

        # ── 1. Title card ────────────────────────────────────────
        title = Text(
            "SVM Kernel Trick: From 2D to 3D",
            font_size=36,
            color=YELLOW,
            weight=BOLD,
        )
        subtitle = Text(
            "Nonlinear in 2D, linear in feature space.",
            font_size=22,
            color=GRAY,
        )
        title_group = VGroup(title, subtitle).arrange(DOWN, buff=0.3)
        title_group.to_corner(UL)
        title_group.fix_in_frame = True
        self.add_fixed_in_frame_mobjects(title_group)
        self.wait(2)

        # ── 2. Show data at Z = 0 ────────────────────────────────
        dots_3d = VGroup()
        for xi, yi, label in zip(X[:, 0], X[:, 1], y):
            color = BLUE if label == 0 else RED
            dot = Dot3D(point=[xi, yi, 0], color=color, radius=0.08)
            dots_3d.add(dot)

        self.play(FadeIn(dots_3d, shift=IN * 0.2), run_time=1.5)

        text_2d = Text(
            "No straight line can separate them in 2D.",
            font_size=24,
            color=WHITE,
        )
        text_2d.to_edge(DOWN)
        text_2d.fix_in_frame = True
        self.add_fixed_in_frame_mobjects(text_2d)
        self.wait(2)

        # ── 3. Kernel formula ────────────────────────────────────
        formula = Text(
            "phi(x, y) = (x, y, x^2 + y^2)",
            font_size=32,
            color=YELLOW,
        )
        formula.to_corner(UR)
        formula.fix_in_frame = True
        self.add_fixed_in_frame_mobjects(formula)
        self.play(Write(formula), run_time=1.5)
        self.wait(1.5)

        # ── 4. Lift points ───────────────────────────────────────
        self.remove(text_2d)
        new_text = Text(
            "Lifting to 3D — now it becomes linearly separable!",
            font_size=24,
            color=GREEN,
        )
        new_text.to_edge(DOWN)
        new_text.fix_in_frame = True
        self.add_fixed_in_frame_mobjects(new_text)

        animations = []
        for dot in dots_3d:
            x_pos, y_pos, _ = dot.get_center()
            z_new = x_pos**2 + y_pos**2
            animations.append(dot.animate.move_to([x_pos, y_pos, z_new]))
        self.play(AnimationGroup(*animations, lag_ratio=0.01), run_time=3)
        self.wait(1)

        # ── 5. Paraboloid surface ────────────────────────────────
        paraboloid = Surface(
            lambda u, v: np.array([u, v, u**2 + v**2]),
            u_range=(-3, 3),
            v_range=(-3, 3),
            fill_color=YELLOW,
            fill_opacity=0.22,
            stroke_width=0.5,
            checkerboard_colors=[YELLOW, GOLD],
        )
        self.play(FadeIn(paraboloid), run_time=2)
        self.wait(1)

        # ── 6. Hyperplane slice ──────────────────────────────────
        c_val = 2.0
        hyperplane = Surface(
            lambda u, v: np.array([u, v, c_val]),
            u_range=(-3, 3),
            v_range=(-3, 3),
            fill_color=BLUE,
            fill_opacity=0.35,
            stroke_width=1,
            stroke_color=WHITE,
            checkerboard_colors=[BLUE, TEAL],
        )
        hp_label = Text(
            "Hyperplane in feature space  (z = 2.0)",
            font_size=20,
            color=BLUE,
        )
        hp_label.next_to(hyperplane, OUT, buff=0.5)
        hp_label.rotate(PI / 2, axis=RIGHT)
        hp_label.fix_in_frame = False
        self.play(FadeIn(hyperplane), FadeIn(hp_label), run_time=2)
        self.wait(2)

        # ── 7. Project circle back to Z = 0 ─────────────────────
        circle_text = Text(
            "z = c  =>  x^2 + y^2 = c", font_size=36, color=YELLOW
        )
        circle_text.to_edge(DOWN)
        circle_text.fix_in_frame = True
        self.remove(new_text)
        self.add_fixed_in_frame_mobjects(circle_text)
        self.play(Write(circle_text), run_time=1.5)

        # Draw circle at z = 0
        circle = Circle(
            radius=np.sqrt(c_val),
            color=YELLOW,
            stroke_width=4,
        )
        circle.move_to([0, 0, 0])
        circle.rotate(PI / 2, axis=RIGHT)
        self.play(Create(circle), run_time=2)
        self.wait(1.5)

        # ── 8. Rotate camera ─────────────────────────────────────
        self.remove(circle_text)
        rot_text = Text(
            "Observe the 3D separation!",
            font_size=24,
            color=WHITE,
        )
        rot_text.to_edge(DOWN)
        rot_text.fix_in_frame = True
        self.add_fixed_in_frame_mobjects(rot_text)
        self.begin_ambient_camera_rotation(rate=0.18)
        self.wait(4)
        self.stop_ambient_camera_rotation()
        self.wait(1)

        # ── 9. Summary ───────────────────────────────────────────
        self.remove(rot_text)
        summary = VGroup(
            Text("Kernel Trick Core Idea", font_size=30, color=YELLOW, weight=BOLD),
            Text(
                "Map data to a higher-dimensional space where it is linearly separable.",
                font_size=20,
                color=WHITE,
            ),
            Text(
                "The kernel function computes inner products without ever computing coordinates.",
                font_size=18,
                color=GRAY,
            ),
        ).arrange(DOWN, buff=0.3)
        summary.to_edge(DOWN)
        summary.fix_in_frame = True
        self.add_fixed_in_frame_mobjects(summary)
        self.play(FadeIn(summary), run_time=2)
        self.wait(3)
