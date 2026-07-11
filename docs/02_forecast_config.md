# SEA-FORWARD — Phase 2: Building a Forecast Configuration — Hand-Edit Edition

This is the **teaching version** of building a forecast configuration. Instead of
running scripted `sed` commands, **you open each file yourself and make the
change by hand** — so you understand *what* every setting is and *why* it's
there.

This phase builds a complete **forecast** configuration: a grid, its boundaries,
the downloaded ocean (Mercator) and weather (GFS) data shaped for CROCO, the four
edited configuration files, and a compiled model — all on the **forecast track**.

!!! note
    **Forecast vs hindcast.** The *steps* here (grid, mask, boundaries, config files, compile) are the same skeleton a hindcast uses — but the *commands* are forecast-specific (Mercator + GFS, the forecast track). Phase 4 (Hindcast) reuses this skeleton and swaps the data source to GLORYS + ERA5. So build your forecast here first; when you later do a hindcast, Phase 4 points back to these steps and only shows what changes.

The worked example is **Canary_12**, a 1/12° domain off North-West Africa
(22°W–15.5°W, 14°N–24°N). To build your own region later, you'll change the same
handful of things you edit here — and because you edited them by hand, you'll
know exactly which ones.

!!! important
    **Prerequisite:** you finished Phase 1 (Setup). The `seaforward` conda environment exists, `nf-config --prefix` shows `~/seaforward/opt_seq`, CROCO is in `~/seaforward/code/croco`, and the bathymetry data is under `~/seaforward/data/DATASETS_CROCOTOOLS/`.

!!! note
    **How to read this guide**
     - When you must **edit a file**, you'll open it in `nano` and the guide tells you what to **find** and what to **change it to**, with a **What / Why** for each.
     - A few steps (downloading data building the grid, compiling) can't be hand-edited — you run them — but the guide explains what each is doing.
     - `✅ CHECK` shows what a correct result looks like.
     - `⚠️ WATCH` marks a trap.

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