# Pre-Download Setup

## 1. Step 1: Compile Fortran tools

The grid calculation and some data processing steps rely on highly optimized Fortran routines. You must compile these routines once before using the tools.
**Important:** Make sure your Conda environment (`croco_pyenv`) is activated first, as it contains the required `gfortran` compiler.

Run the following command. It will navigate to the source directory, clean any old build files, compile the tools, and return to your project root:

```bash
cd vendor/croco_pytools/prepro/Modules/tools_fort_routines && make clean && make && cd -
```

!!!note
    If the compilation is successful, you will see some compiler output ending without any "Error" messages. If you see a `gfortran: command not found` error, please verify that you ran `conda activate croco_pyenv` first.

## 2. Step 2: Download Global Datasets

Before creating a grid, you need topography (ETOPO) and shorelines (GSHHS).

```bash
python3 seaforward_data/downloaders/get_datasets.py
```

_This will automatically install data in `vendor/croco_pytools/data/DATASETS_CROCOTOOLS/`._

## 3. Step 3: Create your Grid

The scripts can automatically read your grid file to detect the download area.

1.  Edit your grid configuration in `seaforward_data/config/grid.ini`.
2.  Run the grid creation script:
    ```bash
    cd vendor/croco_pytools/prepro/
    python3 make_grid.py ../../../seaforward_data/config/grid.ini
    cd -
    ```
    _This creates `croco_grd.nc` in `output_croco_data/results/CROCO_FILES/`._

## 4. Step 4: Accounts & Licenses

### 4.1 ERA5 & GloFAS (Copernicus CDS)

1.  **Register**: Create an account on the [Climate Data Store (CDS)](https://cds.climate.copernicus.eu/).
2.  **API Key**: Follow [these instructions](https://cds.climate.copernicus.eu/how-to-api) to create your `$HOME/.cdsapirc` file.
3.  **Accept Terms**: You must manually accept the license for [ERA5](https://cds.climate.copernicus.eu/cdsapp#!/dataset/reanalysis-era5-single-levels) and [GloFAS](https://cds.climate.copernicus.eu/cdsapp#!/dataset/cems-glofas-historical) on their respective overview pages.

### 4.2 Mercator (Copernicus Marine - CMEMS)

1.  **Register**: Create a free account on the [Copernicus Marine registration page](https://data.marine.copernicus.eu/register).
2.  **Authentication**:
    - **Option 1**: Run the script; it will ask for your credentials once and save them securely.
    - **Option 2**: Add `cmems_username` and `cmems_password` in your `seaforward_data/config/download_mercator.ini` file.
    - **Option 3**: Use environment variables `CMEMS_USERNAME` and `CMEMS_PASSWORD`.

