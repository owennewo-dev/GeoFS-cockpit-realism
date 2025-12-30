# GeoFS cockpit realism addon

Currently supported aircraft:
- Beechcraft Baron B55
  
Aircraft to be supported in the near future:
- Embraer Phenom 100
- Alisport Silent 2 Electro
- de Havilland DHC6 Twin Otter
- Airbus A350

## Installation

### Manual (Browser Console)
1. Paste the contents of `main.js` into your browser console while on the GeoFS website
2. The addon will automatically load when you're in a supported aircraft

### Tampermonkey (Coming Soon)
Install once and forget - the script will run automatically on every GeoFS visit.

## Configuration

### OpenAIP API Key (Optional)

The addon works without an API key, but you can enable aeronautical overlays with OpenAIP:

1. Look for the **Cockpit** button in the bottom menu bar (between Aircraft/Location/Camera and Options/Nav)
2. Click it to open the configuration panel
3. Follow the instructions to get a free OpenAIP API key
4. Enter your key and click "Save Key"
5. Reload the page

The settings panel shows:
- Current API key status
- API key configuration field  
- Step-by-step instructions for getting an API key
- Version information (v0.2.0)

**Security Note:** Your API key is stored locally in your browser's localStorage (not in the code), so it stays private and persists across sessions without being committed to GitHub or shared publicly.