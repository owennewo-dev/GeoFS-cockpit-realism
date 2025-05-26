let map;
let mapCallback;

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
                },
                'vfr': {
                    'type': 'raster',
                    'tiles': ['https://tiles.arcgis.com/tiles/ssFJjBXIUyZDrSYZ/arcgis/rest/services/VFR_Sectional/MapServer/tile/{z}/{y}/{x}.png'],
                    'tileSize': 256,
                    'attribution': '<a href="https://tiles.arcgis.com/tiles/ssFJjBXIUyZDrSYZ/arcgis/rest/services/VFR_Sectional/MapServer" target="_blank">FAA</a>'
                }
            },
            'layers': [
                {'id': 'hills', 'type': 'hillshade', 'source': 'hillshadeSource', 'minzoom': 0, 'maxzoom': 20},
                {'id': 'osm', 'type': 'raster', 'source': 'osm', 'minzoom': 0, 'maxzoom': 20, 'paint': {'raster-opacity': 0.4}},
                {'id': 'openaip', 'type': 'raster', 'source': 'openaip', 'minzoom': 0, 'maxzoom': 20},
                {'id': 'vfr', 'type': 'raster', 'source': 'vfr', 'minzoom': 0, 'maxzoom': 20}
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

function trackLayerSwitch() {
    let mode = 1;

    document.addEventListener("keydown", function(event) {
        if (event.key === "Backspace") {
            if (mode === 1) {
                map.setLayoutProperty("osm", "visibility", "none");
                map.setLayoutProperty("hills", "visibility", "none");
                map.setLayoutProperty("openaip", "visibility", "none");
                map.setLayoutProperty("vfr", "visibility", "visible");
                mode = 2;
            } else {
                map.setLayoutProperty("osm", "visibility", "visible");
                map.setLayoutProperty("hills", "visibility", "visible");
                map.setLayoutProperty("openaip", "visibility", "visible");
                map.setLayoutProperty("vfr", "visibility", "none");
                mode = 1;
            }
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
trackLayerSwitch();

setInterval(function() {
    console.log("Refreshing flight plan...");
    loadFlightplan();
}, 5000);