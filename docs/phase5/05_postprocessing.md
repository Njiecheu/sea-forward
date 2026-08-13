# SEA-FORWARD — Phase 5: Post-processing & Validation

<!-- <img src="../../img/phase5.png" alt="Phase 5" style="width: 100%; height: 550px; object-fit: contain;" /> -->

![Phase 5](../../img/phase5.png)

SEA-FORWARD ships a small, self-contained Python toolkit for analysing CROCO
output — making maps, sections, profiles, Hovmöller diagrams and time series,
and for validating a run against the parent product it was downscaled from
(GLORYS for hindcasts, Mercator for forecasts).

The toolkit lives in `sftools/` and is organised into four modules:

| Module                    | Purpose                                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sftools/postprocess.py`  | Load CROCO output; extract fields, sections, profiles, time series; compute derived quantities (speed, vorticity, EKE) at the surface or any depth. |
| `sftools/define_attrs.py` | A single registry of CF metadata **and** display defaults (colormap, range) for every variable. Plots label and colour themselves from this.        |
| `sftools/plotting.py`     | Attribute-driven plotting: generic builders plus a smart `plot()` wrapper that auto-detects the plot type.                                          |
| `sftools/validation.py`   | Model-vs-parent validation: maps, error growth, profiles, sections, time series, and error-vs-depth — all on the CROCO grid.                        |

The design philosophy is a clean separation:

- **Extractors** (in `postprocess`) build a labelled `xarray.DataArray` — they decide _what_ data (which variable, depth, time).
- **Plotters** (in `plotting`) decide _how_ it looks (colormap, range, title) — reading the labels from the data by default.

So a typical call reads `pl.plot(pp.field(ds, "temp", depth_m=50))`: the extractor
builds temperature at 50 m, the plotter draws and labels it.
