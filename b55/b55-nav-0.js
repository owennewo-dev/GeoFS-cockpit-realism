const canvas = document.createElement("canvas");
canvas.id = "mapCanvas";
canvas.width = 512;
canvas.height = 512;
canvas.style.display = "none";
document.body.appendChild(canvas);

const map = new maplibregl.Map({
    container: canvas,
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

const airplaneElement = document.createElement("div");
airplaneElement.className = "airplane-icon";

const airplaneMarker = new maplibregl.Marker({element: airplaneElement})
    .setLngLat([-74.5, 40])
    .addTo(map);

function updateAirplanePosition() {
    if (geofs.aircraft && geofs.aircraft.instance) {
        const position = geofs.aircraft.instance.llaLocation;
        const heading = geofs.animation.values.heading360;

        console.log("Updating plane position:", position, "Heading:", heading);

        airplaneMarker.setLngLat([position[1], position[0]]);

        airplaneElement.style.transform = `rotate(${heading}deg)`;

        map.setBearing(-heading);
        map.setCenter([position[1], position[0]]);
    }
}


setInterval(updateAirplanePosition, 1000);

function updateMapTexture() {
    const textureData = canvas.toDataURL("image/png");
    
    geofs.aircraft.instance.addParts({
        name: "NavMap",
        url: textureData,
        position: [0.5, -0.3, 1.2],
        scale: 1,
        rotation: [0, 0, 0]
    });

    console.log("Map texture updated!");
}

setInterval(updateMapTexture, 1000);