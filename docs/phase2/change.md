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