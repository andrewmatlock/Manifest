/* Manifest Data Sources - Magic Method State Properties */
// Handles $loading, $error, $ready state properties

/**
 * Get state property value for a data source
 * @param {string} prop - Property name ($loading, $error, $ready)
 * @param {string} dataSourceName - Name of the data source
 * @returns {boolean|string|null} State value
 */
function getStateProperty(prop, dataSourceName) {
    if (typeof Alpine === 'undefined' || !Alpine.store) {
        return prop === '$loading' ? false : (prop === '$error' ? null : false);
    }

    const store = Alpine.store('data');
    if (!store) {
        return prop === '$loading' ? false : (prop === '$error' ? null : false);
    }

    const stateKey = `_${dataSourceName}_state`;
    const state = store[stateKey] || { loading: false, error: null, ready: false };

    if (prop === '$loading') {
        return state.loading !== false; // Default to true if loading
    } else if (prop === '$error') {
        return state.error || null;
    } else if (prop === '$ready') {
        return state.ready || false;
    }

    return undefined;
}

/**
 * Create a state property handler for loading proxies
 * Returns a function that can be used in proxy get handlers
 */
function createStatePropertyHandler(dataSourceName) {
    return function (key) {
        if (key === '$loading' || key === '$error' || key === '$ready') {
            return getStateProperty(key, dataSourceName);
        }
        return undefined;
    };
}

// Export functions to window for use by other subscripts
if (!window.ManifestDataProxiesMagic) {
    window.ManifestDataProxiesMagic = {};
}
window.ManifestDataProxiesMagic.getStateProperty = getStateProperty;
window.ManifestDataProxiesMagic.createStatePropertyHandler = createStatePropertyHandler;

