/* Manifest Data Sources - Route & Proxy Coordinator */
// This file coordinates the proxy creation modules and re-exports their functions
// The actual implementations are in:
// - proxies/creation/manifest.data.proxies.helpers.js (helper functions)
// - proxies/creation/manifest.data.proxies.array.js (array proxy creation)
// - proxies/creation/manifest.data.proxies.object.js (object proxy creation)
// - proxies/creation/manifest.data.proxies.route.js (route proxy creation)

// Re-export functions from proxy creation modules for backward compatibility
// These modules export to window.ManifestDataProxies, so we just ensure the namespace exists
if (typeof window !== 'undefined') {
    if (!window.ManifestDataProxies) {
        window.ManifestDataProxies = {};
    }
    
    // Functions are already exported by the individual modules:
    // - createArrayProxyWithRoute (from array.js)
    // - createRouteProxy (from route.js)
    // - createNestedObjectProxy (from object.js)
    // - clearRouteProxyCacheForDataSource (from route.js)
    // - clearArrayProxyCacheForDataSource (from array.js)
    // - attachArrayMethods (from array.js)
    
    // This file serves as a coordinator and ensures all modules are loaded
    // The build system includes these files in the correct order before this file
}
