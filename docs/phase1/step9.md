## 9. Reference data (bathymetry & coastline)  *(once per machine, large download)*

Building a grid needs global **bathymetry** (sea-floor depth, ETOPO2) and a
**coastline** (GSHHS). CROCO distributes these as the *DATASETS_CROCOTOOLS*
package (several GB). Place it under the repo's `data/` folder so grid.ini finds
it at:

```
~/seaforward/data/DATASETS_CROCOTOOLS/Topo/etopo2.nc
~/seaforward/data/DATASETS_CROCOTOOLS/gshhs/GSHHS_shp/i/GSHHS_i_L1.shp
```

!!! note
    This data is **large and never committed** to the repository (it is git-ignored). Each user downloads it once. `CROCO_DATA_ROOT` in `env.sh` points at `~/seaforward/data`, so as long as the datasets sit there, the tools find them.

Verify:

```bash
source ~/seaforward/env.sh
ls $CROCO_DATA_ROOT/DATASETS_CROCOTOOLS/Topo/etopo2.nc && echo "bathymetry OK"
```