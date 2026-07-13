These download and shape the global data. You can't hand-edit a download, so you
run them — but each does one clear job. The CLI is `seaforward.py` in `sftools`:

```bash
cd ${SEAFORWARD}
export RUN_DT="$(date -u +'%Y-%m-%d') 00:00:00"
```

!!! warning
    ⚠️ **WATCH — negative longitudes need `--domain=` with an equals sign.** Because your box is west of Greenwich, the domain string starts with `-`, and the command reader mistakes it for an option unless you attach it with `=`. Use `--domain="${EXTENTS}"`.

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

!!! check
    ✅ **CHECK** — 5c reports it works through Temperature, Humidity, Precipitation, the four radiation fluxes, U/V wind, and pressure, then `10` files exist.

**5d — build the initial condition** (the ocean's state at the start).

```bash
export MERC=${FCAST}/downloaded_data/MERCATOR/MERCATOR_$(date -u +'%Y%m%d')_00.nc
python seaforward.py make_ini \
    --input_file ${MERC} --output_dir ${CF} \
    --run_date "${RUN_DT}" --hdays ${HDAYS} --Yorig ${YORIG}
```

!!! check
    ✅ **CHECK** — it interpolates temp/salt/u/v onto the sigma layers and prints `Initial file created … croco_ini_MERCATOR_<date>_00.nc`.

**5e — build the boundary conditions** (what flows in at the open edges over
time).

```bash
python seaforward.py make_bry \
    --input_file ${MERC} --output_dir ${CF} \
    --run_date "${RUN_DT}" --hdays ${HDAYS} --fdays ${FDAYS} --Yorig ${YORIG}
```

!!! check
    ✅ **CHECK** — 5e processes **south, west, north** and **skips east**. That's your `obc_dict` in action: it only builds data for the *open* boundaries. Confirm both files exist:
     ```bash
      ls -lh ${CF}/croco_ini_MERCATOR*.nc ${CF}/croco_bry_MERCATOR*.nc
     ```