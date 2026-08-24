# Sensitivity Analysis (from 04_sensitivity.ipynb)

This page documents the notebook workflow that connects forcing perturbation to forecast response across the SEA-FORWARD chain:

- U2: Upstream forcing
- C1: Core forecasting engine (CROCO rerun)
- D1: Downstream diagnostics

## Why This Matters

A forcing perturbation is only scientifically meaningful when the response is propagated through a model rerun. The notebook therefore separates:

1. forcing edit,
2. rerun step,
3. diagnostic comparison.

## Part A: Perturb Wind Forcing (U2)

### Objective

Scale wind components in `croco_blk.nc` by a fixed amplitude factor (default 1.5) and write a perturbed forcing file.

### What to verify

- Wind variable names are correctly detected (`uwnd/vwnd`, `Uwind/Vwind`, or `u10/v10`).
- Output perturbed file is written successfully.
- Metadata records provenance in dataset history.

### Physical note

Wind-stress effects scale faster than linearly with wind speed; a 1.5x wind-speed perturbation can produce a notably amplified dynamical response.

## Part B: CROCO Rerun (C1)

### Objective

Run CROCO externally with the perturbed forcing and keep baseline and perturbed outputs side by side.

### Real-data mode

- Mandatory external rerun.
- Notebook checks for both baseline and perturbed `croco_his.nc` paths.
- Do not overwrite baseline outputs.

### Demo mode

- External rerun is skipped.
- Synthetic perturbed history is generated so Part C can still execute end-to-end.

## Part C: Compare Response (D1)

### Objective

Quantify and interpret the model response to the forcing perturbation.

### Diagnostics

1. SST map comparison: baseline, perturbed, and difference map.
2. Domain statistics: mean bias and RMS difference.
3. Bakun index comparison at coastal reference point.

### Expected physical behavior

- More upwelling-favourable forcing should generally increase coastal cooling.
- Bakun index magnitude should increase with perturbation strength.
- Ratio behavior should be consistent with the formula dependence on both $\lvert W \rvert$ and $W_{alongshore}$.

## Quality Gates and Interpretation

Use the built-in assertions to confirm:

- baseline and perturbed Bakun indices keep the same sign,
- perturbed magnitude exceeds baseline for factor > 1.

If these fail, first check coastline angle, wind extraction location, and forcing file consistency.

## Reporting Template (Suggested)

For each experiment, record:

1. `AMP_FACTOR`
2. SST mean bias and RMS (perturbed minus baseline)
3. Bakun baseline and perturbed values
4. Bakun ratio
5. Demo vs real-data mode status

## Where To Run The Full Workflow

Run the executable notebook for complete code and plots:

<div style="display:flex; gap:10px; flex-wrap:wrap; margin:10px 0 14px 0;">
	<a href="04_sensitivity.ipynb" style="display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:8px; background:linear-gradient(to top, #ccfff4 0%, #389bf2 100%); color:#ffffff; text-decoration:none; font-weight:600;">
		<img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/box-arrow-up-right.svg" alt="" aria-hidden="true" style="width:16px; height:16px; filter:invert(1);" />
		<span>Open notebook 04_sensitivity.ipynb</span>
	</a>
	<a href="04_sensitivity.ipynb" download style="display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:8px; background:linear-gradient(to bottom, #ffffcc 0%, #f0e68c 100%); color:#ffffff; text-decoration:none; font-weight:600;">
		<img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/download.svg" alt="" aria-hidden="true" style="width:16px; height:16px; filter:invert(1);" />
		<span>Download notebook 04_sensitivity.ipynb</span>
	</a>
</div>

Upstream conceptual prerequisite:

<div style="display:flex; gap:10px; flex-wrap:wrap; margin:10px 0 14px 0;">
	<a href="03_exercises.ipynb" style="display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:8px; background:linear-gradient(to top, #ccfff4 0%, #389bf2 100%); color:#ffffff; text-decoration:none; font-weight:600;">
		<img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/box-arrow-up-right.svg" alt="" aria-hidden="true" style="width:16px; height:16px; filter:invert(1);" />
		<span>Open notebook 03_exercises.ipynb</span>
	</a>
</div>
