/* Manifest Data Sources - Simple Object Handler */
// Handles detection and creation of plain copies for simple objects
// This prevents infinite recursion when Alpine wraps proxies and accesses nested properties

/**
 * Checks if an object is a "simple object" (contains only primitives, no nested objects/arrays)
 * @param {*} value - The value to check
 * @returns {boolean} True if the object is simple (only primitives)
 */
function isSimpleObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || value === null) {
        return false;
    }

    try {
        for (const prop in value) {
            if (typeof value[prop] === 'object' && value[prop] !== null) {
                return false;
            }
        }
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Creates or retrieves a cached plain copy of a simple object
 * Plain copies are NOT frozen - Alpine needs to access properties on them
 * @param {Object} value - The simple object to copy
 * @param {Object} params - Handler parameters
 * @param {Set} params.activeProps - Set of currently active property accesses
 * @param {string} params.propKey - The property key being accessed
 * @param {Object} params.rawTarget - Raw target object
 * @param {string} params.fullPath - Full path string for logging
 * @param {Map} params.callDepthMap - Map tracking call depth
 * @param {boolean} params.shouldLog - Whether to log debug information
 * @returns {Object|null} The plain copy, or null if not a simple object or copy failed
 */
function createOrGetPlainCopy(value, {
    activeProps,
    propKey,
    rawTarget,
    fullPath,
    callDepthMap,
    shouldLog
}) {
    if (!isSimpleObject(value)) {
        return null;
    }

    // Initialize cache if needed
    if (!window.ManifestDataProxiesCore.frozenPlainCopyCache) {
        window.ManifestDataProxiesCore.frozenPlainCopyCache = new WeakMap();
    }
    const plainCopyCache = window.ManifestDataProxiesCore.frozenPlainCopyCache;

    // Check for cached copy first - this is critical to prevent recursion
    let cachedCopy = plainCopyCache.get(value);
    if (cachedCopy) {
        // Return cached plain copy - Alpine won't see it as "new"
        // CRITICAL: Remove from activeProps since plain copy is plain object (won't trigger proxy getters)
        if (activeProps) {
            activeProps.delete(propKey);
        }
        // Reset depth after returning plain copy
        if (callDepthMap && rawTarget) {
            callDepthMap.delete(rawTarget);
        }
        return cachedCopy;
    }

    // Create new plain copy

    const plainCopy = {};
    try {
        // CRITICAL: Copy property values directly (they're already primitives for simple objects)
        // Don't freeze nested values - just copy them as-is
        for (const prop in value) {
            plainCopy[prop] = value[prop];
        }

        // Don't freeze the object - Alpine needs to access properties on it
        // Instead, return a plain object copy which Alpine won't wrap in reactivity
        // because it's a new object instance each time (cached by WeakMap)

        // Cache the plain copy for future accesses (same instance = Alpine won't re-evaluate)
        plainCopyCache.set(value, plainCopy);

        // CRITICAL: Remove from activeProps since plain copy is plain object (won't trigger proxy getters)
        // The plain copy breaks the proxy chain, so we don't need to track it in activeProps
        // This prevents false circular reference detection when Alpine accesses properties on the plain copy
        if (activeProps) {
            activeProps.delete(propKey);
        }
        // Reset depth after returning plain copy
        if (callDepthMap && rawTarget) {
            callDepthMap.delete(rawTarget);
        }
        return plainCopy;
    } catch (e) {
        // Return null to indicate failure - caller should fall through to proxy creation
        return null;
    }
}

/**
 * Handles simple object detection and plain copy creation for a value
 * This is the main entry point for simple object handling
 * @param {*} value - The value to check
 * @param {Object} params - Handler parameters
 * @returns {Object|null} The plain copy if simple object, null otherwise
 */
function handleSimpleObject(value, params) {
    if (Array.isArray(value)) {
        return null; // Arrays are not simple objects
    }

    if (!isSimpleObject(value)) {
        return null;
    }

    return createOrGetPlainCopy(value, params);
}

// Export to window for use by proxy creation modules
if (typeof window !== 'undefined') {
    if (!window.ManifestDataProxiesSimple) {
        window.ManifestDataProxiesSimple = {};
    }
    window.ManifestDataProxiesSimple.isSimpleObject = isSimpleObject;
    window.ManifestDataProxiesSimple.createOrGetPlainCopy = createOrGetPlainCopy;
    window.ManifestDataProxiesSimple.handleSimpleObject = handleSimpleObject;
}
