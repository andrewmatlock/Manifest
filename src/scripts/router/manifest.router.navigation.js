// Router navigation

// Current route state
let currentRoute = '/';
let isInternalNavigation = false;

// Handle route changes
async function handleRouteChange() {
    const newRoute = window.location.pathname;
    if (newRoute === currentRoute) return;

    currentRoute = newRoute;

    // Handle scrolling based on whether this is an anchor link or route change
    if (!window.location.hash) {
        // This is a route change - scroll to top
        // Use a small delay to ensure content has loaded
        setTimeout(() => {
            // Scroll main page to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Find and scroll scrollable containers to top
            // Use a generic approach that works with any CSS framework
            // Only check elements that are likely to be scrollable containers
            const potentialContainers = document.querySelectorAll('div, main, section, article, aside, nav, header, footer, .prose');
            potentialContainers.forEach(element => {
                const computedStyle = window.getComputedStyle(element);
                const isScrollable = (
                    computedStyle.overflowY === 'auto' ||
                    computedStyle.overflowY === 'scroll' ||
                    computedStyle.overflow === 'auto' ||
                    computedStyle.overflow === 'scroll'
                ) && element.scrollHeight > element.clientHeight;

                if (isScrollable) {
                    element.scrollTop = 0;
                }
            });
        }, 50);
    } else {
        // This is an anchor link - let the browser handle the scroll naturally
        // Use a small delay to ensure content has loaded, then let browser scroll to anchor
        setTimeout(() => {
            // The browser will automatically scroll to the anchor
            // We just need to ensure the content is loaded first
        }, 50);
    }

    // Emit route change event
    window.dispatchEvent(new CustomEvent('manifest:route-change', {
        detail: {
            from: currentRoute,
            to: newRoute,
            normalizedPath: newRoute === '/' ? '/' : newRoute.replace(/^\/|\/$/g, '')
        }
    }));
}

// Intercept link clicks to prevent page reloads
function interceptLinkClicks() {
    // Use capture phase to intercept before other handlers
    document.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;

        // Handle pure anchor links normally - don't intercept them
        if (href.startsWith('#')) return;

        // Check if it's an external link FIRST (before any other processing)
        let isExternalLink = false;
        try {
            const url = new URL(href, window.location.origin);
            if (url.origin !== window.location.origin) {
                isExternalLink = true; // External link
            }
        } catch (e) {
            // Invalid URL, treat as relative
        }

        // If it's an external link, don't intercept it
        if (isExternalLink) {
            return;
        }

        // Handle links with both route and anchor (e.g., /page#section)
        if (href.includes('#')) {
            const [path, hash] = href.split('#');

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            // Set flag to prevent recursive calls
            isInternalNavigation = true;

            // Update URL without page reload
            history.pushState(null, '', href);

            // Handle route change (but don't scroll to top since there's an anchor)
            handleRouteChange();

            // Reset flag
            isInternalNavigation = false;

            // After route change, scroll to the anchor
            setTimeout(() => {
                const targetElement = document.getElementById(hash);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);

            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // Set flag to prevent recursive calls
        isInternalNavigation = true;

        // Update URL without page reload
        history.pushState(null, '', href);

        // Handle route change
        handleRouteChange();

        // Reset flag
        isInternalNavigation = false;

    }, true); // Use capture phase
}

// Initialize navigation
function initializeNavigation() {
    // Set initial route
    currentRoute = window.location.pathname;

    // Intercept link clicks
    interceptLinkClicks();

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', () => {
        if (!isInternalNavigation) {
            handleRouteChange();
        }
    });

    // Handle initial route
    handleRouteChange();
}

// Run immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNavigation);
} else {
    initializeNavigation();
}

// Export navigation interface
window.ManifestRoutingNavigation = {
    initialize: initializeNavigation,
    getCurrentRoute: () => currentRoute
}; 