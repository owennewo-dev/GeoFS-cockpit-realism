const map = new maplibregl.Map({
    container: 'map',
    style: {
        'version': 8,
        'minzoom': 2,
        'maxzoom': 20,
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
    zoom: 2,
    maxPitch: 90
});

const airplaneElement = document.createElement('div');
airplaneElement.className = 'airplane-icon';

const airplaneMarker = new maplibregl.Marker({element: airplaneElement})
    .setLngLat([-74.5, 40])
    .addTo(map);

function updateAirplanePosition() {
    if (geofs.aircraft && geofs.aircraft.instance) {
        const position = geofs.aircraft.instance.llaLocation;
        airplaneMarker.setLngLat([position[1], position[0]]);
        map.setCenter([position[1], position[0]]);
    }
}

setInterval(updateAirplanePosition, 1000);