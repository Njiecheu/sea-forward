# SEA-FORWARD — Phase 1: Setup (from a bare machine to build-ready)

This is the **first** document. By the end of it you will have, on your own
computer:

- a working Linux shell (via WSL2 if you're on Windows),
- the Miniconda package manager,
- the `seaforward` conda environment (all the Python libraries),
- a **self-contained NetCDF/HDF5 stack** compiled from source (`opt_seq/`),
- the **CROCO** ocean model and **croco_pytools** pre-processing toolbox,
- the SEA-FORWARD repository laid out and ready to build a configuration.

Everything lives under **one folder**, `~/seaforward`, so nothing on your
machine is scattered around. When you finish, Phase 2 (Building a Forecast Config) picks up
from here.

> **Audience.** This assumes very little. If a step looks obvious to you, skip
> it. If a term is new (conda, NetCDF, compiling), each is explained the first
> time it appears.

> **This whole document is done ONCE per machine.** Installing the tools —
> Miniconda, the `seaforward` conda environment, the NetCDF/HDF5 stack, CROCO —
> is a **one-time setup**. You do **not** repeat it for each forecast. Once it's
> done, every future working session is just three lines (source `env.sh`, source
> a `track.sh`, `conda activate seaforward`), shown at the end and used
> throughout Phases 2–4. Wherever a step below is one-time, it's marked
> **(once per machine)**.

---

## 0. What you are building, in one picture

SEA-FORWARD runs the **CROCO** regional ocean model to make short ocean
forecasts. To do that, the machine needs three independent things:

1. **Python tools** (to download global data and shape it for CROCO) — provided
   by the `seaforward` conda environment.
2. **A NetCDF library** (the file format all the ocean data uses) — compiled
   from source into `~/seaforward/opt_seq`.
3. **The CROCO model itself** (Fortran code you compile into a program) — lives
   in `~/seaforward/code/croco`.

The repository ties them together with a few small scripts (`env.sh`,
`install/`, `sftools/`). This document installs all three.

---

## 1. A Linux shell

CROCO and its toolchain are built for Linux. You need a Linux command line.

- **Linux** — you already have one. Open a terminal.
- **macOS** — a terminal works, but the from-source NetCDF build in this guide
  is tuned for Linux; the smoothest path is a Linux machine or a Linux VM.
- **Windows** — install **WSL2** (Windows Subsystem for Linux), which gives you
  a real Ubuntu inside Windows.

### Installing WSL2 (Windows only)

Open **PowerShell as Administrator** and run:

```powershell
wsl --install -d Ubuntu
```

Restart when asked. Launch **Ubuntu** from the Start menu, and create your Linux
username and password when prompted. From now on, every command in these
documents is typed in that Ubuntu terminal.

Check you're in Linux:

```bash
uname -a          # should mention "Linux" and "microsoft-standard-WSL2" on Windows
whoami            # your linux username
```

> **RAM note.** Building the libraries and running the model is comfortable with
> **16 GB** of RAM. With less, use fewer parallel compile jobs (shown later).

---

## 2. System build tools

You need a C/Fortran compiler and a few build utilities. Install them once:

```bash
sudo apt update
sudo apt install -y build-essential gfortran m4 curl wget git \
                    libcurl4-openssl-dev zlib1g-dev
```

What these are:

- `build-essential` — the C compiler (`gcc`) and `make`.
- `gfortran` — the Fortran compiler (CROCO is Fortran).
- `m4`, `zlib1g-dev`, `libcurl4-openssl-dev` — needed by the NetCDF build.
- `git` — to clone the repository.

Verify:

```bash
gcc --version
gfortran --version
```

Both should print a version without error.

---

## 3. Miniconda (the Python package manager)  *(once per machine)*

**Conda** installs and isolates Python libraries so they don't clash with your
system. We use it for the download/pre-processing tools.

Download and install Miniconda:

```bash
cd ~
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash Miniconda3-latest-Linux-x86_64.sh
```

Accept the licence, keep the default location (`~/miniconda3`), and when it asks
whether to initialise, answer **yes**. Then close and reopen the terminal (or
`source ~/.bashrc`). Your prompt should now start with `(base)`.

Confirm:

```bash
conda --version
```

---

## 4. Get the SEA-FORWARD repository

Clone the repo into your home folder as `seaforward` (lowercase):

```bash
cd ~
git clone git@github.com:opera-seaforward/seaforward.git
cd seaforward
ls
```

> If you don't have SSH set up with GitHub, use the HTTPS URL instead:
> `git clone https://github.com/opera-seaforward/seaforward.git`

You should see folders like `sftools/`, `install/`, `forecast/`, `hindcast/`,
`code/`, and files `env.sh`, `environment.yml`.

> **The golden rule of this project:** everything lives under `~/seaforward`.
> The scripts assume `SEA_FORWARD_ROOT=${HOME}/seaforward`. If you clone it
> somewhere else, adjust that variable in `env.sh`.

---

## 5. Create the `seaforward` conda environment  *(once per machine)*

This installs every Python library the tools need (xarray, copernicusmarine for
Mercator downloads, cfgrib for GFS, netCDF4, numpy, scipy, and the CROCO
pre-processing dependencies).

> **Create once, activate every time.** `conda env create` below builds the
> environment **one time**. After that you never run it again — each session you
> only `conda activate seaforward` to step into it. (If you ever need to start
> over, `conda env remove -n seaforward` then create it again.)

```bash
cd ~/seaforward
conda env create -f environment.yml
```

This downloads and solves the packages — it takes a few minutes. When it
finishes, activate it:

```bash
conda activate seaforward
python -c "import xarray, copernicusmarine, netCDF4, numpy, scipy; print('seaforward env OK')"
```

You should see `seaforward env OK`. Your prompt now shows `(seaforward)`.

> **Why a named environment?** Keeping everything in an environment called
> `seaforward` means you can always return to a known-good set of libraries with
> `conda activate seaforward`, and you never pollute your system Python.

---

## 6. The environment file: `env.sh`

Every working session starts by telling the shell where things live. That's what
`env.sh` does. Look at it:

```bash
cat ~/seaforward/env.sh
```

It sets **shared** paths and the compilers:

```bash
export SEA_FORWARD_ROOT=${HOME}/seaforward
export CROCO_MODEL_DIR=${SEA_FORWARD_ROOT}/code/croco
export CROCO_PYTOOLS_DIR=${SEA_FORWARD_ROOT}/code/croco_pytools
export CROCO_DATA_ROOT=${SEA_FORWARD_ROOT}/data
export SEAFORWARD=${SEA_FORWARD_ROOT}/sftools
export CC=gcc; export FC=gfortran; export F90=gfortran; export F77=gfortran
export SEA_FORWARD_PREFIX=${SEA_FORWARD_ROOT}/opt_seq
export NETCDF=${SEA_FORWARD_PREFIX}
export PATH=${SEA_FORWARD_PREFIX}/bin:${PATH}
export LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:${SEA_FORWARD_PREFIX}/lib
```

You **source** it (run it in your current shell) at the start of each session:

```bash
source ~/seaforward/env.sh
```

It prints `SEA-FORWARD environment set (root: /home/<you>/seaforward)`.

> **Sourcing vs running.** `source env.sh` (or `. env.sh`) applies the variables
> to *your* shell. Running `./env.sh` would set them only inside a throwaway
> sub-shell and lose them — so always `source` it.

Note there is **no separate `config.sh`** to worry about: the compilers and the
NetCDF paths are already in `env.sh`, so once you've sourced it, you can compile.

> **These paths point at the finished layout.** `env.sh` names where things
> *will* live — `code/croco`, `opt_seq`, `data/` — but you install those in
> §7–§9 below. So right after cloning, sourcing `env.sh` is harmless but some of
> the folders it names are still empty. They fill in as you work through the rest
> of this document. Nothing here needs those folders to exist yet.

---

## 7. Build the NetCDF/HDF5 stack from source (`opt_seq`)  *(once per machine)*

CROCO reads and writes **NetCDF** files (the standard format for gridded
geophysical data). NetCDF is actually **three** libraries stacked on top of each
other, and we build them **in this order** because each needs the one before it:

1. **HDF5** — the low-level binary container format.
2. **netcdf-c** — the C NetCDF library, built *on top of* HDF5.
3. **netcdf-fortran** — the Fortran interface, built *on top of* netcdf-c. This
   is the one CROCO (Fortran) actually calls.

We build all three from source into **`~/seaforward/opt_seq`** ("opt" =
optional/installed software, "seq" = the **sequential**, non-MPI build). The
result is a self-contained NetCDF that lives in the repo.

> **Why from source and not `apt install`?** Two reasons. (1) We need the
> **Fortran** interface built with the *same* `gfortran` we compile CROCO with —
> a mismatched compiler causes cryptic link errors. (2) A self-contained stack in
> the repo means the identical build works on any machine.
>
> ⚠️ **A from-source stack cannot be moved.** The install path
> (`.../opt_seq`) is baked into the compiled binaries and libraries. If you ever
> relocate the repo, **rebuild** this stack in the new place — do not copy
> `opt_seq`.

### 7.0 — the two ways to build

There are two routes. They produce the identical result:

- **Route A (scripts)** — run the numbered `install/` scripts. Fast, and it's
  what most people use.
- **Route B (by hand)** — type each library's `configure` / `make` / `make
  install` yourself. Slower, but you see exactly what happens; use it to learn,
  or if a script fails and you want to debug a single library.

Both routes install into `${SEA_FORWARD_ROOT}/opt_seq`. Pick one.

#### Choose how many processors to compile with

Compiling is faster if `make` uses several CPU cores at once. That number is
passed to `make` as `-j <N>`, and we store it in a variable called **`NJOBS`**.
Choosing it well matters, so do it deliberately:

**First, see how many cores your machine has:**

```bash
nproc                      # prints the number of CPU cores available
```

**Then pick `NJOBS`.** The safe rule is the **smaller of your core count and
(RAM in GB ÷ 2)** — because each parallel compile job needs roughly 2 GB of RAM.
On a machine with many cores but modest RAM, RAM is the real limit:

- 8-core / 16 GB → `NJOBS=8`  (min(8, 8))
- 8-core / 8 GB  → `NJOBS=4`  (min(8, 4))
- 22-core / 15 GB → `NJOBS=7`  (min(22, 7) — RAM caps it, not cores)
- 2-core / low RAM → `NJOBS=2`

Check your RAM alongside cores:

```bash
nproc                                              # cores
awk '/MemTotal/{printf "%.0f GB\n",$2/1048576}' /proc/meminfo   # RAM
```

Set it (along with the root) — this stays in effect for the rest of this
section:

```bash
source ~/seaforward/env.sh
export SEA_FORWARD_ROOT=~/seaforward

# option 1 — pick a number by hand (see the rule above):
export NJOBS=7

# option 2 — let the rule choose for you: min(cores, RAM_GB/2), at least 1
# CORES=$(nproc); RAM_GB=$(awk '/MemTotal/{printf "%d",$2/1024/1024}' /proc/meminfo)
# export NJOBS=$(( RAM_GB/2 )); [ $NJOBS -gt $CORES ] && export NJOBS=$CORES; [ $NJOBS -lt 1 ] && export NJOBS=1

echo "will compile with NJOBS=${NJOBS} parallel jobs"
```

> **The `install/` scripts do this for you.** If you run the numbered build
> scripts (Route A), they **auto-pick** `NJOBS = min(cores, RAM_GB/2)` when you
> haven't set it, and print what they chose — so you can skip setting it. Setting
> `NJOBS` by hand (above) still works and overrides the auto choice. The manual
> `make -j ${NJOBS}` commands in Route B need the variable set as shown.

> ⚠️ **`NJOBS` lives only in the current terminal.** If you open a new terminal
> partway through, re-run the two `export` lines above, or `make -j ${NJOBS}`
> becomes `make -j` (unbounded jobs) and can exhaust memory. Every build command
> below uses `-j ${NJOBS}`, so this one variable controls the processor count
> everywhere.

---

### 7.1 — Download the source tarballs

Either way, you need the source code. Put the tarballs in
`${SEA_FORWARD_ROOT}/install`:

```bash
mkdir -p ${SEA_FORWARD_ROOT}/install
cd ${SEA_FORWARD_ROOT}/install

wget https://support.hdfgroup.org/releases/hdf5/v1_14/v1_14_6/downloads/hdf5-1.14.6.tar.gz
wget https://downloads.unidata.ucar.edu/netcdf-c/4.10.0/netcdf-c-4.10.0.tar.gz
wget https://downloads.unidata.ucar.edu/netcdf-fortran/4.6.2/netcdf-fortran-4.6.2.tar.gz

# Optional — only if you later build the PARALLEL (MPI) stack; the sequential
# build in this guide does NOT use it:
# wget https://download.open-mpi.org/release/open-mpi/v4.1/openmpi-4.1.8.tar.gz
```

> `install/00_download_libraries.sh` does exactly these `wget`s if you prefer to
> run the script. **MPI/OpenMPI is not needed** for the sequential stack; it's
> only for a parallel build (see `install/notes/README_parallel.md`).

You should now have the three `.tar.gz` files:

```bash
ls -1 ${SEA_FORWARD_ROOT}/install/*.tar.gz
```

---

### Route A — build with the scripts (fast)

Run the three scripts **in order**:

```bash
cd ~/seaforward
bash install/01_build_hdf5.sh           # HDF5           (~3-8 min)
bash install/02_build_netcdf_c.sh       # netcdf-c       (~3-5 min)
bash install/03_build_netcdf_fortran.sh # netcdf-fortran (~2-3 min)
```

Each script untars its library, configures it to install into
`${SEA_FORWARD_ROOT}/opt_seq`, compiles with `-j ${NJOBS}`, and installs. The
last one prints `>>> sequential NetCDF stack complete`. **Skip to §7.5 to
verify.**

---

### Route B — build by hand (learn / debug)

This is exactly what the scripts do, one library at a time. A few conventions:

- We build inside a `build/` subfolder to keep the source tree clean.
- `CC=gcc FC=gfortran` forces the compilers (must match what CROCO uses).
- `--prefix=${SEA_FORWARD_ROOT}/opt_seq` is **where it installs** — the same for
  all three, so they find each other.
- `make -j ${NJOBS}` compiles using the processor count you set in §7.0. Confirm
  it's still set (`echo ${NJOBS}` — if blank, re-do the `export` in §7.0).
- `2>&1 | tee X.log` saves each step's output to a log you can inspect if
  something fails.

> ⚠️ **Dependencies for netcdf-c.** It needs `libcurl` and `m4` headers. You
> installed these in §2 (`libcurl4-openssl-dev m4`). If a configure step
> complains about curl or m4, install them and re-run that library.

#### 7.2 — HDF5

```bash
cd ${SEA_FORWARD_ROOT}/install
tar -xvf hdf5-1.14.6.tar.gz
cd hdf5-1.14.6
mkdir -p build && cd build

CC=gcc FC=gfortran ../configure \
    --prefix=${SEA_FORWARD_ROOT}/opt_seq \
    --enable-fortran \
    --with-zlib=/usr \
    2>&1 | tee configure.log

make -j ${NJOBS} all 2>&1 | tee make.log
make install         2>&1 | tee install.log
```

Flags explained: `--enable-fortran` builds the Fortran HDF5 interface (needed by
netcdf-fortran); `--with-zlib=/usr` uses the system zlib (from `zlib1g-dev`).

Confirm:

```bash
ls ${SEA_FORWARD_ROOT}/opt_seq/lib/libhdf5.so && echo "HDF5 installed"
```

#### 7.3 — netcdf-c (built on top of HDF5)

```bash
cd ${SEA_FORWARD_ROOT}/install
tar -xvf netcdf-c-4.10.0.tar.gz
cd netcdf-c-4.10.0
mkdir -p build && cd build

CC=gcc FC=gfortran \
  CPPFLAGS=-I${SEA_FORWARD_ROOT}/opt_seq/include \
  LDFLAGS=-L${SEA_FORWARD_ROOT}/opt_seq/lib \
  LIBS=-ldl \
  ../configure \
    --prefix=${SEA_FORWARD_ROOT}/opt_seq \
    --enable-hdf5 \
    --disable-libxml2 \
    --enable-curl \
    2>&1 | tee configure.log

make -j ${NJOBS} all 2>&1 | tee make.log
make install         2>&1 | tee install.log
```

Flags explained: `CPPFLAGS`/`LDFLAGS` point at the **HDF5 you just built** (so
netcdf-c finds it); `--enable-hdf5` turns on the HDF5 backend;
`--disable-libxml2` avoids an optional dependency; `--enable-curl` allows reading
remote datasets.

Confirm:

```bash
ls ${SEA_FORWARD_ROOT}/opt_seq/bin/nc-config \
   ${SEA_FORWARD_ROOT}/opt_seq/lib/libnetcdf.so && echo "netcdf-c installed"
```

#### 7.4 — netcdf-fortran (built on top of netcdf-c)

```bash
cd ${SEA_FORWARD_ROOT}/install
tar -xvf netcdf-fortran-4.6.2.tar.gz
cd netcdf-fortran-4.6.2
mkdir -p build && cd build

CC=gcc FC=gfortran \
  CPPFLAGS=-I${SEA_FORWARD_ROOT}/opt_seq/include \
  LDFLAGS=-L${SEA_FORWARD_ROOT}/opt_seq/lib \
  ../configure \
    --prefix=${SEA_FORWARD_ROOT}/opt_seq \
    2>&1 | tee configure.log

make -j ${NJOBS} all 2>&1 | tee make.log
make install         2>&1 | tee install.log
```

Flags explained: again `CPPFLAGS`/`LDFLAGS` point at the netcdf-c you just built,
so the Fortran layer binds to it.

---

### 7.5 — Verify the stack (the single most important check)

Whichever route you took:

```bash
source ~/seaforward/env.sh
which nf-config
nf-config --prefix
```

**Both must point inside the repo:**

```
/home/<you>/seaforward/opt_seq/bin/nf-config
/home/<you>/seaforward/opt_seq
```

`nf-config` is the small program CROCO's build uses to discover NetCDF (its
compiler flags and library paths). If `--prefix` shows `~/seaforward/opt_seq`,
the model will link correctly. (If it shows a conda or system path, a different
NetCDF is ahead on your `PATH` — re-`source ~/seaforward/env.sh`, and for
compiling later also `conda deactivate`.)

You can see the exact flags CROCO will use:

```bash
nf-config --all          # includes  --flibs  and  --includedir  that jobcomp reads
```

Confirm the Fortran library file exists:

```bash
ls ~/seaforward/opt_seq/lib/libnetcdff.so && echo "NetCDF-Fortran present"
```

> **Naming note.** Upstream CROCO documentation often installs into a folder
> called `opt`. SEA-FORWARD names it **`opt_seq`** to make explicit that this is
> the *sequential* build (a future *parallel*/MPI build would live in a separate
> `opt_mpi`). `env.sh` points `SEA_FORWARD_PREFIX` at `opt_seq`, so everything
> downstream finds it.

---

## 8. Get CROCO and croco_pytools into `code/`  *(once per machine)*

Two pieces of "the model side" go under `~/seaforward/code/`:

- **`code/croco`** — the CROCO ocean model source (Fortran).
- **`code/croco_pytools`** — the pre-processing toolbox (builds grids, initial
  and boundary conditions).

> **Clean names, no versions.** The folders are named exactly `croco` and
> `croco_pytools` — no version suffix. The version you downloaded is recorded in
> `install/04_get_croco.sh`; the folder names stay clean so nothing else in the
> project has to know the version.

The script **`install/04_get_croco.sh` does all of this for you** — it downloads
both, extracts them, renames to the clean names, and compiles the croco_pytools
Fortran tools (Route A). If you'd rather do it by hand (Route B), here are the
exact steps it runs — download the two tarballs, extract, and **rename to the
clean names**:

```bash
cd ~/seaforward/code

# 1. CROCO ocean model (Fortran) — v2.1.3
wget https://gitlab.inria.fr/croco-ocean/croco/-/archive/v2.1.3/croco-v2.1.3.tar.gz
tar -xzf croco-v2.1.3.tar.gz
mv croco-v2.1.3 croco
rm croco-v2.1.3.tar.gz

# 2. croco_pytools pre-processing toolbox — v2.0.4
wget https://gitlab.inria.fr/croco-ocean/croco_pytools/-/archive/v2.0.4/croco_pytools-v2.0.4.tar.gz
tar -xzf croco_pytools-v2.0.4.tar.gz
mv croco_pytools-v2.0.4 croco_pytools
rm croco_pytools-v2.0.4.tar.gz
```

✅ **CHECK** — both folders exist with the clean names:

```bash
ls -d ~/seaforward/code/croco ~/seaforward/code/croco_pytools && echo "both present"
```

> **Clean names, no versions.** The folders are named exactly `croco` and
> `croco_pytools` — the version you downloaded (v2.1.3 / v2.0.4) is recorded in
> `install/04_get_croco.sh`; the folder names stay clean so nothing else in the
> project has to know the version. If you download **different** versions, the
> `mv` targets are still `croco` and `croco_pytools`.

> **Source note.** These tarballs come from the official CROCO GitLab
> (`gitlab.inria.fr/croco-ocean`). CROCO is also distributed from
> croco-ocean.org after accepting its licence — either source gives the same
> code; the GitLab archive links above are the quickest for a scripted download.

### Compile the croco_pytools Fortran helpers

croco_pytools has a small set of Fortran routines (for grid interpolation) that
must be compiled once:

```bash
conda activate seaforward
cd ~/seaforward/code/croco_pytools/prepro/Modules/tools_fort_routines/
make clean && make
```

Confirm the compiled module appeared:

```bash
ls ~/seaforward/code/croco_pytools/prepro/Modules/toolsf*.so && echo "croco_pytools tools compiled"
```

> **Note on the pre-processing toolbox.** SEA-FORWARD ships a **vendored** copy
> of the exact croco_pytools modules its pre-processing code needs, inside
> `sftools/croco_pytools/`. The CLI uses that vendored copy, so the download and
> pre-processing tools work even before you install the full `code/croco_pytools`.
> You still install `code/croco_pytools` for grid-building.

---

## 9. Reference data (bathymetry & coastline)  *(once per machine, large download)*

Building a grid needs global **bathymetry** (sea-floor depth, ETOPO2) and a
**coastline** (GSHHS). CROCO distributes these as the *DATASETS_CROCOTOOLS*
package (several GB). Place it under the repo's `data/` folder so grid.ini finds
it at:

```
~/seaforward/data/DATASETS_CROCOTOOLS/Topo/etopo2.nc
~/seaforward/data/DATASETS_CROCOTOOLS/gshhs/GSHHS_shp/i/GSHHS_i_L1.shp
```

> This data is **large and never committed** to the repository (it is
> git-ignored). Each user downloads it once. `CROCO_DATA_ROOT` in `env.sh`
> points at `~/seaforward/data`, so as long as the datasets sit there, the tools
> find them.

Verify:

```bash
source ~/seaforward/env.sh
ls $CROCO_DATA_ROOT/DATASETS_CROCOTOOLS/Topo/etopo2.nc && echo "bathymetry OK"
```

---

## 10. Final check — is the machine build-ready?

Run this all-in-one check. Every line should succeed:

```bash
source ~/seaforward/env.sh
conda activate seaforward

echo "-- python env --";      python -c "import xarray, copernicusmarine, netCDF4; print('  OK')"
echo "-- CLI --";             python ${SEAFORWARD}/seaforward.py --help >/dev/null && echo "  OK"
echo "-- NetCDF stack --";    nf-config --prefix
echo "-- CROCO source --";    ls ${CROCO_MODEL_DIR}/OCEAN/cppdefs.h >/dev/null && echo "  OK"
echo "-- pytools tools --";   ls ${CROCO_PYTOOLS_DIR}/prepro/Modules/toolsf*.so >/dev/null && echo "  OK"
echo "-- bathymetry --";      ls ${CROCO_DATA_ROOT}/DATASETS_CROCOTOOLS/Topo/etopo2.nc >/dev/null && echo "  OK"
```

If all six print `OK` (and `nf-config --prefix` shows `~/seaforward/opt_seq`),
your machine is fully set up.

---

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

---

## What you have now

```
~/seaforward/
├── README.md                  # project overview
├── env.sh                     # sourced each session (paths + compilers + NetCDF)
├── environment.yml            # the conda environment definition
├── install/                   # 00..04 build scripts (the downloaded sources are git-ignored)
├── sftools/                   # the Python CLI + vendored croco_pytools
├── docs/                      # the step-by-step guides (this document is docs/01_setup.md)
├── code/                      # obtained by install/04 — git-ignored
│   ├── croco/                 # CROCO model source
│   └── croco_pytools/         # pre-processing toolbox (Fortran helpers compiled)
├── opt_seq/                   # NetCDF/HDF5 stack (built from source — git-ignored)
├── data/DATASETS_CROCOTOOLS/  # bathymetry + coastline (downloaded — git-ignored)
├── forecast/                  # the forecast track: configs/, scratch/, model-runs/, driver
└── hindcast/                  # the hindcast track: configs/, scratch/, model-runs/, driver
```

> **What's committed vs local.** The repo carries what you author — `sftools/`,
> the `install/` scripts, the `forecast/`/`hindcast/` configs and drivers,
> `docs/`, and the top-level files. The heavy, regenerable pieces (`code/`,
> `opt_seq/`, `data/`, and each track's `scratch/`/`model-runs/`) are
> **git-ignored**: the setup scripts build them and the CLI downloads the data, so
> they don't bloat the repository.

!!! note
    **Next:** Phase 2 — *Building a Forecast Config*, where you build a region's grid, decide its open boundaries, and prepare the ocean and atmosphere data. Those steps are identical for forecasts and hindcasts, which is why they're a document of their own.

---

## Troubleshooting

- **`conda: command not found`** — reopen the terminal, or run
  `source ~/miniconda3/etc/profile.d/conda.sh`.
- **`nf-config --prefix` shows a conda path or a system path** — you have a
  different NetCDF ahead on `PATH`. Re-run `source ~/seaforward/env.sh`; for
  compiling, also `conda deactivate` so conda's NetCDF steps aside.
- **A library build fails on a missing header** — install the dev package it
  names (commonly `zlib1g-dev`, `libcurl4-openssl-dev`, `m4`) and re-run that
  one script.
- **You moved the repo and now compiles fail** — the from-source NetCDF stack
  has absolute paths baked in. Rebuild it (`install/01`→`03`) in the new
  location rather than copying `opt_seq`.
- **Out of memory during a build** — lower parallelism: `export NJOBS=4` (or
  `2`) and re-run the script.