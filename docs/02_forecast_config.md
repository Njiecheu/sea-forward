# SEA-FORWARD — Phase 2: Building a Forecast Configuration — Hand-Edit Edition

This is the **teaching version** of building a forecast configuration. Instead of
running scripted `sed` commands, **you open each file yourself and make the
change by hand** — so you understand *what* every setting is and *why* it's
there.

This phase builds a complete **forecast** configuration: a grid, its boundaries,
the downloaded ocean (Mercator) and weather (GFS) data shaped for CROCO, the four
edited configuration files, and a compiled model — all on the **forecast track**.

> **Forecast vs hindcast.** The *steps* here (grid, mask, boundaries, config
> files, compile) are the same skeleton a hindcast uses — but the *commands* are
> forecast-specific (Mercator + GFS, the forecast track). Phase 4 (Hindcast)
> reuses this skeleton and swaps the data source to GLORYS + ERA5. So build your
> forecast here first; when you later do a hindcast, Phase 4 points back to these
> steps and only shows what changes.

The worked example is **Canary_12**, a 1/12° domain off North-West Africa
(22°W–15.5°W, 14°N–24°N). To build your own region later, you'll change the same
handful of things you edit here — and because you edited them by hand, you'll
know exactly which ones.

> **Prerequisite:** you finished Phase 1 (Setup). The `seaforward` conda
> environment exists, `nf-config --prefix` shows `~/seaforward/opt_seq`, CROCO is
> in `~/seaforward/code/croco`, and the bathymetry data is under
> `~/seaforward/data/DATASETS_CROCOTOOLS/`.

> **How to read this guide**
> - When you must **edit a file**, you'll open it in `nano` and the guide tells
>   you what to **find** and what to **change it to**, with a **What / Why** for
>   each.
> - A few steps (downloading data, building the grid, compiling) can't be
>   hand-edited — you run them — but the guide explains what each is doing.
> - `✅ CHECK` shows what a correct result looks like.
> - `⚠️ WATCH` marks a trap.

### nano crash course (you'll use it the whole way)

```
nano FILENAME        open a file
Ctrl-W               search ("Where is") — type text, Enter — jumps to it
Ctrl-K               cut the current line
Ctrl-O, Enter        save ("Write Out")
Ctrl-X               exit
arrow keys           move around; just type to insert text
```

That's all you need. `Ctrl-W` (search) is your main tool — you'll use it to find
the line to change in each file.

---

## The idea behind the whole thing

A regional ocean model **takes a global ocean and weather product and adds fine
detail over your region**. You build it in two phases:

**Phase A — prepare the data:** make a grid, decide its boundaries, download the
global ocean and weather, and turn them into the model's starting state, edge
values, and surface forcing.

**Phase B — set up and run the model:** tell CROCO about your grid and physics
(by editing four text files), compile it into a program, and (in Phase 3 or 4)
run it.

Everything you edit by hand is *configuration* — text that describes your region
to the model. Understanding that configuration is the whole point.

---

## Step 0 — Set up your environment  *(every session starts here)*

You **run** this (it's not a file to edit), but understand it: these commands
tell every tool where SEA-FORWARD lives, pick your track, step into the Python
environment, and set the region you're building.

Open a terminal and run the three-line **session ritual**:

```bash
source ~/seaforward/env.sh                 # shared paths + compilers + NetCDF
source ~/seaforward/forecast/track.sh      # pick the FORECAST track
conda activate seaforward                  # the Python tools
```

- `env.sh` sets the shared variables: `SEA_FORWARD_ROOT=~/seaforward`,
  `CROCO_MODEL_DIR=…/code/croco`, `CROCO_PYTOOLS_DIR=…/code/croco_pytools`,
  `CROCO_DATA_ROOT=…/data`, `SEAFORWARD=…/sftools`, the compilers, and the
  `opt_seq` NetCDF paths.
- `track.sh` sets the **per-track** variables — where configs and runs live:
  - `forecast/track.sh` → `CROCO_CONFIGS_ROOT=…/forecast/configs`,
    `CROCO_RUNS_ROOT=…/forecast/scratch`
  - `hindcast/track.sh` → the same under `…/hindcast/`

> **Why a track?** The repo keeps forecast and hindcast fully separate so their
> configs and runs never mix. Sourcing a `track.sh` is how you say which one
> you're working on. This document uses the **forecast** track; a hindcast of the
> same region uses `hindcast/track.sh` and lives entirely under `hindcast/`.

Now set **your region** (the only numbers you change for a different region):

```bash
export CONFIG_NAME=Canary_12
export LON_MIN=-22.0; export LON_MAX=-15.5      # west/east edges of your box
export LAT_MIN=14.0;  export LAT_MAX=24.0       # south/north edges
export RES=$(echo "1/12" | bc -l)               # grid spacing: 1/12° (~9 km)
export EXTENTS=-23.5,-14.0,12.5,25.5            # DOWNLOAD box = your box + ~1.5° margin
export HDAYS=2; export FDAYS=5                   # 2 days spin-up + 5 days forecast
export YORIG=2000                                # time reference year (leave at 2000)

# derived paths (config recipe vs run folder)
export CONFIG_DIR=${CROCO_CONFIGS_ROOT}/${CONFIG_NAME}   # forecast/configs/Canary_12
export FCAST=${CROCO_RUNS_ROOT}/${CONFIG_NAME}           # forecast/scratch/Canary_12
export CF=${FCAST}/CROCO_FILES
mkdir -p ${CONFIG_DIR} ${CF} \
         ${FCAST}/downloaded_data/MERCATOR \
         ${FCAST}/downloaded_data/GFS/for_croco
echo "Building ${CONFIG_NAME}: lon ${LON_MIN}..${LON_MAX}, lat ${LAT_MIN}..${LAT_MAX}"
```

**Two folders, two jobs.** `CONFIG_DIR` (`forecast/configs/Canary_12`) holds the
**recipe** — the config files you edit, kept for the future. `FCAST`
(`forecast/scratch/Canary_12`) is the **workbench** — where you build the grid,
generate data, compile, and test.

**Why the two boxes?** Your *grid box* (`LON_MIN..LAT_MAX`) is your model's
domain. The *download box* (`EXTENTS`) is ~1.5° bigger on every side, because the
tools that interpolate global data onto your grid need data slightly *beyond*
your grid edges. If the download box is too tight, `make_ini`/`make_bry` fail
with "extents not sufficient."

> ⚠️ **WATCH — the region variables live only in this terminal.** The scripts
> below read them; if one is missing, a tool guesses a wrong path and stops. If
> you open a fresh terminal later, re-run the whole Step 0 block first (the
> ritual **and** the region variables).

> **`bc -l` for the resolution.** We compute `1/12` with `bc -l` so you never
> hand-round it to `0.0833`. The full-precision value is what makes the grid come
> out to the expected point count.

---

## Step 1 — Create the grid definition (run + read)

You run a helper that writes a small text file describing the grid. In the new
repo the config generators live under `sftools/config`:

```bash
cd ${SEAFORWARD}/config
python3 make_grid_config.py "${CONFIG_NAME}" \
        ${LON_MIN} ${LON_MAX} ${LAT_MIN} ${LAT_MAX} ${RES} ${RES}
```

It prints where it saved the file and an estimated size, e.g.
`Config saved to: .../forecast/configs/Canary_12/grid.ini (79x121 points)`.

Now **open the file it made** and read it, so you see what a grid definition is:

```bash
nano ${CONFIG_DIR}/grid.ini
```

Look for `lon_min`, `lon_max`, `lat_min`, `lat_max`, `dlon`, `dlat` — your box
and spacing. Also notice `topo_file` and `shp_file`: they point at your
`DATASETS_CROCOTOOLS` bathymetry and coastline (via `CROCO_DATA_ROOT`), and
`croco_files_dir`, which is where the grid will be written. `Ctrl-X` to exit
(don't change anything).

✅ **CHECK** — the box matches what you set; `dlon = dlat ≈ 0.083333` (that's
1/12°). The "(79x121 points)" is only an **estimate**; the real size comes from
the next step.

---

## Step 2 — Build the grid (run), then read its real size

```bash
cd ${CROCO_PYTOOLS_DIR}/prepro
python3 make_grid.py ${CONFIG_DIR}/grid.ini 2>&1 | tail -20
```

**What this does:** reads the sea-floor depth data (ETOPO2), works out which grid
points are land vs ocean (the "mask") from the coastline, and smooths the
bathymetry so the model stays stable. The scrolling `rx0`/`ry0` numbers are the
smoothing working; they settle near `0.20`. It finishes with
`Writing .../CROCO_FILES/croco_grd.nc done`.

Now read the **real** grid dimensions from the file it produced:

```bash
ncdump -h ${CF}/croco_grd.nc | grep -E "xi_rho|eta_rho"
```

✅ **CHECK** for Canary_12: `xi_rho = 81`, `eta_rho = 123`.

**Write these two numbers down.** You'll need them (minus 2) for `param.h` later:

     - `LLm0 = xi_rho − 2 = 79`
     - `MMm0 = eta_rho − 2 = 121`

> ⚠️ **WATCH — use the numbers from the file, not the estimate.** The estimate
> said 79×121; the real grid is 81×123. The `− 2` removes two boundary rows CROCO
> adds internally.

---

## Step 3 — Look at the land and decide your boundaries (the key concept)

Each of your four boundaries is either **open** (water flows through — the model
reads ocean data there) or **closed** (a solid wall — because it's land). You
don't guess this; you read it from the mask.

Run this to *see* your boundaries as strips of ocean (`O`) and land (`.`):

```bash
python3 -c "
import xarray as xr
g=xr.open_dataset('${CF}/croco_grd.nc'); m=g.mask_rho.values
strip=lambda r: ''.join('O' if v==1 else '.' for v in r)
print('south:', int(m[0,:].sum()),'/',m.shape[1]); print('   W', strip(m[0,:]), 'E')
print('north:', int(m[-1,:].sum()),'/',m.shape[1]); print('   W', strip(m[-1,:]), 'E')
print('west :', int(m[:,0].sum()),'/',m.shape[0]);  print('   S', strip(m[:,0]), 'N')
print('east :', int(m[:,-1].sum()),'/',m.shape[0]); print('   S', strip(m[:,-1]), 'N')
"
```

**Mostly `O` → open (write `1`). Mostly `.` → closed (write `0`).**

✅ **Canary_12 reads:**

- west: 123/123 ocean → **open (1)**
- east: ~1/123 ocean — it's the African coast → **closed (0)**
- north: 77/81 ocean → **open (1)**
- south: 67/81 ocean → **open (1)**

So your boundary setting is **south=1, west=1, east=0, north=1**. Remember this —
it appears in **three** places (the `crocotools_param.py` below, `cppdefs.h`, and
it decides what the boundary file contains). All three must agree.

**Why it matters:** opening a boundary that's actually land is meaningless and
can make the model unstable. Closing a boundary that's really open starves the
model of inflow. The mask tells you the truth for *your* box.

---

## Step 4 — Write `crocotools_param.py` BY HAND

This file tells the tools that build the initial and boundary conditions about
your grid. The CLI reads it from the folder you point `make_ini`/`make_bry` at
(your `CROCO_FILES`). Create and edit it:

```bash
nano ${CF}/crocotools_param.py
```

The file is empty. **Type in** the following (don't type the explanations that
follow):

```python
inputdata    = 'mercator'
Nzgoodmin    = 4
multi_files  = False
tracers      = ['temp', 'salt']
croco_grd    = 'croco_grd.nc'
sigma_params = dict(theta_s=7, theta_b=2, N=50, hc=200)
ini_prefix   = 'croco_ini_MERCATOR'
bry_prefix   = 'croco_bry_MERCATOR'
obc_dict     = dict(south=1, west=1, east=0, north=1)
cycle_bry    = 0
```

Save: `Ctrl-O`, Enter. Exit: `Ctrl-X`.

**Line by line — what each is:**

     - `inputdata = 'mercator'` — the global ocean data comes from Mercator (variables named `zos/thetao/so/uo/vo`). This tells the reader which naming to expect.
  **(Hindcast: this becomes `'glorys'`.)**
     - `Nzgoodmin = 4` — minimum good vertical levels before the tool fills gaps.
     - `multi_files = False` — your ocean data is one merged file, not many.
     - `tracers = ['temp', 'salt']` — temperature and salinity, carried through the water.
     - `croco_grd = 'croco_grd.nc'` — the grid filename, in the same folder.
     - `sigma_params = dict(theta_s=7, theta_b=2, N=50, hc=200)` — the **vertical grid**: 50 layers from surface to sea floor, stretched to pack more near the surface. **These four numbers must match `croco.in` and `param.h` later.**
     - `ini_prefix` / `bry_prefix` — the names your initial/boundary files will get.
     - `obc_dict = dict(south=1, west=1, east=0, north=1)` — **your boundaries from Step 3.** Change these to match *your* mask for a different region.
     - `cycle_bry = 0` — the boundary data uses real dates, not a repeating loop.

> **Keep a copy with the recipe.** Also save this file into your config folder so
> the recipe is complete:
> `cp ${CF}/crocotools_param.py ${CONFIG_DIR}/`.

> ⚠️ **WATCH — `sigma_params` must match everywhere.** `theta_s=7, theta_b=2,
> N=50, hc=200` here must equal the S-coord line in `croco.in` and the `N` in
> `param.h`. If they differ, the model's vertical grid won't match its inputs.

---

## Step 5 — Prepare the data (run the five CLI commands)

These download and shape the global data. You can't hand-edit a download, so you
run them — but each does one clear job. The CLI is `seaforward.py` in `sftools`:

```bash
cd ${SEAFORWARD}
export RUN_DT="$(date -u +'%Y-%m-%d') 00:00:00"
```

> ⚠️ **WATCH — negative longitudes need `--domain=` with an equals sign.**
> Because your box is west of Greenwich, the domain string starts with `-`, and
> the command reader mistakes it for an option unless you attach it with `=`. Use
> `--domain="${EXTENTS}"`.

**5a — download the global ocean (Mercator).** It asks for your Copernicus Marine
login the first time, then remembers it.

```bash
python seaforward.py download_ocean \
    --domain="${EXTENTS}" --run_date "${RUN_DT}" \
    --hdays ${HDAYS} --fdays ${FDAYS} \
    --outputDir ${FCAST}/downloaded_data/MERCATOR
```

**5b — download the global weather (GFS).**

```bash
python seaforward.py download_atmosphere \
    --domain="${EXTENTS}" --run_date "${RUN_DT}" \
    --hdays ${HDAYS} --fdays ${FDAYS} \
    --outputDir ${FCAST}/downloaded_data/GFS
```

**5c — turn the raw GFS into surface forcing the model can read.**

```bash
python seaforward.py make_forcing \
    --gfsDir ${FCAST}/downloaded_data/GFS \
    --outputDir ${FCAST}/downloaded_data/GFS/for_croco \
    --Yorig ${YORIG}
ls ${FCAST}/downloaded_data/GFS/for_croco/*.nc | wc -l   # expect 10
```

✅ **CHECK** — 5c reports it works through Temperature, Humidity, Precipitation,
the four radiation fluxes, U/V wind, and pressure, then `10` files exist.

**5d — build the initial condition** (the ocean's state at the start).

```bash
export MERC=${FCAST}/downloaded_data/MERCATOR/MERCATOR_$(date -u +'%Y%m%d')_00.nc
python seaforward.py make_ini \
    --input_file ${MERC} --output_dir ${CF} \
    --run_date "${RUN_DT}" --hdays ${HDAYS} --Yorig ${YORIG}
```

✅ **CHECK** — it interpolates temp/salt/u/v onto the sigma layers and prints
`Initial file created … croco_ini_MERCATOR_<date>_00.nc`.

**5e — build the boundary conditions** (what flows in at the open edges over
time).

```bash
python seaforward.py make_bry \
    --input_file ${MERC} --output_dir ${CF} \
    --run_date "${RUN_DT}" --hdays ${HDAYS} --fdays ${FDAYS} --Yorig ${YORIG}
```

✅ **CHECK** — 5e processes **south, west, north** and **skips east**. That's your
`obc_dict` in action: it only builds data for the *open* boundaries. Confirm both
files exist:

```bash
ls -lh ${CF}/croco_ini_MERCATOR*.nc ${CF}/croco_bry_MERCATOR*.nc
```

---

## Step 6 — Fix the GFS longitudes (only for western-hemisphere regions)

GFS labels longitude from 0 to 360; your model uses −180 to 180. For a region
west of Greenwich these don't match, and the model would crash reading the
weather forcing. Check whether you're affected:

```bash
python3 -c "
import xarray as xr
g = xr.open_dataset('${CF}/croco_grd.nc')
f = xr.open_dataset('${FCAST}/downloaded_data/GFS/for_croco/TEMPERATURE_HEIGHT_ABOVE_GROUND_Y9999M01.nc')
print('MODEL   lon: %.2f .. %.2f' % (float(g.lon_rho.min()), float(g.lon_rho.max())))
print('FORCING lon: %.2f .. %.2f' % (float(f.lon.min()), float(f.lon.max())))
print('covers?', float(f.lon.min())<=float(g.lon_rho.min()) and float(f.lon.max())>=float(g.lon_rho.max()))
"
```

If it says `covers? False` and the forcing lon numbers are big (like 336..346),
run the one-time conversion:

```bash
cd ${FCAST}
python3 << 'PYEOF'
import xarray as xr, glob, os
for f in sorted(glob.glob('downloaded_data/GFS/for_croco/*.nc')):
    d = xr.open_dataset(f); lon = d['lon'].values
    if lon.max() > 180:
        d = d.assign_coords(lon=((lon + 180) % 360) - 180).sortby('lon')
        tmp=f+'.tmp'; d.to_netcdf(tmp); d.close(); os.replace(tmp, f)
        print('fixed', os.path.basename(f))
    else:
        d.close()
print('done')
PYEOF
```

Re-run the check — it should now say `covers? True` with forcing lon around
`−23.5..−14.0`. (Eastern-hemisphere regions skip this whole step.)

---

## Step 7 — Copy the CROCO source files you'll edit

You start from CROCO's blank templates. Copy them into your **config** folder
(the recipe), and keep pristine `.orig` backups:

```bash
cd ${CONFIG_DIR}
cp ${CROCO_MODEL_DIR}/OCEAN/cppdefs.h .
cp ${CROCO_MODEL_DIR}/OCEAN/param.h .
cp ${CROCO_MODEL_DIR}/OCEAN/croco.in .
cp ${CROCO_MODEL_DIR}/OCEAN/jobcomp .
for f in cppdefs.h param.h croco.in jobcomp; do cp $f $f.orig; done
```

> **No `config.sh` to copy.** In the new setup, the compilers and the `opt_seq`
> NetCDF paths are already in `env.sh` (which you sourced in Step 0). There is no
> per-config `config.sh` to copy or source — sourcing `env.sh` at the start of
> the session is enough to compile later.

The next four steps each open one of these and edit it **by hand**. This is the
heart of understanding a CROCO configuration.

---

## Step 8 — Edit `cppdefs.h` BY HAND (the model's "features" switches)

`cppdefs.h` is a list of on/off switches that decide which parts of the model get
built. Open it:

```bash
nano cppdefs.h
```

You'll make **three** changes. Use `Ctrl-W` to find each line.

### 8.1 — Name your configuration

`Ctrl-W`, type `BENGUELA_LR`, Enter. You'll land on:

```
# define BENGUELA_LR
```

Change `BENGUELA_LR` to `CANARY_12`:

```
# define CANARY_12
```

**What:** this names your configuration. **Why:** `BENGUELA_LR` is CROCO's
built-in South-Africa example; you're replacing it with your own. Use
**UPPERCASE** (CROCO's convention), and the exact same name must appear in
`param.h` (Step 9).

### 8.2 — Turn on online weather forcing

`Ctrl-W`, type `undef  ONLINE`, Enter. You'll find:

```
#  undef  ONLINE
```

Change `undef` to `define`:

```
#  define ONLINE
```

**What:** turns on the feature that reads your GFS surface forcing. **Why:**
without it, the model wouldn't use the weather files you made in Step 5c. Just
below it, leave `AROME` and `ERA_ECMWF` as `undef` — that selects the default
(GFS-style) forcing format your files are in.

> **Hindcast note:** if you force with **ERA5** in ECMWF format, this is where you
> would `define ERA_ECMWF` instead. Match the switch to the format your data has.

### 8.3 — Close the land boundary

`Ctrl-W`, type `define OBC_EAST`, Enter:

```
# define OBC_EAST
```

Change `define` to `undef` (and fix the spacing so it lines up):

```
# undef  OBC_EAST
```

**What:** makes the eastern edge a solid wall. **Why:** Step 3 showed the east
edge is land (the African coast), so it must be closed. Leave `OBC_WEST`,
`OBC_NORTH`, `OBC_SOUTH` as `define` — those are your open boundaries.

> ⚠️ **WATCH — many blocks contain `OBC_EAST`.** `Ctrl-W` may land in a different
> configuration's block. Make sure you're editing the one in **your REGIONAL
> block** (near your `# define CANARY_12`). If unsure, search again to confirm
> you changed the right one, and that the other three `OBC_*` there are still
> `define`.

> For **your** region: close whichever edges your mask (Step 3) showed as land.
> This must match the `obc_dict` you wrote in Step 4.

Save (`Ctrl-O`, Enter) and exit (`Ctrl-X`). Then confirm your edits:

```bash
grep -nE "define CANARY_12|define ONLINE|OBC_EAST|OBC_WEST|OBC_NORTH|OBC_SOUTH|undef  TIDES|undef  USE_CALENDAR" cppdefs.h | head
```

✅ **CHECK** — `CANARY_12` and `ONLINE` are `define`d; `OBC_EAST` is `undef`, the
other three `OBC_*` are `define`d; `TIDES` and `USE_CALENDAR` are `undef` (already
off in the template — good: we're not using tides, and calendar-off is the mode
forecasts use).

---

## Step 9 — Edit `param.h` BY HAND (the grid size)

`param.h` tells the model how big your grid is — and this must match
`croco_grd.nc`. Open it:

```bash
nano param.h
```

`Ctrl-W`, type `YOUR REGIONAL CONFIG`, Enter. You'll land near this block:

```
#  elif defined GIBRALTAR_VHR5
       parameter (LLm0=348, MMm0=198,  N=40)
# else
      parameter (LLm0=xx,   MMm0=xx,   N=xx)   ! YOUR REGIONAL CONFIG
# endif
```

Add a new branch **just above the `# else` line**, so the block becomes:

```
#  elif defined GIBRALTAR_VHR5
       parameter (LLm0=348, MMm0=198,  N=40)
# elif defined  CANARY_12
      parameter (LLm0=79,   MMm0=121,   N=50)   ! Canary_12  81x123
# else
      parameter (LLm0=xx,   MMm0=xx,   N=xx)   ! YOUR REGIONAL CONFIG
# endif
```

**What:** this tells the model your grid is 79×121 (interior points) with 50
vertical levels. **Why:** the numbers come from Step 2 (`xi_rho=81 → LLm0=79`,
`eta_rho=123 → MMm0=121`), and `N=50` matches your `sigma_params`. The name
`CANARY_12` must be **identical** to the one you set in `cppdefs.h`.

> ⚠️ **WATCH — the new `# elif` goes ABOVE `# else`, never below it.** An `# elif`
> after `# else` is a compile error. Put your two lines between the
> `GIBRALTAR_VHR5` block and the `# else`.

Save (`Ctrl-O`, Enter), exit (`Ctrl-X`), and verify the model will pick up your
numbers:

```bash
cpp -DREGIONAL -DCANARY_12 param.h 2>/dev/null | grep "parameter (LLm0" | head
```

✅ **CHECK** — it prints `parameter (LLm0=79, MMm0=121, N=50)` (your numbers). If
it shows `xx` or a BENGUELA number, your branch name or placement is off — reopen
and fix.

---

## Step 10 — Edit `croco.in` BY HAND (the config-specific run settings)

`croco.in` is the model's run recipe. For the **common** preparation you set only
the config-specific values here; the run-length, initial/boundary file names, and
the online path are set when you actually run (Phase 3's manual test, or the
operational driver, patch them). Open it:

```bash
nano croco.in
```

### 10.1 — Title

`Ctrl-W`, `BENGUELA TEST`, Enter. Change the title line to your config's name:

```
        CANARY_12 FORECAST
```

Cosmetic, but keeps configs identifiable.

### 10.2 — The S-coordinate (check it matches)

`Ctrl-W`, `S-coord`, Enter. The line below should read:

```
           7.0d0     2.0d0      200.0d0
```

**Confirm** it's `7.0 / 2.0 / 200.0` — these are `theta_s / theta_b / hc`, and
they **must equal** your `sigma_params` from Step 4. The template usually already
has these — check, don't assume.

### 10.3 — The sponge (remove the placeholders)

`Ctrl-W`, `X_SPONGE`, Enter. The line **below** the header may show `XXX  XXX`.
Change it to real numbers:

```
                    50000.            400.
```

**What:** a 50 km "sponge" band near the open boundaries that absorbs outgoing
waves so they don't reflect back inward. `50000.` is its width in metres (≈5–6
cells at 1/12°); `400.` is the peak viscosity (m²/s). **Why:** the template
leaves `XXX` placeholders that would make CROCO error — you must set real values.
(Finer grids use smaller numbers.)

Save (`Ctrl-O`, Enter), exit (`Ctrl-X`), and confirm no placeholder remains:

```bash
grep -n "XXX" croco.in && echo "STILL HAS XXX — fix it" || echo "no XXX left — good"
```

> The `time_stepping`, `initial`, `boundary`, and `online` lines are set at run
> time (Phase 3). The many `diagnostics`, `floats`, `stations`, `psource`,
> `sediment`, `biology`, `wkb_*` sections are inert unless their CPP switch is on,
> so you can ignore them for this configuration.

---

## Step 11 — Edit `jobcomp` BY HAND (where the source lives)

`jobcomp` is the build script; it needs to know where CROCO's source code is.
Open it:

```bash
nano jobcomp
```

`Ctrl-W`, type `SOURCE1=`, Enter. You'll find:

```
SOURCE1=../croco/OCEAN
```

Change it to your actual source path (the clean new-repo path):

```
SOURCE1=/home/<you>/seaforward/code/croco/OCEAN
```

(Replace `<you>` with your username, or write `${HOME}/seaforward/code/croco/OCEAN`.)

**What:** tells the compiler where the model's `.F` source files are. **Why:** the
default `../croco/OCEAN` is a relative path that doesn't exist in your layout.
`jobcomp` finds the NetCDF library automatically via `nf-config` (which points at
`opt_seq` after you sourced `env.sh`), so there are **no NetCDF paths to
hand-edit**.

Save (`Ctrl-O`, Enter), exit (`Ctrl-X`).

---

## Step 12 — Compile (build the program)

This turns the source + your four edited files into an executable called `croco`.
It's a command, not an edit — but one detail matters a lot.

First, **stage** your edited config files from the recipe folder into the run
folder (where the build happens):

```bash
cd ${FCAST}
cp ${CONFIG_DIR}/{cppdefs.h,param.h,croco.in,jobcomp} .
```

Then set the compile environment and build. **Compile outside conda** so the
system linker uses your `opt_seq` NetCDF, not conda's:

```bash
conda deactivate                 # leave conda for the link step
source ~/seaforward/env.sh       # ensures opt_seq's nf-config + compilers are set
which nf-config                  # must show .../seaforward/opt_seq/bin/nf-config
./jobcomp 2>&1 | tee compile.log | tail -40
```

**Why `conda deactivate` first:** conda ships its own NetCDF, and if it's ahead
on the path the build fails with a confusing `libcurl` / `CURL_OPENSSL` error.
Leaving conda lets the system linker use your `opt_seq` build. Sourcing `env.sh`
keeps `opt_seq/bin` on `PATH` and the compilers set.

> ⚠️ **WATCH — `which nf-config` must show `opt_seq`, not a conda path.** If it
> shows conda, run `conda deactivate`, `source ~/seaforward/env.sh`, and re-check
> before `./jobcomp`.

✅ **CHECK** — after a few minutes you see the CROCO ASCII logo and **`CROCO is
OK`**, and a `croco` program appears:

```bash
ls -lh ${FCAST}/croco
```

---

## Step 13 — Run it once to prove the config

Compiling only proves the code builds — it doesn't prove your grid, boundaries,
and data actually run. So do **one** manual run here. (The operational driver in
Phase 3 does this automatically every day; this single run is the by-hand proof.)

A single run needs four run-time lines set in `croco.in` — the driver would patch
these for you, but for this one manual run you set them by hand. Still in
`${FCAST}`, with today's dated file names:

```bash
cd ${FCAST}
TODAY=$(date -u +%Y%m%d)

# how long / what timestep: NTIMES = (spin-up+forecast days)*86400/dt = (2+5)*86400/300 = 2016
sed -i '/^time_stepping:/{n; s/.*/                2016     300       60      1/}' croco.in

# initial condition (NRREC=1 = start fresh from this file)
sed -i "/^initial:/{n; n; s|.*|    CROCO_FILES/croco_ini_MERCATOR_${TODAY}_00.nc|}" croco.in

# boundary file
sed -i "/^boundary:/{n; s|.*|    CROCO_FILES/croco_bry_MERCATOR_${TODAY}_00.nc|}" croco.in

# online forcing block: dummy dates + the for_croco path
sed -i '/^online:/{n;   s/.*/           9999   1      24            9999     1/}' croco.in
sed -i "/^online:/{n; n; s|.*|    ${FCAST}/downloaded_data/GFS/for_croco/|}" croco.in
```

> **Why these values.** `dt=300` s and `NTIMES=2016` run 7 days (2 spin-up + 5
> forecast) as one continuous simulation. `9999 1 24 9999 1` is the dummy-date
> convention that pairs with the `Y9999M01` forcing files (24 = hourly records).
> With `USE_CALENDAR` off (the regional default), CROCO ignores real calendar
> dates and just steps through the records — so you don't hand-edit real dates
> here.

> **Leave `start_date` / `end_date` alone.** You'll see lines like
> `start_date: 2000-01-01 00:00:00` in `croco.in`. Because `USE_CALENDAR` is off,
> CROCO **ignores** them — they have no effect on the run, so there's nothing to
> change. (The operational driver in Phase 3 does fill them in per phase, purely
> for bookkeeping; the model still ignores them when the calendar is off.)

Now run the model (outside conda, same linker reason as compiling):

```bash
cd ${FCAST}
conda deactivate
source ~/seaforward/env.sh
./croco croco.in 2>&1 | tee run.log | tail -60
```

**What to watch:** it reads the grid, initial, boundary and weather files
(`GET_INITIAL`, `GET_BRY`, `ONLINE_BULK -- Read file`), then a table of steps
counting toward 2016. The kinetic-energy column should stay small and steady (not
grow), and `trd` should be `0`.

✅ **CHECK** — it ends with **`MAIN: DONE`** and writes the outputs:

```bash
ls -lh ${CF}/croco_his.nc ${CF}/croco_avg.nc
tail -6 run.log
```

You should see `croco_his.nc` (history) and `croco_avg.nc` (averages). The
`IEEE_UNDERFLOW` note at the very end is **harmless**. **Your configuration is now
proven** — it builds *and* runs.

> **If it crashes with `Abnormal termination: netCDF INPUT`** right after "Open
> Meteo file" — it's the GFS longitude issue; redo Step 6.
> **If numbers go `NaN` / it says `BLOW UP`** — an instability: recheck the open
> boundaries (Step 3) match the mask, and that the timestep isn't too large.

---

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

> **If this is a new region (not Canary_12):** the operational driver
> (`forecast/run_forecast_today.sh`) is provided set up for Canary_12. Before you
> run it in Phase 3, update its `CONFIG_NAME`, `EXTENTS` (your download box), and
> `FIX_GFS_LON` to match the config you just built — otherwise it runs Canary_12,
> not your region. Details in Phase 3 §B.4.

---

## What you change for your own region

When you build a different region, these are the only things that differ:

| Step / file | What you change | Set from |
|---|---|---|
| Step 0 | `CONFIG_NAME`, box, `EXTENTS` | your chosen region |
| Step 3 | which boundaries are open/closed | the land mask |
| Step 4 `crocotools_param.py` | `obc_dict`, `sigma_params`, `inputdata` | Step 3 + your vertical choice |
| Step 8 `cppdefs.h` | config name, `OBC_*`, forcing switch | Steps 0 and 3 |
| Step 9 `param.h` | `LLm0`, `MMm0`, `N` | Step 2 grid size |
| Step 10 `croco.in` | title, sponge (S-coord to match) | your setup |
| Step 11 `jobcomp` | `SOURCE1` | your CROCO source path |

Everything else — downloading data, building the grid, compiling — is the same
every time.

---

## The consistency rules to remember

Three sets of numbers must agree across files, or the run fails or is wrong:

1. **Grid size:** `croco_grd.nc` (`xi_rho`,`eta_rho`) → `param.h`
   (`LLm0=xi_rho−2`, `MMm0=eta_rho−2`).
2. **Vertical grid:** `sigma_params` (`crocotools_param.py`) = S-coord
   (`croco.in`) = `N` (`param.h`).
3. **Boundaries:** the mask (Step 3) = `obc_dict` (`crocotools_param.py`) =
   `OBC_*` (`cppdefs.h`) = what the boundary file contains.

If a run misbehaves, check these three first — most problems are one of them
disagreeing.