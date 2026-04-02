// Router navigation

// Current route state (logical path, e.g. /gadget; not full pathname when app is in a subpath)
let currentRoute = '/';
let isInternalNavigation = false;

function isPrerenderedStaticBuild() {
    // When prerendered HTML is served as static pages, prefer normal browser navigation (MPA)
    // so each URL loads its own prerendered HTML rather than SPA toggling.
    return !!document.querySelector('meta[name="manifest:prerendered"][content="1"]');
}

function getBasePath() {
    return (typeof window.getManifestBasePath === 'function' ? window.getManifestBasePath() : '') || '';
}

function pathnameToLogical(pathname) {
    const base = getBasePath();
    if (!base) {
        const p = (pathname || '/').replace(/\/$/, '') || '/';
        if (p === '/' || p === '/index.html' || p === '/index') return '/';
        return p.startsWith('/') ? p : '/' + p;
    }
    if (pathname === base || pathname === base + '/') return '/';
    if (pathname.startsWith(base + '/')) {
        let logical = pathname.slice(base.length) || '/';
        if (logical === '/index.html' || logical === '/index') logical = '/';
        return logical;
    }
    if (pathname === base + '/index.html' || pathname === base + '/index') return '/';
    return pathname;
}

// Handle route changes
async function handleRouteChange() {
    const pathname = window.location.pathname;
    const newRoute = pathnameToLogical(pathname);
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

// Resolve internal link to absolute pathname for pushState. Relative hrefs (e.g. "gadget") are resolved against the app base, not the current URL, so we never get additive paths like /src/dist/widget/gadget/widget/...
function resolveHref(href) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return href;
    try {
        const base = getBasePath();
        const baseUrl = base ? (window.location.origin + base + '/') : (window.location.origin + '/');
        const url = new URL(href, baseUrl);
        if (url.origin !== window.location.origin) return href;
        let path = url.pathname.replace(/\/$/, '') || '/';
        if (!base) return path.startsWith('/') ? path : '/' + path;
        if (path === base || path.startsWith(base + '/')) return path;
        // path may be above base (e.g. /gadget when base is /src/dist) or unrelated; take only the route part and put under base so we never stack.
        if (path.startsWith('/')) {
            const pathSegs = path.split('/').filter(Boolean);
            const baseSegs = base.split('/').filter(Boolean);
            let i = 0;
            while (i < baseSegs.length && i < pathSegs.length && baseSegs[i] === pathSegs[i]) i++;
            const routeSegs = pathSegs.slice(i);
            if (routeSegs.length) return base + '/' + routeSegs.join('/');
        }
        const out = base + (path.startsWith('/') ? path : '/' + path);
        return out.startsWith('/') ? out : '/' + out;
    } catch {
        const base = getBasePath();
        const safe = (href || '').trim();
        if (!safe) return base || '/';
        return base ? (base + (safe.startsWith('/') ? safe : '/' + safe)) : (safe.startsWith('/') ? safe : '/' + safe);
    }
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
            const fullHref = resolveHref(path) + (hash ? '#' + hash : '');

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            // Set flag to prevent recursive calls
            isInternalNavigation = true;

            // Update URL without page reload (use base path when app is in a subpath)
            history.pushState(null, '', fullHref);

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

        // Update URL without page reload (use base path when app is in a subpath, e.g. /src/dist/gadget)
        const fullHref = resolveHref(href);
        history.pushState(null, '', fullHref);

        // Handle route change
        handleRouteChange();

        // Reset flag
        isInternalNavigation = false;

    }, true); // Use capture phase
}

// Initialize navigation
function initializeNavigation() {
    // Set initial route (logical path for matching)
    currentRoute = pathnameToLogical(window.location.pathname);

    // In prerendered/static output, use default browser navigation (no interception)
    if (!isPrerenderedStaticBuild()) {
        // Intercept link clicks
        interceptLinkClicks();

        // Listen for popstate events (browser back/forward)
        window.addEventListener('popstate', () => {
            if (!isInternalNavigation) {
                handleRouteChange();
            }
        });
    }

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
    getCurrentRoute: () => currentRoute,
    getBasePath,
    resolveHref,
    pathnameToLogical
}; 