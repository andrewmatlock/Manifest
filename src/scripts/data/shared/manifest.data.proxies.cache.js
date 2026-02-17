/* Manifest Data Sources - Access Cache Management */

// Global access cache map (dataSourceName -> cache Map)
const globalAccessCache = new Map();

// Clear access cache for a specific data source
function clearAccessCache(dataSourceName) {
    if (dataSourceName) {
        globalAccessCache.delete(dataSourceName);
    } else {
        globalAccessCache.clear();
    }
}

// Export functions to window for use by other subscripts
if (!window.ManifestDataProxies) {
    window.ManifestDataProxies = {};
}
window.ManifestDataProxies.clearAccessCache = clearAccessCache;
window.ManifestDataProxies.globalAccessCache = globalAccessCache;
