(function(){
    'use strict';

    function getOpenAIPKey(){
        let key = localStorage.getItem('geofsOpenAIPKey');
        if(!key || key === 'YOUR_OPENAIP_API_KEY' || key === ''){
            return '';
        }
        return key;
    }

    window.geofsAddonRestart = function(){
        console.log('[GeoFS Cockpit Realism] Restarting addon...');
        if(window.geofsAddonCleanup && typeof window.geofsAddonCleanup === 'function'){
            try{
                window.geofsAddonCleanup();
            }catch(e){
                console.error('[GeoFS Cockpit Realism] Cleanup error:', e);
            }
        }

        const existingPanel = document.querySelector('.geofs-cockpit-addon-panel');
        if(existingPanel) existingPanel.remove();

        const existingBtn = document.querySelector('[data-toggle-panel=".geofs-cockpit-addon-panel"]');
        if(existingBtn) existingBtn.remove();

        if(window.geofsAddonState){
            const aircraftScriptUrls = Object.values({
                "Beechcraft Baron B55": "https://owennewo-dev.github.io/GeoFS-cockpit-realism/b55/b55.js",
                "Embraer Phenom 100": "https://owennewo-dev.github.io/GeoFS-cockpit-realism/phenom/phenom.js"
            });

            window.geofsAddonState.loadedScripts.forEach(script => {
                if(!aircraftScriptUrls.includes(script)){
                    window.geofsAddonState.loadedScripts.delete(script);
                }
            });

            window.geofsAddonState.currentAircraftId = null;
        }

        setTimeout(() => { initializeAddon(); }, 100);
    };

    function createSettingsUI(){
        if(document.querySelector('.geofs-cockpit-addon-panel')) return;

        const currentKey = localStorage.getItem('geofsOpenAIPKey') || '';
        const hasKey = currentKey && currentKey !== 'YOUR_OPENAIP_API_KEY' && currentKey !== '';

        const aircraftBtn = document.querySelector('[data-toggle-panel=".geofs-aircraft-list"]');
        console.log('[GeoFS Cockpit Realism] Aircraft button found:', aircraftBtn);
        if(!aircraftBtn){
            console.warn('[GeoFS Cockpit Realism] Could not find aircraft button to clone');
            return;
        }

        const cockpitBtn = aircraftBtn.cloneNode(true);
        cockpitBtn.textContent = 'Cockpit';
        cockpitBtn.removeAttribute('data-toggle-panel');
        cockpitBtn.setAttribute('data-toggle-panel', '.geofs-cockpit-addon-panel');
        cockpitBtn.setAttribute('title', 'Cockpit Navigation Screen Settings');
        cockpitBtn.removeAttribute('id');
        cockpitBtn.id = 'cockpit-button';

        aircraftBtn.parentNode.insertBefore(cockpitBtn, aircraftBtn.nextSibling);

        const panel = document.createElement('ul');
        panel.className = 'geofs-list geofs-toggle-panel geofs-cockpit-addon-panel';
        panel.style.cssText = 'display: none;';

        panel.innerHTML = `
            <li style="text-align: center; font-size: 18px; font-weight: bold; padding: 20px 10px 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                Configuration for Cockpit Navigation Screen
            </li>
            <li style="padding: 10px 15px; text-align: center;">
                <div style="display:flex; gap:8px;">
                    <button id="geofs-addon-map-heading-btn" class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent" style="flex: 1;">MAP: NORTH UP</button>
                    <button id="geofs-addon-toggle-terrain-btn" class="mdl-button mdl-js-button mdl-button--raised" style="flex: 1; background: #f44336; color: white;">TOGGLE MAP TERRAIN</button>
                </div>
            </li>
            <li style="padding: 15px;">
                <div style="margin-bottom: 15px;">
                    <strong>Status:</strong> <span style="color: ${hasKey ? '#4CAF50' : '#ff9800'};">${hasKey ? '✓ API Key Configured' : '⚠ No API Key Set'}</span>
                </div>
                <label style="display: block; margin-bottom: 10px;">
                    <strong>OpenAIP API Key:</strong><br>
                    <span style="font-size: 12px; opacity: 0.7;">For aeronautical charts and navigation data</span>
                </label>
                <input type="text" id="geofs-addon-api-key-input" class="geofs-stopKeyboardPropagation geofs-stopKeyupPropagation geofs-stopMousePropagation" value="${currentKey}" placeholder="Enter your OpenAIP API key" style="width: 100%; padding: 8px; margin-top: 5px; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 3px; box-sizing: border-box; font-family: monospace;">
                <div style="margin-top: 15px;">
                    <button id="geofs-addon-save-btn" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" style="margin-right: 10px;">Save Key</button>
                    <button id="geofs-addon-clear-btn" class="mdl-button mdl-js-button mdl-button--raised" style="margin-right: 10px;">Clear Key</button>
                </div>
            </li>
            <li style="padding: 15px;">
                <div style="padding: 0 0 10px 0; line-height: 1.6;">
                    <strong>How to get an API key</strong>
                    <ol style="margin: 8px 0 0 20px; padding: 0;">
                        <li>Create a free account at <a href="https://www.openaip.net/" target="_blank" style="color: #4CAF50; text-decoration: underline;">openaip.net</a></li>
                        <li>Visit the <a href="https://www.openaip.net/user/api-clients" target="_blank" style="color: #4CAF50; text-decoration: underline;">API Clients page</a></li>
                        <li>Click 'Create API Client'</li>
                        <li>Add a name and description (any text works)</li>
                        <li>Copy your API Key and paste it above</li>
                        <li>Click 'Save Key'</li>
                    </ol>
                </div>
            </li>
            <li style="padding: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 12px; opacity: 0.5; text-align: center;">GeoFS Cockpit Realism v0.5.0</div>
            </li>
        `;

        const aircraftPanel = document.querySelector('.geofs-aircraft-list');
        if(aircraftPanel && aircraftPanel.parentNode){
            aircraftPanel.parentNode.insertBefore(panel, aircraftPanel.nextSibling);
        }else{
            document.body.appendChild(panel);
        }

        cockpitBtn.addEventListener('click', function(){
            if(panel.style.display === 'block'){
                panel.style.display = 'none';
            }else{
                panel.style.display = 'block';
            }
        });

        document.querySelectorAll('[data-toggle-panel]').forEach(btn => {
            if(btn.id !== 'cockpit-button'){
                btn.addEventListener('click', function(){ panel.style.display = 'none'; });
            }
        });

        setTimeout(() => {
            const saveBtn = document.getElementById('geofs-addon-save-btn');
            const clearBtn = document.getElementById('geofs-addon-clear-btn');
            const input = document.getElementById('geofs-addon-api-key-input');

            if(saveBtn){
                saveBtn.onclick = () => {
                    const newKey = input.value.trim();
                    if(newKey){
                        localStorage.setItem('geofsOpenAIPKey', newKey);
                        window.openAIPKey = newKey;
                        const panelElement = document.querySelector('.geofs-cockpit-addon-panel');
                        if(panelElement) panelElement.style.display = 'none';
                        console.log('[GeoFS Cockpit Realism] API key saved, restarting...');
                        window.geofsAddonRestart();
                    }else{
                        alert('Please enter a valid API key.');
                    }
                };
            }

            if(clearBtn){
                clearBtn.onclick = () => {
                    if(confirm('Are you sure you want to clear your API key?')){
                        localStorage.removeItem('geofsOpenAIPKey');
                        window.openAIPKey = '';
                        const panelElement = document.querySelector('.geofs-cockpit-addon-panel');
                        if(panelElement) panelElement.style.display = 'none';
                        console.log('[GeoFS Cockpit Realism] API key cleared, restarting...');
                        window.geofsAddonRestart();
                    }
                };
            }

            const mapHeadingBtn = document.getElementById('geofs-addon-map-heading-btn');
            if(mapHeadingBtn){
                mapHeadingBtn.onclick = () => {
                    console.log('[GeoFS Cockpit Realism] Map heading toggle requested from UI');
                    if(window.geofsAddonToggleMapHeading && typeof window.geofsAddonToggleMapHeading === 'function'){
                        try{
                            const mode = window.geofsAddonToggleMapHeading();
                            // Show opposite mode - what you'll switch TO next time
                            const nextMode = mode === 'North Up' ? 'Heading Up' : 'North Up';
                            mapHeadingBtn.textContent = 'MAP: ' + nextMode.toUpperCase();
                            const panelElement = document.querySelector('.geofs-cockpit-addon-panel');
                            if(panelElement) panelElement.style.display = 'none';
                        }catch(e){
                            console.error('[GeoFS Cockpit Realism] Map heading toggle error:', e);
                            alert('Map heading toggle failed. Check console for details.');
                        }
                    }else{
                        alert('No map loaded for heading toggle. Switch to a supported aircraft first.');
                    }
                };
            }

            const toggleTerrainBtn = document.getElementById('geofs-addon-toggle-terrain-btn');
            if(toggleTerrainBtn){
                toggleTerrainBtn.onclick = () => {
                    console.log('[GeoFS Cockpit Realism] Terrain toggle requested from UI');
                    if(window.geofsAddonToggleTerrain && typeof window.geofsAddonToggleTerrain === 'function'){
                        try{
                            window.geofsAddonToggleTerrain();
                            const panelElement = document.querySelector('.geofs-cockpit-addon-panel');
                            if(panelElement) panelElement.style.display = 'none';
                        }catch(e){
                            console.error('[GeoFS Cockpit Realism] Terrain toggle error:', e);
                            alert('Terrain toggle failed. Check console for details.');
                        }
                    }else{
                        alert('No map loaded for terrain toggle. Switch to a supported aircraft first.');
                    }
                };
            }
        }, 100);

        console.log('[GeoFS Cockpit Realism] Settings UI integrated into menu');
    }

    function addFlightPlanSyncButton(){
        // Check if button already exists
        if(document.getElementById('geofs-flightplan-sync-btn')){
            console.log('[GeoFS Cockpit Realism] Flight plan sync button already exists');
            return;
        }

        // Find the flight plan waypoint controls container
        const flightPlanWaypoint = document.getElementById('flightPlanWaypoint');
        if(!flightPlanWaypoint){
            console.warn('[GeoFS Cockpit Realism] Flight plan waypoint container not found');
            return;
        }

        // Reduce the width of the text field to make room for the new button
        const textFieldContainer = flightPlanWaypoint.querySelector('.mdl-textfield');
        if(textFieldContainer){
            textFieldContainer.style.width = '250px';
        }

        // Create the sync button
        const syncButton = document.createElement('button');
        syncButton.className = 'mdl-button mdl-js-button mdl-button--icon geofs-flightplanAction';
        syncButton.id = 'geofs-flightplan-sync-btn';
        syncButton.title = 'Send Flight Plan to Map';
        syncButton.onclick = () => {
            console.log('[GeoFS Cockpit Realism] Flight plan sync requested from map UI');
            if(window.geofsAddonRefreshWaypoints && typeof window.geofsAddonRefreshWaypoints === 'function'){
                try{
                    window.geofsAddonRefreshWaypoints();
                }catch(e){
                    console.error('[GeoFS Cockpit Realism] Sync error:', e);
                    alert('Waypoint sync failed. Check console for details.');
                }
            }else{
                alert('No map loaded for waypoint sync. Switch to a supported aircraft first.');
            }
        };

        // Create the icon
        const icon = document.createElement('i');
        icon.className = 'material-icons';
        icon.textContent = 'sync';
        syncButton.appendChild(icon);

        // Append the button at the end of the container
        flightPlanWaypoint.appendChild(syncButton);

        console.log('[GeoFS Cockpit Realism] Flight plan sync button added');
    }

    function addMapSearchButtonsToWaypoints(){
        // Function to add map search button to a single waypoint
        function addButtonToWaypoint(waypoint){
            // Check if button already exists
            if(waypoint.querySelector('.geofs-waypoint-map-search-btn')){
                return;
            }

            // Find the delete button to insert after it
            const deleteBtn = waypoint.querySelector('button[onclick*="geofs.flightplan.deleteWaypoint"]');
            if(!deleteBtn){
                return;
            }

            // Get the waypoint coordinates
            const coordsSpan = waypoint.querySelector('.geofs-waypointCoords');
            if(!coordsSpan){
                return;
            }

            // Create the map search button
            const mapSearchBtn = document.createElement('button');
            mapSearchBtn.className = 'mdl-button mdl-js-button mdl-button--icon geofs-flightplanAction geofs-waypoint-map-search-btn';
            mapSearchBtn.title = 'Show on Map';
            mapSearchBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Parse coordinates from the span text (format: "lat, lon")
                const coordsText = coordsSpan.textContent.trim();
                const coords = coordsText.split(',').map(c => parseFloat(c.trim()));
                
                if(coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])){
                    const lat = coords[0];
                    const lon = coords[1];
                    
                    console.log(`[GeoFS Cockpit Realism] Moving map to waypoint: ${lat}, ${lon}`);
                    
                    // Check if map exists and move to location
                    if(window.geofsB55Addon && window.geofsB55Addon.centerMapOnLocation){
                        try{
                            window.geofsB55Addon.centerMapOnLocation(lat, lon);
                        }catch(e){
                            console.error('[GeoFS Cockpit Realism] Error centering map:', e);
                            alert('Failed to move map. Check console for details.');
                        }
                    }else{
                        alert('No map loaded. Switch to a supported aircraft first.');
                    }
                }else{
                    console.error('[GeoFS Cockpit Realism] Invalid coordinates:', coordsText);
                    alert('Invalid waypoint coordinates.');
                }
            };

            // Create the icon
            const icon = document.createElement('i');
            icon.className = 'material-icons';
            icon.textContent = 'map_search';
            mapSearchBtn.appendChild(icon);

            // Insert after the delete button
            deleteBtn.parentNode.insertBefore(mapSearchBtn, deleteBtn.nextSibling);
        }

        // Monitor the flight plan list for changes
        const flightPlanList = document.querySelector('.geofs-flightPlanList');
        if(!flightPlanList){
            console.warn('[GeoFS Cockpit Realism] Flight plan list not found, will retry...');
            return;
        }

        // Add buttons to existing waypoints
        const waypoints = flightPlanList.querySelectorAll('.geofs-flightPlanWaypoint');
        waypoints.forEach(addButtonToWaypoint);

        // Set up MutationObserver to watch for new waypoints
        if(!window.geofsAddonState.waypointObserver){
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if(node.nodeType === 1 && node.classList && node.classList.contains('geofs-flightPlanWaypoint')){
                            addButtonToWaypoint(node);
                        }
                    });
                });
            });

            observer.observe(flightPlanList, { childList: true, subtree: true });
            window.geofsAddonState.waypointObserver = observer;
            console.log('[GeoFS Cockpit Realism] Waypoint observer initialized');
        }
    }

    function promptForAPIKeyIfNeeded(){
        const key = localStorage.getItem('geofsOpenAIPKey');
        const hasSeenPrompt = localStorage.getItem('geofsAddonSeenPrompt');
        if((!key || key === '') && !hasSeenPrompt){
            localStorage.setItem('geofsAddonSeenPrompt', 'true');
            setTimeout(() => {
                if(confirm('GeoFS Cockpit Realism: Would you like to configure your OpenAIP API key now for aeronautical overlays?\n\n(You can always configure this later using the settings button)')){
                    createSettingsUI();
                    const panel = document.querySelector('.geofs-cockpit-addon-panel');
                    if(panel){ panel.style.display = 'block'; const input = document.getElementById('geofs-addon-api-key-input'); if(input) input.focus(); }
                }else{
                    alert('No problem! The addon will work without OpenAIP overlays.\n\nYou can configure your API key anytime by clicking the "⚙️ Cockpit Addon" button in the bottom-right corner.');
                }
            }, 2000);
        }
    }

    window.openAIPKey = getOpenAIPKey();

    window.geofsAddonState = window.geofsAddonState || {
        loadedScripts: new Set(),
        currentAircraftId: null,
        mapLibreLoaded: false,
        geofsReady: false,
        monitorInterval: null,
        readyInterval: null
    };

    function initializeAddon(){
        console.log('[GeoFS Cockpit Realism] Initializing...');
        window.openAIPKey = getOpenAIPKey();
        if(window.geofsAddonState.monitorInterval) clearInterval(window.geofsAddonState.monitorInterval);
        if(window.geofsAddonState.readyInterval) clearInterval(window.geofsAddonState.readyInterval);

        function loadScript(url, callback){
            if(window.geofsAddonState.loadedScripts.has(url)){
                console.log(`[GeoFS Cockpit Realism] Script already loaded: ${url}`);
                if(callback) callback();
                return;
            }
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => { window.geofsAddonState.loadedScripts.add(url); console.log(`[GeoFS Cockpit Realism] Script loaded: ${url}`); if(callback) callback(); };
            script.onerror = () => { console.error(`[GeoFS Cockpit Realism] Failed to load script: ${url}`); if(callback) callback(new Error(`Failed to load ${url}`)); };
            document.head.appendChild(script);
        }

        function loadMapLibre(callback){
            if(window.geofsAddonState.mapLibreLoaded || typeof maplibregl !== 'undefined'){ window.geofsAddonState.mapLibreLoaded = true; console.log("[GeoFS Cockpit Realism] MapLibre already loaded"); if(callback) callback(); return; }
            loadScript("https://unpkg.com/maplibre-gl@5.5.0/dist/maplibre-gl.js", (err) => { if(!err){ window.geofsAddonState.mapLibreLoaded = true; console.log("[GeoFS Cockpit Realism] MapLibre loaded"); } if(callback) callback(err); });
        }

        const aircraftScripts = {
            "Beechcraft Baron B55": "https://owennewo-dev.github.io/GeoFS-cockpit-realism/b55/b55.js",
            "Embraer Phenom 100": "https://owennewo-dev.github.io/GeoFS-cockpit-realism/phenom/phenom.js"
        };

        function checkAndRunAircraftScript(){
            if(typeof geofs === 'undefined' || !geofs.aircraft || !geofs.aircraft.instance){ console.warn('[GeoFS Cockpit Realism] GeoFS not ready yet'); return; }
            const aircraftId = geofs.aircraft.instance.id;
            const aircraftName = geofs.aircraftList[aircraftId]?.name;
            console.log(`[GeoFS Cockpit Realism] Current Aircraft: ${aircraftName} (ID: ${aircraftId})`);
            if(window.geofsAddonState.currentAircraftId === aircraftId && window.geofsAddonState.loadedScripts.size > 1){ console.log(`[GeoFS Cockpit Realism] Already initialized for this aircraft`); return; }
            window.geofsAddonState.currentAircraftId = aircraftId;
            if(window.geofsAddonCleanup && typeof window.geofsAddonCleanup === 'function'){ try{ window.geofsAddonCleanup(); }catch(e){ console.error('[GeoFS Cockpit Realism] Cleanup error:', e); } }
            if(aircraftScripts[aircraftName]){
                const scriptUrl = aircraftScripts[aircraftName];
                const isScriptLoaded = window.geofsAddonState.loadedScripts.has(scriptUrl);
                if(isScriptLoaded && window.geofsB55Addon && typeof window.geofsB55Addon.init === 'function' && aircraftName === "Beechcraft Baron B55"){
                    console.log(`[GeoFS Cockpit Realism] Re-initializing B55 with updated settings...`);
                    try{ window.geofsB55Addon.init(); }catch(e){ console.error('[GeoFS Cockpit Realism] Re-initialization error:', e); }
                }else if(!isScriptLoaded){
                    console.log(`[GeoFS Cockpit Realism] Loading script: ${scriptUrl}`);
                    loadScript(scriptUrl);
                }else{
                    console.log(`[GeoFS Cockpit Realism] Script already loaded but no init function available`);
                }
            }else{
                console.log(`[GeoFS Cockpit Realism] Aircraft "${aircraftName}" not supported yet`);
            }
        }

        function monitorAircraftChanges(){
            window.geofsAddonState.monitorInterval = setInterval(() => {
                if(window.geofsAddonState.geofsReady && geofs.aircraft && geofs.aircraft.instance){
                    const newAircraftId = geofs.aircraft.instance.id;
                    if(newAircraftId !== window.geofsAddonState.currentAircraftId){
                        console.log('[GeoFS Cockpit Realism] Aircraft changed, reloading...');
                        checkAndRunAircraftScript();
                    }
                }
            }, 1000);
        }

        window.geofsAddonState.readyInterval = setInterval(() => {
            if(typeof geofs !== "undefined" && geofs.aircraft && geofs.aircraft.instance){
                clearInterval(window.geofsAddonState.readyInterval);
                window.geofsAddonState.geofsReady = true;
                console.log('[GeoFS Cockpit Realism] GeoFS ready');
                setTimeout(() => {
                    console.log('[GeoFS Cockpit Realism] Creating settings UI...');
                    createSettingsUI();
                    addFlightPlanSyncButton();
                    addMapSearchButtonsToWaypoints();
                    promptForAPIKeyIfNeeded();
                    loadMapLibre((err) => {
                        if(!err){ checkAndRunAircraftScript(); monitorAircraftChanges(); }else{ console.error('[GeoFS Cockpit Realism] Failed to load MapLibre'); }
                    });
                }, 2000);
            }
        }, 1000);
    }

    initializeAddon();
})();

