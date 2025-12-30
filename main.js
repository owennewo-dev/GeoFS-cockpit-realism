(function() {
    'use strict';

    // Security: Use localStorage for API key instead of hardcoding
    function getOpenAIPKey() {
        let key = localStorage.getItem('geofsOpenAIPKey');
        if (!key || key === 'YOUR_OPENAIP_API_KEY' || key === '') {
            return '';
        }
        return key;
    }

    // UI: Create settings panel integrated into GeoFS menu
    function createSettingsUI() {
        // Check if already created
        if (document.querySelector('.geofs-cockpit-addon-panel')) return;

        const currentKey = localStorage.getItem('geofsOpenAIPKey') || '';
        const hasKey = currentKey && currentKey !== 'YOUR_OPENAIP_API_KEY' && currentKey !== '';

        // Find the bottom UI container where the buttons are
        const bottomUI = document.querySelector('.geofs-ui-bottom');
        if (!bottomUI) {
            console.warn('[GeoFS Cockpit Realism] Could not find bottom UI container');
            return;
        }

        // Create the "Cockpit" button matching GeoFS style
        const cockpitBtn = document.createElement('button');
        cockpitBtn.className = 'mdl-button mdl-js-button geofs-f-standard-ui';
        cockpitBtn.setAttribute('data-toggle-panel', '.geofs-cockpit-addon-panel');
        cockpitBtn.setAttribute('title', 'Cockpit Navigation Screen Settings');
        cockpitBtn.innerHTML = 'Cockpit <i class="material-icons geofs-ui-bottom-icon">dashboard</i>';
        
        // Insert button before the Options button
        const optionsBtn = bottomUI.querySelector('[data-toggle-panel=".geofs-preference-list"]');
        if (optionsBtn) {
            optionsBtn.parentNode.insertBefore(cockpitBtn, optionsBtn);
        } else {
            bottomUI.appendChild(cockpitBtn);
        }

        // Create the panel matching GeoFS style
        const panel = document.createElement('ul');
        panel.className = 'geofs-list geofs-toggle-panel geofs-cockpit-addon-panel';
        panel.style.cssText = 'display: none;'; // Hidden by default, GeoFS will toggle it

        panel.innerHTML = `
            <li style="text-align: center; font-size: 18px; font-weight: bold; padding: 20px 10px 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                Configuration for Cockpit Navigation Screen
            </li>
            
            <li style="padding: 15px;">
                <div style="margin-bottom: 15px;">
                    <strong>Status:</strong> <span style="color: ${hasKey ? '#4CAF50' : '#ff9800'};">${hasKey ? '✓ API Key Configured' : '⚠ No API Key Set'}</span>
                </div>
                
                <label style="display: block; margin-bottom: 10px;">
                    <strong>OpenAIP API Key:</strong><br>
                    <span style="font-size: 12px; opacity: 0.7;">For aeronautical charts and navigation data</span>
                </label>
                <input type="text" 
                    id="geofs-addon-api-key-input" 
                    class="geofs-stopKeyboardPropagation geofs-stopKeyupPropagation geofs-stopMousePropagation"
                    value="${currentKey}" 
                    placeholder="Enter your OpenAIP API key"
                    style="width: 100%; padding: 8px; margin-top: 5px; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 3px; box-sizing: border-box; font-family: monospace;">
                
                <div style="margin-top: 15px;">
                    <button id="geofs-addon-save-btn" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" style="margin-right: 10px;">Save Key</button>
                    <button id="geofs-addon-clear-btn" class="mdl-button mdl-js-button mdl-button--raised">Clear Key</button>
                </div>
            </li>
            
            <li class="geofs-list-collapsible-item">How to get an API key
                <ul class="geofs-collapsible" style="padding: 15px; line-height: 1.6;">
                    <li>1. Create a free account at <a href="https://www.openaip.net/" target="_blank" style="color: #4CAF50; text-decoration: underline;">openaip.net</a></li>
                    <li>2. Visit <a href="https://www.openaip.net/user/api-clients" target="_blank" style="color: #4CAF50; text-decoration: underline;">API Clients page</a></li>
                    <li>3. Click 'Create API Client'</li>
                    <li>4. Add a name and description (any text works)</li>
                    <li>5. Copy your API Key and paste it above</li>
                    <li>6. Click 'Save Key' and reload the page</li>
                </ul>
            </li>
            
            <li style="padding: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 12px; opacity: 0.5; text-align: center;">
                    GeoFS Cockpit Realism v0.2.0
                </div>
            </li>
        `;

        // Add panel to the page (after other panels)
        const existingPanels = document.querySelector('.geofs-location-list');
        if (existingPanels && existingPanels.parentNode) {
            existingPanels.parentNode.insertBefore(panel, existingPanels.nextSibling);
        } else {
            document.body.appendChild(panel);
        }

        // Add event handlers (wait for DOM to be ready)
        setTimeout(() => {
            const saveBtn = document.getElementById('geofs-addon-save-btn');
            const clearBtn = document.getElementById('geofs-addon-clear-btn');
            const input = document.getElementById('geofs-addon-api-key-input');

            if (saveBtn) {
                saveBtn.onclick = () => {
                    const newKey = input.value.trim();
                    if (newKey) {
                        localStorage.setItem('geofsOpenAIPKey', newKey);
                        window.openAIPKey = newKey;
                        alert('API key saved successfully! Please reload the page to apply changes.');
                    } else {
                        alert('Please enter a valid API key.');
                    }
                };
            }

            if (clearBtn) {
                clearBtn.onclick = () => {
                    if (confirm('Are you sure you want to clear your API key?')) {
                        localStorage.removeItem('geofsOpenAIPKey');
                        window.openAIPKey = '';
                        input.value = '';
                        alert('API key cleared. Reload the page to apply changes.');
                    }
                };
            }
        }, 100);

        console.log('[GeoFS Cockpit Realism] Settings UI integrated into menu');
    }

    // Prompt for API key on first run
    function promptForAPIKeyIfNeeded() {
        const key = localStorage.getItem('geofsOpenAIPKey');
        const hasSeenPrompt = localStorage.getItem('geofsAddonSeenPrompt');
        
        if ((!key || key === '') && !hasSeenPrompt) {
            localStorage.setItem('geofsAddonSeenPrompt', 'true');
            
            setTimeout(() => {
                if (confirm('GeoFS Cockpit Realism: Would you like to configure your OpenAIP API key now for aeronautical overlays?\n\n(You can always configure this later using the settings button)')) {
                    showSettingsDialog();
                } else {
                    alert('No problem! The addon will work without OpenAIP overlays.\n\nYou can configure your API key anytime by clicking the "⚙️ Cockpit Addon" button in the bottom-right corner.');
                }
            }, 2000);
        }
    }

    window.openAIPKey = getOpenAIPKey();

    // Efficiency: Track loaded scripts and aircraft to prevent duplicates
    const loadedScripts = new Set();
    let currentAircraftId = null;
    let mapLibreLoaded = false;
    let geofsReady = false;

    // Safety: Load script with error handling and duplicate prevention
    function loadScript(url, callback) {
        if (loadedScripts.has(url)) {
            console.log(`[GeoFS Cockpit Realism] Script already loaded: ${url}`);
            if (callback) callback();
            return;
        }

        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
            loadedScripts.add(url);
            console.log(`[GeoFS Cockpit Realism] Script loaded: ${url}`);
            if (callback) callback();
        };
        script.onerror = () => {
            console.error(`[GeoFS Cockpit Realism] Failed to load script: ${url}`);
            if (callback) callback(new Error(`Failed to load ${url}`));
        };
        document.head.appendChild(script);
    }

    // Efficiency: Load MapLibre only once
    function loadMapLibre(callback) {
        if (mapLibreLoaded || typeof maplibregl !== 'undefined') {
            mapLibreLoaded = true;
            console.log("[GeoFS Cockpit Realism] MapLibre already loaded");
            if (callback) callback();
            return;
        }

        loadScript("https://unpkg.com/maplibre-gl@5.5.0/dist/maplibre-gl.js", (err) => {
            if (!err) {
                mapLibreLoaded = true;
                console.log("[GeoFS Cockpit Realism] MapLibre loaded");
            }
            if (callback) callback(err);
        });
    }

    // Aircraft script mapping
    const aircraftScripts = {
        "Beechcraft Baron B55": "https://owennewo-dev.github.io/GeoFS-cockpit-realism/b55/b55.js",
        "Embraer Phenom 100": "https://owennewo-dev.github.io/GeoFS-cockpit-realism/phenom/phenom.js",
    };

    // Safety: Check and run aircraft script with guards
    function checkAndRunAircraftScript() {
        if (typeof geofs === 'undefined' || !geofs.aircraft || !geofs.aircraft.instance) {
            console.warn('[GeoFS Cockpit Realism] GeoFS not ready yet');
            return;
        }

        const aircraftId = geofs.aircraft.instance.id;
        const aircraftName = geofs.aircraftList[aircraftId]?.name;
        
        console.log(`[GeoFS Cockpit Realism] Current Aircraft: ${aircraftName} (ID: ${aircraftId})`);

        // Efficiency: Skip if same aircraft (unless it's the first load)
        if (currentAircraftId === aircraftId && loadedScripts.size > 1) {
            console.log(`[GeoFS Cockpit Realism] Already initialized for this aircraft`);
            return;
        }

        currentAircraftId = aircraftId;

        // Cleanup previous aircraft if needed
        if (window.geofsAddonCleanup && typeof window.geofsAddonCleanup === 'function') {
            console.log('[GeoFS Cockpit Realism] Cleaning up previous aircraft');
            try {
                window.geofsAddonCleanup();
            } catch (e) {
                console.error('[GeoFS Cockpit Realism] Cleanup error:', e);
            }
        }

        if (aircraftScripts[aircraftName]) {
            console.log(`[GeoFS Cockpit Realism] Loading script: ${aircraftScripts[aircraftName]}`);
            loadScript(aircraftScripts[aircraftName]);
        } else {
            console.log(`[GeoFS Cockpit Realism] Aircraft "${aircraftName}" not supported yet`);
        }
    }

    // Monitor aircraft changes
    function monitorAircraftChanges() {
        setInterval(() => {
            if (geofsReady && geofs.aircraft && geofs.aircraft.instance) {
                const newAircraftId = geofs.aircraft.instance.id;
                if (newAircraftId !== currentAircraftId) {
                    console.log('[GeoFS Cockpit Realism] Aircraft changed, reloading...');
                    checkAndRunAircraftScript();
                }
            }
        }, 1000);
    }

    // Wait for GeoFS to be ready
    const checkGeoFSReady = setInterval(() => {
        if (typeof geofs !== "undefined" && geofs.aircraft && geofs.aircraft.instance) {
            clearInterval(checkGeoFSReady);
            geofsReady = true;
            console.log('[GeoFS Cockpit Realism] GeoFS ready');
            
            // Create settings UI
            createSettingsUI();
            
            loadMapLibre((err) => {
                if (!err) {
                    checkAndRunAircraftScript();
                    monitorAircraftChanges();
                } else {
                    console.error('[GeoFS Cockpit Realism] Failed to load MapLibre');
                }
            });
        }
    }, 1000);

    console.log('[GeoFS Cockpit Realism] Addon initializing...');
})();
