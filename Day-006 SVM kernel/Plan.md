You are an expert AI software engineer and machine learning educator. Implement the following complete repository for an educational project titled "SVM Kernel Trick 3D Interactive Demo". 

Strictly follow the project structure, design constraints, and mathematical accuracy specified below. Do not shorten, stub, or placeholder any code. All files must be fully implemented, executable, and independently runnable.

### 📁 REPOSITORY STRUCTURE TO CREATE
Create the following files in the workspace:
1. `requirements.txt`
2. `utils/data_generator.py`
3. `utils/svm_utils.py`
4. `phase1_manim_kernel_trick.py`
5. `phase2_rbf_decision_surface.py`
6. `phase3_streamlit_app.py`
7. `README.md`

---

### 1. FILE: `requirements.txt`
Write exactly these dependencies:
manim
numpy
scikit-learn
matplotlib
streamlit
plotly
pandas

---

### 2. FILE: `utils/data_generator.py`
Implement a data generator for the concentric rings dataset.
- Function name: `generate_ring_dataset(n_inner=35, n_outer=45, inner_radius_range=(0.0, 1.0), outer_radius_range=(1.6, 2.5), noise=0.08, random_seed=7)`
- Use numpy to sample polar coordinates (r, theta) uniformly within the given ranges, convert to Cartesian (X, y), and inject Gaussian noise into the coordinates.
- Return `X` (shape: [N, 2]) and `y` (binary labels: 0 for inner, 1 for outer).

---

### 3. FILE: `utils/svm_utils.py`
Implement core scikit-learn helper functions.
- `train_svm(X, y, kernel='rbf', C=10.0, gamma=1.0, degree=3)`: Returns a fitted `sklearn.svm.SVC` model. Ensure `probability=True` is NOT strictly required but model handles the parameters correctly.
- `make_decision_grid(x_range=(-3, 3), y_range=(-3, 3), resolution=80)`: Returns `xx`, `yy` (from np.meshgrid) and `grid_points` (np.c_[xx.ravel(), yy.ravel()]).
- `compute_decision_surface(model, grid_points)`: Evaluates `model.decision_function(grid_points)` and reshapes it to match the grid shape.

---

### 4. FILE: `phase1_manim_kernel_trick.py`
Create a 3D Manim animation class named `SVMKernelTrick3D` inheriting from `ThreeDScene`.
- **Visuals:** Dark background. Inner points = BLUE, Outer points = RED, Separation Plane/Boundary = YELLOW.
- **Scene Setup:** Set initial camera to `phi=65 * DEGREES`, `theta=-45 * DEGREES`. Show 3D labeled axes.
- **Sequence:**
  1. Title Card: "SVM Kernel Trick: From 2D to 3D" with subtitle "Nonlinear in 2D, linear in feature space."
  2. Show dataset from `utils.data_generator` positioned at Z=0. Display Text: "No straight line can separate them in 2D."
  3. Show MathTex formula: "\phi(x, y) = (x, y, x^2 + y^2)".
  4. Lift points smoothly: animate translation of each dot from `(x, y, 0)` to `(x, y, x^2 + y^2)`. Blue points stay low; red points move higher.
  5. Add translucent Paraboloid `Surface` ($z = x^2 + y^2$) with opacity 0.22.
  6. Insert horizontal `Surface` slice at $z = c$ (e.g., $z=1.8$) representing the Hyperplane with opacity 0.35. Label it: "Hyperplane in feature space".
  7. Show text/math reduction: $z = c \implies x^2 + y^2 = c$. Project a 2D circle back down to Z=0.
  8. Rotate camera via `begin_3d_glass_rotation(rate=0.18)` for a short period to emphasize 3D separation.
  9. Show final summary text fixed to frame.

---

### 5. FILE: `phase2_rbf_decision_surface.py`
Create a standalone Matplotlib 3D script that demonstrates real RBF SVM behavior.
- Generate data using `utils.data_generator` (noise=0.08). Train `SVC(kernel='rbf', C=10, gamma=1)`.
- Plot 1 (2D Frame): Scatter points. Plot contour lines for `decision_function = 0` (bold yellow) and `decision_function = [-1, 1]` (dashed margins). Circle support vectors with a larger transparent ring marker.
- Plot 2 (3D Frame): Plot $z = f(x, y)$ using `plot_surface` where $f$ is the decision score. Scatter training points directly on the surface at height $z = f(x, y)$. Highlight support vectors.
- Include an educational print statement or text explaining that the RBF kernel maps to an infinite-dimensional space, and this 3D plot visualizes the **decision boundary evaluation function**, NOT the explicit feature mapping space itself.

---

### 6. FILE: `phase3_streamlit_app.py`
Build a highly interactive web application using Streamlit and Plotly.
- **Sidebar Controls:** - `kernel` (selectbox: rbf, linear, poly, sigmoid; default=rbf).
  - `C` (slider: 0.1 to 100.0, default=10.0).
  - `gamma` (slider: 0.01 to 10.0, default=1.0, only visible if kernel in [rbf, poly, sigmoid]).
  - `degree` (slider: 2 to 6, default=3, only visible if kernel == poly).
  - `noise` (slider: 0.00 to 0.50, default=0.08).
  - `number_of_points` (slider: 40 to 300, default=120).
  - `random_seed` (number_input, default=7).
- **Caching:** Wrap data generation and training with `@st.cache_data`. Use a grid resolution of 80 (max 150) for fast UI rendering.
- **Main Layout:**
  - Title: "Interactive SVM Kernel Trick 3D Demo".
  - Section 1: Concept summary explaining non-linear boundaries.
  - Section 2 (2D Boundary Plotly Chart): Render scatter data + contour lines ($f(x,y) = 0, \pm 1$) + support vector markers.
  - Section 3 (3D Surface Plotly Chart): Interactive `go.Surface` showing $z = decision\_function(x, y)$. Overlay `go.Scatter3d` for points at $z = f(x, y)$. Add a flat reference grid surface at $z = 0$.
  - Section 4 (Metrics): Show Training Accuracy, Total Support Vector Count.
  - Section 5 (Dynamic Teaching Notes): Append conditional insights based on values of gamma and C (e.g., if gamma > 3 display overfitting warning; if C < 1 display soft margin behavior explanation).

---

### 7. FILE: `README.md`
Write a polished, clear markdown file with these sections:
- Project Overview & Target Audience
- Educational Story Architecture
- Installation Guidelines (`pip install -r requirements.txt`)
- Execution Commands for Phase 1 (Low & High quality), Phase 2, and Phase 3.
- **Important Mathematical Note:** Explicitly state that $z = x^2 + y^2$ is for 3D geometric concept teaching intuition, while real RBF operates in an infinite-dimensional space visualized via the decision landscape $f(x,y)$.
- Teaching Suggestions for classrooms.

Proceed to generate all file implementations sequentially. Make the code highly readable, robust, and clean.