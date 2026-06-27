# Help & Debugging

To see all available parameters for any script, use the `--help` flag:

```bash
python3 seaforward_data/downloaders/era5.py --help
```

## 1. Common Issues

1. **ModuleNotFoundError**: Ensure the `croco_pyenv` conda environment is active.
2. **CDSAPI Error**: Ensure your `~/.cdsapirc` file is correct and licenses are accepted on the CDS website.
3. **Grid Not Found**: If `use_grd_extent` is `True`, ensure `croco_grd.nc` exists in `vendor/croco_pytools/results/CROCO_FILES/`.