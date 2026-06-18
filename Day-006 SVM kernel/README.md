# SVM Kernel Trick — 3D Interactive Demo

A three‑phase educational project that **visually** explains the kernel trick,
the core idea that makes Support Vector Machines so powerful.

---

## Target Audience

- **Students** in machine learning / data science courses who hear "kernel trick"
  but have never *seen* it.
- **Educators** looking for a ready‑to‑run classroom demo with interactive controls.
- **Self‑learners** who want to go beyond equations and build geometric intuition.

---

## Educational Story Architecture

The project is delivered in **three phases** that progressively deepen understanding:

| Phase | Tool | What you experience |
|-------|------|---------------------|
| **1** | Manim (animation) | A 3‑D cinematic story: data starts on a flat plane, lifts into a paraboloid, a hyperplane separates it, and the projection reveals a circle — the kernel trick in pure geometry. |
| **2** | Matplotlib (static) | A precise, static visualisation of a *real* RBF‑SVM trained on the same dataset. Shows the 2‑D decision contours **and** the 3‑D decision landscape $f(x,y)$. |
| **3** | Streamlit + Plotly | A fully **interactive** web dashboard. Change kernels, $C$, $\gamma$, noise, and immediately see how the boundary and surface react. |

---

## Installation

```bash
pip install -r requirements.txt
```

The dependencies are: `manim`, `numpy`, `scikit-learn`, `matplotlib`, `streamlit`, `plotly`, and `pandas`.

> **Note for Manim**: If you encounter issues with Manim rendering, ensure you have
> a working LaTeX distribution (for `MathTex`) or set `tex_template` appropriately.

---

## Execution Commands

### Phase 1 — 3‑D Manim Animation

```bash
# Low quality (fast preview):
manim -pql phase1_manim_kernel_trick.py SVMKernelTrick3D

# High quality (final render):
manim -pqh phase1_manim_kernel_trick.py SVMKernelTrick3D
```

### Phase 2 — Static Matplotlib Visualisation

```bash
python phase2_rbf_decision_surface.py
```

This opens a two‑panel figure (2‑D contours + 3‑D decision surface) and prints an
educational note to the terminal.

### Phase 3 — Interactive Streamlit Dashboard

```bash
streamlit run phase3_streamlit_app.py
```

Then open [http://localhost:8501](http://localhost:8501) in your browser.

---

## Important Mathematical Note

The **Phase 1 animation** uses the mapping

$$\phi(x, y) = (x,\; y,\; x^2 + y^2)$$

This is a **didactic simplification** designed to teach the geometric intuition
behind the kernel trick — *not* the actual RBF feature space.

The **real RBF kernel**,

$$K(\mathbf{x}_i, \mathbf{x}_j) = \exp\bigl(-\gamma\,\|\mathbf{x}_i - \mathbf{x}_j\|^2\bigr),$$

maps data into an **infinite‑dimensional** Hilbert space. We cannot visualise that
space directly.

What **Phase 2** and **Phase 3** show is the **decision function** $f(x,y)$ —
the numerical score the SVM assigns to every point in the 2‑D plane. Points with
$f > 0$ are classified as class 1, $f < 0$ as class 0, and the set $\{f = 0\}$
is the decision boundary. Plotting $z = f(x,y)$ gives a 3‑D landscape that
*reveals* the effect of the kernel without needing to construct the implicit
feature space.

---

## Teaching Suggestions

1. **Start with Phase 1** — play the Manim animation in class to hook students
   with the "aha!" moment of seeing 2‑D become 3‑D.
2. **Follow with Phase 2** — discuss the printout that explains the difference
   between the didactic $x^2+y^2$ mapping and the real RBF kernel.
3. **Let students drive Phase 3** — give them 15 minutes to toggle kernels,
   slide $C$ and $\gamma$, and answer guided questions:
   - "What happens to the boundary when $\gamma$ gets very large?"
   - "Why does the linear kernel (almost) fail on this dataset?"
   - "How many support vectors do you see when $C$ is small? Why?"
4. **Assessment idea** — ask students to explain in their own words why the RBF
   kernel works on concentric circles but the linear kernel does not, referencing
   the visualisations.

---

## Repository Structure

```
.
├── requirements.txt                  # Python dependencies
├── utils/
│   ├── __init__.py
│   ├── data_generator.py            # Concentric‑ring dataset generator
│   └── svm_utils.py                 # SVM training & grid helpers
├── phase1_manim_kernel_trick.py     # 3‑D Manim animation
├── phase2_rbf_decision_surface.py   # Static Matplotlib 2‑D & 3‑D visualisation
├── phase3_streamlit_app.py          # Interactive Streamlit dashboard
└── README.md                        # This file
```
