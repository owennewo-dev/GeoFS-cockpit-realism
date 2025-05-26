# GeoFS cockpit realism addon

Currently supported aircraft:
- Beechcraft Baron B55
  
Aircraft to be supported in the near future:
- Embraer Phenom 100
- Alisport Silent 2 Electro
- de Havilland DHC6 Twin Otter
- Airbus A350

To use this addon, just paste the contents of `main.js` into your browser console.

To use this addon at it's fullest with OpenAIP aeronautical overlays, create an account on https://www.openaip.net/. Then click this link https://www.openaip.net/user/api-clients, and click 'Create API Client'. Add a name, and a description (what you put in doesn't matter) then click 'Create'. Once it's done, click the copy button next to 'API Key'. Paste your API key into `main.js` window.openAIPKey = "YOUR_OPENAIP_API_KEY";.

So it would look like this: window.openAIPKey = "968e2a38f015320b77a033e3f77ab506";