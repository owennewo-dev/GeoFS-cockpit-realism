let map;
let mapCallback;

// Airplane icon as SVG data URL (black fill)
const airplaneIconSvg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="black" viewBox="0 0 16 16"><path d="M6.428 1.151C6.708.591 7.213 0 8 0s1.292.592 1.572 1.151C9.861 1.73 10 2.431 10 3v3.691l5.17 2.585a1.5 1.5 0 0 1 .83 1.342V12a.5.5 0 0 1-.582.493l-5.507-.918-.375 2.253 1.318 1.318A.5.5 0 0 1 10.5 16h-5a.5.5 0 0 1-.354-.854l1.319-1.318-.376-2.253-5.507.918A.5.5 0 0 1 0 12v-1.382a1.5 1.5 0 0 1 .83-1.342L6 6.691V3c0-.568.14-1.271.428-1.849"/></svg>');

function initMap() {
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
                    'tiles': ['https://api.tiles.openaip.net/api/data/openaip/{z}/{x}/{y}.png?apiKey=7966bc2e7fc3f108e9c7428b661bf2e1'],
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

    // Add airplane icon when map style loads
    map.on('load', function() {
        const img = new Image();
        img.onload = function() {
            if (!map.hasImage('airplane-icon')) {
                map.addImage('airplane-icon', img);
            }
            
            if (!map.getSource('aircraft-position')) {
                map.addSource('aircraft-position', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'geometry': { 'type': 'Point', 'coordinates': [-74.5, 40] },
                        'properties': { 'bearing': 0 }
                    }
                });
            }
            
            if (!map.getLayer('aircraft-layer')) {
                map.addLayer({
                    'id': 'aircraft-layer',
                    'type': 'symbol',
                    'source': 'aircraft-position',
                    'layout': {
                        'icon-image': 'airplane-icon',
                        'icon-size': 1.0,
                        'icon-rotate': ['get', 'bearing'],
                        'icon-rotation-alignment': 'map',
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true
                    }
                });
            }
        };
        img.src = airplaneIconSvg;
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
    const lon = geofs.aircraft.instance.llaLocation[1];
    const lat = geofs.aircraft.instance.llaLocation[0];
    const heading = geofs.animation.values.heading360;
    
    map.jumpTo({
        center: [lon, lat],
        bearing: heading
    });
    
    // Update airplane icon position (rotation = 0 since map rotates with heading)
    const aircraftSource = map.getSource('aircraft-position');
    if (aircraftSource) {
        aircraftSource.setData({
            'type': 'Feature',
            'geometry': { 'type': 'Point', 'coordinates': [lon, lat] },
            'properties': { 'bearing': 0 }
        });
    }
    
    geofs.aircraft.instance.parts["map"].object3d.model.setTextureFromCanvas(map.painter.context.gl, 0);
}

function destroy() {
    geofs.api.removeFrameCallback(mapCallback);
    try { if (window.geofsAddonRefreshWaypoints === window.geofsElectroAddon.reloadWaypoints) delete window.geofsAddonRefreshWaypoints; } catch(e) { }
    try { if (window.geofsAddonToggleTerrain === window.geofsElectroAddon.toggleTerrain) delete window.geofsAddonToggleTerrain; } catch(e) { }
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

document.getElementById("centerMap").parentElement.style.display = "none";
document.getElementById("drawFlightPath").parentElement.style.display = "none";

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


initMap();
loadFlightplan();
addMapDisplay();
trackZoomKeys();

// Expose manual reload to main addon UI
window.geofsElectroAddon = window.geofsElectroAddon || {};
window.geofsElectroAddon.reloadWaypoints = function() {
    if (map && geofs.flightPlan && geofs.flightPlan.waypointArray) {
        console.log("[Electro] Manual refresh of flight plan requested");
        loadFlightplan();
    } else {
        console.warn("[Electro] No map or flight plan available to refresh");
    }
};
window.geofsAddonRefreshWaypoints = window.geofsElectroAddon.reloadWaypoints;

// Expose terrain toggle to main addon UI
window.geofsElectroAddon.toggleTerrain = function() {
    try{
        if (map && map.getLayer && map.getLayer('hills')){
            const current = map.getLayoutProperty('hills', 'visibility') || 'visible';
            const next = current === 'none' ? 'visible' : 'none';
            map.setLayoutProperty('hills', 'visibility', next);
            console.log('[Electro] Terrain layer visibility set to', next);
        } else {
            console.warn('[Electro] Terrain layer not present yet');
        }
    }catch(e){ console.error('[Electro] Toggle terrain error:', e); }
};
window.geofsAddonToggleTerrain = window.geofsElectroAddon.toggleTerrain;