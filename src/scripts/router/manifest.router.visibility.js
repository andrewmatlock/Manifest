// Router visibility

// Process visibility for all elements with x-route
function processRouteVisibility(normalizedPath) {
    const routeElements = document.querySelectorAll('[x-route]');

    // First pass: collect all defined routes (excluding !* and other negative conditions)
    const definedRoutes = [];
    routeElements.forEach(element => {
        const routeCondition = element.getAttribute('x-route');
        if (!routeCondition) return;

        const conditions = routeCondition.split(',').map(cond => cond.trim());
        conditions.forEach(cond => {
            // Only collect positive conditions and wildcards (not negative ones)
            if (!cond.startsWith('!') && cond !== '!*') {
                definedRoutes.push(cond);
            }
        });
    });

    // Extract localization codes from manifest.json data sources
    const localizationCodes = [];
    try {
        // Check if manifest is available and has data sources
        const manifest = window.ManifestComponentsRegistry?.manifest || window.manifest;
        if (manifest && manifest.data) {
            Object.values(manifest.data).forEach(dataSource => {
                if (typeof dataSource === 'object' && dataSource !== null) {
                    Object.keys(dataSource).forEach(key => {
                        // Check if this looks like a localization key (common language codes)
                        if (key.match(/^[a-z]{2}(-[A-Z]{2})?$/)) {
                            localizationCodes.push(key);
                        }
                    });
                }
            });
        }
    } catch (e) {
        // Ignore errors if manifest is not available
    }

    // Check if current route is defined by any route
    let isRouteDefined = definedRoutes.some(route =>
        window.ManifestRouting.matchesCondition(normalizedPath, route)
    );

    // Also check if the route starts with a localization code
    if (!isRouteDefined && localizationCodes.length > 0) {
        const pathSegments = normalizedPath.split('/').filter(segment => segment);
        if (pathSegments.length > 0) {
            const firstSegment = pathSegments[0];
            if (localizationCodes.includes(firstSegment)) {
                // This is a localized route - check if the remaining path is defined
                const remainingPath = pathSegments.slice(1).join('/');

                // If no remaining path, treat as root route
                if (remainingPath === '') {
                    isRouteDefined = definedRoutes.some(route =>
                        window.ManifestRouting.matchesCondition('/', route) ||
                        window.ManifestRouting.matchesCondition('', route)
                    );
                } else {
                    // Check if the remaining path matches any defined route
                    isRouteDefined = definedRoutes.some(route =>
                        window.ManifestRouting.matchesCondition(remainingPath, route)
                    );
                }
            }
        }
    }

    routeElements.forEach(element => {
        const routeCondition = element.getAttribute('x-route');
        if (!routeCondition) return;

        // Parse route conditions
        const conditions = routeCondition.split(',').map(cond => cond.trim());
        const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
        const negativeConditions = conditions
            .filter(cond => cond.startsWith('!'))
            .map(cond => cond.slice(1));

        // Special handling for !* (undefined routes)
        if (conditions.includes('!*')) {
            const shouldShow = !isRouteDefined;
            if (shouldShow) {
                element.removeAttribute('hidden');
                element.style.display = '';
            } else {
                element.setAttribute('hidden', '');
                element.style.display = 'none';
            }
            return;
        }

        // Check conditions
        const hasNegativeMatch = negativeConditions.some(cond =>
            window.ManifestRouting.matchesCondition(normalizedPath, cond)
        );
        const hasPositiveMatch = positiveConditions.length === 0 || positiveConditions.some(cond =>
            window.ManifestRouting.matchesCondition(normalizedPath, cond)
        );

        const shouldShow = hasPositiveMatch && !hasNegativeMatch;

        // Show/hide element
        if (shouldShow) {
            element.removeAttribute('hidden');
            element.style.display = '';
        } else {
            element.setAttribute('hidden', '');
            element.style.display = 'none';
        }
    });
}

// Add x-cloak to route elements that don't have it
function addXCloakToRouteElements() {
    const routeElements = document.querySelectorAll('[x-route]:not([x-cloak])');
    routeElements.forEach(element => {
        element.setAttribute('x-cloak', '');
    });
}

// Initialize visibility management
function initializeVisibility() {
    // Add x-cloak to route elements to prevent flash
    addXCloakToRouteElements();

    // Process initial visibility
    const currentPath = window.location.pathname;
    const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');
    processRouteVisibility(normalizedPath);

    // Listen for route changes
    window.addEventListener('manifest:route-change', (event) => {
        processRouteVisibility(event.detail.normalizedPath);
    });

    // Listen for component processing to ensure visibility is applied after components load
    window.addEventListener('manifest:components-processed', () => {
        // Add x-cloak to any new route elements
        addXCloakToRouteElements();

        const currentPath = window.location.pathname;
        const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');
        processRouteVisibility(normalizedPath);
    });
}

// Add x-cloak immediately to prevent flash
if (document.readyState === 'loading') {
    // DOM is still loading, add x-cloak as soon as possible
    document.addEventListener('DOMContentLoaded', () => {
        addXCloakToRouteElements();
        initializeVisibility();
    });
} else {
    // DOM is ready, add x-cloak immediately
    addXCloakToRouteElements();
    initializeVisibility();
}

// Export visibility interface
window.ManifestRoutingVisibility = {
    initialize: initializeVisibility,
    processRouteVisibility
}; 