// Namespace to avoid conflicts and enable cleanup
window.geofsB55Addon = window.geofsB55Addon || {};

let map;
let mapCallback;
let flightPlanInterval;
let isInitialized = false;

function initMap() {
    // Safety: Check if already initialized
    if (map) {
        console.log('[B55] Map already initialized');
        return;
    }
    
    // Safety: Check for MapLibre
    if (typeof maplibregl === 'undefined') {
        console.error('[B55] MapLibre not loaded yet');
        return;
    }
    appendNewChild(document.head, 'link', { rel: 'stylesheet', href: 'https://unpkg.com/maplibre-gl@5.5.0/dist/maplibre-gl.css' });
    appendNewChild(document.head, 'script', { src: 'https://unpkg.com/maplibre-gl@5.5.0/dist/maplibre-gl.js' });
    const mapDiv = createTag("div", { id: 'map', style: 'width: 1024px; height: 1024px; padding: 0px; position: absolute; left: -9999px; top: -9999px;', });
    document.body.appendChild(mapDiv);
    map = new maplibregl.Map({
        container: 'map', // container id
        style: {
            'version': 8,
            'minzoom': 2,
            'maxzoom': 16,
            'sources': {
                'osm': {
                    'type': 'raster',
                    'tiles': ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                    'tileSize': 256,
                    'attribution': '<a href="https://openstreetmap.org/" target="_blank">OpenStreetMap</a>'
                },
                'hillshadeSource': {
                    'type': 'raster-dem',
                    'tiles': ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
                    'tileSize': 256,
                    'encoding': 'terrarium'        
                },
                'openaip': {
                    'type': 'raster',
                    'tiles': ['https://api.tiles.openaip.net/api/data/openaip/{z}/{x}/{y}.png?apiKey=' + window.openAIPKey],
                    'tileSize': 256,
                    'attribution': '<a href="https://www.openaip.net" target="_blank">OpenAIP</a>'
                }
            },
            'layers': [
                {'id': 'hills', 'type': 'hillshade', 'source': 'hillshadeSource', 'minzoom': 0, 'maxzoom': 20},
                {'id': 'osm', 'type': 'raster', 'source': 'osm', 'minzoom': 0, 'maxzoom': 20, 'paint': {'raster-opacity': 0.4}},
                {'id': 'openaip', 'type': 'raster', 'source': 'openaip', 'minzoom': 0, 'maxzoom': 20}
            ],
        },
        center: [-74.5, 40],
        zoom: 10,
        maxPitch: 90
    });
}

function loadMapLibre(callback) {
    const script = document.createElement('script');
    script.src = "https://unpkg.com/maplibre-gl@5.5.0/dist/maplibre-gl.js";
    script.onload = callback;
    document.head.appendChild(script);
  }

function addMapDisplay() {
    geofs.aircraft.instance.addParts([{
        "name": "map",
        "type": "none",
        "parent": "cockpit",
        "model": "https://owennewo-dev.github.io/GeoFS-cockpit-realism/b55/garmin-gns-530.glb",
        "position": [0.22, 0.6275, 0.358],
        "scale": [1.2, 1.2, 1.2],
        "rotation": [0, 270, 90]
    }]);
    
    geofs.aircraft.instance.fixCockpitScale(geofs.aircraft.instance.definition.cockpitScaleFix);
    mapCallback = geofs.api.addFrameCallback(showMap);
}

function trackZoomKeys() {
    document.addEventListener("keydown", function(event) {
        if (event.key === "-") { 
            map.setZoom(map.getZoom() - 1);
        } else if (event.key === "=") { 
            map.setZoom(map.getZoom() + 1);
        }
    });
}

function showMap() {
    map.jumpTo({
        center: [geofs.aircraft.instance.llaLocation[1], geofs.aircraft.instance.llaLocation[0]],
        bearing: geofs.animation.values.heading360
    })
    geofs.aircraft.instance.parts["map"].object3d.model.setTextureFromCanvas(map.painter.context.gl, 0)
}

function destroy() {
    geofs.api.removeFrameCallback(mapCallback);
}

function loadFlightplan(waypointArray) {
    if (!map) {
        console.error("Map instance is not initialized!");
        return;
    }

    waypointArray = geofs.flightPlan.waypointArray;

    if (!waypointArray || waypointArray.length === 0) {
        console.error("No waypoints found!");
        return;
    }

    console.log("Reloading flight plan...");

    if (map.getSource('route')) {
        map.removeLayer('route');
        map.removeSource('route');
    }

    let waypoints = waypointArray.map(wp => [wp.lon, wp.lat]);

    console.log("Updating map with waypoints:", waypoints);

    map.addSource('route', {
        'type': 'geojson',
        'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'LineString',
                'coordinates': waypoints
            }
        }
    });

    map.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#b100b1',
            'line-width': 5
        }
    });

    map.jumpTo({ center: waypoints[0] });
}

// Safety: Hide default GeoFS map controls if they exist
function hideDefaultMapControls() {
    const centerMap = document.getElementById("centerMap");
    const drawFlightPath = document.getElementById("drawFlightPath");
    
    if (centerMap && centerMap.parentElement) {
        centerMap.parentElement.style.display = "none";
    }
    if (drawFlightPath && drawFlightPath.parentElement) {
        drawFlightPath.parentElement.style.display = "none";
    }
}

// Defer execution until DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideDefaultMapControls);
} else {
    hideDefaultMapControls();
}

//this is from LiverySelector

/**
 * Create tag with <name attributes=...
 *
 * @param {string} name
 * @param {Object} attributes
 * @param {string|number} content
 * @returns {HTMLElement}
 */
function createTag(name, attributes = {}, content = '') {
    const el = document.createElement(name);
    Object.keys(attributes || {}).forEach(k => el.setAttribute(k, attributes[k]));
    if (('' + content).length) {
        el.innerHTML = content;
    }
    return el;
}


/**
 * Creates a new element <tagName attributes=...
 * appends to parent and returns the child for later access
 *
 * @param {HTMLElement} parent
 * @param {string} tagName
 * @param {object} attributes
 * @param {number} pos insert in Nth position (default append)
 * @returns {HTMLElement}
 */
function appendNewChild(parent, tagName, attributes = {}, pos = -1) {
    const child = createTag(tagName, attributes);
    if (pos < 0) {
        parent.appendChild(child);
    } else {
        parent.insertBefore(child, parent.children[pos]);
    }

    return child;
}


// Cleanup function for aircraft changes
function cleanup() {
    console.log('[B55] Cleaning up...');
    
    if (mapCallback) {
        try {
            geofs.api.removeFrameCallback(mapCallback);
            mapCallback = null;
        } catch (e) {
            console.error('[B55] Error removing frame callback:', e);
        }
    }
    
    if (flightPlanInterval) {
        clearInterval(flightPlanInterval);
        flightPlanInterval = null;
    }
    
    if (map) {
        try {
            map.remove();
            map = null;
        } catch (e) {
            console.error('[B55] Error removing map:', e);
        }
    }
    
    // Remove map div
    const mapDiv = document.getElementById('map');
    if (mapDiv) {
        mapDiv.remove();
    }
    
    try { if (window.geofsAddonRefreshWaypoints === window.geofsB55Addon.reloadWaypoints) delete window.geofsAddonRefreshWaypoints; } catch(e) { }
    try { if (window.geofsAddonToggleTerrain === window.geofsB55Addon.toggleTerrain) delete window.geofsAddonToggleTerrain; } catch(e) { }
    isInitialized = false;
}

// Safety: Initialize only if GeoFS is ready and not already initialized
function safeInit() {
    if (isInitialized) {
        console.log('[B55] Already initialized, skipping');
        return;
    }
    
    if (typeof geofs === 'undefined' || !geofs.aircraft || !geofs.aircraft.instance) {
        console.error('[B55] GeoFS not ready');
        return;
    }
    
    if (typeof maplibregl === 'undefined') {
        console.error('[B55] MapLibre not loaded');
        return;
    }
    
    try {
        console.log('[B55] Initializing...');
        initMap();
        
        // Wait for map to be ready before loading flight plan
        if (map) {
            map.on('load', () => {
                console.log('[B55] Map loaded');
                loadFlightplan();
            });
        }
        
        addMapDisplay();
        trackZoomKeys();
        
        // Expose manual reload to main addon UI
        window.geofsB55Addon.reloadWaypoints = function() {
            if (map && geofs.flightPlan && geofs.flightPlan.waypointArray) {
                console.log("[B55] Manual refresh of flight plan requested");
                loadFlightplan();
            } else {
                console.warn("[B55] No map or flight plan available to refresh");
            }
        };
        window.geofsAddonRefreshWaypoints = window.geofsB55Addon.reloadWaypoints;

        // Expose terrain toggle to main addon UI
        window.geofsB55Addon.toggleTerrain = function() {
            try{
                if (map && map.getLayer && map.getLayer('hills')){
                    const current = map.getLayoutProperty('hills', 'visibility') || 'visible';
                    const next = current === 'none' ? 'visible' : 'none';
                    map.setLayoutProperty('hills', 'visibility', next);
                    console.log('[B55] Terrain layer visibility set to', next);
                } else {
                    console.warn('[B55] Terrain layer not present yet');
                }
            }catch(e){ console.error('[B55] Toggle terrain error:', e); }
        };
        window.geofsAddonToggleTerrain = window.geofsB55Addon.toggleTerrain;
        
        isInitialized = true;
        console.log('[B55] Initialization complete');
    } catch (e) {
        console.error('[B55] Initialization error:', e);
    }
}

// Export cleanup for main script
window.geofsAddonCleanup = cleanup;
window.geofsB55Addon.cleanup = cleanup;
window.geofsB55Addon.init = safeInit;

// Initialize
safeInit();