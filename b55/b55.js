// Namespace to avoid conflicts and enable cleanup
window.geofsB55Addon = window.geofsB55Addon || {};

let map;
let mapCallback;
let flightPlanInterval;
let isInitialized = false;
let mapNorthUp = false; // Toggle between north-up and heading alignment
let mapFollowAircraft = true; // Whether map should auto-center on aircraft
let terrainStateBeforeSatellite = 'visible'; // Track terrain state when satellite imagery is enabled

// Airplane icon as SVG data URL (black fill) - larger resolution for scaling
const airplaneIconSvg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="black" viewBox="0 0 16 16"><path d="M6.428 1.151C6.708.591 7.213 0 8 0s1.292.592 1.572 1.151C9.861 1.73 10 2.431 10 3v3.691l5.17 2.585a1.5 1.5 0 0 1 .83 1.342V12a.5.5 0 0 1-.582.493l-5.507-.918-.375 2.253 1.318 1.318A.5.5 0 0 1 10.5 16h-5a.5.5 0 0 1-.354-.854l1.319-1.318-.376-2.253-5.507.918A.5.5 0 0 1 0 12v-1.382a1.5 1.5 0 0 1 .83-1.342L6 6.691V3c0-.568.14-1.271.428-1.849"/></svg>');

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
                },
                'arcgis-satellite': {
                    'type': 'raster',
                    'tiles': ['https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                    'tileSize': 256,
                    'attribution': '<a href="https://www.arcgis.com" target="_blank">Esri</a>'
                }
            },
            'layers': [
                {'id': 'hills', 'type': 'hillshade', 'source': 'hillshadeSource', 'minzoom': 0, 'maxzoom': 20},
                {'id': 'arcgis-satellite', 'type': 'raster', 'source': 'arcgis-satellite', 'minzoom': 0, 'maxzoom': 20, 'layout': {'visibility': 'none'}, 'paint': {'raster-opacity': 1}},
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
        // Load the airplane icon image
        const img = new Image();
        img.onload = function() {
            if (!map.hasImage('airplane-icon')) {
                map.addImage('airplane-icon', img);
            }
            
            // Add aircraft position source
            if (!map.getSource('aircraft-position')) {
                map.addSource('aircraft-position', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [-74.5, 40]
                        },
                        'properties': {
                            'bearing': 0
                        }
                    }
                });
            }
            
            // Add airplane symbol layer
                if (!map.getLayer('aircraft-layer')) {
                map.addLayer({
                    'id': 'aircraft-layer',
                    'type': 'symbol',
                    'source': 'aircraft-position',
                    'layout': {
                        'icon-image': 'airplane-icon',
                        // Increased size for better visibility in cockpit display
                        'icon-size': 1.5,
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
    
    // Only center map on aircraft if following is enabled
    if (mapFollowAircraft) {
        map.jumpTo({
            center: [lon, lat],
            bearing: mapNorthUp ? 0 : heading
        });
    }
    
    // Update airplane icon position and rotation
    const aircraftSource = map.getSource('aircraft-position');
    if (aircraftSource) {
        // Icon always rotates to match aircraft heading
        // With icon-rotation-alignment: 'map', the icon points to the heading in map coordinates
        // This works correctly in both HEADING UP and NORTH UP modes
        aircraftSource.setData({
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [lon, lat]
            },
            'properties': {
                'bearing': heading
            }
        });
    }
    
    geofs.aircraft.instance.parts["map"].object3d.model.setTextureFromCanvas(map.painter.context.gl, 0);
}

function centerMapOnLocation(lat, lon) {
    if (!map) {
        console.error("[B55] Map instance is not initialized!");
        return;
    }
    console.log(`[B55] Centering map on: ${lat}, ${lon}`);
    mapFollowAircraft = false; // Disable auto-centering on aircraft
    const currentZoom = map.getZoom(); // Preserve current zoom level
    map.jumpTo({
        center: [lon, lat],
        zoom: currentZoom
    });
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
                    return next; // Return new state for button label
                } else {
                    console.warn('[B55] Terrain layer not present yet');
                    return null;
                }
            }catch(e){ console.error('[B55] Toggle terrain error:', e); return null; }
        };
        window.geofsAddonToggleTerrain = window.geofsB55Addon.toggleTerrain;

        // Expose satellite imagery toggle to main addon UI
        window.geofsB55Addon.toggleSatelliteImagery = function() {
            try{
                if (map && map.getLayer && map.getLayer('arcgis-satellite')){
                    const current = map.getLayoutProperty('arcgis-satellite', 'visibility') || 'none';
                    const next = current === 'none' ? 'visible' : 'none';
                    
                    if(next === 'visible'){
                        // Enabling satellite: save current terrain state, disable terrain and OSM
                        if(map.getLayer('hills')){
                            terrainStateBeforeSatellite = map.getLayoutProperty('hills', 'visibility') || 'visible';
                            map.setLayoutProperty('hills', 'visibility', 'none');
                            console.log('[B55] Terrain disabled (was:', terrainStateBeforeSatellite + '), satellite enabled');
                        }
                        // Hide OSM layer so satellite shows at full opacity
                        if(map.getLayer('osm')){
                            map.setLayoutProperty('osm', 'visibility', 'none');
                            console.log('[B55] OSM layer hidden for satellite view');
                        }
                    } else {
                        // Disabling satellite: restore previous terrain state and show OSM
                        if(map.getLayer('hills')){
                            map.setLayoutProperty('hills', 'visibility', terrainStateBeforeSatellite);
                            console.log('[B55] Terrain restored to:', terrainStateBeforeSatellite + ', satellite disabled');
                        }
                        // Restore OSM layer
                        if(map.getLayer('osm')){
                            map.setLayoutProperty('osm', 'visibility', 'visible');
                            console.log('[B55] OSM layer restored');
                        }
                    }
                    
                    map.setLayoutProperty('arcgis-satellite', 'visibility', next);
                    console.log('[B55] Satellite imagery layer visibility set to', next);
                    return next; // Return new state for button label
                } else {
                    console.warn('[B55] Satellite imagery layer not present yet');
                    return null;
                }
            }catch(e){ console.error('[B55] Toggle satellite imagery error:', e); return null; }
        };
        window.geofsAddonToggleSatelliteImagery = window.geofsB55Addon.toggleSatelliteImagery;

        // Expose map heading toggle to main addon UI
        window.geofsB55Addon.toggleMapHeading = function() {
            mapNorthUp = !mapNorthUp;
            const mode = mapNorthUp ? 'North Up' : 'Heading Up';
            console.log('[B55] Map heading mode set to', mode);
            return mode;
        };
        window.geofsAddonToggleMapHeading = window.geofsB55Addon.toggleMapHeading;

        // Expose center map on location to main addon UI
        window.geofsB55Addon.centerMapOnLocation = centerMapOnLocation;
        
        // Expose recenter on aircraft function
        window.geofsB55Addon.recenterOnAircraft = function() {
            mapFollowAircraft = true;
            console.log('[B55] Recentering map on aircraft, map follow enabled');
        };
        
        // Expose toggle map follow function
        window.geofsB55Addon.toggleMapFollow = function() {
            mapFollowAircraft = !mapFollowAircraft;
            console.log('[B55] Map follow aircraft:', mapFollowAircraft);
            return mapFollowAircraft;
        };
        window.geofsAddonToggleMapFollow = window.geofsB55Addon.toggleMapFollow;
        
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