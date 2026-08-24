# 03 -- Guided exercises (DCC process **D1**)

**SEA-FORWARD** OceanPrediction-A toolkit

Scaffolded exercises for Step 5.2 of the operational workflow, owned by Python
Dev 1/2 under the Visualisation Notebook component (process **D1**). Each
exercise takes you from raw CROCO output to a physically meaningful
coastal-ocean diagnostic, using only building blocks already in
`sftools.postprocess`.

| Exercise | Concept | Relevance |
|---|---|---|
| 1 | Upwelling index (Bakun-style Ekman transport) | The cold-SST signal validated visually in `02_validation.ipynb` |
| 2 | Mixed-layer depth (temperature-threshold) | Standard ocean-forecasting diagnostic (ETOOFS Guide, IOC-UNESCO GOOS-275) |
| 3 | Coastal jet analysis | Cross-shore velocity section, jet core speed/depth |
| 4 | Eddy detection | Closed-contour identification on SSH |

**How to use this notebook.** Each exercise's main code cell has a working
reference implementation *with the key physics lines commented, next to a
`# TODO` explaining what that line does* -- read the TODO, then look at the
line right below it. A short **Self-check** cell follows, with `assert`
statements confirming the result is physically sensible (right sign, right
order of magnitude) -- if you modify the exercise (different point, different
threshold, your own region), re-run the self-check to catch mistakes early.

*Why not blank-out the lines outright?* This shipped notebook must execute
end-to-end without errors from a fresh kernel restart (QA requirement,
Testing and Validation Plan Section 9.1) -- a literal fill-in-the-blank
version would fail that by construction. If your course/workshop wants a
truly blanked student handout, generate one from this notebook by deleting
the marked answer lines; this version is the instructor/reference copy.

*Language note (FR-09):* markdown and docstrings are in English; French
translation is coordinated separately with the documentation team.

## Exercise 1 -- Upwelling index (Bakun-style Ekman transport)

Coastal upwelling occurs when alongshore wind drives an offshore Ekman
transport, pulling cold, nutrient-rich subsurface water to the surface. The
classic **Bakun upwelling index** quantifies this from the wind alone:

Qx = (rho_air * Cd * &#124;W&#124; * W_alongshore) / (rho_water * f)

where `W_alongshore` is the wind component *parallel to the coastline*
(rotate the wind vector by the coastline orientation angle), `f` is the
Coriolis parameter, and `Qx` is the cross-shore Ekman transport (m^2/s per
unit coastline). A positive `Qx` means upwelling-favourable wind.

**TODO(1a):** rotate the wind vector into along-/cross-shore components.
**TODO(1b):** compute the Bakun transport.

In demo mode, the wind field is a synthetic due-south wind (`_demo_data.
make_synthetic_wind`) -- with a real ERA5 `for_croco` archive, use
`sftools.validation._load_wind(ERA5_DIR, date)` instead, and set
`COAST_ANGLE_DEG` to your region's actual coastline orientation, e.g. from
`docs/07_regions.md` or a `grid_bathy_map` plot.

## Exercise 2 -- Mixed-layer depth (temperature-threshold criterion)

The mixed-layer depth (MLD) is the depth at which temperature departs from
its near-surface value by more than a fixed threshold (de Boyer Montegut et
al., 2004 use delta-T = 0.2 degC from a 10 m reference depth) -- one of the
core ocean-forecasting diagnostics listed in FR-08 and the ETOOFS Guide.

**TODO(2a):** extract the temperature profile with `pp.profile`.
**TODO(2b):** find the shallowest depth where &#124;T - T_ref&#124; exceeds the threshold.

## Exercise 3 -- Coastal jet analysis

Eastern-boundary and equatorial upwelling systems typically develop a
narrow, intense alongshore current (the "coastal jet") a short distance
offshore and below the surface. We extract a cross-shore vertical section
of current speed and locate the jet core (depth and magnitude of the speed
maximum) using `pp.section`.

**TODO(3a):** build the cross-shore section with `pp.section`.
**TODO(3b):** locate the jet core (max speed, and its depth).

## Exercise 4 -- Eddy detection (closed-contour method)

Mesoscale eddies show up as closed contours of sea-surface height (SSH)
anomaly: anticyclonic (warm-core) eddies as SSH highs, cyclonic (cold-core)
eddies as SSH lows (Chelton et al., 2011). The production pipeline
(`validation/animate.py`, `animate_ssh_eddies`) uses py-eddy-tracker's full
amplitude/shape-error algorithm; here you implement a simplified version
yourself with `scipy.ndimage`, to understand what "closed-contour
detection" actually means before trusting the library version.

**TODO(4a):** compute the SSH anomaly (remove the domain mean).
**TODO(4b):** find local extrema with `maximum_filter`/`minimum_filter`.

### Wrap-up

You have derived four standard coastal-ocean diagnostics directly from
CROCO output: an upwelling index from wind alone, a mixed-layer depth from
a temperature profile, a coastal-jet core from a velocity section, and
candidate eddy centres from SSH extrema.

Continue to **`04_sensitivity.ipynb`** to see how the upwelling index you
just computed responds when the wind forcing itself is perturbed (Step 5.3, U2 -> C1 -> D1).

## Where To Run The Full Workflow

Run the executable notebook for full code, plots, and self-checks:

<div style="display:flex; gap:10px; flex-wrap:wrap; margin:10px 0 14px 0;">
	<a href="https://github.com/Njiecheu/sea-forward/blob/main/docs/notebooks/03_exercises.ipynb" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:8px; background:linear-gradient(to top, #ccfff4 0%, #389bf2 100%); color:#ffffff; text-decoration:none; font-weight:600;">
		<img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/box-arrow-up-right.svg" alt="" aria-hidden="true" style="width:16px; height:16px; filter:invert(1);" />
		<span>Open notebook 03_exercises.ipynb</span>
	</a>
	<a href="https://github.com/Njiecheu/sea-forward/raw/main/docs/notebooks/03_exercises.ipynb" style="display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:8px; background:linear-gradient(to bottom, #ffffcc 0%, #fbec69 100%); color:#ffffff; text-decoration:none; font-weight:600;">
		<img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/download.svg" alt="" aria-hidden="true" style="width:16px; height:16px; filter:invert(1);" />
		<span>Download notebook 03_exercises.ipynb</span>
	</a>
</div>

Then continue with sensitivity analysis:

<div style="display:flex; gap:10px; flex-wrap:wrap; margin:10px 0 14px 0;">
	<a href="https://github.com/Njiecheu/sea-forward/blob/main/docs/notebooks/04_sensitivity.ipynb" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:8px; background:linear-gradient(to top, #ccfff4 0%, #389bf2 100%); color:#ffffff; text-decoration:none; font-weight:600;">
		<img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/box-arrow-up-right.svg" alt="" aria-hidden="true" style="width:16px; height:16px; filter:invert(1);" />
		<span>Open notebook 04_sensitivity.ipynb</span>
	</a>
</div>
