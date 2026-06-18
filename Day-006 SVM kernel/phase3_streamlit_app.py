"""phase3_streamlit_app.py
================================================
Interactive Streamlit + Plotly demo for the SVM kernel trick.

Run:  streamlit run phase3_streamlit_app.py
"""

import streamlit as st
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots

import sys, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.data_generator import generate_ring_dataset
from utils.svm_utils import train_svm, make_decision_grid, compute_decision_surface

# ── page config ──────────────────────────────────────────────────
st.set_page_config(
    page_title="SVM Kernel Trick 3D Demo",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── sidebar controls ─────────────────────────────────────────────
st.sidebar.title("Controls")

kernel = st.sidebar.selectbox(
    "Kernel",
    options=["rbf", "linear", "poly", "sigmoid"],
    index=0,
)

C = st.sidebar.slider("C (regularisation)", 0.1, 100.0, 10.0, step=0.1)

gamma = None
if kernel in ("rbf", "poly", "sigmoid"):
    gamma = st.sidebar.slider("gamma", 0.01, 10.0, 1.0, step=0.01)

degree = None
if kernel == "poly":
    degree = st.sidebar.slider("degree", 2, 6, 3, step=1)

noise = st.sidebar.slider("noise", 0.00, 0.50, 0.08, step=0.01)
n_points = st.sidebar.slider("number of points", 40, 300, 120, step=10)
random_seed = st.sidebar.number_input("random seed", value=7, step=1)

# ── cached helpers ───────────────────────────────────────────────
@st.cache_data
def cached_generate(n_inner, n_outer, noise_val, seed):
    X, y = generate_ring_dataset(
        n_inner=n_inner,
        n_outer=n_outer,
        noise=noise_val,
        random_seed=int(seed),
    )
    return X, y


@st.cache_data
def cached_train(X, y, kernel, C, gamma, degree):
    m = train_svm(X, y, kernel=kernel, C=C, gamma=gamma, degree=degree)
    return m


@st.cache_data
def cached_grid(x_range, y_range, resolution):
    return make_decision_grid(x_range, y_range, resolution)


@st.cache_data
def cached_surface(_model, grid_points):
    return compute_decision_surface(_model, grid_points)


# ── generate data ────────────────────────────────────────────────
n_inner = int(n_points * 0.44)
n_outer = n_points - n_inner

X, y = cached_generate(n_inner, n_outer, noise, random_seed)
model = cached_train(X, y, kernel, C, gamma, degree)
xx, yy, grid_points = cached_grid((-3, 3), (-3, 3), 80)
Z = cached_surface(model, grid_points)

z_train = model.decision_function(X)

# ── title ────────────────────────────────────────────────────────
st.title("Interactive SVM Kernel Trick 3D Demo")
st.markdown(
    """
Explore how different SVM kernels separate non‑linear data.
The concentric‑rings dataset is **not** linearly separable in 2‑D,
but the RBF kernel maps it to a high‑dimensional space where it
*is* separable.
"""
)

# ── section 1: concept ──────────────────────────────────────────
with st.expander("Concept Summary — The Kernel Trick", expanded=False):
    st.markdown(
        """
### Why kernels?

Many real‑world datasets (like concentric rings) cannot be separated
by a straight line.  SVMs solve this by:

1. **Mapping** data to a higher‑dimensional *feature space* via a
   transformation $\\phi(\\mathbf{x})$.
2. **Finding** a linear separating hyperplane in that space.
3. Using a **kernel function** $K(\\mathbf{x}_i, \\mathbf{x}_j) =
   \\langle \\phi(\\mathbf{x}_i), \\phi(\\mathbf{x}_j)\\rangle$ to
   compute inner products *without ever constructing* the high‑
   dimensional coordinates explicitly.

| Kernel | Formula | Behaviour |
|--------|---------|-----------|
| Linear | $K = \\mathbf{x}_i^T \\mathbf{x}_j$ | Straight line — will *fail* on rings |
| RBF | $K = \\exp(-\\gamma \\|\\mathbf{x}_i - \\mathbf{x}_j\\|^2)$ | Infinite‑dimensional mapping, smooth curves |
| Poly | $K = (\\gamma \\mathbf{x}_i^T \\mathbf{x}_j + 1)^d$ | Polynomial boundary of degree $d$ |
| Sigmoid | $K = \\tanh(\\gamma \\mathbf{x}_i^T \\mathbf{x}_j)$ | Neural‑net‑like activation |
"""
    )

# ── section 2: 2‑D plot ─────────────────────────────────────────
st.subheader("2‑D Decision Boundary")

fig2d = go.Figure()

# contour fill
fig2d.add_trace(
    go.Contour(
        z=Z,
        x=np.linspace(-3, 3, 80),
        y=np.linspace(-3, 3, 80),
        colorscale="RdBu",
        contours=dict(start=-3, end=3, size=0.3),
        colorbar=dict(title="f(x,y)", thickness=15, x=0.47),
        opacity=0.55,
        name="Decision scores",
        showscale=True,
    )
)

# contour lines: 0, ±1
for lvl, dash_style, width_val in [(0, "solid", 3), (-1, "dash", 1.5), (1, "dash", 1.5)]:
    trace = go.Contour(
        z=Z,
        x=np.linspace(-3, 3, 80),
        y=np.linspace(-3, 3, 80),
        contours=dict(type="constraint", operation="=", value=lvl),
        line=dict(color="yellow", width=width_val, dash=dash_style),
        showscale=False,
        name=f"f={lvl}",
        hoverinfo="none",
    )
    fig2d.add_trace(trace)

# scatter data
fig2d.add_trace(
    go.Scatter(
        x=X[y == 0, 0],
        y=X[y == 0, 1],
        mode="markers",
        marker=dict(color="blue", size=8, line=dict(color="black", width=0.5)),
        name="Inner ring",
    )
)
fig2d.add_trace(
    go.Scatter(
        x=X[y == 1, 0],
        y=X[y == 1, 1],
        mode="markers",
        marker=dict(color="red", size=8, line=dict(color="black", width=0.5)),
        name="Outer ring",
    )
)

# support vectors
sv = model.support_vectors_
fig2d.add_trace(
    go.Scatter(
        x=sv[:, 0],
        y=sv[:, 1],
        mode="markers",
        marker=dict(
            size=14,
            color="rgba(0,0,0,0)",
            line=dict(color="cyan", width=2.5),
        ),
        name="Support vectors",
    )
)

fig2d.update_layout(
    xaxis_title="x",
    yaxis_title="y",
    xaxis=dict(range=[-3, 3], constrain="domain"),
    yaxis=dict(range=[-3, 3], scaleanchor="x", scaleratio=1),
    width=600,
    height=550,
    margin=dict(l=20, r=20, t=30, b=20),
    legend=dict(x=0.01, y=0.99, bgcolor="rgba(255,255,255,0.7)"),
)
st.plotly_chart(fig2d, use_container_width=True)

# ── section 3: 3‑D surface ──────────────────────────────────────
st.subheader("3‑D Decision Landscape  $f(x, y)$")

fig3d = go.Figure()

fig3d.add_trace(
    go.Surface(
        z=Z,
        x=np.linspace(-3, 3, 80),
        y=np.linspace(-3, 3, 80),
        colorscale="RdBu",
        opacity=0.8,
        name="f(x,y)",
        colorbar=dict(title="f(x,y)", thickness=15),
        contours=dict(
            z=dict(show=True, usecolormap=False, project=dict(z=True), color="yellow", width=2, highlightcolor="limegreen")
        ),
    )
)

# flat reference grid at z = 0
ref_z = np.zeros_like(Z)
fig3d.add_trace(
    go.Surface(
        z=ref_z,
        x=np.linspace(-3, 3, 80),
        y=np.linspace(-3, 3, 80),
        colorscale=[[0, "gray"], [1, "gray"]],
        opacity=0.12,
        name="z = 0 plane",
        showscale=False,
        hoverinfo="none",
    )
)

# training points at height = decision score
fig3d.add_trace(
    go.Scatter3d(
        x=X[y == 0, 0],
        y=X[y == 0, 1],
        z=z_train[y == 0],
        mode="markers",
        marker=dict(color="blue", size=4, line=dict(color="black", width=0.3)),
        name="Inner ring",
    )
)
fig3d.add_trace(
    go.Scatter3d(
        x=X[y == 1, 0],
        y=X[y == 1, 1],
        z=z_train[y == 1],
        mode="markers",
        marker=dict(color="red", size=4, line=dict(color="black", width=0.3)),
        name="Outer ring",
    )
)

# support vectors
z_sv = model.decision_function(sv)
fig3d.add_trace(
    go.Scatter3d(
        x=sv[:, 0],
        y=sv[:, 1],
        z=z_sv,
        mode="markers",
        marker=dict(
            size=8,
            color="rgba(0,0,0,0)",
            line=dict(color="cyan", width=2.5),
        ),
        name="Support vectors",
    )
)

fig3d.update_layout(
    scene=dict(
        xaxis_title="x",
        yaxis_title="y",
        zaxis_title="f(x, y)",
        xaxis=dict(range=[-3, 3]),
        yaxis=dict(range=[-3, 3]),
        aspectmode="cube",
    ),
    width=700,
    height=600,
    margin=dict(l=0, r=0, t=30, b=0),
    legend=dict(x=0.01, y=0.99, bgcolor="rgba(255,255,255,0.7)"),
)
st.plotly_chart(fig3d, use_container_width=True)

# ── section 4: metrics ──────────────────────────────────────────
st.subheader("Performance Metrics")

col1, col2, col3 = st.columns(3)
acc = model.score(X, y)
n_sv = len(sv)
col1.metric("Training Accuracy", f"{acc:.3f}")
col2.metric("Total Support Vectors", n_sv)
col3.metric("Number of Training Points", n_points)

# ── section 5: dynamic teaching notes ───────────────────────────
st.subheader("Dynamic Teaching Notes")

notes = []

if kernel == "linear":
    notes.append(
        "**Linear kernel**: As expected, the linear kernel draws a straight line and "
        "cannot separate the concentric rings. Accuracy will be near 50%."
    )
if kernel == "rbf":
    notes.append(
        "**RBF kernel**: The radial basis function is a universal approximator. "
        "It maps implicitly to an *infinite‑dimensional* space, producing smooth, "
        "flexible decision boundaries."
    )
if kernel == "poly":
    notes.append(
        f"**Polynomial kernel (degree {degree})**: Creates a polynomial decision "
        "boundary. Higher degrees yield more complex shapes but may overfit."
    )
if kernel == "sigmoid":
    notes.append(
        "**Sigmoid kernel**: Behaves like a two‑layer neural network. "
        "It can struggle on ring‑shaped data."
    )

if gamma is not None and gamma > 3.0:
    notes.append(
        f"⚠️ **High gamma ({gamma:.2f})**: The model focuses on very local "
        "patterns — risk of **overfitting**. Watch for jagged, island‑like "
        "decision boundaries."
    )
if gamma is not None and gamma < 0.1:
    notes.append(
        f"🔹 **Low gamma ({gamma:.2f})**: The influence of each point spans far — "
        "the boundary becomes smoother but may **underfit**."
    )

if C < 1.0:
    notes.append(
        f"🔹 **C < 1 ({C:.2f})**: Soft margin is dominant. The model tolerates "
        "more misclassification for a wider margin. Useful when data is noisy."
    )
if C > 50.0:
    notes.append(
        f"⚠️ **Very high C ({C:.2f})**: Hard margin behaviour. The model tries "
        "to classify every training point correctly — may overfit to noise."
    )

if noise > 0.25:
    notes.append(
        f"🔹 **High noise ({noise:.2f})**: With substantial overlap between classes, "
        "expect more support vectors and a potentially simpler boundary."
    )

if n_sv > n_points * 0.6:
    notes.append(
        f"⚠️ **High support vector ratio ({n_sv}/{n_points})**: Suggests the model "
        "is memorising rather than generalising. Try adjusting C or gamma."
    )

if not notes:
    notes.append("Adjust the sidebar controls to see dynamic teaching notes here.")

for note in notes:
    st.markdown(f"- {note}")

# ── footer ───────────────────────────────────────────────────────
st.markdown("---")
st.caption(
    "Educational demo — part of the SVM Kernel Trick 3D Interactive project.  "
    "See the README for more details on the geometric intuition vs. the real RBF feature space."
)
