/* Manifest Data Sources - Proxy Helper Functions */
// Utility functions for proxy creation and data manipulation

/**
 * Find an item in nested data structures by path key and segments
 * @param {*} data - The data to search (array or object)
 * @param {string} pathKey - The key that contains the path value
 * @param {Array} pathSegments - Array of path segments to match
 * @returns {*} The found item or null
 */
function findItemByPath(data, pathKey, pathSegments) {
    if (!pathSegments || pathSegments.length === 0) {
        return null;
    }

    // Handle arrays (including Alpine proxies that might not pass Array.isArray check)
    const hasLength = data && typeof data === 'object' && ('length' in data) && typeof data.length === 'number';
    const isArrayLike = hasLength && (Array.isArray(data) || (data.length >= 0 && (data.length === 0 || (typeof data[0] !== 'undefined' || typeof data['0'] !== 'undefined'))));

    if (isArrayLike) {
        // Convert to real array if needed (handles Alpine proxies)
        let arrayToSearch = data;
        if (!Array.isArray(data)) {
            try {
                // Try Array.from first (works for most iterables)
                arrayToSearch = Array.from(data);
            } catch (e) {
                // Fallback: manual conversion for non-iterable array-like objects
                arrayToSearch = [];
                for (let i = 0; i < data.length; i++) {
                    arrayToSearch[i] = data[i];
                }
            }
        }

        for (const item of arrayToSearch) {
            if (typeof item === 'object' && item !== null) {
                // Check if this item has the path key
                if (pathKey in item) {
                    const itemPath = item[pathKey];
                    // Check if any path segment matches this item's path
                    // Use String() to ensure type consistency in comparison
                    if (pathSegments.some(segment => String(segment) === String(itemPath))) {
                        return item;
                    }
                }

                // Recursively search nested objects
                const found = findItemByPath(item, pathKey, pathSegments);
                if (found) return found;
            }
        }
    } else if (typeof data === 'object' && data !== null) {
        for (const key in data) {
            const found = findItemByPath(data[key], pathKey, pathSegments);
            if (found) return found;
        }
    }

    return null;
}

/**
 * Find the group that contains a specific item
 * @param {*} data - The data to search
 * @param {*} targetItem - The item to find
 * @returns {*} The group containing the item or null
 */
function findGroupContainingItem(data, targetItem) {
    if (Array.isArray(data)) {
        for (const item of data) {
            if (typeof item === 'object' && item !== null) {
                // Check if this is a group with items
                if (item.group && Array.isArray(item.items)) {
                    // Check if the target item is in this group's items
                    if (item.items.includes(targetItem)) {
                        return item;
                    }
                }

                // Recursively search in nested objects
                const found = findGroupContainingItem(item, targetItem);
                if (found) return found;
            }
        }
    } else if (typeof data === 'object' && data !== null) {
        for (const key in data) {
            const found = findGroupContainingItem(data[key], targetItem);
            if (found) return found;
        }
    }

    return null;
}

/**
 * Convert Alpine proxy to real array
 * @param {*} proxyData - The proxy data to convert
 * @returns {Array} The converted array or original value
 */
function convertProxyToArray(proxyData) {
    if (Array.isArray(proxyData)) {
        return proxyData;
    }
    if (!proxyData || typeof proxyData !== 'object' || !('length' in proxyData)) {
        return proxyData;
    }
    try {
        return Array.from(proxyData);
    } catch (e) {
        // Fallback: manual conversion for non-iterable array-like objects
        const arr = [];
        for (let i = 0; i < proxyData.length; i++) {
            arr[i] = proxyData[i];
        }
        return arr;
    }
}

// Export to window for use by proxy creation modules
if (typeof window !== 'undefined') {
    if (!window.ManifestDataProxiesHelpers) {
        window.ManifestDataProxiesHelpers = {};
    }
    window.ManifestDataProxiesHelpers.findItemByPath = findItemByPath;
    window.ManifestDataProxiesHelpers.findGroupContainingItem = findGroupContainingItem;
    window.ManifestDataProxiesHelpers.convertProxyToArray = convertProxyToArray;
}
