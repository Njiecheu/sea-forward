# Guided Exercises (from 03_exercises.ipynb)

This page explains the pedagogical flow of `03_exercises.ipynb` for ReadTheDocs readers who want the concepts and expected outputs before running code.

## Scope and Learning Goals

The notebook turns raw CROCO outputs into four standard coastal-ocean diagnostics:

1. Bakun-style upwelling index from wind.
2. Mixed-layer depth (MLD) from a temperature-threshold criterion.
3. Coastal jet core identification from a cross-shore section.
4. Candidate eddy centres from SSH anomaly extrema.

Each exercise includes:

- a reference implementation with `# TODO` guidance,
- a self-check cell with `assert` tests,
- physically interpretable outputs (sign, magnitude, location, map/section view).

## Exercise 1: Upwelling Index (Bakun-Style)

### Objective

Quantify upwelling-favourable forcing from 10 m wind at a representative coastal point.

### Method

- Rotate wind into alongshore/cross-shore components using coastline angle.
- Compute Coriolis parameter at latitude.
- Evaluate Bakun transport:

$$
Q_x = \frac{\rho_{air} C_D \lvert W \rvert W_{alongshore}}{\rho_{water} f}
$$

Positive $Q_x$ indicates upwelling-favourable conditions.

### Expected checks

- Finite value.
- Magnitude in plausible range for moderate winds.

### Common pitfalls

- Wrong coastline orientation.
- Near-equatorial latitude ($f \to 0$).
- Unit inconsistency.

## Exercise 2: Mixed-Layer Depth (MLD)

### Objective

Estimate MLD from a vertical temperature profile using a threshold criterion.

### Method

- Extract profile at the same coastal point.
- Use a reference depth (default 10 m).
- Find shallowest depth where $\lvert T - T_{ref} \rvert > \Delta T$ (default 0.2 degC).

### Expected checks

- MLD lies inside the water column bounds.
- If no threshold crossing appears, report a well-mixed column scenario.

### Common pitfalls

- Using levels above the reference depth.
- Misreading sign convention for depth (negative downward).

## Exercise 3: Coastal Jet Analysis

### Objective

Locate the coastal jet core from a cross-shore vertical section of current speed.

### Method

- Build a section approximately perpendicular to the coast.
- Identify the maximum speed in section coordinates.
- Report jet speed, depth, and offshore distance.

### Expected checks

- Positive finite maximum speed.
- Jet core depth within section bounds.

### Common pitfalls

- Transect not crossing the shelf/slope correctly.
- Endpoint selection inconsistent with local coastline orientation.

## Exercise 4: Eddy Detection (Simplified Local-Extrema Method)

### Objective

Understand eddy-candidate detection from SSH anomaly extrema before using production-grade methods.

### Method

- Compute SSH anomaly by removing domain mean.
- Use neighbourhood max/min filters to detect local extrema.
- Apply a minimum amplitude threshold to discard weak/flat features.

### Expected checks

- Non-negative candidate counts for cyclonic and anticyclonic centres.
- Spatial map showing coherent candidate distribution.

### Important limitation

This simplified method finds candidate centres only. It does not enforce full closed-contour shape validation used in production workflows.

## Interpretation Guide

When diagnostics are physically consistent together:

1. Stronger upwelling-favourable wind should align with coastal cooling tendencies.
2. MLD and jet patterns should remain plausible for the local regime.
3. Eddy candidates should appear in dynamically active zones, not uniformly everywhere.

## Where To Run The Full Workflow

Run the executable notebook for full code, plots, and self-checks:

<div style="display:flex; gap:10px; flex-wrap:wrap; margin:10px 0 14px 0;">
	<a href="03_exercises.ipynb" style="display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:8px; background:linear-gradient(to top, #ccfff4 0%, #389bf2 100%); color:#ffffff; text-decoration:none; font-weight:600;">
		<img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/box-arrow-up-right.svg" alt="" aria-hidden="true" style="width:16px; height:16px; filter:invert(1);" />
		<span>Open notebook 03_exercises.ipynb</span>
	</a>
	<a href="03_exercises.ipynb" download style="display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:8px; background:linear-gradient(to bottom, #ffffcc 0%, #f0e68c 100%); color:#ffffff; text-decoration:none; font-weight:600;">
		<img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/download.svg" alt="" aria-hidden="true" style="width:16px; height:16px; filter:invert(1);" />
		<span>Download notebook 03_exercises.ipynb</span>
	</a>
</div>

Then continue with sensitivity analysis:

<div style="display:flex; gap:10px; flex-wrap:wrap; margin:10px 0 14px 0;">
	<a href="04_sensitivity.ipynb" style="display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:8px; background:linear-gradient(to top, #ccfff4 0%, #389bf2 100%); color:#ffffff; text-decoration:none; font-weight:600;">
		<img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/box-arrow-up-right.svg" alt="" aria-hidden="true" style="width:16px; height:16px; filter:invert(1);" />
		<span>Open notebook 04_sensitivity.ipynb</span>
	</a>
</div>
