# Defining the Download Area

## 1. Automatic (Using your Grid) - Recommended

If you have generated a grid in Step 2, the script will automatically extract the extent.

```bash
python3 seaforward_data/downloaders/era5.py --ystart 2013 --mstart 1
```

## 2. Manual (Without a Grid)

You can specify a custom area `[latmax, lonmin, latmin, lonmax]`.

```bash
python3 seaforward_data/downloaders/era5.py --ystart 2013 --mstart 1 \
  --use-grd-extent False \
  --custom-extent "[-26, 6.5, -38, 23.5]"
```

