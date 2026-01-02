(function(){
    'use strict';

    function getOpenAIPKey(){
        let key = localStorage.getItem('geofsOpenAIPKey');
        return (!key || key === 'YOUR_OPENAIP_API_KEY') ? '' : key;
    }

    window.geofsAddonRestart = function(){
        console.log('[GeoFS Cockpit Realism] Restarting addon...');
        if(typeof window.geofsAddonCleanup === 'function'){
            try{ window.geofsAddonCleanup(); }catch(e){ console.error('Cleanup error:', e); }
        }

        document.querySelector('.geofs-cockpit-addon-panel')?.remove();
        document.querySelector('[data-toggle-panel=".geofs-cockpit-addon-panel"]')?.remove();

        if(window.geofsAddonState){
            const aircraftScriptUrls = Object.values({
                "Beechcraft Baron B55": "https://owennewo-dev.github.io/GeoFS-cockpit-realism/b55/b55.js",
                "Embraer Phenom 100": "https://owennewo-dev.github.io/GeoFS-cockpit-realism/phenom/phenom.js"
            });

            window.geofsAddonState.loadedScripts.forEach(script => {
                if(!aircraftScriptUrls.includes(script)) window.geofsAddonState.loadedScripts.delete(script);
            });
            window.geofsAddonState.currentAircraftId = null;
        }
        setTimeout(initializeAddon, 100);
    };

    function createSettingsUI(){
        if(document.querySelector('.geofs-cockpit-addon-panel')) return;

        const currentKey = localStorage.getItem('geofsOpenAIPKey') || '';
        const hasKey = currentKey && currentKey !== 'YOUR_OPENAIP_API_KEY';

        const aircraftBtn = document.querySelector('[data-toggle-panel=".geofs-aircraft-list"]');
        if(!aircraftBtn) return;

        const cockpitBtn = aircraftBtn.cloneNode(true);
        cockpitBtn.textContent = 'Cockpit';
        cockpitBtn.setAttribute('data-toggle-panel', '.geofs-cockpit-addon-panel');
        cockpitBtn.title = 'Cockpit Navigation Screen Settings';
        cockpitBtn.id = 'cockpit-button';

        aircraftBtn.parentNode.insertBefore(cockpitBtn, aircraftBtn.nextSibling);

        const panel = document.createElement('ul');
        panel.className = 'geofs-list geofs-toggle-panel geofs-cockpit-addon-panel';
        panel.style.display = 'none';

        panel.innerHTML = `
            <li style="text-align: center; font-size: 18px; font-weight: bold; padding: 20px 10px 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                Configuration for Cockpit Navigation Screen
            </li>
            <style>
                .geofs-addon-toggle-container { display: flex; align-items: center; padding: 12px 15px; border-bottom: 1px solid rgba(255,255,255,0.1); gap: 12px; }
                .geofs-addon-toggle-label { font-size: 16px; font-weight: 500; color: #000; }
                .geofs-addon-toggle-switch { position: relative; display: inline-block; width: 50px; height: 24px; }
                .geofs-addon-toggle-switch input { opacity: 0; width: 0; height: 0; }
                .geofs-addon-toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: 0.3s; border-radius: 24px; }
                .geofs-addon-toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: 0.3s; border-radius: 50%; }
                .geofs-addon-toggle-switch input:checked + .geofs-addon-toggle-slider { background-color: #4CAF50; }
                .geofs-addon-toggle-switch input:checked + .geofs-addon-toggle-slider:before { transform: translateX(26px); }
            </style>
            <li style="padding: 10px 0;">
                <div class="geofs-addon-toggle-container">
                    <label class="geofs-addon-toggle-switch"><input type="checkbox" id="geofs-addon-map-heading-toggle"><span class="geofs-addon-toggle-slider"></span></label>
                    <span class="geofs-addon-toggle-label">North Up Mode</span>
                </div>
                <div class="geofs-addon-toggle-container">
                    <label class="geofs-addon-toggle-switch"><input type="checkbox" id="geofs-addon-toggle-terrain-toggle" checked><span class="geofs-addon-toggle-slider"></span></label>
                    <span class="geofs-addon-toggle-label">Terrain</span>
                </div>
                <div class="geofs-addon-toggle-container">
                    <label class="geofs-addon-toggle-switch"><input type="checkbox" id="geofs-addon-toggle-satellite-toggle"><span class="geofs-addon-toggle-slider"></span></label>
                    <span class="geofs-addon-toggle-label">Satellite Imagery</span>
                </div>
                <div class="geofs-addon-toggle-container">
                    <label class="geofs-addon-toggle-switch"><input type="checkbox" id="geofs-addon-toggle-keyboard-toggle"><span class="geofs-addon-toggle-slider"></span></label>
                    <span class="geofs-addon-toggle-label">Keyboard Arrow Controls</span>
                </div>
            </li>
            <li style="padding: 15px;">
                <div style="margin-bottom: 15px;">
                    <strong>Status:</strong> <span style="color: ${hasKey ? '#4CAF50' : '#ff9800'};">${hasKey ? '✓ API Key Configured' : '⚠ No API Key Set'}</span>
                </div>
                <label style="display: block; margin-bottom: 10px;">
                    <strong>OpenAIP API Key:</strong><br><span style="font-size: 12px; opacity: 0.7;">For aeronautical charts and navigation data</span>
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
                <div style="font-size: 12px; opacity: 0.5; text-align: center;">GeoFS Cockpit Realism v0.10.0</div>
            </li>
        `;

        const aircraftPanel = document.querySelector('.geofs-aircraft-list');
        if(aircraftPanel?.parentNode) aircraftPanel.parentNode.insertBefore(panel, aircraftPanel.nextSibling);
        else document.body.appendChild(panel);

        cockpitBtn.addEventListener('click', () => panel.style.display = panel.style.display === 'block' ? 'none' : 'block');

        document.querySelectorAll('[data-toggle-panel]').forEach(btn => {
            if(btn.id !== 'cockpit-button') btn.addEventListener('click', () => panel.style.display = 'none');
        });

        setTimeout(() => {
            const saveBtn = document.getElementById('geofs-addon-save-btn');
            const clearBtn = document.getElementById('geofs-addon-clear-btn');
            const input = document.getElementById('geofs-addon-api-key-input');

            if(saveBtn) saveBtn.onclick = () => {
                const newKey = input.value.trim();
                if(newKey){
                    localStorage.setItem('geofsOpenAIPKey', newKey);
                    window.openAIPKey = newKey;
                    if(document.querySelector('.geofs-cockpit-addon-panel')) document.querySelector('.geofs-cockpit-addon-panel').style.display = 'none';
                    window.geofsAddonRestart();
                } else alert('Please enter a valid API key.');
            };

            if(clearBtn) clearBtn.onclick = () => {
                if(confirm('Are you sure you want to clear your API key?')){
                    localStorage.removeItem('geofsOpenAIPKey');
                    window.openAIPKey = '';
                    if(document.querySelector('.geofs-cockpit-addon-panel')) document.querySelector('.geofs-cockpit-addon-panel').style.display = 'none';
                    window.geofsAddonRestart();
                }
            };

            const setupToggle = (id, funcName, errorMsg) => {
                const toggle = document.getElementById(id);
                if(toggle) toggle.onchange = () => {
                    if(typeof window[funcName] === 'function'){
                        try {
                            window[funcName]();
                            if(document.querySelector('.geofs-cockpit-addon-panel')) document.querySelector('.geofs-cockpit-addon-panel').style.display = 'none';
                        } catch(e) {
                            console.error(errorMsg, e);
                            toggle.checked = !toggle.checked;
                        }
                    } else {
                        alert('No map loaded. Switch to a supported aircraft first.');
                        toggle.checked = !toggle.checked;
                    }
                };
            };

            setupToggle('geofs-addon-map-heading-toggle', 'geofsAddonToggleMapHeading', 'Map heading toggle error:');
            setupToggle('geofs-addon-toggle-terrain-toggle', 'geofsAddonToggleTerrain', 'Terrain toggle error:');
            setupToggle('geofs-addon-toggle-satellite-toggle', 'geofsAddonToggleSatelliteImagery', 'Satellite imagery toggle error:');
            setupToggle('geofs-addon-toggle-keyboard-toggle', 'geofsAddonToggleKeyboardArrows', 'Keyboard arrows toggle error:');

        }, 100);
        console.log('[GeoFS Cockpit Realism] Settings UI integrated');
    }

    function addFlightPlanSyncButton(){
        if(document.getElementById('geofs-flightplan-sync-btn')) return;

        const flightPlanWaypoint = document.getElementById('flightPlanWaypoint');
        if(!flightPlanWaypoint) return;

        const textFieldContainer = flightPlanWaypoint.querySelector('.mdl-textfield');
        if(textFieldContainer) textFieldContainer.style.width = '200px';

        const syncButton = document.createElement('button');
        syncButton.className = 'mdl-button mdl-js-button mdl-button--icon geofs-flightplanAction';
        syncButton.id = 'geofs-flightplan-sync-btn';
        syncButton.title = 'Sync Flight Plan to Navigation Device';
        syncButton.onclick = () => {
            if(typeof window.geofsAddonRefreshWaypoints === 'function'){
                try{ window.geofsAddonRefreshWaypoints(); }catch(e){ console.error('Sync error:', e); alert('Waypoint sync failed.'); }
            }else alert('No map loaded for waypoint sync. Switch to a supported aircraft first.');
        };

        const icon = document.createElement('i');
        icon.className = 'material-icons';
        icon.textContent = 'sync';
        syncButton.appendChild(icon);
        flightPlanWaypoint.appendChild(syncButton);
    }

    function addRecenterMapButton(){
        if(document.getElementById('geofs-recenter-map-btn')) return;

        const flightPlanWaypoint = document.getElementById('flightPlanWaypoint');
        if(!flightPlanWaypoint) return;

        const recenterButton = document.createElement('button');
        recenterButton.className = 'mdl-button mdl-js-button mdl-button--icon geofs-flightplanAction';
        recenterButton.id = 'geofs-recenter-map-btn';
        recenterButton.title = 'Recenter Map on Aircraft';
        recenterButton.onclick = () => {
            if(window.geofsB55Addon?.recenterOnAircraft){
                try{ window.geofsB55Addon.recenterOnAircraft(); }catch(e){ console.error('Recenter error:', e); alert('Failed to recenter map.'); }
            }else alert('No map loaded. Switch to a supported aircraft first.');
        };

        const icon = document.createElement('i');
        icon.className = 'material-icons';
        icon.textContent = 'navigation';
        recenterButton.appendChild(icon);
        flightPlanWaypoint.appendChild(recenterButton);
    }

    function addToggleLeafletMapButton(){
        if(document.getElementById('geofs-toggle-leaflet-btn')) return;

        const flightPlanWaypoint = document.getElementById('flightPlanWaypoint');
        if(!flightPlanWaypoint) return;

        let leafletMapVisible = true;

        const toggleButton = document.createElement('button');
        toggleButton.className = 'mdl-button mdl-js-button mdl-button--icon geofs-flightplanAction';
        toggleButton.id = 'geofs-toggle-leaflet-btn';
        toggleButton.title = 'Hide Native Map';

        const icon = document.createElement('i');
        icon.className = 'material-icons';
        icon.textContent = 'visibility_off';
        toggleButton.appendChild(icon);

        const tooltip = document.createElement('div');
        tooltip.className = 'mdl-tooltip';
        tooltip.setAttribute('for', toggleButton.id);
        tooltip.textContent = 'Hide Native Map';

        toggleButton.onclick = () => {
            const leafletMap = document.querySelector('.geofs-map-viewport');
            if(!leafletMap) return alert('Native map element not found.');

            leafletMapVisible = !leafletMapVisible;
            const centerMapBtn = document.getElementById('centerMap');
            const drawFlightPathBtn = document.getElementById('drawFlightPath');
            
            leafletMap.style.display = leafletMapVisible ? '' : 'none';
            icon.textContent = leafletMapVisible ? 'visibility_off' : 'visibility';
            toggleButton.title = leafletMapVisible ? 'Hide Native Map' : 'Show Native Map';
            tooltip.textContent = toggleButton.title;
            
            [centerMapBtn, drawFlightPathBtn].forEach(btn => {
                if(btn?.parentElement) btn.parentElement.style.display = leafletMapVisible ? '' : 'none';
            });
        };

        flightPlanWaypoint.appendChild(toggleButton);
        flightPlanWaypoint.appendChild(tooltip);
    }

    function addMapSearchButtonsToWaypoints(){
        if(!document.getElementById('geofs-waypoint-compact-style')){
            const style = document.createElement('style');
            style.id = 'geofs-waypoint-compact-style';
            style.textContent = `.geofs-flightPlanWaypoint .geofs-waypointProperty, .geofs-flightplanheader .geofs-waypointProperty { width: 60px !important; }`;
            document.head.appendChild(style);
        }
        
        function addButtonToWaypoint(waypoint){
            if(waypoint.querySelector('.geofs-waypoint-map-search-btn')) return;

            const deleteIcon = waypoint.querySelector('i[onclick*="geofs.flightPlan.deleteWaypoint"]');
            const deleteBtn = deleteIcon?.closest('button');
            const coordsSpan = waypoint.querySelector('.geofs-waypointCoords');
            if(!deleteBtn || !coordsSpan) return;

            const mapSearchBtn = document.createElement('button');
            mapSearchBtn.className = 'mdl-button mdl-js-button mdl-button--icon geofs-flightplanAction geofs-waypoint-map-search-btn';
            mapSearchBtn.title = 'Show on Map';
            mapSearchBtn.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                const coords = coordsSpan.textContent.trim().split(',').map(c => parseFloat(c.trim()));
                
                if(coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])){
                    if(window.geofsB55Addon?.centerMapOnLocation){
                        try{ window.geofsB55Addon.centerMapOnLocation(coords[0], coords[1]); }catch(e){ console.error('Error centering map:', e); }
                    }else alert('No map loaded. Switch to a supported aircraft first.');
                }else alert('Invalid waypoint coordinates.');
            };

            const icon = document.createElement('i');
            icon.className = 'material-icons';
            icon.textContent = 'map';
            mapSearchBtn.appendChild(icon);
            deleteBtn.parentNode.insertBefore(mapSearchBtn, deleteBtn.nextSibling);
        }

        const flightPlanList = document.querySelector('.geofs-flightPlanList');
        if(!flightPlanList) return;

        flightPlanList.querySelectorAll('.geofs-flightPlanWaypoint').forEach(addButtonToWaypoint);

        if(!window.geofsAddonState.waypointObserver){
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if(node.nodeType === 1 && node.classList?.contains('geofs-flightPlanWaypoint')) addButtonToWaypoint(node);
                    });
                });
            });
            observer.observe(flightPlanList, { childList: true, subtree: true });
            window.geofsAddonState.waypointObserver = observer;
        }
    }

    function promptForAPIKeyIfNeeded(){
        const key = localStorage.getItem('geofsOpenAIPKey');
        if((!key || key === '') && !localStorage.getItem('geofsAddonSeenPrompt')){
            localStorage.setItem('geofsAddonSeenPrompt', 'true');
            setTimeout(() => {
                if(confirm('GeoFS Cockpit Realism: Configure OpenAIP API key now?\n\n(You can configure this later in settings)')){
                    createSettingsUI();
                    const panel = document.querySelector('.geofs-cockpit-addon-panel');
                    if(panel){ panel.style.display = 'block'; document.getElementById('geofs-addon-api-key-input')?.focus(); }
                }else alert('Addon will work without OpenAIP overlays. Configure anytime via "⚙️ Cockpit Addon".');
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
                if(callback) callback();
                return;
            }
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => { window.geofsAddonState.loadedScripts.add(url); console.log(`Loaded: ${url}`); if(callback) callback(); };
            script.onerror = () => { console.error(`Failed to load: ${url}`); if(callback) callback(new Error(`Failed to load ${url}`)); };
            document.head.appendChild(script);
        }

        function loadMapLibre(callback){
            if(window.geofsAddonState.mapLibreLoaded || typeof maplibregl !== 'undefined'){ window.geofsAddonState.mapLibreLoaded = true; if(callback) callback(); return; }
            loadScript("https://unpkg.com/maplibre-gl@5.5.0/dist/maplibre-gl.js", (err) => { if(!err) window.geofsAddonState.mapLibreLoaded = true; if(callback) callback(err); });
        }

        const aircraftScripts = {
            "Beechcraft Baron B55": "https://owennewo-dev.github.io/GeoFS-cockpit-realism/b55/b55.js",
            "Embraer Phenom 100": "https://owennewo-dev.github.io/GeoFS-cockpit-realism/phenom/phenom.js"
        };

        function checkAndRunAircraftScript(){
            if(typeof geofs === 'undefined' || !geofs.aircraft?.instance) return;
            const aircraftId = geofs.aircraft.instance.id;
            const aircraftName = geofs.aircraftList[aircraftId]?.name;
            
            if(window.geofsAddonState.currentAircraftId === aircraftId && window.geofsAddonState.loadedScripts.size > 1) return;
            
            console.log(`[GeoFS Cockpit Realism] Aircraft: ${aircraftName} (${aircraftId})`);
            window.geofsAddonState.currentAircraftId = aircraftId;
            
            if(typeof window.geofsAddonCleanup === 'function') try{ window.geofsAddonCleanup(); }catch(e){ console.error('Cleanup error:', e); }
            
            if(aircraftScripts[aircraftName]){
                const scriptUrl = aircraftScripts[aircraftName];
                if(window.geofsAddonState.loadedScripts.has(scriptUrl) && window.geofsB55Addon?.init && aircraftName === "Beechcraft Baron B55"){
                    console.log(`Re-initializing B55...`);
                    try{ window.geofsB55Addon.init(); }catch(e){ console.error('Re-init error:', e); }
                }else if(!window.geofsAddonState.loadedScripts.has(scriptUrl)){
                    loadScript(scriptUrl);
                }
            }
        }

        function monitorAircraftChanges(){
            window.geofsAddonState.monitorInterval = setInterval(() => {
                if(window.geofsAddonState.geofsReady && geofs.aircraft?.instance?.id !== window.geofsAddonState.currentAircraftId){
                    checkAndRunAircraftScript();
                }
            }, 1000);
        }

        window.geofsAddonState.readyInterval = setInterval(() => {
            if(typeof geofs !== "undefined" && geofs.aircraft?.instance){
                clearInterval(window.geofsAddonState.readyInterval);
                window.geofsAddonState.geofsReady = true;
                console.log('[GeoFS Cockpit Realism] GeoFS ready');
                setTimeout(() => {
                    createSettingsUI();
                    addFlightPlanSyncButton();
                    addRecenterMapButton();
                    addToggleLeafletMapButton();
                    addMapSearchButtonsToWaypoints();
                    promptForAPIKeyIfNeeded();
                    loadMapLibre((err) => {
                        if(!err){ checkAndRunAircraftScript(); monitorAircraftChanges(); }
                    });
                }, 2000);
            }
        }, 1000);
    }

    initializeAddon();
})();

