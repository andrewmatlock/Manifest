/* Manifest Data Sources - Circular Reference Handler */
// Handles detection and resolution of circular references in proxy property access
// This is critical for preventing infinite recursion when Alpine re-evaluates expressions

/**
 * Handles circular reference detection and resolution
 * @param {Object} params - Handler parameters
 * @param {Set} params.activeProps - Set of currently active property accesses
 * @param {string} params.propKey - The property key being accessed
 * @param {Object} params.rawTarget - Raw target object (not Alpine-wrapped)
 * @param {Array} params.path - Path array to the current object
 * @param {string} params.key - The key being accessed
 * @param {string} params.fullPath - Full path string for logging
 * @param {number} params.currentDepth - Current call depth
 * @param {string} params.triggeredBy - What triggered this access ('Alpine', 'Proxy', etc.)
 * @param {boolean} params.shouldLog - Whether to log debug information
 * @returns {*} The resolved value or undefined to break the cycle
 */
function handleCircularReference({
    activeProps,
    propKey,
    rawTarget,
    path,
    key,
    fullPath,
    currentDepth,
    triggeredBy,
    shouldLog
}) {
    if (!activeProps || !activeProps.has(propKey)) {
        return null; // Not a circular reference, continue normal flow
    }

    if (shouldLog) {
        console.warn(`[Proxy] ⚠️ CIRCULAR ${fullPath} | depth:${currentDepth} | triggered by:${triggeredBy} | This is likely Alpine re-evaluation`);
    }

    // Property is already being accessed - this is likely Alpine re-evaluating the expression
    // CRITICAL: For simple objects that are already being accessed, return the cached plain copy
    // if it exists. This prevents infinite recursion by ensuring Alpine gets the same object instance.
    try {
        // First, try to get the value from rawTarget
        let current = rawTarget;
        let pathValid = true;
        const accessPath = path.length === 0 ? [key] : [...path, key];

        for (let i = 0; i < accessPath.length; i++) {
            const pathKey = accessPath[i];
            if (current && typeof current === 'object' && pathKey in current) {
                current = current[pathKey];
            } else {
                pathValid = false;
                break;
            }
        }

        if (pathValid && current !== undefined && current !== null) {
            // If it's a primitive, return it directly
            if (typeof current !== 'object' || current === null) {
                if (activeProps) {
                    activeProps.delete(propKey);
                }
                return current;
            }

            // If it's a simple object, check if we have a cached plain copy
            if (!Array.isArray(current)) {
                let isSimpleObject = true;
                try {
                    for (const prop in current) {
                        if (typeof current[prop] === 'object' && current[prop] !== null) {
                            isSimpleObject = false;
                            break;
                        }
                    }
                } catch (e) {
                    isSimpleObject = false;
                }

                if (isSimpleObject) {
                    // Check for cached plain copy first - this is critical to prevent recursion
                    if (!window.ManifestDataProxiesCore.frozenPlainCopyCache) {
                        window.ManifestDataProxiesCore.frozenPlainCopyCache = new WeakMap();
                    }
                    const plainCopyCache = window.ManifestDataProxiesCore.frozenPlainCopyCache;
                    const cachedCopy = plainCopyCache.get(current);

                    if (cachedCopy) {
                        // Return cached copy immediately - don't create a new one
                        // DON'T remove from activeProps here - let the normal flow handle it
                        return cachedCopy;
                    }
                }
            }
        }
    } catch (e) {
        if (shouldLog) {
            console.error(`[Proxy] ${fullPath} | Error in circular check:`, e);
        }
    }

    // If we can't return a cached copy, return undefined to break the cycle
    if (shouldLog) {
        console.warn(`[Proxy] ${fullPath} | ⚠️ CIRCULAR - returning undefined to break cycle`);
    }
    if (activeProps) {
        activeProps.delete(propKey);
    }
    return undefined;
}

// Export to window for use by proxy creation modules
if (typeof window !== 'undefined') {
    if (!window.ManifestDataProxiesHandlers) {
        window.ManifestDataProxiesHandlers = {};
    }
    window.ManifestDataProxiesHandlers.handleCircularReference = handleCircularReference;
}
