// Router magic property

// Initialize router magic property
function initializeRouterMagic() {
    // Check if Alpine is available
    if (typeof Alpine === 'undefined') {
        console.error('[Manifest Router Magic] Alpine is not available');
        return;
    }

    // Create a reactive object for route data
    const route = Alpine.reactive({
        current: window.location.pathname,
        segments: [],
        params: {},
        matches: null
    });

    // Update route when route changes
    const updateRoute = () => {
        const currentRoute = window.ManifestRoutingNavigation?.getCurrentRoute() || window.location.pathname;

        // Strip localization codes and other injected segments to get the logical route
        let logicalRoute = currentRoute;

        // Check if there's a localization code at the start of the path
        const pathParts = currentRoute.split('/').filter(Boolean);
        if (pathParts.length > 0) {
            // Check if first segment is a language code (2-5 characters, alphanumeric with hyphens/underscores)
            const firstSegment = pathParts[0];
            if (/^[a-zA-Z0-9_-]{2,5}$/.test(firstSegment)) {
                // This might be a language code, check if it's in the available locales
                const store = Alpine.store('locale');
                if (store && store.available && store.available.includes(firstSegment)) {
                    // Remove the language code from the path
                    logicalRoute = '/' + pathParts.slice(1).join('/');
                    if (logicalRoute === '/') logicalRoute = '/';
                }
            }
        }

        const normalizedPath = logicalRoute === '/' ? '' : logicalRoute.replace(/^\/|\/$/g, '');
        const segments = normalizedPath ? normalizedPath.split('/').filter(segment => segment) : [];

        route.current = logicalRoute;
        route.segments = segments;
        route.params = {};
    };

    // Listen for route changes
    window.addEventListener('manifest:route-change', updateRoute);
    window.addEventListener('popstate', updateRoute);

    // Register $route magic property - return the route string directly
    Alpine.magic('route', () => route.current);
}

// Initialize when Alpine is ready and router is ready
document.addEventListener('alpine:init', () => {
    // Wait for router to be ready
    const waitForRouter = () => {
        if (window.ManifestRoutingNavigation && window.ManifestRouting) {
            try {
                initializeRouterMagic();
            } catch (error) {
                console.error('[Manifest Router Magic] Failed to initialize:', error);
            }
        } else {
            // Wait a bit more for router to initialize
            setTimeout(waitForRouter, 50);
        }
    };

    waitForRouter();
});

// Also try to initialize immediately if Alpine and router are already available
if (typeof Alpine !== 'undefined' && window.ManifestRoutingNavigation && window.ManifestRouting) {
    try {
        initializeRouterMagic();
    } catch (error) {
        console.error('[Manifest Router Magic] Failed to initialize immediately:', error);
    }
}

// Export magic property interface
window.ManifestRoutingMagic = {
    initialize: initializeRouterMagic
};
