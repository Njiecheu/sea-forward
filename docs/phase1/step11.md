## 11. From now on — the every-session ritual

Everything above was **one-time setup**. You will not repeat it. From here on,
each time you open a terminal to work with SEA-FORWARD, you run just these three
lines:

```bash
source ~/seaforward/env.sh                 # shared paths + compilers + NetCDF
source ~/seaforward/forecast/track.sh      # OR hindcast/track.sh — pick the track
conda activate seaforward                  # step into the Python environment
```

That's it — no re-installing, no re-building. To **compile** the model you
additionally `conda deactivate` first (so the system linker uses `opt_seq`'s
NetCDF, not conda's), then run `./jobcomp`.

| Task | When |
|------|------|
| Install Miniconda (§3) | once per machine |
| Create `seaforward` env (§5) | once per machine |
| Build `opt_seq` NetCDF stack (§7) | once per machine |
| Install CROCO + croco_pytools (§8) | once per machine |
| Download bathymetry data (§9) | once per machine |
| **`source env.sh` + `track.sh` + `conda activate`** | **every session** |