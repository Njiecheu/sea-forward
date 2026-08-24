# Sensitivity Analysis (from 04_sensitivity.ipynb)

**SEA-FORWARD** OceanPrediction-A toolkit

Perturb the **atmospheric forcing** (wind amplitude in `croco_blk.nc`),
**re-run CROCO**, and compare the **upwelling response**. This is the
clearest hands-on illustration in the whole toolkit of how the
OceanPrediction-A value chain is connected end to end:

```
   U2                      C1                       D1
Upstream forcing  --->  Core Forecasting  --->  Downstream diagnostic
(wind, perturbed          Engine (CROCO)          (upwelling index,
 here)                    re-run with the          SST response --
                          perturbed forcing)        computed here)
```

A change made at **U2** (the wind field edited below) only becomes visible
at **D1** (the SST/upwelling diagnostics at the end) *by passing through*
**C1** -- you cannot skip the model run. This is why Step 5.3 requires an
actual CROCO re-run between the two halves of this notebook, rather than
just perturbing a diagnostic directly.

**Demo mode.** A real CROCO re-run needs HPC access and takes far longer
than a notebook cell -- there's no honest way to fake that. So: Part A and
Part C below run for real either way (against a small synthetic stand-in
for what a re-run *would* produce, in demo mode, clearly labelled); Part B
(the actual re-run) is a genuine external step that this notebook cannot
skip in real-data mode -- see the assert-gate in that section.

**Prerequisite:** run `03_exercises.ipynb` first (or at least its Exercise
1) -- the Bakun upwelling index computation is reused unchanged below.

*Language note (FR-09):* markdown and docstrings are in English; French
translation is coordinated separately with the documentation team.

## Part A -- Perturb the wind forcing (U2)

We scale the 10 m wind components in `croco_blk.nc` by a fixed amplitude
factor (**x1.5**, per Technical Specification Step 5.3) and write a new
bulk-forcing file. Wind *stress* in bulk-flux formulations scales roughly
with the square of wind speed, so a 1.5x wind-*speed* perturbation is a
substantially stronger forcing change than it first appears -- worth
keeping in mind when you look at the SST response in Part C.



## Part B -- Re-run CROCO with the perturbed forcing (C1)

**In real-data mode**, this step happens *outside* the notebook, using the
same forecast/hindcast orchestration script described in the Technical
Specification (Step 4 of the operational workflow), pointed at
`croco_blk_wind1.5.nc` instead of the baseline file:

```bash
# from the repository root, in the seaforward conda environment:
cd hindcast
# edit crocotools_param.py (or the region config) so blkfilename points at
# the perturbed file written by Part A, OR pass the override supported by
# your run script, e.g.:
./run_hindcast_cycle.sh --region Canary_12 --blk croco_blk_wind1.5.nc --outdir ../hindcast/model-runs/Canary_12/<DATE>/hcast_wind1p5
```

Do **not** overwrite the baseline run directory -- keep the two side by side
so Part C can compare them. Once the run completes, point `HIS_PERTURBED`
at its `croco_his.nc` and re-run the cell below.

**In demo mode**, this cell is skipped -- `_demo_data.get_sensitivity_paths()`
already generated a synthetic "perturbed" history file (stronger coastal
cooling) standing in for what this re-run would produce, so Part C below
still has something real to compare.

## Part C -- Compare the upwelling response (D1)

Three comparisons, from the simplest to the most physically direct:

1. **SST difference map** (perturbed minus baseline): where did the wind
   change cool the surface, and by how much?
2. **Bakun upwelling index** at the coastal reference point (Exercise 1 of
   `03_exercises.ipynb`, reused verbatim), baseline vs. perturbed.
3. **Domain statistics** of the SST change, to put a single number on "how
   much stronger is upwelling with 1.5x wind".

### Bakun upwelling index -- baseline vs. perturbed

Reusing the Exercise 1 calculation from `03_exercises.ipynb` unchanged,
applied to both wind fields, so the *only* thing that differs between the
two numbers below is the `AMP_FACTOR` scaling applied in Part A.

> **Note.** The qualitative result -- that the index scales *faster* than
> linearly with `AMP_FACTOR` -- holds because both the alongshore-wind term
> *and* the wind-speed term in the Bakun formula grow together (Qx is
> proportional to `&#124;W&#124; * W_alongshore`, i.e. roughly quadratic in wind
> speed for wind blowing mostly alongshore). Compare `Qx_pert/Qx_base`
> above to `AMP_FACTOR**2` to check this directly on your own run.

## Summary

This notebook closed the loop from **U2** (perturbed wind forcing) through
**C1** (the re-run CROCO model) to **D1** (the SST and upwelling-index
response) -- the exact chain the Technical Specification's Data
Consistency Chain (DCC) architecture requires. Record your `AMP_FACTOR`,
the resulting SST bias/RMSE, and the Bakun-index ratio in your lab notes.

*Reminder:* results above are DEMO DATA unless you completed Part B with a
real CROCO re-run -- check the `IS_DEMO` flag printed near the top of this
notebook before drawing any scientific conclusions.

<div style="display:flex; justify-content:center; margin:10px 0 14px 0;">
   <a href="https://raw.githubusercontent.com/Njiecheu/sea-forward/main/docs/notebooks/04_sensitivity.ipynb" data-download-url="https://raw.githubusercontent.com/Njiecheu/sea-forward/main/docs/notebooks/04_sensitivity.ipynb" data-download-filename="04_sensitivity.ipynb" style="display:inline-flex; align-items:center; justify-content:center; gap:16px; min-width: 80px; padding:20px 20px; border-radius:10px; background:linear-gradient(to bottom, #ffffcc 0%, #f4f797de 100%); color:#000000; text-decoration:none; font-size:1.2rem; line-height:1.1; text-align:center;">
      <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/download.svg" alt="" aria-hidden="true" style="width:25px; height:25px; color: #000000; font-weight: bold filter:invert(1);" />
      <span>Download notebook 04_sensitivity.ipynb</span>
   </a>
</div>
