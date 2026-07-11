# SEA-FORWARD — Phase 4: Building and Running a Hindcast — Hand-Edit Edition

A **hindcast** reconstructs the ocean for a **past** period, rather than
predicting the future. The model and the workflow are the same as the forecast;
what changes is the **data**:

| | Forecast (Phases 2–3) | Hindcast (this phase) |
|---|---|---|
| Ocean source | Mercator analysis-forecast (anfc) | **GLORYS** reanalysis (CMEMS) |
| Atmosphere source | GFS (online) | **ERA5** reanalysis (online, ECMWF format) |
| Time direction | today → today+N | a chosen past window |
| Track folder | `forecast/` | `hindcast/` |
| Time origin `Yorig` | 2000 | **1993** (GLORYS/reanalysis convention) |

Because the grid, the config files, and the run mechanics are the same skeleton
as Phase 2, this document focuses on **what's different for a hindcast** and
points back to Phase 2 for the shared steps. By the end you'll have built a
GLORYS+ERA5 hindcast config for a region, proven a single run, and run a
multi-cycle hindcast (2-day spin-up + 5-day hindcast per cycle) over a past
window — including one that **crosses the year boundary**.

The worked example is again **Canary_12** (22°W–15.5°W, 14°N–24°N, 1/12°), for
**December 2025 → January 2026**.

> **Prerequisites:** Phase 1 (Setup) done, and you've read Phases 2–3 (the
> hindcast reuses their steps and vocabulary). You need a **CDS account + API
> key** for ERA5 (explained in §3).

> **How to read this guide** — same conventions as Phase 2: `nano` hand-edits
> with **What / Why**, `✅ CHECK`, `⚠️ WATCH`.

---

## The idea: same model, reanalysis data, run in cycles

A hindcast forces the same CROCO model with **reanalysis** products — best
estimates of the *past* ocean (GLORYS) and atmosphere (ERA5). You run a long
past period in **cycles**: each cycle is a short model run (here a 2-day spin-up
followed by a 5-day hindcast), and cycles tile the period. Every cycle re-starts
its ocean state from GLORYS, so the reconstruction stays anchored to the
reanalysis rather than drifting.

The SEA-FORWARD hindcast tools are exposed through the same CLI as the forecast
(`seaforward.py`), with a parallel set of **`*_hindcast`** subcommands. You built
and proved them in this phase.

---

## Step 0 — Session ritual (the HINDCAST track)

```bash
source ~/seaforward/env.sh                 # shared paths + compilers + NetCDF
source ~/seaforward/hindcast/track.sh      # pick the HINDCAST track
conda activate seaforward
```

`hindcast/track.sh` points `CROCO_CONFIGS_ROOT` at `hindcast/configs` and
`CROCO_RUNS_ROOT` at `hindcast/scratch` — so everything you build lives under
`hindcast/`, fully separate from the forecast.

Set the region + hindcast variables:

```bash
export CONFIG_NAME=Canary_12
export CONFIG_DIR=${CROCO_CONFIGS_ROOT}/${CONFIG_NAME}   # hindcast/configs/Canary_12
export HCAST=${CROCO_RUNS_ROOT}/${CONFIG_NAME}           # hindcast/scratch/Canary_12
export CF=${HCAST}/CROCO_FILES

export LON_MIN=-22.0; export LON_MAX=-15.5      # grid box
export LAT_MIN=14.0;  export LAT_MAX=24.0
export RES=$(echo "1/12" | bc -l)
export EXTENTS=-23.5,-14.0,12.5,25.5           # GLORYS download box (grid + ~1.5°)
export ERA5_BOX="-22,-15.5,14,24"              # ERA5 grid box (a 2° margin is added)
export YORIG=1993                               # reanalysis time origin — NOT 2000

mkdir -p ${CONFIG_DIR} ${CF} \
         ${HCAST}/downloaded_data/GLORYS \
         ${HCAST}/downloaded_data/ERA5/for_croco
```

> ⚠️ **`Yorig=1993` for the hindcast.** GLORYS and ERA5 use 1993 as the time
> origin (the start of the altimetry era the reanalysis covers). Use **1993**
> consistently across the ini, bry, ERA5 convert, and the run — mixing origins
> corrupts the time axis.

---

## Step 1 — Build the grid (its own, in the hindcast track)

The hindcast builds its **own** grid so the track is self-contained — even though
for the same region it comes out identical to the forecast's. This is Phase 2
Steps 1–2, run under the hindcast track:

```bash
cd ${SEAFORWARD}/config
python3 make_grid_config.py "${CONFIG_NAME}" \
        ${LON_MIN} ${LON_MAX} ${LAT_MIN} ${LAT_MAX} ${RES} ${RES}

cd ${CROCO_PYTOOLS_DIR}/prepro
python3 make_grid.py ${CONFIG_DIR}/grid.ini 2>&1 | tail -20

ncdump -h ${CF}/croco_grd.nc | grep -E "xi_rho|eta_rho"
```

✅ `xi_rho = 81`, `eta_rho = 123` (→ `LLm0=79, MMm0=121`), written to
`hindcast/scratch/Canary_12/CROCO_FILES/croco_grd.nc`.

---

## Step 2 — The hindcast `crocotools_param.py`

Create the pre-processing parameters in `CF`. It's like the forecast's, with
GLORYS-specific values:

```bash
nano ${CF}/crocotools_param.py
```

```python
inputdata     = 'mercator'                                  # GLORYS reads through the 'mercator' reader
Nzgoodmin     = 4
multi_files   = False
tracers       = ['temp', 'salt']
croco_grd     = 'croco_grd.nc'
sigma_params  = dict(theta_s=7, theta_b=2, N=50, hc=200)    # same vertical grid as forecast
ini_prefix    = 'croco_ini_GLORYS'
bry_prefix    = 'croco_bry_GLORYS'
obc_dict      = dict(south=1, west=1, east=0, north=1)      # same Canary boundaries
cycle_bry     = 0
```

**Line by line — what's different from the forecast:**

- `inputdata = 'mercator'` — **not** `'glorys'`. GLORYS from CMEMS uses the same variable names as Mercator (`zos, thetao, so, uo, vo`), so it reads through the reader's `'mercator'` branch. (Verified: the reader `ibc_class.py` maps `'mercator'` → `ssh:zos, temp:thetao, salt:so, u:uo, v:vo` — exactly GLORYS.)
- `ini_prefix`/`bry_prefix` → `GLORYS` so hindcast files are distinct from forecast `MERCATOR` ones.
- `sigma_params`, `obc_dict` — **identical** to the forecast (same grid, same boundaries).

> ⚠️ **WATCH — it's `'mercator'`, not `'glorys'`.** There is no `'glorys'` key in
> the reader. GLORYS's CMEMS variable names match the `'mercator'` mapping, so
> that's the one to use. `'mercator_croco'` is a *different* mapping (renamed
> variables) — not your raw GLORYS.

---

## Step 3 — Set up ERA5 access (CDS account + API key) *(once per machine)*

ERA5 comes from the **Copernicus Climate Data Store (CDS)** — a different service
from CMEMS, with its own free account and API key. This is a one-time setup.
Here's the whole thing, step by step.

### 3.1 Create a free CDS account

1. Go to **https://cds.climate.copernicus.eu** and click **Login / register**
   (top right). Create an account (email + password), then confirm via the email
   they send and log in.

### 3.2 Get your Personal Access Token

2. While logged in, open your **profile page**:
   **https://cds.climate.copernicus.eu/profile**
3. Find the section **"Personal Access Token"** (sometimes shown under an "API
   key" / "How to use the CDS API" heading). It shows two lines you'll need —
   something like:
   ```
   url: https://cds.climate.copernicus.eu/api
   key: 12345678-abcd-1234-efgh-1234567890ab
   ```
   The long string after `key:` is your token. **Treat it like a password** — keep
   it secret.

> **Note (the 2024–25 CDS change):** the CDS moved to a new system. The URL is now
> `https://cds.climate.copernicus.eu/api` (not the old `.../api/v2`), and the key
> is a single **token** (no `UID:APIKEY` colon form). If a tutorial shows the old
> two-part key with a colon, it's outdated — use the single-token form from your
> profile.

### 3.3 Create the `~/.cdsapirc` file

4. Create the credentials file in your home directory (the `cdsapi` library reads
   it automatically):

```bash
nano ~/.cdsapirc
```

Paste **exactly** the two lines from your profile (with *your* token):

```
url: https://cds.climate.copernicus.eu/api
key: 12345678-abcd-1234-efgh-1234567890ab
```

**What:** `url` is the CDS API endpoint; `key` is your personal token. **Why
here:** `cdsapi.Client()` looks for `~/.cdsapirc` by default, so every ERA5
download finds your credentials with no extra flags.

Save (`Ctrl-O`, Enter), exit (`Ctrl-X`). Lock the permissions (it holds a secret):

```bash
chmod 600 ~/.cdsapirc
```

### 3.4 Install the client (if not already)

The `seaforward` conda env should already have `cdsapi`. If not:

```bash
pip install "cdsapi>=0.7.2"      # 0.7.2+ needed for the new CDS system
```

### 3.5 Accept the ERA5 licence (one-time, per dataset)

5. You **must** accept the dataset's terms once, from the website, or downloads
   fail with a licence error. Open the ERA5 single-levels dataset:
   **https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels**
   → go to the **Download** tab → scroll to the bottom → under **Terms of use**,
   click **Accept**. (Do this once; it's remembered for your account.)

### 3.6 Verify it's all set

```bash
python -c "import cdsapi; print('cdsapi OK')"
ls -la ~/.cdsapirc && echo ".cdsapirc present"
python - << 'EOF'
import cdsapi
cdsapi.Client()          # reads ~/.cdsapirc; errors here mean bad url/key
print("CDS client initialised OK")
EOF
```

✅ All three should succeed: `cdsapi OK`, the `.cdsapirc` listing, and
`CDS client initialised OK`.

> ⚠️ **If `.cdsapirc` is missing or wrong** you'll get an *authentication* error
> when downloading — redo 3.2–3.3 (token copied correctly, new URL form). **If you
> get a *licence* error** for ERA5 despite the key working, you skipped 3.5 —
> accept the terms on the dataset page and retry.

---

## Step 4 — Download the ocean (GLORYS) — `download_ocean_hindcast`

The CLI has a hindcast ocean subcommand that pulls **GLORYS monthly files**
(`YYYY_MM.nc`, one file per month containing that month's daily records):

```bash
cd ${SEAFORWARD}
python seaforward.py download_ocean_hindcast \
    --domain="${EXTENTS}" \
    --month_start 2025-12 --month_end 2026-01 \
    --product_id cmems_mod_glo_phy_my_0.083deg_P1D-m \
    --outputDir ${HCAST}/downloaded_data/GLORYS
```

**What each flag is:**

- `--domain` — the download box (negative lons → use the `=` form, as in theforecast).
- `--month_start/--month_end` — the months to fetch (inclusive).
- `--product_id` — the CMEMS GLORYS dataset. **`..._P1D-m`** is the **daily** reanalysis (day-to-day variability); `..._P1M-m` is monthly means. Use daily for a real hindcast.

> **Which GLORYS product / does it cover my dates?** The daily multiyear
> reanalysis `cmems_mod_glo_phy_my_0.083deg_P1D-m` covers 1993 → ~present
> (verify the current end date on the CMEMS product page). For very recent dates
> beyond the reanalysis, you'd switch to the interim (`myint`) or the anfc
> analysis. Check coverage with `copernicusmarine describe --dataset-id <id>` if
> unsure.

✅ **CHECK** — one file per month appears:

```bash
ls -lh ${HCAST}/downloaded_data/GLORYS/
ncdump -h ${HCAST}/downloaded_data/GLORYS/2025_12.nc | grep -E "time = |zos|thetao|depth ="
```

You want `2025_12.nc`, `2026_01.nc` with `time = 31`/`time = 31` (daily records),
`depth = 50`, and the ocean variables. (Re-running skips months already present.)

> **Neighbour months for boundaries.** Boundary conditions need ocean data
> slightly *beyond* the run window. For a cycle near a month edge (e.g. Dec 30 →
> Jan 4), the tools read **both** `2025_12.nc` and `2026_01.nc`. So download the
> month before and after your period too. The operational driver does this
> automatically.

---

## Step 5 — Download the atmosphere (ERA5) — `download_atmosphere_hindcast`

The hindcast atmosphere subcommand downloads ERA5 from CDS **and** converts it to
CROCO online-forcing format in one command:

```bash
cd ${SEAFORWARD}
python seaforward.py download_atmosphere_hindcast \
    --domain="${ERA5_BOX}" \
    --month_start 2025-12 --month_end 2026-01 \
    --outputDir ${HCAST}/downloaded_data/ERA5
```

**What it does (two internal stages):**

1. **request** — pulls raw ERA5 (10 variables: lsm, sst, tp, strd, ssr, t2m, q, u10, v10, msl) from CDS into `ERA5/raw/`. A 2° margin is added around the box.
2. **convert** — reshapes raw ERA5 into CROCO online forcing in `ERA5/for_croco/`, applying unit conversions (precip → kg m⁻² s⁻¹, radiation → W m⁻²).

> **CDS queues.** ERA5 requests queue on CDS's servers; a month is usually a few
> minutes but can be longer under load. The command handles request→convert
> automatically.

✅ **CHECK** — 10 converted files per month in `for_croco/`, named
`<VAR>_Y<year>M<month>.nc`:

```bash
ls ${HCAST}/downloaded_data/ERA5/for_croco/ | sort
```

You want, per month: `T2M_ Q_ TP_ SSR_ STRD_ U10M_ V10M_ msl_ SST_ LSM_` with the
`_Y2025M12.nc` / `_Y2026M01.nc` suffix.

> ⚠️ **WATCH — zero-pad the month (`M01`, not `M1`).** CROCO's ERA5 online reader
> expects a **two-digit** month for Jan–Sep (`M01`…`M09`) by default. The convert
> writes `str(imonth).zfill(2)` so single-digit months come out padded. If you
> ever see files like `T2M_Y2026M1.nc` (unpadded), rename them:
> `for f in *Y2026M1.nc; do mv "$f" "${f%Y2026M1.nc}Y2026M01.nc"; done`
> (Months ≥10 are always two-digit, so December `M12` is fine.)

> **Skip-existing.** The ERA5 request re-downloads unless the raw files already
> exist; the wrapper regenerates `era5_crocotools_param.py` from your args each
> run (so you never hand-edit that param file).

---

## Step 6 — Build the initial condition — `make_ini_hindcast`

The hindcast ini subcommand builds the ocean's starting state from GLORYS for a
**date** (it picks the right monthly file, and reads across months if the window
needs it):

```bash
cd ${SEAFORWARD}
python seaforward.py make_ini_hindcast \
    --input_dir ${HCAST}/downloaded_data/GLORYS \
    --output_dir ${CF} \
    --date 2025-12-02 --Yorig ${YORIG}
```

**Flags:** `--date YYYY-MM-DD` (the IC date), `--Yorig 1993`. It reads
`crocotools_param.py` + `croco_grd.nc` from `--output_dir`.

✅ **CHECK** — writes `croco_ini_GLORYS_Y2025M12D02.nc` with `s_rho = 50` and
`scrum_time` in "seconds since **1993**-01-01":

```bash
ls -lh ${CF}/croco_ini_GLORYS*.nc
ncdump -h ${CF}/croco_ini_GLORYS*.nc | grep -E "s_rho = |since|temp"
```

---

## Step 7 — Build the boundaries — `make_bry_hindcast` (cross-year capable)

The hindcast bry subcommand takes a **date window** and reads whatever monthly
GLORYS files it spans — so a window crossing Dec→Jan reads both months
automatically:

```bash
cd ${SEAFORWARD}
python seaforward.py make_bry_hindcast \
    --input_dir ${HCAST}/downloaded_data/GLORYS \
    --output_dir ${CF} \
    --start_date 2025-12-02 --end_date 2025-12-30 --Yorig ${YORIG}
```

**Flags:** `--start_date`/`--end_date` (full dates), `--Yorig 1993`. Internally it
gathers the monthly files spanning the window (± a day buffer) and hands the list
to the interpolation, which concatenates them across time. It processes the
**open** boundaries (south, west, north) and **skips east** (your `obc_dict`).

✅ **CHECK** — writes `croco_bry_GLORYS_Y...D..._to_Y...D....nc` with `bry_time`
referenced to 1993 and the open-boundary variables (no `_east`):

```bash
ls -lh ${CF}/croco_bry_GLORYS_*.nc
ncdump -h ${CF}/croco_bry_GLORYS_*to*.nc | grep -E "bry_time = |since|_south|_west|_north"
```

> **Cross-year proof.** A window like `--start_date 2025-12-30 --end_date
> 2026-01-04` reads **both** `2025_12.nc` and `2026_01.nc` and stitches them —
> the file name records the span, e.g. `..._Y2025M12D30_to_Y2026M01D04.nc`.

---

## Step 8 — The CROCO config files (Phase 2, with ERA5 differences)

Copy the templates into the hindcast config folder (Phase 2 Step 7), then edit
the four files **by hand in `nano`**. Only the ERA5 differences are spelled out
here; everything else is exactly Phase 2.

```bash
cd ${CONFIG_DIR}
cp ${CROCO_MODEL_DIR}/OCEAN/{cppdefs.h,param.h,croco.in,jobcomp} .
for f in cppdefs.h param.h croco.in jobcomp; do cp $f $f.orig; done
```

> **nano reminders** (same as Phase 2): `Ctrl-W` = search (type text, Enter, it
> jumps there), edit with arrow keys, `Ctrl-O` then Enter = save, `Ctrl-X` = exit.

### 8.1 `cppdefs.h` — config name, boundaries, and **ERA5 forcing**

```bash
nano cppdefs.h
```

**Edit 1 — config name.** `Ctrl-W`, type `BENGUELA_LR`, Enter. Change the name on
that line to `CANARY_12`. (Search again with `Ctrl-W` `BENGUELA_LR` for a second
occurrence and change it too, if present.)

- **What:** names your configuration. **Why:** `param.h`, `croco.in`, and jobcomp all key off this name.

**Edit 2 — ONLINE + ERA5.** `Ctrl-W`, type `undef  ONLINE`, Enter — this lands in
**your** regional block (the one just below the `BULK_*` lines). Set the block to:
```
#  define ONLINE
#  ifdef ONLINE
#   undef  AROME
#   define ERA_ECMWF
#  endif
```
- **What:** turns on online forcing and selects the **ERA5 (ECMWF)** format.
  **Why different from forecast:** the forecast used GFS (`ERA_ECMWF` undef); the
  hindcast uses ERA5 (`ERA_ECMWF` **define**).

**Edit 3 — close the east boundary.** `Ctrl-W`, type `define OBC_EAST`, Enter.
Change `define` to `undef  ` on that line:
```
# undef  OBC_EAST
```
- **What:** closes the eastern boundary (the African coast). **Why:** same Canary
  boundary choice as the forecast — open south/west/north, closed east.

Save: `Ctrl-O`, Enter. Exit: `Ctrl-X`.

✅ **Verify:**
```bash
grep -nE "define +CANARY_12|define +ONLINE|define +ERA_ECMWF|undef +AROME|OBC_EAST|OBC_WEST|OBC_NORTH|OBC_SOUTH" cppdefs.h
```
Want: `CANARY_12` define, `ONLINE` define, `ERA_ECMWF` define, `AROME` undef,
`OBC_EAST` undef, the other three OBC define.

> ⚠️ **WATCH — edit the ONLINE block in YOUR regional config section.** cppdefs.h
> has several `ONLINE` blocks for different example configs; make sure you edit
> the one near your `# define CANARY_12` (the one with the `BULK_*` settings), not
> another config's block. If the verify grep doesn't show `ONLINE`/`ERA_ECMWF`
> defined, you edited the wrong block — reopen and find the right one.

> **Pressure (`msl`) is optional.** CROCO only reads `msl` if `READ_PATM` is
> defined. Leave `READ_PATM` **undef** for a basic run (you have the `msl` file;
> enabling it is a later refinement).

### 8.2 `param.h` — grid size (identical to forecast)

```bash
nano param.h
```

`Ctrl-W`, type `YOUR REGIONAL CONFIG`, Enter. Add your branch **above** the
`# else` line:
```
# elif defined  CANARY_12
      parameter (LLm0=79,   MMm0=121,   N=50)   ! Canary_12 hindcast
```
- **What:** sets the interior grid size. **Why these numbers:** they're
  `xi_rho−2`, `eta_rho−2` from your grid (81→79, 123→121), and `N=50` matches
  `sigma_params`.

Save `Ctrl-O` Enter, exit `Ctrl-X`. Verify:
```bash
cpp -DREGIONAL -DCANARY_12 param.h 2>/dev/null | grep "parameter (LLm0"
```
✅ Expect `parameter (LLm0=79, MMm0=121, N=50)`.

### 8.3 `jobcomp` — source path (identical to forecast)

```bash
nano jobcomp
```

`Ctrl-W`, type `SOURCE1=`, Enter. Set that line to your CROCO source:
```
SOURCE1=/home/<you>/seaforward/code/croco/OCEAN
```
(replace `<you>` with your username). Save `Ctrl-O` Enter, exit `Ctrl-X`.

---

## Step 9 — `croco.in` for the ERA5 hindcast

The one section that differs from the forecast is **`online:`**, which uses the
ERA5 form (real byear/bmonth, not the GFS `9999` dummy dates). For a single manual
test run (7 days, Dec 2→9, ini at D02):

```bash
nano croco.in
```

Make the Phase 2 Step 10 edits (title, S-coord, sponge) **plus** these. Each is a
`Ctrl-W` search, then edit the line *below* the keyword.

**Title.** `Ctrl-W` `BENGUELA TEST`, Enter. Change line 2 to:
```
        CANARY_12 HINDCAST
```

**time_stepping** — `Ctrl-W` `720`, Enter (or search `time_stepping`). Set the
values line (7 days at dt=300 → `NTIMES = 7×86400/300 = 2016`):
```
                2016      300      60      1
```

**initial** (NRREC=1) — `Ctrl-W` `croco_ini.nc`, Enter. Change the filename line to
your GLORYS ini (leave the `1` on the NRREC line above it):
```
    CROCO_FILES/croco_ini_GLORYS_Y2025M12D02.nc
```

**boundary** — `Ctrl-W` `croco_bry.nc`, Enter. Change the filename line to your
GLORYS bry:
```
    CROCO_FILES/croco_bry_GLORYS_Y2025M12D01_to_Y2025M12D10.nc
```
> ⚠️ Build this bry with a window that extends **one day past** the run on each
> end (so Dec 1 → Dec 10 for a Dec 2 → Dec 9 run). CROCO needs a boundary record
> bracketing every timestep — otherwise it errors at the last step with
> `cannot read variable 'bry_time'`. See Troubleshooting. (Generate it with
> `make_bry_hindcast --start_date 2025-12-01 --end_date 2025-12-10`.)

**sponge** — `Ctrl-W` `X_SPONGE`, Enter. Change the values line (the `XXX XXX`) to:
```
                    50000.            400.
```

**online (ERA5 form)** — `Ctrl-W` `byear  bmonth`, Enter. Set the two lines below
the `online:` header — the numbers line, then the data-path line:
```
online:    byear  bmonth recordsperday byearend bmonthend / data path
           2025   12      24            2025     12
    /home/<you>/seaforward/hindcast/scratch/Canary_12/downloaded_data/ERA5/for_croco/
```
(replace `<you>` with your username).

- **What the online fields mean:** `byear=2025 bmonth=12` (window start),
  `recordsperday=24` (ERA5 is **hourly**), `byearend/bmonthend` (window end).
  CROCO builds `<path><VAR>_Y<year>M<month>.nc` (e.g. `T2M_Y2025M12.nc`) and reads
  across months if start/end differ.

Save: `Ctrl-O`, Enter. Exit: `Ctrl-X`.

✅ **Verify all edits:**
```bash
grep -nA1 "^time_stepping:" croco.in
grep -nA2 "^initial:" croco.in
grep -nA1 "^boundary:" croco.in
grep -nA1 "^sponge:" croco.in
grep -nA2 "^online:" croco.in
grep -n "XXX" croco.in && echo "STILL HAS XXX" || echo "no XXX left"
sed -n '2p' croco.in
```
Want: title `CANARY_12 HINDCAST`, time_stepping `2016 300 60 1`, initial → the
GLORYS ini with NRREC=1, boundary → the GLORYS bry, sponge `50000. 400.`, online
`2025 12 24 2025 12` + the ERA5 path, and no `XXX` left.

> **`start_date`/`end_date`** — as in the forecast, with `USE_CALENDAR` off these
> are ignored for the manual run; leave them. (CROCO prints a harmless
> `Unrecognized keyword: start_date DISREGARDED`.) The operational driver patches
> them per phase for bookkeeping.

Then **compile** (Phase 2 Step 12 — outside conda, `opt_seq` NetCDF: `conda
deactivate; source ~/seaforward/env.sh; which nf-config` must show `opt_seq`, then
`./jobcomp`) and **run** (Phase 2 Step 13: `./croco croco.in`). Success =
`CROCO is OK` at compile, then `MAIN: DONE` at run, producing `croco_his.nc` +
`croco_avg.nc`. That proves the hindcast config.

---

## Step 10 — The operational driver: cycling over a past period

`hindcast/run_hindcast_cycle.sh` automates the whole thing over a date range, in
**2-day spin-up + 5-day hindcast** cycles. It mirrors the forecast driver, with
GLORYS+ERA5 and a cycle loop.

### 10.1 What one cycle does (per cycle date T)

- **spin-up** (T−2 → T): `make_ini_hindcast` at T−2 + `make_bry_hindcast`
  T−2→T; run 2 days → `croco_rst.nc`.
- **hindcast** (T → T+5): ini = the spin-up **restart** (copied to
  `croco_ini.nc`, NRREC=1); `make_bry_hindcast` T→T+5; run 5 days →
  `croco_his.nc`/`croco_avg.nc`.
- then T advances by 5 days to the next cycle. **Each cycle re-inits from
  GLORYS** (not chained), keeping it anchored to the reanalysis.

The driver **auto-downloads** any missing GLORYS/ERA5 month for each cycle's
window, and its `patch_croco_in` sets the ERA5 online block automatically
(spanning months when a cycle crosses a boundary, e.g. `2025 12 24 2026 01`).

### 10.2 Settings at the top

```bash
CONFIG_NAME=Canary_12
START_DATE="2025-12-25"      # first cycle date T
NCYCLES=3                    # number of cycles
SPINUP_DAYS=2
HCAST_DAYS=5
YORIG=1993
EXTENTS="-23.5,-14.0,12.5,25.5"   # GLORYS box
ERA5_BOX="-22,-15.5,14,24"        # ERA5 box
```

> ⚠️ **Match the driver to your config** — same as the forecast driver, update
> `CONFIG_NAME`, `EXTENTS`, `ERA5_BOX` for a new region, or it runs Canary_12.

With these, the 3 cycles are:

| Cycle | T | spin-up | hindcast | note |
|---|---|---|---|---|
| 1 | 2025-12-25 | Dec 23→25 | Dec 25→30 | December |
| 2 | 2025-12-30 | Dec 28→30 | **Dec 30→Jan 4** | **crosses the year** |
| 3 | 2026-01-04 | Jan 2→4 | Jan 4→9 | January |

Cycle 2 is the interesting one: its hindcast window **Dec 30 → Jan 4** straddles
the year boundary, so it needs ocean and atmosphere data from **two** months.
Concretely, cycle 2 will:

- build its boundaries by reading **both** `2025_12.nc` **and** `2026_01.nc` GLORYS files and stitching them across the year (thanks to the date-based `make_bry_hindcast` from Step 7), and
- read **both** months' ERA5 online forcing — the driver sets the online block to `2025 12 24 2026 01` (start month → end month), so CROCO opens `..._Y2025M12.nc` and rolls over to `..._Y2026M01.nc` as the run crosses midnight on Dec 31.

This is exactly why the cross-month/cross-year support in Steps 6–7 matters — a
naive single-month tool would fail here.

### 10.3 Run it

```bash
cd ~/seaforward/hindcast
./run_hindcast_cycle.sh 2>&1 | tee hcast_3cycles.log
```

The `tee` keeps a full log in `hcast_3cycles.log` while you watch it live.

**What the console shows.** For each cycle you'll see a banner, then the four
stages. It looks like this (trimmed):

```
############################################################
# CYCLE 1/3  T=20251225
#   spin-up : 2025-12-23 -> 2025-12-25
#   hindcast: 2025-12-25 -> 2025-12-30
############################################################
>>> [1/4] build spin-up ini + bry (GLORYS) ...
    ... make_ini_hindcast: interpolates temp/salt/u/v onto 50 sigma levels ...
    ... make_bry_hindcast: south/west/north boundaries (east skipped) ...
>>> [2/4] run spin-up ...
    CANARY_12 HINDCAST
    ... timestep table, kinetic energy small & steady, trd column = 0 ...
    MAIN: DONE                         <-- spin-up finished, wrote croco_rst.nc
>>> [3/4] build hindcast bry (GLORYS) ...
    ... make_bry_hindcast for the 5-day window ...
>>> [4/4] run hindcast ...
    ... GET_INITIAL restarts from the spin-up; GET_BRY + ONLINE_BULK read ...
    MAIN: DONE                         <-- hindcast finished, wrote croco_his.nc
  cycle 20251225 done -> .../20251225/hcast/CROCO_FILES/croco_his.nc
```

**Each of the two model runs per cycle must end in `MAIN: DONE`.** Six
`MAIN: DONE` in total for three cycles (spin-up + hindcast each).

**Watching cycle 2 (the cross-year one) specifically.** When cycle 2 runs, look
for two tell-tales that the year-crossing worked:

1. In stage `[3/4]` the bry build prints that it's reading the GLORYS data because the window is Dec 29→Jan 5 (padded), `make_bry_hindcast` pulls in both `2025_12.nc` and `2026_01.nc`. The output filename records the span, e.g. `croco_bry_GLORYS_Y2025M12D29_to_Y2026M01D05.nc`.
2. In stage `[4/4]` the run header prints the online forcing months spanning the year, e.g. `Online forcing: first ... year 2025, month 12` and `last ... year 2026, month 1`, and as the run passes Dec 31 you'll see it open the January ERA5 file (`... T2M_Y2026M01.nc`).

If a cycle stops early instead of reaching `MAIN: DONE`, jump to Troubleshooting —
the most common first-run cause is the boundary window not extending past the run
(the `bry_time` / `SET_CYCLE` error), which the driver's ±1-day pad handles.

### 10.4 Where the results go — and how to check them

Each cycle writes a dated folder under `hindcast/model-runs/<CONFIG>/`:

```
hindcast/model-runs/Canary_12/20251225/
├── spinup/                 # the 2-day spin-up run
│   ├── croco.in            # patched for this phase (start/end, NTIMES, online)
│   ├── croco_spinup.out    # spin-up console log
│   └── CROCO_FILES/
│       ├── croco_ini.nc    # the spin-up IC (from GLORYS, at T-2)
│       ├── croco_bry.nc    # the spin-up boundaries
│       └── croco_rst.nc    # RESTART — handed to the hindcast phase as its IC
├── hcast/                  # the 5-day hindcast run
│   ├── croco.in
│   ├── croco_hcast.out     # hindcast console log
│   └── CROCO_FILES/
│       ├── croco_ini.nc    # = the spin-up restart (warm start)
│       ├── croco_bry.nc
│       ├── croco_his.nc    # THE HINDCAST HISTORY — what you keep
│       └── croco_avg.nc    # time-averaged fields
├── gen_spinup/CROCO_FILES/ # where the spin-up ini/bry were generated (dated names)
└── gen_hcast/CROCO_FILES/  # where the hindcast bry was generated
```

…and likewise `20251230/` (cycle 2) and `20260104/` (cycle 3).

> **Why `gen_*` and generic names both exist.** The generator writes dated files
> (e.g. `croco_ini_GLORYS_Y2025M12D23.nc`) into `gen_spinup/`; the driver then
> copies them into the run dir under the **generic** names `croco_ini.nc` /
> `croco_bry.nc` that `croco.in` points at. So the run dirs always use simple
> names, and `gen_*` keeps the provenance (which date each file was built for).

**✅ Verify all cycles succeeded** — check every hindcast produced a history file
and reached `MAIN: DONE`:

```bash
export CONFIG_NAME=Canary_12
export OUT=${SEA_FORWARD_ROOT}/hindcast/model-runs/${CONFIG_NAME}

for d in ${OUT}/*/; do
    tag=$(basename "$d")
    his="${d}hcast/CROCO_FILES/croco_his.nc"
    if [[ -f "$his" ]] && grep -q "MAIN: DONE" "${d}hcast/croco_hcast.out" 2>/dev/null; then
        echo "  ${tag}: ✅ hindcast DONE — $(du -h "$his" | cut -f1) croco_his.nc"
    else
        echo "  ${tag}: ❌ check ${d}hcast/croco_hcast.out"
    fi
done
```

✅ You want three lines, one per cycle, each `✅ hindcast DONE`.

**Peek at a result** (e.g. cycle 2's history — confirm it has real records and a
time axis crossing the year):

```bash
ncdump -h ${OUT}/20251230/hcast/CROCO_FILES/croco_his.nc | grep -E "time = |scrum_time|since"
```

**Stitch the cycles into one continuous hindcast.** Each `croco_his.nc` covers its
5-day window; concatenate them in time (they share the grid) with NCO's `ncrcat`:

```bash
# in time order: cycle1, cycle2, cycle3
ncrcat ${OUT}/20251225/hcast/CROCO_FILES/croco_his.nc \
       ${OUT}/20251230/hcast/CROCO_FILES/croco_his.nc \
       ${OUT}/20260104/hcast/CROCO_FILES/croco_his.nc \
       ${OUT}/canary12_hindcast_2025-12-25_to_2026-01-09.nc
```

(If `ncrcat` isn't installed: `conda install -c conda-forge nco` or
`sudo apt install nco`.) The result is one file spanning Dec 25 → Jan 9 that you
can plot or analyse as a single time series.

> **scratch vs model-runs** — same split as the forecast: the built config
> (binary, grid, downloaded data) stays in `hindcast/scratch/<CONFIG>/`; each
> cycle's *output* goes to `hindcast/model-runs/<CONFIG>/<T>/`. You can safely
> delete a `model-runs/<T>/` folder and re-run that cycle without touching the
> build.

---

## What you built (the hindcast CLI additions)

This phase added four hindcast subcommands to `seaforward.py`, parallel to the
forecast ones:

| Subcommand | Does |
|---|---|
| `download_ocean_hindcast` | GLORYS monthly reanalysis (CMEMS) → `YYYY_MM.nc` |
| `download_atmosphere_hindcast` | ERA5 (CDS) request **+** convert → `for_croco/` |
| `make_ini_hindcast` | GLORYS initial condition for a `--date` |
| `make_bry_hindcast` | GLORYS boundaries for a `--start_date/--end_date` window (cross-month) |

Plus the `hindcast/run_hindcast_cycle.sh` cycling driver.

---

## Forecast vs hindcast — the mental model

- **Same:** grid, mask, boundary decision, vertical coordinate, `param.h`,
  `jobcomp`, compiled binary mechanics, spin-up→run handoff, scratch/model-runs
  split.
- **Different:** ocean source (Mercator → **GLORYS**), atmosphere (GFS →
  **ERA5**, `ERA_ECMWF`), `Yorig` (2000 → **1993**), data by **month** (not one
  anfc file), month-padding for ERA5 (`M01`), and the driver cycles a **past**
  window instead of running "today."
- **Kept separate on disk:** `forecast/` and `hindcast/` each have their own
  `configs/`, `scratch/`, `model-runs/`, and `track.sh`.

---

## Quick reference — hindcast

```bash
source ~/seaforward/env.sh
source ~/seaforward/hindcast/track.sh
conda activate seaforward

# data (GLORYS + ERA5) for the period + neighbour months
python seaforward.py download_ocean_hindcast --domain="-23.5,-14.0,12.5,25.5" \
    --month_start 2025-12 --month_end 2026-01 \
    --product_id cmems_mod_glo_phy_my_0.083deg_P1D-m --outputDir ${HCAST}/downloaded_data/GLORYS
python seaforward.py download_atmosphere_hindcast --domain="-22,-15.5,14,24" \
    --month_start 2025-12 --month_end 2026-01 --outputDir ${HCAST}/downloaded_data/ERA5

# config: reuse Phase 2, but inputdata='mercator', ERA_ECMWF defined, Yorig=1993
# then cycle:
cd ~/seaforward/hindcast
./run_hindcast_cycle.sh
# results: hindcast/model-runs/<CONFIG>/<T>/hcast/CROCO_FILES/croco_his.nc
```

---

## Troubleshooting (hindcast-specific)

- **ERA5 "authentication" / licence error** — set up `~/.cdsapirc` and accept the
  ERA5 dataset licence on the CDS site (Step 3).
- **CROCO can't find an ERA5 file** — month padding: CROCO wants `M01` for Jan–Sep. Rename `M1`→`M01` (Step 5 WATCH) and confirm the convert uses `.zfill(2)`.
- **GLORYS empty / date out of range** — the `my` reanalysis has an end date; check the product's coverage, or use `myint`/anfc for very recent dates.
- **bry fails at a month edge** — you're missing the neighbour month; download the month before/after so the window's ± day buffer is covered.
- **`ERROR in get_bry: cannot read variable 'bry_time'`** or **`SET_CYCLE ERROR: non-cycling regime, but model time exceeds ...`** — the boundary file doesn't extend past the run window. CROCO needs a bry record *bracketing* every timestep, so the boundary time series must reach **one day beyond** the run on each end (and with `cycle_bry=0` it can't wrap around). Fix: build each phase's bry with a ±1-day pad — i.e. for a run `T0→T1`, call `make_bry_hindcast --start_date <T0−1day> --end_date <T1+1day>`. The operational driver does this automatically; if you run a phase by hand, add the pad yourself.
- **`inputdata` error in ini/bry** — must be `'mercator'` (GLORYS reads through it), not `'glorys'`.
- **BLOW UP / NaN** — recheck boundaries match the mask and the timestep; same as the forecast.