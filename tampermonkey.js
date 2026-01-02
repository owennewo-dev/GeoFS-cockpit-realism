// ==UserScript==
// @name         GeoFS Cockpit Realism
// @namespace    https://github.com/owennewo-dev/GeoFS-cockpit-realism
// @version      1.0.0
// @description  Adds realistic cockpit navigation displays to GeoFS aircraft
// @author       owennewo-dev
// @match        *://www.geo-fs.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        none
// @updateURL    https://raw.githubusercontent.com/owennewo-dev/GeoFS-cockpit-realism/main/tampermonkey.js
// @downloadURL  https://raw.githubusercontent.com/owennewo-dev/GeoFS-cockpit-realism/main/tampermonkey.js
// ==/UserScript==

(function(){
    'use strict';
    const script = document.createElement('script');
    script.src = 'https://owennewo-dev.github.io/GeoFS-cockpit-realism/main.js';
    script.onload = () => console.log('[GeoFS Cockpit Realism] Loader initialized');
    script.onerror = () => console.error('[GeoFS Cockpit Realism] Failed to load main script');
    document.head.appendChild(script);
})();
