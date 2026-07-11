## What you have now

For your region you have a compiled model that has **run to completion**, with all
its inputs and outputs in the run folder:

```
forecast/scratch/Canary_12/
├── croco                       # the compiled program
├── cppdefs.h param.h croco.in jobcomp   # your edited config (also in configs/Canary_12)
├── compile.log
├── run.log                     # the proof it ran to MAIN: DONE
├── CROCO_FILES/
│   ├── croco_grd.nc            # grid + land mask
│   ├── crocotools_param.py     # pre-processing parameters
│   ├── croco_ini_MERCATOR_*.nc # initial condition
│   ├── croco_bry_MERCATOR_*.nc # boundary conditions
│   ├── croco_his.nc            # history output (this run)
│   └── croco_avg.nc            # averages output (this run)
└── downloaded_data/            # Mercator + GFS (+ for_croco forcing)
```

!!! note
    **Next:** Phase 3 — *Running a Forecast*. Part A there is simply this single run you just did; Part B is the automated operational driver (2-day spin-up + 5-day forecast). If you're doing a hindcast, Phase 4 reuses everything here and swaps the data source (GLORYS + ERA5) and the track.

!!! important
    **If this is a new region (not Canary_12):** the operational driver(`forecast/run_forecast_today.sh`) is provided set up for Canary_12. Before you run it in Phase 3, update its `CONFIG_NAME`, `EXTENTS` (your download box), and `FIX_GFS_LON` to match the config you just built — otherwise it runs Canary_12, not your region. Details in Phase 3 §B.4.

