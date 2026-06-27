# How to Run the Scripts

Settings are prioritized in the following order: **CLI > Env Vars > INI File > Prompt**.

## 1 Method A: Command Line Arguments (Highest Priority)

```bash
# ERA5 (Atmosphere)
python3 seaforward_data/downloaders/era5.py --ystart 2013 --mstart 1 --yend 2013 --mend 1 \
  --era5-dir output_croco_data/data/DATA_METEO/ERA5/

# GloFAS (Rivers)
python3 seaforward_data/downloaders/glofas.py --ystart 2013 --mstart 1 --yend 2013 --mend 1 \
  --rivers-dir output_croco_data/data/DATA_RIVERS/

# Mercator (Ocean GLORYS)
python3 seaforward_data/downloaders/mercator.py --ystart 2013 --mstart 1 --yend 2013 --mend 1 \
  --depths "[0, 5000]" --ibc-dir output_croco_data/data/DATA_IBC/GLORYS/ \
  --cmems-username your_user --cmems-password your_pass

# HYCOM (Ocean)
python3 seaforward_data/downloaders/hycom.py --ystart 2019 --mstart 1 --yend 2019 --mend 1 \
  --ibc-dir output_croco_data/data/DATA_IBC/HYCOM/
```

## 2. Method B: Environment Variables

Each dataset has its own prefix to avoid conflicts.

```bash
# ERA5 Example
export ERA5_YSTART=2013
export ERA5_MSTART=1
export ERA5_ERA5_DIR=vendor/croco_pytools/data/DATA_METEO/ERA5/
python3 seaforward_data/downloaders/era5.py

# Mercator Example
export CMEMS_USERNAME=your_user
export CMEMS_PASSWORD=your_pass
export MERCATOR_YSTART=2013
export MERCATOR_IBC_DIR=vendor/croco_pytools/data/DATA_IBC/GLORYS/
python3 seaforward_data/downloaders/mercator.py
```

## 3. Method C: Configuration File (.ini)

Default configuration files are located in `seaforward_data/config/`.

```bash
# The script automatically finds its corresponding .ini in seaforward_data/config/
python3 seaforward_data/downloaders/era5.py
python3 seaforward_data/downloaders/glofas.py
python3 seaforward_data/downloaders/mercator.py
python3 seaforward_data/downloaders/hycom.py
```

## 4. Method D: Interactive Prompt

The script will politely ask for any missing required settings during execution.

