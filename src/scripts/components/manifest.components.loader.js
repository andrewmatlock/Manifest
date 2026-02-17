// Components loader
// Uses cache for resolved content and _loading for in-flight promises so duplicate
// loadComponent(name) calls share one network request.
window.ManifestComponentsLoader = {
    cache: {},
    _loading: {},
    initialize() {
        this.cache = {};
        this._loading = {};
        // Preload components listed in registry.preloaded
        const registry = window.ManifestComponentsRegistry;
        if (registry && Array.isArray(registry.preloaded)) {
            registry.preloaded.forEach(name => {
                this.loadComponent(name).then(() => {
                    // Preloaded component
                });
            });
        }
    },
    async loadComponent(name) {
        if (this.cache[name]) {
            return this.cache[name];
        }
        if (this._loading[name]) {
            return this._loading[name];
        }
        const registry = window.ManifestComponentsRegistry;
        if (!registry || !registry.manifest) {
            console.warn('[Manifest] Manifest not loaded, cannot load component:', name);
            return null;
        }
        const path = (registry.manifest.preloadedComponents || []).concat(registry.manifest.components || [])
            .find(p => p.split('/').pop().replace('.html', '') === name);
        if (!path) {
            console.warn('[Manifest] Component', name, 'not found in manifest.');
            return null;
        }
        const promise = (async () => {
            try {
                const response = await fetch('/' + path);
                if (!response.ok) {
                    console.warn('[Manifest] HTML file not found for component', name, 'at path:', path, '(HTTP', response.status + ')');
                    return null;
                }
                const content = await response.text();
                this.cache[name] = content;
                return content;
            } catch (error) {
                console.warn('[Manifest] Failed to load component', name, 'from', path + ':', error.message);
                return null;
            } finally {
                delete this._loading[name];
            }
        })();
        this._loading[name] = promise;
        return promise;
    }
}; 