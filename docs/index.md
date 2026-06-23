# Sea Forward: Data Download Guide

This guide explains how to easily download environmental data (**ERA5** atmospheric data, **GloFAS** river discharge data, and **Mercator/HYCOM** ocean data) for your CROCO simulations using the `seaforward_data` wrapper.

---

## 0. Cloning the Github Repository

Before setting up the environment, you need to download (clone) the project to your local machine. You must clone the **develop** branch. You can do this using either **SSH** (recommended for frequent contributors) or **HTTPS** (easier for beginners).

### Option A: Clone via SSH (Recommended)
To use SSH, you must first have an SSH key configured on your GitHub account. If you haven't done this yet, please follow this instruction:

**On Linux:** Open the terminal and run these commands:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
```
Copy your SSH key.

**On Windows:** Install Git Bash, then open it and run these commands:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
```
Copy your SSH key.

**On GitHub:**
- Open Settings
- Open the "SSH and GPG keys" section
- Click on "New SSH key"
- Paste your SSH key and save

Once your SSH key is added to GitHub, open a terminal and run:
```bash
git clone -b develop git@github.com:opera-seaforward/seaforward-pytools.git
cd seaforward-pytools
```

### Option B: Clone via HTTPS
If you don't want to set up SSH keys right now, you can clone using HTTPS. You may be prompted to enter your GitHub username and password/personal access token.
```bash
git clone -b develop https://github.com/opera-seaforward/seaforward-pytools.git
cd seaforward-pytools
```

---

## 1. Environment Creation and Installation

### Prerequisite: Install Conda
Before creating the environment, you must have Conda installed on your machine. We recommend installing **Miniconda**, which is a free, minimal installer.

**On Linux:**
```bash
# Download the installer
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O miniconda.sh
# Run the installer
bash miniconda.sh
```
Follow the prompts on the screen (press Enter, read the license, type yes to accept, and yes to initialize conda). Restart your terminal after installation.

**On macOS:**
```bash
# For Intel Macs:
curl -O https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh
# For Apple Silicon (M1/M2/M3):
curl -O https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh
# Run the installer
bash Miniconda3-latest-MacOSX-*.sh
```
Follow the prompts and restart your terminal after installation.

**On Windows:**
     - Download the Windows installer from the [official Miniconda page](https://docs.conda.io/en/latest/miniconda.html).
     - Double-click the downloaded `.exe` file to run it.
     - Follow the instructions on the screen (it is recommended to install for "Just Me").
     - After installation, search for and open **Anaconda Prompt** from your Start menu to run the subsequent commands.

---

Analyzing CROCO outputs requires a dedicated Python environment with several specialized scientific libraries. The project already provides a default configuration file (`env.yml`) that contains all the base requirements.

**Create the Conda Environment from `env.yml`:**
From the root of the project, navigate to the `vendor` directory and create the environment:
```bash
cd vendor/croco_pytools
conda env create -f env.yml
cd -
```

**Activate the Environment:**
```bash
conda activate croco_pyenv
```

---

## 2. Architecture Overview

`seaforward_data` acts as a user‑friendly layer on top of the CROCO Vendor scripts.

- **Vendor scripts** (`vendor/croco_pytools/prepro/`) handle the heavy‑duty download logic.
- **seaforward_data scripts** (`seaforward_data/downloaders/`) handle configuration, validation, and advanced error reporting.

---

## 3. Step‑by‑Step Setup

### Step 1: Compile Fortran tools
The grid calculation and some processing steps require compiled Fortran routines.
```bash
cd vendor/croco_pytools/prepro/Modules/tools_fort_routines && make clean && make && cd -
```

### Step 1.5: Download Global Datasets
Before creating a grid, you need topography (ETOPO) and shorelines (GSHHS).
```bash
python3 seaforward_data/downloaders/get_datasets.py
```
This will automatically install data in `vendor/croco_pytools/data/DATASETS_CROCOTOOLS/`.

### Step 2: Create your Grid
The scripts can automatically read your grid file to detect the download area.
- Edit your grid configuration in `seaforward_data/config/grid.ini`.
- Run the grid creation script:
```bash
cd vendor/croco_pytools/prepro/
python3 make_grid.py ../../../seaforward_data/config/grid.ini
cd -
```
This creates `croco_grd.nc` in `output_croco_data/results/CROCO_FILES/`.

### Step 3: Accounts & Licenses

#### A. ERA5 & GloFAS (Copernicus CDS)
- **Register**: Create an account on the [Climate Data Store (CDS)](https://cds.climate.copernicus.eu/).
- **API Key**: Follow [these instructions](https://cds.climate.copernicus.eu/api-how-to) to create your `$HOME/.cdsapirc` file.
- **Accept Terms**: You must manually accept the license for ERA5 and GloFAS on their respective overview pages.

#### B. Mercator (Copernicus Marine – CMEMS)
- **Register**: Create a free account on the [Copernicus Marine registration page](https://marine.copernicus.eu/).
- **Authentication**:
  - **Option 1**: Run the script; it will ask for your credentials once and save them securely.
  - **Option 2**: Add `cmems_username` and `cmems_password` in your `seaforward_data/config/download_mercator.ini` file.
  - **Option 3**: Use environment variables `CMEMS_USERNAME` and `CMEMS_PASSWORD`.

---

## 4. How to Run the Scripts

Settings are prioritized in the following order: **CLI > Env Vars > INI File > Prompt**.

### Method A: Command Line Arguments (Highest Priority)

**ERA5 (Atmosphere)**
```bash
python3 seaforward_data/downloaders/era5.py --ystart 2013 --mstart 1 --yend 2013 --mend 1 \
  --era5-dir output_croco_data/data/DATA_METEO/ERA5/
```

**GloFAS (Rivers)**
```bash
python3 seaforward_data/downloaders/glofas.py --ystart 2013 --mstart 1 --yend 2013 --mend 1 \
  --rivers-dir output_croco_data/data/DATA_RIVERS/
```

**Mercator (Ocean GLORYS)**
```bash
python3 seaforward_data/downloaders/mercator.py --ystart 2013 --mstart 1 --yend 2013 --mend 1 \
  --depths "[0, 5000]" --ibc-dir output_croco_data/data/DATA_IBC/GLORYS/ \
  --cmems-username your_user --cmems-password your_pass
```

**HYCOM (Ocean)**
```bash
python3 seaforward_data/downloaders/hycom.py --ystart 2019 --mstart 1 --yend 2019 --mend 1 \
  --ibc-dir output_croco_data/data/DATA_IBC/HYCOM/
```

### Method B: Environment Variables
Each dataset has its own prefix to avoid conflicts.

**ERA5 Example**
```bash
export ERA5_YSTART=2013
export ERA5_MSTART=1
export ERA5_ERA5_DIR=vendor/croco_pytools/data/DATA_METEO/ERA5/
python3 seaforward_data/downloaders/era5.py
```

**Mercator Example**
```bash
export CMEMS_USERNAME=your_user
export CMEMS_PASSWORD=your_pass
export MERCATOR_YSTART=2013
export MERCATOR_IBC_DIR=vendor/croco_pytools/data/DATA_IBC/GLORYS/
python3 seaforward_data/downloaders/mercator.py
```

### Method C: Configuration File (`.ini`)
Default configuration files are located in `seaforward_data/config/`.  
The script automatically finds its corresponding `.ini` in that folder:
```bash
python3 seaforward_data/downloaders/era5.py
python3 seaforward_data/downloaders/glofas.py
python3 seaforward_data/downloaders/mercator.py
python3 seaforward_data/downloaders/hycom.py
```

### Method D: Interactive Prompt
The script will politely ask for any missing required settings during execution.

---

## 5. Defining the Download Area

### A. Automatic (Using your Grid) – Recommended
If you have generated a grid in Step 2, the script will automatically extract the extent.
```bash
python3 seaforward_data/downloaders/era5.py --ystart 2013 --mstart 1
```

### B. Manual (Without a Grid)
You can specify a custom area `[latmax, lonmin, latmin, lonmax]`.
```bash
python3 seaforward_data/downloaders/era5.py --ystart 2013 --mstart 1 \
  --use-grd-extent False \
  --custom-extent "[-26, 6.5, -38, 23.5]"
```

---

## 6. Available Parameters Summary

| Dataset   | Prefix      | Env Var Example             | CLI Argument                          |
|-----------|-------------|-----------------------------|---------------------------------------|
| **ERA5**  | `ERA5_`     | `ERA5_YSTART`               | `--ystart`                            |
| **GloFAS**| `GLOFAS_`   | `GLOFAS_YSTART`             | `--ystart`                            |
| **Mercator**| `MERCATOR_`| `CMEMS_USERNAME` / `_PASSWORD` | `--cmems-username` / `--cmems-password` |
| **HYCOM** | `HYCOM_`    | `HYCOM_YSTART`              | `--ystart`                            |

---

## 7. Help & Debugging

To see all available parameters for any script, use the `--help` flag:
```bash
python3 seaforward_data/downloaders/era5.py --help
```

### Common Issues
- **ModuleNotFoundError**: Ensure the `croco_pyenv` conda environment is active.
- **CDSAPI Error**: Ensure your `~/.cdsapirc` file is correct and licenses are accepted on the CDS website.
- **Grid Not Found**: If `use_grd_extent` is `True`, ensure `croco_grd.nc` exists in `vendor/croco_pytools/results/CROCO_FILES/`.