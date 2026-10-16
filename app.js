/* global L, window, document, fetch, AbortController */

"use strict";

// Any future keys/values come from .env via serve.py -> /config.js
const config = window.APP_CONFIG || {};

const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const NOMINATIM_URL =
  config.NOMINATIM_URL || "https://nominatim.openstreetmap.org";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Default view: Islamabad (your usual search area)
const DEFAULT_VIEW = { lat: 33.6844, lng: 73.0479, zoom: 12 };

const els = {
  form: document.getElementById("search-form"),
  input: document.getElementById("search-input"),
  button: document.getElementById("search-button"),
  status: document.getElementById("status"),
};

// ---------- map ----------

const map = L.map("map").setView(
  [DEFAULT_VIEW.lat, DEFAULT_VIEW.lng],
  DEFAULT_VIEW.zoom
);

L.tileLayer(OSM_TILES, {
  maxZoom: 19,
  attribution: OSM_ATTRIBUTION,
}).addTo(map);

let marker = null;

function placeMarker(lat, lon, label) {
  if (marker) {
    marker.setLatLng([lat, lon]);
  } else {
    marker = L.marker([lat, lon]).addTo(map);
  }
  marker.bindPopup(label);
  marker.openPopup();
  map.flyTo([lat, lon], Math.max(map.getZoom(), 15), { duration: 0.8 });
}

// ---------- search (Nominatim) ----------

function setStatus(text, isError = false) {
  els.status.textContent = text;
  els.status.classList.toggle("error", isError);
}

let pendingSearch = null;

async function search(query) {
  if (pendingSearch) pendingSearch.abort(); // Nominatim policy: 1 request at a time
  pendingSearch = new AbortController();

  els.button.disabled = true;
  setStatus("Searching…");

  const url =
    `${NOMINATIM_URL}/search` +
    `?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      signal: pendingSearch.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Nominatim responded with HTTP ${res.status}`);

    const results = await res.json();
    if (!results.length) {
      setStatus(`No results for “${query}”`, true);
      return;
    }

    const hit = results[0];
    const lat = parseFloat(hit.lat);
    const lon = parseFloat(hit.lon);

    placeMarker(lat, lon, hit.display_name);
    setStatus(`${hit.display_name}`);
  } catch (err) {
    if (err.name === "AbortError") return; // superseded by a newer search
    setStatus(`Search failed: ${err.message}`, true);
  } finally {
    els.button.disabled = false;
    pendingSearch = null;
  }
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = els.input.value.trim();
  if (query) search(query);
});

setStatus("Ready — search for a place");
