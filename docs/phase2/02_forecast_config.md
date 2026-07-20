# Phase 2 — Run a Forecast Locally

### Building and running a single CROCO forecast by hand, from global data to a proven model

This chapter builds a complete regional ocean **forecast** and runs it once, on
your own machine, editing every configuration file by hand. You start from today's
global ocean and atmosphere, refine them over your region, compile the model, and
integrate forward to produce a short forecast. Doing it by hand — rather than
running one wrapper script — is the point: you finish knowing *what* every setting
does and *why* it is there, which is exactly the knowledge that automating the run
later depends on.

For the initial condition and open boundaries we use the **Mercator** global
analysis-and-forecast product; for the surface forcing we use **GFS**. The worked
example is **Canary_12**, a 1/12° domain off North-West Africa (22°W–15.5°W,
14°N–24°N). To build your own region you change only a handful of the values you
edit here — and because you edited them by hand, you will know exactly which ones.

!!! note
    **A note on scope — this is not yet a fully operational forecast.** A real operational system does two things this manual run does not: it gives the forecast a proper **spin-up** (a short run that lets the regional model settle into balance and provides the forecast's initial state, instead of a cold start from the global model), and it runs **automatically on a schedule**. Here we do a single cold-started run by hand. That is the correct place to begin — it is the forecast that the operational cycle wraps a spin-up around and repeats daily. The step from this manual run to the automated, spun-up workflow is introduced at the end of this chapter (*Toward an operational workflow*) and built in Phase 3.

!!! important
    **Prerequisite.** You have finished Phase 1 (Setup): the `seaforward` conda environment exists, `nf-config --prefix` shows `~/seaforward/opt_seq`, CROCO is in `~/seaforward/code/croco`, and the bathymetry data is under `~/seaforward/data/DATASETS_CROCOTOOLS/`.

!!! important 
    **How to read this guide.** 
    - When a step **edits a file**, you open it in `nano`; the guide tells you what to **find** and what to **change it to**, with a **What / Why** for each edit.
    - A few steps (downloading data, building the grid, compiling) are run rather than edited — the guide explains what each is doing. 
    - **✅ CHECK** shows what a correct result looks like.
    - **⚠️ WATCH** marks a trap.
    - A **workflow diagram** opens each step, with the piece that step produces highlighted, so you always see where you are in the build.

### nano crash course

```
nano FILENAME        open a file
Ctrl-W               search ("Where is") — type text, Enter — jumps to it
Ctrl-K               cut the current line
Ctrl-O, Enter        save ("Write Out")
Ctrl-X               exit
arrow keys           move around; just type to insert text
```

`Ctrl-W` (search) is the main tool — you use it to find the line to change in each
file.