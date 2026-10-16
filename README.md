# Map App (Leaflet + OpenStreetMap)

A minimal, keyless map app: Leaflet map with OSM raster tiles, a Nominatim
search box, and a marker dropped on the first result.

## Run

```powershell
cd E:\Find_clients\map_app
python serve.py
# open http://127.0.0.1:8000
```

(`serve.py` is recommended over opening `index.html` directly: `/config.js`
is only served by it.)

## Files

| File         | Purpose                                              |
|--------------|------------------------------------------------------|
| `index.html` | Page shell: toolbar, search form, map div            |
| `app.js`     | Map init, tile layer, search, marker logic           |
| `style.css`  | Layout and toolbar styling                           |
| `serve.py`   | Dependency-free static server; injects `.env` config |
| `.env`       | Future keys — currently empty, git-ignored           |

## Notes

- **No API key needed** for Leaflet, OSM tiles, or Nominatim.
- **Nominatim usage policy:** max 1 request/second, one in-flight request
  (newer searches abort older ones), valid User-Agent/attribution — this app
  debounces nothing else but cancels stale requests automatically.
- **Adding keys later:** put them in `.env` (`KEY=value`). `serve.py` exposes
  them as `window.APP_CONFIG` via `/config.js`; read them in `app.js` as
  `config.SOME_API_KEY`. `.env` is git-ignored.
