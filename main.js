(function() {
    'use strict';

    window.openAIPKey = "YOUR_OPENAIP_API_KEY";

    function loadScript(url, callback) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        document.head.appendChild(script);
    }

    function loadMapLibre(callback) {
        loadScript("https://unpkg.com/maplibre-gl@5.5.0/dist/maplibre-gl.js", function() {
            console.log("MapLibre loaded");
            callback();
        });
    }

    function checkAndRunAircraftScript() {
        const aircraftName = geofs.aircraftList[geofs.aircraft.instance.id]?.name;
        console.log("Current Aircraft:", aircraftName);

        const aircraftScripts = {
            "Beechcraft Baron B55": "https://owennewo-dev.github.io/GeoFS-cockpit-realism/b55/b55.js",
            "Embraer Phenom 100": "https://owennewo-dev.github.io/GeoFS-cockpit-realism/phenom/phenom.js",
        };

        if (aircraftScripts[aircraftName]) {
            console.log(`Loading script: ${aircraftScripts[aircraftName]}`);
            loadScript(aircraftScripts[aircraftName]);
        } else {
            console.log("Aircraft not supported");
        }
    }

    const checkGeoFSReady = setInterval(() => {
        if (typeof geofs !== "undefined" && geofs.aircraft && geofs.aircraft.instance) {
            clearInterval(checkGeoFSReady);
            loadMapLibre(checkAndRunAircraftScript);
        }
    }, 1000);
})();
