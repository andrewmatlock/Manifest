/* Manifest Data Sources - Object Proxy Creation */
// Create proxies for nested objects that properly handles arrays and further nesting
// Simplified: Only proxy arrays, return objects directly (like backup)
function createNestedObjectProxy(objTarget, dataSourceName = null, reloadDataSource = null, path = []) {
    // path: array of keys representing the path to this object (e.g., ['specialHeader'] for $x.example.specialHeader)
    // This allows us to directly access nested values in the raw store without triggering Alpine reactivity

    // CRITICAL: Check if objTarget is already a proxy we created to prevent infinite recursion
    // Alpine may wrap our proxy, but we should never proxy a proxy we already created
    if (window.ManifestDataProxiesCore?.nestedObjectProxyCache?.has(objTarget)) {
        // This object is already proxied, return the cached proxy
        return window.ManifestDataProxiesCore.nestedObjectProxyCache.get(objTarget);
    }

    // Get the raw object from the store using the path to ensure we cache the correct object
    // This is critical because objTarget might be Alpine-wrapped (e.g. when raw wasn't ready at first access)
    let rawObjectForCache = objTarget;
    if (path.length >= 0 && window.ManifestDataStore?.getRawData && dataSourceName) {
        const rawDataSource = window.ManifestDataStore.getRawData(dataSourceName);
        if (rawDataSource && typeof rawDataSource === 'object') {
            let current = rawDataSource;
            let pathValid = true;
            for (let i = 0; i < path.length; i++) {
                const pathKey = path[i];
                if (current && typeof current === 'object' && pathKey in current) {
                    current = current[pathKey];
                } else {
                    pathValid = false;
                    break;
                }
            }
            if (pathValid && current) {
                rawObjectForCache = current;
            }
        }
    }

    // Check cache first to prevent infinite recursion and ensure same proxy instance is returned
    // This is critical for Alpine reactivity - if we create a new proxy each time,
    // Alpine sees it as a "new" object and triggers re-evaluation, causing infinite loops
    // Use the raw object from store as cache key (WeakMap requires object keys)
    if (window.ManifestDataProxiesCore?.nestedObjectProxyCache?.has(rawObjectForCache)) {
        const cached = window.ManifestDataProxiesCore.nestedObjectProxyCache.get(rawObjectForCache);

        return cached;
    }

    // Track active property accesses to prevent circular references
    // Use a WeakMap to track active accesses per target object (works even with Alpine proxies)
    // CRITICAL: Use rawObjectForCache as the key, not objTarget, because objTarget might be Alpine-wrapped
    if (!window.ManifestDataProxiesCore) {
        window.ManifestDataProxiesCore = {};
    }
    if (!window.ManifestDataProxiesCore.nestedProxyActiveProps) {
        window.ManifestDataProxiesCore.nestedProxyActiveProps = new WeakMap();
    }
    const activePropsMap = window.ManifestDataProxiesCore.nestedProxyActiveProps;

    // Initialize active props set for this target if not already present
    // Use rawObjectForCache as key to ensure consistency even when Alpine wraps the proxy
    if (!activePropsMap.has(rawObjectForCache)) {
        activePropsMap.set(rawObjectForCache, new Set());
    }

    // Store reference to raw target to avoid Alpine proxy wrapping issues
    // CRITICAL: Alpine may wrap our proxy in its own proxy, making 'target' in the get trap
    // actually be Alpine's wrapped version. By storing the raw object reference separately,
    // we can always access the true raw data without triggering Alpine's reactivity
    // CRITICAL: Always use rawObjectForCache for tracking, not objTarget which might be Alpine-wrapped
    const rawTarget = rawObjectForCache;

    // CRITICAL: Use rawTarget as the Proxy target, not objTarget
    // This ensures Alpine wraps a proxy around raw data, not Alpine-wrapped data
    // When Alpine wraps our proxy and accesses properties, it won't trigger reactivity loops
    const proxyTarget = rawTarget;

    // Track call depth for debugging recursion
    if (!window.__manifestProxyCallDepth) {
        window.__manifestProxyCallDepth = new WeakMap();
    }
    const callDepthMap = window.__manifestProxyCallDepth;
    const currentDepth = (callDepthMap.get(rawTarget) || 0) + 1;
    callDepthMap.set(rawTarget, currentDepth);

    // Re-entry guard: when get-trap call depth exceeds threshold, resolve directly from raw store
    // and return (no proxy creation) to break recursion (e.g. :aria-label="$x.content.theme.light").
    const NESTED_GET_REENTRY_THRESHOLD = 10;
    if (typeof window !== 'undefined') {
        window.__manifestNestedGetDepth = window.__manifestNestedGetDepth || 0;
    }

    const proxy = new Proxy(proxyTarget, {
        get(target, key) {
            const nestedDepth = typeof window !== 'undefined' ? (window.__manifestNestedGetDepth = (window.__manifestNestedGetDepth || 0) + 1) : 0;
            try {
                const fullPath = dataSourceName ? `${dataSourceName}.${path.join('.')}.${String(key)}` : String(key);

                // Re-entry guard: resolve from raw and return to break recursion
                if (nestedDepth > NESTED_GET_REENTRY_THRESHOLD && dataSourceName && window.ManifestDataStore?.getRawData) {
                    try {
                        const raw = window.ManifestDataStore.getRawData(dataSourceName);
                        if (raw && typeof raw === 'object') {
                            const fullPathKeys = [...path, key];
                            let v = raw;
                            for (const k of fullPathKeys) {
                                if (v == null || typeof v !== 'object') break;
                                v = Object.prototype.hasOwnProperty.call(v, k) ? v[k] : undefined;
                            }
                            if (v === null || typeof v !== 'object') {
                                return v !== undefined ? v : '';
                            }
                            const plain = {};
                            for (const k of Object.keys(v)) {
                                if (Object.prototype.hasOwnProperty.call(v, k)) plain[k] = v[k];
                            }
                            return plain;
                        }
                    } catch (e) { /* ignore */ }
                }

                // CRITICAL: If rawTarget is already a proxy we created, get value directly from store
                const isRawTargetProxied = window.ManifestDataProxiesCore?.nestedObjectProxyCache?.has(rawTarget);

                // Required by handleCircularReference (no debug stack capture)
                const triggeredBy = 'Unknown';

                // Handle special keys
                if (key === Symbol.iterator || key === 'then' || key === 'catch' || key === 'finally') {
                    return undefined;
                }

                // Handle toPrimitive for text content
                if (key === Symbol.toPrimitive) {
                    return function () {
                        // Use rawTarget (rawObjectForCache) to avoid Alpine reactivity issues
                        try {
                            const getRawData = window.ManifestDataStore?.getRawData;
                            if (getRawData && dataSourceName && path.length >= 0) {
                                const rawDataSource = getRawData(dataSourceName);
                                if (rawDataSource && typeof rawDataSource === 'object') {
                                    // Use a helper function to safely access properties without triggering proxies
                                    const safeGet = (obj, prop) => {
                                        if (obj && typeof obj === 'object' && prop in obj) {
                                            try {
                                                if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                                                    return obj[prop];
                                                }
                                                return obj[prop];
                                            } catch (e) {
                                                return undefined;
                                            }
                                        }
                                        return undefined;
                                    };

                                    let current = rawDataSource;
                                    let pathValid = true;
                                    // Traverse the full path including the current key to get the final value
                                    const fullPath = [...path, key];
                                    for (let i = 0; i < fullPath.length; i++) {
                                        const pathKey = fullPath[i];
                                        const nextValue = safeGet(current, pathKey);
                                        if (nextValue !== undefined) {
                                            current = nextValue;
                                        } else {
                                            pathValid = false;
                                            break;
                                        }
                                    }
                                    if (pathValid && current !== undefined && current !== null) {
                                        return String(current) || '';
                                    }
                                }
                            }
                        } catch (e) {
                            // Fallback
                        }
                        return '';
                    };
                }

                // Check for circular reference using WeakMap
                // Use rawTarget (rawObjectForCache) instead of target to ensure we're tracking the correct object
                // This is critical because target might be Alpine's wrapped version
                const activeProps = activePropsMap.get(rawTarget);
                const propKey = String(key);

                // Use extracted circular reference handler
                const handleCircularReference = window.ManifestDataProxiesHandlers?.handleCircularReference;
                if (handleCircularReference) {
                    const circularResult = handleCircularReference({
                        activeProps,
                        propKey,
                        rawTarget,
                        path,
                        key,
                        fullPath,
                        currentDepth,
                        triggeredBy,
                        shouldLog: false,
                    });
                    // If handler returned a value (including undefined), use it
                    // null means not a circular reference, continue normal flow
                    if (circularResult !== null) {
                        return circularResult;
                    }
                } else {
                    // Fallback to inline handling if handler not available (shouldn't happen in production)
                    if (activeProps && activeProps.has(propKey)) {
                        if (activeProps) {
                            activeProps.delete(propKey);
                        }
                        return undefined;
                    }
                }

                // Mark this property as being accessed (temporarily, will remove after getting value)
                // CRITICAL: Do this BEFORE any async operations or proxy creation to prevent re-entry
                if (activeProps) {
                    activeProps.add(propKey);
                }

                // CRITICAL: Always use rawTarget directly, never target
                // Even though we set proxyTarget to rawTarget, Alpine may wrap our proxy
                // and replace 'target' with an Alpine-wrapped version
                // By always using rawTarget (captured in closure), we ensure we're accessing raw data
                let value;

                try {
                    // Use a safe property accessor that bypasses proxies
                    const safeGet = (obj, prop) => {
                        if (!obj || typeof obj !== 'object') return undefined;
                        // Use Object.prototype.hasOwnProperty to check existence without triggering getters
                        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                            // Use direct property access - this bypasses proxy getters
                            return obj[prop];
                        }
                        return undefined;
                    };

                    // ALWAYS use rawTarget, never target (which might be Alpine-wrapped)
                    // For nested paths, traverse step by step using safe property access
                    // rawTarget is always the object at this path (path from root to this proxy).
                    // So we only need to read the requested key from rawTarget, never re-traverse path.
                    value = safeGet(rawTarget, key);
                } catch (e) {
                    // Silently handle errors
                }

                // content.theme: return plain object so .light/.dark/.system are plain reads; avoids Alpine
                // wrapping a proxy and re-running, which caused stack overflow for :aria-label.
                if (dataSourceName === 'content' && key === 'theme' && value != null && typeof value === 'object' && !Array.isArray(value)) {
                    const theme = value;
                    const plain = {
                        light: (theme.light != null ? String(theme.light) : '') || 'Light',
                        dark: (theme.dark != null ? String(theme.dark) : '') || 'Dark',
                        system: (theme.system != null ? String(theme.system) : '') || 'System'
                    };
                    if (activeProps) activeProps.delete(propKey);
                    callDepthMap.delete(rawTarget);
                    return plain;
                }

                // When key is missing, return chaining fallback so deep paths like .another.deep.level don't throw
                if (value === undefined) {
                    if (activeProps) activeProps.delete(propKey);
                    callDepthMap.delete(rawTarget);
                    const fallback = window.ManifestDataProxiesCore?.getChainingFallback?.();
                    return fallback !== undefined ? fallback : '';
                }

                // CRITICAL: Return primitives immediately to prevent Alpine wrapping issues
                // This must come BEFORE array/object checks to handle primitive values correctly
                if (value === null ||
                    typeof value === 'string' || typeof value === 'number' ||
                    typeof value === 'boolean' || typeof value === 'symbol') {
                    // Remove from activeProps before returning
                    if (activeProps) {
                        activeProps.delete(propKey);
                    }
                    // Reset depth after returning primitive
                    callDepthMap.delete(rawTarget);
                    return value;
                }

                // If the property is an array, create a proxy that handles array methods and $route at the top level
                if (Array.isArray(value)) {
                    // First attach methods directly to the array (for compatibility)
                    let arrayWithMethods = value;
                    try {
                        const attachArrayMethods = window.ManifestDataProxies?.attachArrayMethods;
                        if (attachArrayMethods) {
                            arrayWithMethods = attachArrayMethods(value, dataSourceName, reloadDataSource);
                        }
                    } catch (error) {
                        // Silently handle error attaching methods
                    }

                    // CRITICAL: Store reference to key and dataSourceName for toJSON access
                    const arrayKey = key;
                    const arrayDataSourceName = dataSourceName;

                    // CRITICAL: Define toJSON on the array before proxying
                    // JSON.stringify checks for toJSON before accessing properties
                    if (typeof arrayWithMethods.toJSON !== 'function') {
                        Object.defineProperty(arrayWithMethods, 'toJSON', {
                            enumerable: false,
                            configurable: true,
                            writable: false,
                            value: function () {
                                // Get raw array from store for serialization
                                try {
                                    const getRawData = window.ManifestDataStore?.getRawData;
                                    if (getRawData && arrayDataSourceName) {
                                        const rawDataSource = getRawData(arrayDataSourceName);
                                        if (rawDataSource && typeof rawDataSource === 'object') {
                                            const rawArray = rawDataSource[arrayKey];
                                            if (Array.isArray(rawArray)) {
                                                return rawArray; // Return raw array directly
                                            }
                                        }
                                    }
                                } catch (e) {
                                    // Fallback
                                }
                                // Fallback to arrayWithMethods (should be a plain array)
                                return Array.isArray(arrayWithMethods) ? arrayWithMethods : arrayWithMethods;
                            }
                        });
                    }

                    // Create a proxy for the array that handles methods at the top level
                    // This is similar to how Appwrite methods work - handled in proxy's get trap
                    const arrayProxy = new Proxy(arrayWithMethods, {
                        get(proxyTarget, prop) {
                            // CRITICAL: Handle toJSON for JSON.stringify compatibility
                            // JSON.stringify calls toJSON if it exists, otherwise it accesses properties
                            if (prop === 'toJSON') {
                                // Return the toJSON method directly from the target
                                return proxyTarget.toJSON;
                            }

                            // CRITICAL: Handle Symbol.toPrimitive for string conversion
                            if (prop === Symbol.toPrimitive) {
                                return function (hint) {
                                    if (hint === 'string' || hint === 'default') {
                                        // Use toJSON if available, otherwise stringify directly
                                        if (typeof proxyTarget.toJSON === 'function') {
                                            return JSON.stringify(proxyTarget.toJSON());
                                        }
                                        return JSON.stringify(proxyTarget);
                                    }
                                    return proxyTarget;
                                };
                            }

                            // Handle $search and $query at proxy level with safe fallbacks
                            if (prop === '$search' || prop === '$query') {
                                // Check if method exists on target
                                if (proxyTarget && typeof proxyTarget === 'object' && prop in proxyTarget && typeof proxyTarget[prop] === 'function') {
                                    return proxyTarget[prop].bind(proxyTarget);
                                }
                                // Fallback: return safe function that returns empty array
                                // This prevents Alpine errors when method doesn't exist yet (during loading)
                                return function () {
                                    return [];
                                };
                            }

                            // Handle $route at proxy level (like Appwrite methods)
                            if (prop === '$route') {
                                const createRouteProxy = window.ManifestDataProxies?.createRouteProxy;
                                if (!createRouteProxy) {
                                    return new Proxy({}, { get: () => undefined });
                                }
                                const routeFunction = function (pathKey) {
                                    if (proxyTarget && Array.isArray(proxyTarget)) {
                                        const getRawData = window.ManifestDataStore?.getRawData;
                                        let dataToUse = proxyTarget;
                                        // Try to get the nested array from raw data if needed
                                        if (dataSourceName && getRawData) {
                                            const rawData = getRawData(dataSourceName);
                                            if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
                                                // If raw data is an object, try to find the nested array
                                                if (rawData[key] && Array.isArray(rawData[key])) {
                                                    dataToUse = rawData[key];
                                                }
                                            } else if (rawData && Array.isArray(rawData)) {
                                                dataToUse = rawData;
                                            }
                                        }
                                        const result = createRouteProxy(
                                            dataToUse,
                                            pathKey,
                                            (Array.isArray(dataToUse) && dataToUse.length > 0 && dataToUse[0] && dataToUse[0].contentType)
                                                ? dataToUse[0].contentType
                                                : dataSourceName || undefined
                                        );
                                        return result;
                                    }
                                    return new Proxy({}, { get: () => undefined });
                                };
                                // Ensure function has proper prototype for Alpine's instanceof checks
                                Object.setPrototypeOf(routeFunction, Function.prototype);
                                // Mark as callable
                                routeFunction.call = Function.prototype.call;
                                routeFunction.apply = Function.prototype.apply;
                                routeFunction.bind = Function.prototype.bind;
                                return routeFunction;
                            }

                            // Handle ALL array methods at proxy level (like Appwrite methods)
                            if (typeof prop === 'string' && typeof Array.prototype[prop] === 'function') {
                                if (typeof proxyTarget[prop] === 'function') {
                                    const bound = proxyTarget[prop].bind(proxyTarget);
                                    Object.setPrototypeOf(bound, Function.prototype);
                                    return bound;
                                }
                                const bound = Array.prototype[prop].bind(proxyTarget);
                                Object.setPrototypeOf(bound, Function.prototype);
                                return bound;
                            }

                            // Fall through to target for other properties (including numeric indices)
                            return proxyTarget[prop];
                        },
                        // CRITICAL: Alpine uses has() to check if properties exist before accessing them
                        has(target, prop) {
                            // Always report that base plugin methods exist (we provide fallbacks)
                            if (prop === '$route' || prop === '$search' || prop === '$query') {
                                return true;
                            }
                            if (typeof prop === 'string' && typeof Array.prototype[prop] === 'function') {
                                return true;
                            }
                            return prop in target;
                        },
                        // CRITICAL: Alpine uses getOwnPropertyDescriptor to introspect properties
                        getOwnPropertyDescriptor(target, prop) {
                            if (prop === '$route') {
                                // Create the same function as in get() to ensure consistency
                                const createRouteProxy = window.ManifestDataProxies?.createRouteProxy;
                                if (!createRouteProxy) {
                                    return {
                                        enumerable: false,
                                        configurable: true,
                                        writable: false,
                                        value: function (pathKey) {
                                            return new Proxy({}, { get: () => undefined });
                                        }
                                    };
                                }
                                const routeFunction = function (pathKey) {
                                    if (target && Array.isArray(target)) {
                                        const getRawData = window.ManifestDataStore?.getRawData;
                                        let dataToUse = target;
                                        if (dataSourceName && getRawData) {
                                            const rawData = getRawData(dataSourceName);
                                            if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
                                                if (rawData[key] && Array.isArray(rawData[key])) {
                                                    dataToUse = rawData[key];
                                                }
                                            } else if (rawData && Array.isArray(rawData)) {
                                                dataToUse = rawData;
                                            }
                                        }
                                        return createRouteProxy(
                                            dataToUse,
                                            pathKey,
                                            (Array.isArray(dataToUse) && dataToUse.length > 0 && dataToUse[0] && dataToUse[0].contentType)
                                                ? dataToUse[0].contentType
                                                : dataSourceName || undefined
                                        );
                                    }
                                    return new Proxy({}, { get: () => undefined });
                                };
                                Object.setPrototypeOf(routeFunction, Function.prototype);
                                routeFunction.call = Function.prototype.call;
                                routeFunction.apply = Function.prototype.apply;
                                routeFunction.bind = Function.prototype.bind;
                                return {
                                    enumerable: false,
                                    configurable: true,
                                    writable: false,
                                    value: routeFunction
                                };
                            }
                            if (typeof prop === 'string' && typeof Array.prototype[prop] === 'function') {
                                return {
                                    enumerable: false,
                                    configurable: true,
                                    writable: false,
                                    value: (() => {
                                        if (typeof target[prop] === 'function') {
                                            return target[prop].bind(target);
                                        }
                                        return Array.prototype[prop].bind(target);
                                    })()
                                };
                            }
                            return Reflect.getOwnPropertyDescriptor(target, prop);
                        },
                        // CRITICAL: Include $route in ownKeys so Alpine sees it as an own property
                        ownKeys(target) {
                            const keys = Reflect.ownKeys(target);
                            const result = [...keys];
                            if (!result.includes('$route')) {
                                result.push('$route');
                            }
                            // CRITICAL: Include toJSON for JSON.stringify compatibility
                            if (!result.includes('toJSON')) {
                                result.push('toJSON');
                            }
                            return result;
                        }
                    });

                    // Remove from activeProps after creating array proxy
                    if (activeProps) {
                        activeProps.delete(propKey);
                    }

                    return arrayProxy;
                }

                // If the property is an object, wrap it recursively for further nesting
                // (activeProps is already declared above)
                // Pass along dataSourceName and reloadDataSource to maintain context
                if (typeof value === 'object' && value !== null) {
                    // NOTE: activeProps was already removed above after getting the value
                    // This prevents false circular reference detection when Alpine wraps our proxy

                    // CRITICAL: Always use the raw value we got from the store using path-based access
                    // The 'value' variable already contains the raw data from the store (via path traversal)
                    // This ensures we never use Alpine-wrapped objects
                    let objectToProxy = value;

                    // CRITICAL FIX: For simple objects accessed through nested proxies,
                    // return a plain object copy instead of creating another proxy.
                    // This prevents infinite recursion when Alpine wraps our proxy and accesses properties.
                    // Use extracted simple object handler
                    const handleSimpleObject = window.ManifestDataProxiesSimple?.handleSimpleObject;
                    if (handleSimpleObject && !Array.isArray(value)) {
                        const plainCopy = handleSimpleObject(value, {
                            activeProps,
                            propKey,
                            rawTarget,
                            fullPath,
                            callDepthMap
                        });
                        // If handler returned a plain copy, use it (null means not a simple object or failed)
                        if (plainCopy !== null) {
                            return plainCopy;
                        }
                        // Fall through to proxy creation if not a simple object or copy failed
                    }

                    // CRITICAL: If rawTarget is already proxied, check if the value itself is proxied before creating new proxy
                    // This prevents infinite recursion when Alpine wraps our proxy and accesses nested properties
                    if (isRawTargetProxied) {
                        // Get the raw nested object from store to check cache
                        const newPath = [...path, key];
                        let rawNestedObject = objectToProxy;

                        try {
                            const getRawData = window.ManifestDataStore?.getRawData;
                            if (getRawData && dataSourceName) {
                                const rawDataSource = getRawData(dataSourceName);
                                if (rawDataSource && typeof rawDataSource === 'object') {
                                    let current = rawDataSource;
                                    let pathValid = true;
                                    for (let i = 0; i < newPath.length; i++) {
                                        const pathKey = newPath[i];
                                        if (current && typeof current === 'object' && pathKey in current) {
                                            current = current[pathKey];
                                        } else {
                                            pathValid = false;
                                            break;
                                        }
                                    }
                                    if (pathValid && current) {
                                        rawNestedObject = current;
                                    }
                                }
                            }
                        } catch (e) {
                            // Silently handle errors
                        }

                        // If the nested object is already proxied, return the cached proxy
                        if (window.ManifestDataProxiesCore?.nestedObjectProxyCache?.has(rawNestedObject)) {
                            const cachedProxy = window.ManifestDataProxiesCore.nestedObjectProxyCache.get(rawNestedObject);
                            if (cachedProxy) {
                                if (activeProps) {
                                    activeProps.delete(propKey);
                                }
                                return cachedProxy;
                            }
                        }

                        // If rawTarget is proxied but nested object isn't, we still need to create a proxy
                        // But use the raw nested object from store as the target
                        objectToProxy = rawNestedObject;
                    }

                    // CRITICAL: Check if this object is already a proxy we created to prevent infinite recursion
                    // This can happen when Alpine wraps our proxy and accesses properties on the wrapped proxy
                    if (window.ManifestDataProxiesCore?.nestedObjectProxyCache?.has(objectToProxy)) {
                        const cachedProxy = window.ManifestDataProxiesCore.nestedObjectProxyCache.get(objectToProxy);
                        if (activeProps) {
                            activeProps.delete(propKey);
                        }
                        return cachedProxy;
                    }

                    // Final check: if still undefined or null, return undefined
                    if (objectToProxy === undefined || objectToProxy === null) {
                        return undefined;
                    }

                    // CRITICAL FIX: Check cache BEFORE calling createNestedObjectProxy to avoid function call overhead
                    // Get the raw nested object from store to use as cache key
                    const newPath = [...path, key];
                    let rawNestedObject = objectToProxy;

                    // Try to get the raw object from store using the new path
                    const getRawData = window.ManifestDataStore?.getRawData;
                    if (getRawData && dataSourceName) {
                        const rawDataSource = getRawData(dataSourceName);
                        if (rawDataSource && typeof rawDataSource === 'object') {
                            let current = rawDataSource;
                            let pathValid = true;
                            for (let i = 0; i < newPath.length; i++) {
                                const pathKey = newPath[i];
                                if (current && typeof current === 'object' && pathKey in current) {
                                    current = current[pathKey];
                                } else {
                                    pathValid = false;
                                    break;
                                }
                            }
                            if (pathValid && current) {
                                rawNestedObject = current;
                            }
                        }
                    }

                    if (window.ManifestDataProxiesCore?.nestedObjectProxyCache?.has(rawNestedObject)) {
                        const cachedProxy = window.ManifestDataProxiesCore.nestedObjectProxyCache.get(rawNestedObject);
                        if (cachedProxy) {
                            // Remove from activeProps before returning cached proxy
                            if (activeProps) {
                                activeProps.delete(propKey);
                            }
                            return cachedProxy;
                        }
                    }

                    const nestedProxy = createNestedObjectProxy(objectToProxy, dataSourceName, reloadDataSource, newPath);

                    // Remove from activeProps after creating nested proxy
                    // This allows Alpine to access nested properties without false circular detection
                    if (activeProps) {
                        activeProps.delete(propKey);
                    }

                    // Don't reset depth here - nested proxy will handle it
                    return nestedProxy;
                }

                // If value is undefined, return a loading proxy to maintain chain and prevent errors
                if (value === undefined) {
                    // Remove from activeProps before returning
                    if (activeProps) {
                        activeProps.delete(propKey);
                    }
                    // Reset depth
                    callDepthMap.delete(rawTarget);
                    return window.ManifestDataProxiesCore.createLoadingProxy(dataSourceName);
                }

                // Remove from activeProps before returning
                if (activeProps) {
                    activeProps.delete(propKey);
                }

                // Reset depth
                callDepthMap.delete(rawTarget);
                return value;
            } finally {
                if (typeof window !== 'undefined') window.__manifestNestedGetDepth = Math.max(0, (window.__manifestNestedGetDepth || 0) - 1);
            }
        }
    });

    // Cache the proxy before returning to prevent re-proxying the same object
    // Use the raw object from store as cache key (WeakMap requires object keys)
    // Critical for Alpine reactivity - prevents infinite re-evaluation loops
    if (window.ManifestDataProxiesCore?.nestedObjectProxyCache) {
        window.ManifestDataProxiesCore.nestedObjectProxyCache.set(rawObjectForCache, proxy);


    }
    return proxy;
}

// Export functions to window for use by other subscripts
if (typeof window !== 'undefined') {
    if (!window.ManifestDataProxies) {
        window.ManifestDataProxies = {};
    }
    window.ManifestDataProxies.createNestedObjectProxy = createNestedObjectProxy;
}
