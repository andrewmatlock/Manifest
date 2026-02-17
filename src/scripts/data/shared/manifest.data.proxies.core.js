/* Manifest Data Sources - Core Proxy Utilities */

// Track if we're in Alpine's initial evaluation phase
// During this phase, we return safe values to prevent recursion
let isInitialEvaluation = true;
setTimeout(() => {
    isInitialEvaluation = false;
}, 100); // Give Alpine time to finish initial evaluation

// Fallback for nested property access: chainable (return self for string keys so
// .another.deep.level never throws) and string-like (toString/valueOf → '', common string methods).
// Used by loading proxy and nested object proxy when a key is missing.
let cachedChainingFallback = null;
function getChainingFallback() {
    if (cachedChainingFallback) return cachedChainingFallback;
    const empty = [];
    const attachArrayMethods = window.ManifestDataProxies?.attachArrayMethods;
    const arrayWithMethods = attachArrayMethods ? attachArrayMethods(empty, '', null) : empty;
    const routeFn = (typeof arrayWithMethods?.$route === 'function')
        ? arrayWithMethods.$route.bind(arrayWithMethods)
        : function () { return cachedChainingFallback; };
    const searchFn = (typeof arrayWithMethods?.$search === 'function')
        ? arrayWithMethods.$search.bind(arrayWithMethods)
        : function () { return []; };
    const queryFn = (typeof arrayWithMethods?.$query === 'function')
        ? arrayWithMethods.$query.bind(arrayWithMethods)
        : function () { return []; };
    const emptyStr = function () { return ''; };
    const emptyArr = function () { return []; };
    const stringMethodStubs = {
        trim: emptyStr, toLowerCase: emptyStr, toUpperCase: emptyStr, repeat: emptyStr,
        padStart: emptyStr, padEnd: emptyStr, trimStart: emptyStr, trimEnd: emptyStr,
        replace: emptyStr, replaceAll: emptyStr, slice: emptyStr, substring: emptyStr, substr: emptyStr,
        split: emptyArr, concat: emptyStr, valueOf: emptyStr, toString: emptyStr,
        charAt: emptyStr, charCodeAt: function () { return NaN; }, codePointAt: function () { return undefined; },
        startsWith: function () { return false; }, endsWith: function () { return false; },
        includes: function () { return false; }, indexOf: function () { return -1; }, lastIndexOf: function () { return -1; },
        match: function () { return null; }, matchAll: function () { return []; }, search: function () { return -1; },
        normalize: emptyStr, toLocaleLowerCase: emptyStr, toLocaleUpperCase: emptyStr
    };
    cachedChainingFallback = new Proxy(Object.create(null), {
        get(_, key) {
            if (key === '$route') return routeFn;
            if (key === '$search') return searchFn;
            if (key === '$query') return queryFn;
            if (key === 'length') return 0;
            if (key === Symbol.toPrimitive || key === 'valueOf' || key === 'toString') {
                return emptyStr;
            }
            if (key === Symbol.iterator) {
                return function* () { };
            }
            if (typeof key === 'string' && key in stringMethodStubs) {
                return stringMethodStubs[key];
            }
            // Return self for any other string key so chaining never throws (e.g. .another.deep.level).
            // Display still works via toString/valueOf → ''.
            if (typeof key === 'string') return cachedChainingFallback;
            return undefined;
        },
        has() { return true; }
    });
    return cachedChainingFallback;
}

// Safe loading branch: returns '' for every key. Used only for prop === 'content' so
// $x.content.theme.light never returns a proxy Alpine can re-enter (avoids stack overflow).
let cachedLoadingBranchSafe = null;
function getLoadingBranchSafe() {
    if (cachedLoadingBranchSafe) return cachedLoadingBranchSafe;
    const emptyStr = function () { return ''; };
    cachedLoadingBranchSafe = new Proxy(Object.create(null), {
        get(_, key) {
            if (key === Symbol.toPrimitive || key === 'valueOf' || key === 'toString') return emptyStr;
            if (key === 'then' || key === 'catch' || key === 'finally') return undefined;
            return '';
        },
        has() { return true; }
    });
    return cachedLoadingBranchSafe;
}

// Chainable loading branch: return self for string keys, callable for $route. Used for
// json/yaml/etc so $x.json.products.$route('path').name and deep paths don't throw.
let cachedLoadingBranch = null;
function getLoadingBranch() {
    if (cachedLoadingBranch) return cachedLoadingBranch;
    const returnSelf = function () { return cachedLoadingBranch; };
    const emptyStr = function () { return ''; };
    cachedLoadingBranch = new Proxy(Object.create(null), {
        get(_, key) {
            if (key === Symbol.toPrimitive || key === 'valueOf' || key === 'toString') return emptyStr;
            if (key === 'then' || key === 'catch' || key === 'finally') return undefined;
            if (key === Symbol.iterator) return function* () { };
            if (key === '$route' || key === '$search' || key === '$query') return returnSelf;
            if (key === 'length') return 0;
            if (typeof key === 'string') return cachedLoadingBranch;
            return undefined;
        },
        has() { return true; }
    });
    return cachedLoadingBranch;
}

// Create a simple fallback object that returns empty strings for all properties.
// When propForPlaceholder === 'content', nested data keys use getLoadingBranchSafe() (primitives only)
// so Alpine never gets a chainable proxy and $x.content.theme.light doesn't stack overflow.
// For other props (json, yaml, etc.) use getLoadingBranch() (chainable) so $route and deep paths work.
function createSimpleFallback(propForPlaceholder) {
    const fallback = Object.create(null);

    // Add primitive conversion methods directly to the object
    fallback[Symbol.toPrimitive] = function (hint) {
        return hint === 'number' ? 0 : '';
    };
    fallback.valueOf = function () { return ''; };
    fallback.toString = function () { return ''; };

    // Add $route function that returns the fallback for chaining
    fallback.$route = function (pathKey) {
        return fallback;
    };

    // For array-like properties, add length
    Object.defineProperty(fallback, 'length', {
        value: 0,
        writable: false,
        enumerable: false,
        configurable: false
    });

    // Add array methods to the fallback so expressions like ($x.example.products || []).filter() work
    // even when the data hasn't loaded yet. The loading proxy is truthy, so || [] doesn't trigger,
    // but we need array methods to be available.
    const arrayMethods = [
        'filter', 'map', 'forEach', 'find', 'findIndex', 'some', 'every', 'reduce', 'reduceRight',
        'slice', 'concat', 'includes', 'indexOf', 'lastIndexOf', 'join', 'toString', 'toLocaleString',
        'keys', 'values', 'entries', 'flat', 'flatMap', 'sort', 'reverse'
    ];

    arrayMethods.forEach(methodName => {
        if (typeof Array.prototype[methodName] === 'function') {
            Object.defineProperty(fallback, methodName, {
                value: function () {
                    // For methods that return arrays, return empty array
                    if (['filter', 'map', 'slice', 'concat', 'flat', 'flatMap', 'sort', 'reverse'].includes(methodName)) {
                        return [];
                    }
                    // For methods that return booleans, return false
                    if (['some', 'every', 'includes'].includes(methodName)) {
                        return false;
                    }
                    // For find methods, return undefined
                    if (['find', 'findIndex'].includes(methodName)) {
                        return methodName === 'find' ? undefined : -1;
                    }
                    // For reduce methods, return initial value or undefined
                    if (['reduce', 'reduceRight'].includes(methodName)) {
                        return arguments.length > 1 ? arguments[1] : undefined;
                    }
                    // For indexOf methods, return -1
                    if (['indexOf', 'lastIndexOf'].includes(methodName)) {
                        return -1;
                    }
                    // For join/toString methods, return empty string
                    if (['join', 'toString', 'toLocaleString'].includes(methodName)) {
                        return '';
                    }
                    // For forEach, return undefined (no-op)
                    if (methodName === 'forEach') {
                        return undefined;
                    }
                    // For iterator methods, return empty iterator
                    if (['keys', 'values', 'entries'].includes(methodName)) {
                        return function* () { };
                    }
                    // Default: return empty array for safety
                    return [];
                },
                writable: false,
                enumerable: false,
                configurable: true
            });
        }
    });

    // Make Symbol.toPrimitive non-enumerable and directly on the object
    Object.defineProperty(fallback, Symbol.toPrimitive, {
        value: function (hint) {
            return hint === 'number' ? 0 : '';
        },
        writable: false,
        enumerable: false,
        configurable: false
    });

    // Create an empty array with methods attached for array-like access
    // This is used when array methods are accessed on the loading proxy
    let cachedArrayWithMethods = null;
    const getArrayWithMethods = () => {
        if (!cachedArrayWithMethods) {
            const emptyArray = [];
            const attachArrayMethods = window.ManifestDataProxies?.attachArrayMethods;
            if (attachArrayMethods) {
                // Use a generic data source name - methods will still work
                cachedArrayWithMethods = attachArrayMethods(emptyArray, '', null);
            } else {
                cachedArrayWithMethods = emptyArray;
            }
        }
        return cachedArrayWithMethods;
    };

    // Create the proxy and store a reference to itself for recursive access
    const proxy = new Proxy(fallback, {
        get(target, key) {
            // Handle Symbol.iterator to make it iterable (for Alpine's x-for)
            if (key === Symbol.iterator) {
                return function* () {
                    // Return empty iterator - Alpine can iterate over it safely
                };
            }

            // Handle other special keys
            if (key === 'then' || key === 'catch' || key === 'finally' ||
                key === Symbol.toStringTag || key === Symbol.hasInstance) {
                return undefined;
            }

            // Handle constructor and prototype
            if (key === 'constructor' || key === '__proto__' || key === 'prototype') {
                return undefined;
            }

            // CRITICAL: If array methods ($search, $query) or common array methods are accessed,
            // return the array with methods attached (not just the method)
            // This ensures ($x.example.products || []).$search() works correctly
            // When $search/$query are called, they filter the array and return a new array with methods
            if (key === '$search' || key === '$query' || key === '$route') {
                const arrayWithMethods = getArrayWithMethods();
                // Return the method bound to the array
                if (key in arrayWithMethods && typeof arrayWithMethods[key] === 'function') {
                    return arrayWithMethods[key].bind(arrayWithMethods);
                }
            }
            // For other array methods, return them from the array with methods
            if (typeof key === 'string' && typeof Array.prototype[key] === 'function') {
                const arrayWithMethods = getArrayWithMethods();
                if (key in arrayWithMethods && typeof arrayWithMethods[key] === 'function') {
                    return arrayWithMethods[key].bind(arrayWithMethods);
                }
                // Fallback to Array.prototype method
                return Array.prototype[key].bind(arrayWithMethods);
            }

            // If the key exists on the target (like route, toString, valueOf, length, Symbol.toPrimitive), return it
            if (key in target || key === Symbol.toPrimitive) {
                const value = target[key];
                if (value !== undefined) {
                    return value;
                }
            }

            // For string keys that look like data: use safe placeholder for 'content' (primitives only,
            // no re-entry/stack overflow); use chainable placeholder for other props ($route, deep paths).
            if (typeof key === 'string' && key.length > 0 && key.length < 64 &&
                !key.startsWith('$') && key !== 'length') {
                return propForPlaceholder === 'content' ? getLoadingBranchSafe() : getLoadingBranch();
            }

            // For any other key, return chaining fallback — never return the loading proxy itself.
            return getChainingFallback();
        },
        has(target, key) {
            // Make all string keys appear to exist to prevent Alpine from trying to access them
            if (typeof key === 'string') {
                // Also check if it's an array method - these should definitely exist
                if (typeof Array.prototype[key] === 'function') {
                    return true;
                }
                return true;
            }
            return key in target || key === Symbol.toPrimitive;
        }
    });

    return proxy;
}

// Cache loading proxy per prop so content gets safe placeholder, json/yaml get chainable.
const cachedLoadingProxyByProp = Object.create(null);

// Create a safe proxy for loading state. prop is the top-level key (e.g. 'content', 'json').
// When prop === 'content', nested placeholders are primitives-only (no stack overflow).
function createLoadingProxy(prop) {
    const key = prop == null ? '' : String(prop);
    if (!cachedLoadingProxyByProp[key]) {
        cachedLoadingProxyByProp[key] = createSimpleFallback(key || undefined);
    }
    return cachedLoadingProxyByProp[key];
}

// WeakMap cache only for arrays (to prevent recursion in $route() lookups)
const arrayProxyCache = new WeakMap();

// WeakMap cache for nested object proxies (to prevent infinite recursion)
const nestedObjectProxyCache = new WeakMap();

// WeakMap cache for main data source proxies (to prevent creating new proxies on each access)
const dataSourceProxyCache = new WeakMap();

// Create a proxy for array items
// Simplified: Just return target[key] directly (like backup) - no recursive proxying
function createArrayItemProxy(item) {
    return new Proxy(item, {
        get(target, key) {
            // Handle special keys
            if (key === Symbol.iterator || key === 'then' || key === 'catch' || key === 'finally') {
                return undefined;
            }

            // Handle toPrimitive for text content
            if (key === Symbol.toPrimitive) {
                return function () {
                    return target[key] || '';
                };
            }

            // Just return the value directly - let Alpine's store handle reactivity
            // This prevents recursion by not creating nested proxies
            return target[key];
        }
    });
}

// Export functions to window for use by other subscripts
window.ManifestDataProxiesCore = {
    isInitialEvaluation: () => isInitialEvaluation,
    getChainingFallback,
    createLoadingProxy,
    createArrayItemProxy,
    arrayProxyCache,
    nestedObjectProxyCache,
    dataSourceProxyCache
};
