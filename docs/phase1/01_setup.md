# SEA FORWARD — Phase 1: Setup (from a bare machine to build-ready)

This is the **first** document. By the end of it you will have on your own
computer:

- a working Linux shell (via WSL2 if you're on Windows),
- the Miniconda package manager,
- the `seaforward` conda environment (all the Python libraries),
- a **self-contained NetCDF/HDF5 stack** compiled from source (`opt_seq/`),
- the **CROCO** ocean model and **croco_pytools** pre-processing toolbox,
- the SEA FORWARD repository laid out and ready to build a configuration.

Everything lives under **one folder**, `~/seaforward`, so nothing on your
machine is scattered around. When you finish, Phase 2 (Building a Forecast Config) picks up
from here.

!!! note
    **Audience.** This assumes very little. If a step looks obvious to you, skip it. If a term is new (conda, NetCDF, compiling), each is explained the first time it appears.

!!! note
    **This whole document is done ONCE per machine.** Installing the tools Miniconda, the `seaforward` conda environment, the NetCDF/HDF5 stack, CROCO is a **one-time setup**. You do **not** repeat it for each forecast. Once it's done, every future working session is just three lines (source `env.sh`, source a `track.sh`, `conda activate seaforward`), shown at the end and used throughout Phases 2–4. Wherever a step below is one-time, it's marked **(once per machine)**.