## Step 6 — Fix the GFS longitudes (only for western-hemisphere regions)

GFS labels longitude from 0 to 360; your model uses −180 to 180. For a region
west of Greenwich these don't match, and the model would crash reading the
weather forcing. Check whether you're affected:

```bash
python3 -c "
import xarray as xr
g = xr.open_dataset('${CF}/croco_grd.nc')
f = xr.open_dataset('${FCAST}/downloaded_data/GFS/for_croco/TEMPERATURE_HEIGHT_ABOVE_GROUND_Y9999M01.nc')
print('MODEL   lon: %.2f .. %.2f' % (float(g.lon_rho.min()), float(g.lon_rho.max())))
print('FORCING lon: %.2f .. %.2f' % (float(f.lon.min()), float(f.lon.max())))
print('covers?', float(f.lon.min())<=float(g.lon_rho.min()) and float(f.lon.max())>=float(g.lon_rho.max()))
"
```

If it says `covers? False` and the forcing lon numbers are big (like 336..346),
run the one-time conversion:

```bash
cd ${FCAST}
python3 << 'PYEOF'
import xarray as xr, glob, os
for f in sorted(glob.glob('downloaded_data/GFS/for_croco/*.nc')):
    d = xr.open_dataset(f); lon = d['lon'].values
    if lon.max() > 180:
        d = d.assign_coords(lon=((lon + 180) % 360) - 180).sortby('lon')
        tmp=f+'.tmp'; d.to_netcdf(tmp); d.close(); os.replace(tmp, f)
        print('fixed', os.path.basename(f))
    else:
        d.close()
print('done')
PYEOF
```

Re-run the check — it should now say `covers? True` with forcing lon around
`−23.5..−14.0`. (Eastern-hemisphere regions skip this whole step.)