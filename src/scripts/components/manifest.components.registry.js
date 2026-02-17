/* Manifest Components */

// Components registry
window.ManifestComponentsRegistry = {
    manifest: null,
    registered: new Set(),
    preloaded: [],
    initialize() {
        // Use loader-provided manifest if set; otherwise load synchronously (standalone)
        let manifest = window.__manifestLoaded || this.manifest;
        if (!manifest) {
            try {
                const manifestUrl = (document.querySelector('link[rel="manifest"]')?.getAttribute('href')) || '/manifest.json';
                const req = new XMLHttpRequest();
                req.open('GET', manifestUrl + (manifestUrl.includes('?') ? '&' : '?') + 't=' + Date.now(), false);
                req.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                req.setRequestHeader('Pragma', 'no-cache');
                req.setRequestHeader('Expires', '0');
                req.send(null);
                if (req.status === 200) {
                    manifest = JSON.parse(req.responseText);
                } else {
                    console.warn('[Manifest] Failed to load manifest.json (HTTP', req.status + ')');
                }
            } catch (e) {
                console.warn('[Manifest] Failed to load manifest.json:', e.message);
            }
        }
        if (manifest) {
            this.manifest = manifest;
            const allComponents = [
                ...(this.manifest?.preloadedComponents || []),
                ...(this.manifest?.components || [])
            ];
            allComponents.forEach(path => {
                const name = path.split('/').pop().replace('.html', '');
                this.registered.add(name);
            });
            this.preloaded = (this.manifest?.preloadedComponents || []).map(path => path.split('/').pop().replace('.html', ''));
        }
    }
}; 