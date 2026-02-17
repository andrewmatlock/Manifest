/* Manifest Router */

// Main routing initialization
function initializeRouting() {

    // Mark as initialized
    window.__manifestRoutingInitialized = true;
    window.dispatchEvent(new CustomEvent('manifest:routing-ready'));

}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRouting);
} else {
    initializeRouting();
}

// Export main routing interface
window.ManifestRouting = {
    initialize: initializeRouting,
    // Route matching utility
    matchesCondition: (path, condition) => {
        // Normalize path consistently - keep '/' as '/' for home route
        const normalizedPath = path === '/' ? '/' : path.replace(/^\/+|\/+$/g, '') || '/';

        // Get localization codes from manifest
        const localizationCodes = [];
        try {
            const manifest = window.ManifestComponentsRegistry?.manifest || window.manifest;
            if (manifest && manifest.data) {
                Object.values(manifest.data).forEach(dataSource => {
                    if (typeof dataSource === 'object' && dataSource !== null) {
                        Object.keys(dataSource).forEach(key => {
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

        // Check if path starts with a localization code
        let pathToCheck = normalizedPath;
        if (localizationCodes.length > 0) {
            const pathSegments = normalizedPath.split('/').filter(segment => segment);
            if (pathSegments.length > 0 && localizationCodes.includes(pathSegments[0])) {
                // Remove the localization code and check the remaining path
                pathToCheck = pathSegments.slice(1).join('/') || '/';
            }
        }

        // Handle wildcards
        if (condition.includes('*')) {
            if (condition === '*') return true;
            const wildcardPattern = condition.replace('*', '');
            const normalizedPattern = wildcardPattern.replace(/^\/+|\/+$/g, '');
            return pathToCheck.startsWith(normalizedPattern + '/');
        }

        // Handle exact matches (starting with =) - after localization processing
        if (condition.startsWith('=')) {
            const exactPath = condition.slice(1);
            if (exactPath === '/') {
                return pathToCheck === '/' || pathToCheck === '';
            }
            const normalizedExactPath = exactPath.replace(/^\/+|\/+$/g, '');
            return pathToCheck === normalizedExactPath;
        }

        // Handle exact paths (starting with /)
        if (condition.startsWith('/')) {
            if (condition === '/') {
                return pathToCheck === '/' || pathToCheck === '';
            }
            const routePath = condition.replace(/^\//, '');
            return pathToCheck === routePath || pathToCheck.startsWith(routePath + '/');
        }

        // Handle substring matching (default behavior)
        return pathToCheck.includes(condition);
    }
};


// Router position

// Capture initial body order from index.html
function captureBodyOrder() {
    if (window.__manifestBodyOrder) return; // Already captured

    try {
        const req = new XMLHttpRequest();
        req.open('GET', '/index.html', false);
        req.send(null);
        if (req.status === 200) {
            let html = req.responseText;

            // Handle self-closing tags if components plugin isn't available
            if (!window.ManifestComponents) {
                html = html.replace(/<x-([a-z0-9-]+)([^>]*)\s*\/?>/gi, (match, tag, attrs) => `<x-${tag}${attrs}></x-${tag}>`);
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const bodyChildren = Array.from(doc.body.children);

            window.__manifestBodyOrder = bodyChildren.map((el, index) => ({
                index,
                tag: el.tagName.toLowerCase().trim(),
                isComponent: el.tagName.toLowerCase().startsWith('x-'),
                attrs: Array.from(el.attributes).map(attr => [attr.name, attr.value]),
                key: el.getAttribute('data-component-id') || (el.tagName.toLowerCase().startsWith('x-') ? el.tagName.toLowerCase().replace('x-', '').trim() : null),
                position: index,
                content: el.tagName.toLowerCase().startsWith('x-') ? null : el.innerHTML
            }));
        }
    } catch (e) {
        // Failed to load index.html for body order snapshot
    }
}

// Assign data-order attributes to all top-level elements
function assignDataPositions() {
    if (!document.body) return;

    const bodyChildren = Array.from(document.body.children);

    bodyChildren.forEach((element, index) => {
        element.setAttribute('data-order', index.toString());
    });
}

// Initialize position management
function initializePositionManagement() {
    // Capture body order first
    captureBodyOrder();

    // Assign data-order attributes
    assignDataPositions();
}

// Run immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePositionManagement);
} else {
    initializePositionManagement();
}

// Export position management interface
window.ManifestRoutingPosition = {
    initialize: initializePositionManagement,
    captureBodyOrder,
    assignDataPositions
}; 

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

// Router head

// Track injected head content to prevent duplicates
const injectedHeadContent = new Set();

// Check if an element should be visible based on route conditions
function shouldElementBeVisible(element, normalizedPath) {

    // Check if element has x-route attribute
    if (element.hasAttribute('x-route')) {
        const routeCondition = element.getAttribute('x-route');

        if (routeCondition) {
            const conditions = routeCondition.split(',').map(cond => cond.trim());
            const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
            const negativeConditions = conditions
                .filter(cond => cond.startsWith('!'))
                .map(cond => cond.slice(1));

            const hasNegativeMatch = negativeConditions.some(cond => {
                const matches = window.ManifestRouting.matchesCondition(normalizedPath, cond);
                return matches;
            });

            const hasPositiveMatch = positiveConditions.length === 0 || positiveConditions.some(cond => {
                const matches = window.ManifestRouting.matchesCondition(normalizedPath, cond);
                return matches;
            });

            const result = hasPositiveMatch && !hasNegativeMatch;
            return result;
        }
    }

    // Check parent elements for x-route
    const parentWithRoute = element.closest('[x-route]');
    if (parentWithRoute) {
        return shouldElementBeVisible(parentWithRoute, normalizedPath);
    }

    // If no route conditions, element is visible
    return true;
}

// Generate unique identifier for head content
function generateHeadId(element) {
    const position = element.getAttribute('data-order');
    const componentId = element.getAttribute('data-component-id');
    const tagName = element.tagName.toLowerCase();

    if (position) {
        return `${tagName}-${position}`;
    } else if (componentId) {
        return `${tagName}-${componentId}`;
    } else {
        return `${tagName}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Process head content for a single element
function processElementHeadContent(element, normalizedPath) {
    let headTemplate = null;

    // Check if the element itself is a template with data-head
    if (element.tagName === 'TEMPLATE' && element.hasAttribute('data-head')) {
        headTemplate = element;
    } else {
        // Look for a template with data-head inside the element
        headTemplate = element.querySelector('template[data-head]');
    }

    if (!headTemplate) {
        return;
    }

    const headId = generateHeadId(element);
    const isVisible = shouldElementBeVisible(element, normalizedPath);

    if (isVisible) {
        // Check if we've already injected this content
        if (injectedHeadContent.has(headId)) {
            return;
        }

        // Add new head content
        Array.from(headTemplate.content.children).forEach(child => {
            if (child.tagName === 'SCRIPT') {
                // For scripts, create and execute directly
                const script = document.createElement('script');
                script.textContent = child.textContent;
                script.setAttribute('data-route-head', headId);
                document.head.appendChild(script);
            } else {
                // For other elements, clone and add
                const clonedChild = child.cloneNode(true);
                clonedChild.setAttribute('data-route-head', headId);
                document.head.appendChild(clonedChild);
            }
        });

        injectedHeadContent.add(headId);
    } else {
        // Element is not visible, remove any existing head content for this element
        const existingHead = document.head.querySelectorAll(`[data-route-head="${headId}"]`);
        existingHead.forEach(el => {
            el.remove();
        });
        injectedHeadContent.delete(headId);
    }
}

// Process all head content in the DOM
function processAllHeadContent(normalizedPath) {

    // Find all elements with head templates
    const elementsWithHead = document.querySelectorAll('template[data-head]');

    // Debug: Let's see what's actually in the DOM
    const allTemplates = document.querySelectorAll('template');
    allTemplates.forEach((template, index) => {
        if (template.hasAttribute('data-head')) {
        } else {
            // Check if this might be the about template
            if (template.getAttribute('x-route') === 'about') {
            }
        }
    });

    // Also try a more specific selector to see if we can find the about template
    const aboutTemplate = document.querySelector('template[x-route="about"]');
    if (aboutTemplate) {
    }

    // Process each element's head content
    elementsWithHead.forEach((template, index) => {

        // For component templates, we need to check if the component should be visible
        // based on the current route, not just the template's own attributes
        let element = template;
        let shouldProcess = true;

        // If this is a component template (has data-component), check if the component
        // should be visible for the current route
        if (template.hasAttribute('data-component')) {
            const componentId = template.getAttribute('data-component');
            const componentRoute = template.getAttribute('x-route');

            // Check if this component should be visible for the current route
            if (componentRoute) {
                const isVisible = window.ManifestRouting.matchesCondition(normalizedPath, componentRoute);
                shouldProcess = isVisible;
            } else {
                shouldProcess = false;
            }
        } else {
            // For non-component templates, use the existing logic
            element = template.closest('[data-order], [data-component-id], [x-route]');

            // If the template itself has the attributes we need, use it directly
            if (!element || element === template) {
                if (template.hasAttribute('data-order') || template.hasAttribute('data-component') || template.hasAttribute('x-route')) {
                    element = template;
                } else {
                    element = template.parentElement;
                }
            }

            if (element) {
                const isVisible = shouldElementBeVisible(element, normalizedPath);
                shouldProcess = isVisible;
            }
        }

        if (shouldProcess) {
            // For component templates, process them directly since we've already determined visibility
            if (template.hasAttribute('data-component')) {
                processElementHeadContent(template, normalizedPath);
            } else {
                // For non-component templates, use the existing logic
                processElementHeadContent(element, normalizedPath);
            }
        }
    });
}

// Initialize head content management
function initializeHeadContent() {
    // Wait for components to be ready before processing head content
    function processHeadContentAfterComponentsReady() {
        // Process initial head content after a longer delay to let components settle
        setTimeout(() => {
            const currentPath = window.location.pathname;
            const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');

            // Debug: Check if about component exists
            const aboutComponent = document.querySelector('[data-component="about-1"]');
            if (aboutComponent) {
            }

            // Debug: Check what placeholders exist
            const placeholders = document.querySelectorAll('x-about, x-home, x-ui');
            placeholders.forEach((placeholder, index) => {
            });

            processAllHeadContent(normalizedPath);
        }, 200);
    }

    // Function to process head content immediately (for projects without components)
    function processHeadContentImmediately() {
        const currentPath = window.location.pathname;
        const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');
        processAllHeadContent(normalizedPath);
    }

    // Check if components system exists
    if (window.ManifestComponents) {
        // Components system exists - wait for it to be fully processed
        if (window.__manifestComponentsInitialized) {
            // Components are initialized, but we need to wait for them to be processed
            // Check if components have already been processed
            if (document.querySelector('[data-component]')) {
                processHeadContentAfterComponentsReady();
            } else {
                // Wait for components to be processed
                window.addEventListener('manifest:components-processed', processHeadContentAfterComponentsReady);
            }
        } else {
            // Wait for components to be ready, then wait for them to be processed
            window.addEventListener('manifest:components-ready', () => {
                window.addEventListener('manifest:components-processed', processHeadContentAfterComponentsReady);
            });
        }
    } else {
        // No components system - process immediately
        processHeadContentImmediately();
    }

    // Listen for route changes - process immediately after components are ready
    window.addEventListener('manifest:route-change', (event) => {

        // Wait a bit for components to settle after route change
        setTimeout(() => {
            // Process head content immediately to catch components before they're reverted
            const currentPath = window.location.pathname;
            const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');

            // Debug: Check if about component exists
            const aboutComponent = document.querySelector('[data-component="about-1"]');
            if (aboutComponent) {
            }

            // Debug: Check what placeholders exist
            const placeholders = document.querySelectorAll('x-about, x-home, x-ui');
            placeholders.forEach((placeholder, index) => {
            });

            processAllHeadContent(normalizedPath);
        }, 100);
    });
}

// Run immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHeadContent);
} else {
    initializeHeadContent();
}

// Export head content interface
window.ManifestRoutingHead = {
    initialize: initializeHeadContent,
    processElementHeadContent,
    processAllHeadContent
}; 

// Router anchors

// Anchors functionality
function initializeAnchors() {

    // Register anchors directive  
    Alpine.directive('anchors', (el, { expression, modifiers }, { effect, evaluateLater, Alpine }) => {


        try {
            // Parse pipeline syntax: 'scope | targets'
            const parseExpression = (expr) => {
                if (!expr || expr.trim() === '') {
                    return { scope: '', targets: 'h1, h2, h3, h4, h5, h6' };
                }

                if (expr.includes('|')) {
                    const parts = expr.split('|').map(p => p.trim());
                    return {
                        scope: parts[0] || '',
                        targets: parts[1] || 'h1, h2, h3, h4, h5, h6'
                    };
                } else {
                    return { scope: '', targets: expr };
                }
            };

            // Extract anchors function
            const extractAnchors = (expr) => {
                const parsed = parseExpression(expr);

                let containers = [];
                if (!parsed.scope) {
                    containers = [document.body];
                } else {
                    containers = Array.from(document.querySelectorAll(parsed.scope));
                }

                let elements = [];
                const targets = parsed.targets.split(',').map(t => t.trim());

                containers.forEach(container => {
                    // Query all targets at once, then filter and sort by DOM order
                    const allMatches = [];
                    targets.forEach(target => {
                        const matches = container.querySelectorAll(target);
                        allMatches.push(...Array.from(matches));
                    });

                    // Remove duplicates and sort by DOM order
                    const uniqueMatches = [...new Set(allMatches)];
                    uniqueMatches.sort((a, b) => {
                        const position = a.compareDocumentPosition(b);
                        if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
                        if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
                        return 0;
                    });

                    elements.push(...uniqueMatches);
                });

                return elements.map((element, index) => {
                    // Generate simple ID
                    let id = element.id;
                    if (!id) {
                        id = element.textContent.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                        if (id) element.id = id;
                    }

                    // Selected state will be managed by intersection observer

                    return {
                        id: id,
                        text: element.textContent,
                        link: `#${id}`,
                        tag: element.tagName.toLowerCase(),
                        class: element.className.split(' ')[0] || '',
                        classes: Array.from(element.classList),
                        index: index,
                        element: element,

                    };
                });
            };

            // Track rendered elements to prevent duplicates
            let renderedElements = [];

            // Update Alpine data with anchors
            const updateAnchors = (anchors) => {
                // Remove existing rendered elements if they exist
                renderedElements.forEach(element => {
                    if (element.parentElement) {
                        element.remove();
                    }
                });
                renderedElements = [];

                // Set Alpine reactive property for anchor count
                Alpine.store('anchors', { count: anchors.length });

                // Render using the template element's structure and classes
                if (anchors.length > 0) {
                    // Find the container div inside the template
                    const templateContent = el.content || el;
                    const containerTemplate = templateContent.querySelector('div') || el.querySelector('div');

                    if (containerTemplate) {
                        // Clone the container div from the template
                        const containerElement = containerTemplate.cloneNode(false); // Don't clone children

                        // Remove Alpine directives from the container
                        containerElement.removeAttribute('x-show');

                        anchors.forEach(anchor => {
                            // Find the <a> element inside the template
                            const anchorTemplate = templateContent.querySelector('a') || el.querySelector('a');

                            if (anchorTemplate) {
                                // Clone the <a> element from inside the template
                                const linkElement = anchorTemplate.cloneNode(true);

                                // Remove Alpine directives
                                linkElement.removeAttribute('x-text');
                                linkElement.removeAttribute(':href');

                                // Set the actual href and text content
                                linkElement.href = anchor.link;
                                linkElement.textContent = anchor.text;

                                // Evaluate :class binding if present
                                if (linkElement.hasAttribute(':class')) {
                                    const classBinding = linkElement.getAttribute(':class');
                                    linkElement.removeAttribute(':class');

                                    try {
                                        // Create a simple evaluator for class bindings
                                        const evaluateClassBinding = (binding, anchor) => {
                                            // Replace anchor.property references with actual values
                                            let evaluated = binding
                                                .replace(/anchor\.tag/g, `'${anchor.tag}'`)
                                                .replace(/anchor\.selected/g, anchor.selected ? 'true' : 'false')
                                                .replace(/anchor\.index/g, anchor.index)
                                                .replace(/anchor\.id/g, `'${anchor.id}'`)
                                                .replace(/anchor\.text/g, `'${anchor.text.replace(/'/g, "\\'")}'`)
                                                .replace(/anchor\.link/g, `'${anchor.link}'`)
                                                .replace(/anchor\.class/g, `'${anchor.class}'`);

                                            // Simple object evaluation for class bindings
                                            if (evaluated.includes('{') && evaluated.includes('}')) {
                                                // Extract the object part
                                                const objectMatch = evaluated.match(/\{([^}]+)\}/);
                                                if (objectMatch) {
                                                    const objectContent = objectMatch[1];
                                                    const classPairs = objectContent.split(',').map(pair => pair.trim());

                                                    classPairs.forEach(pair => {
                                                        const [className, condition] = pair.split(':').map(s => s.trim());
                                                        if (condition && eval(condition)) {
                                                            linkElement.classList.add(className.replace(/['"]/g, ''));
                                                        }
                                                    });
                                                }
                                            }
                                        };

                                        evaluateClassBinding(classBinding, anchor);
                                    } catch (error) {
                                        console.warn('[Manifest Anchors] Could not evaluate class binding:', classBinding, error);
                                    }
                                }

                                containerElement.appendChild(linkElement);
                            }
                        });

                        // Insert the container before the template element
                        el.parentElement.insertBefore(containerElement, el);
                        renderedElements.push(containerElement);
                    } else {
                        // Fallback: insert links directly if no container found
                        anchors.forEach(anchor => {
                            const templateContent = el.content || el;
                            const anchorTemplate = templateContent.querySelector('a') || el.querySelector('a');

                            if (anchorTemplate) {
                                const linkElement = anchorTemplate.cloneNode(true);
                                linkElement.removeAttribute('x-text');
                                linkElement.removeAttribute(':href');
                                linkElement.href = anchor.link;
                                linkElement.textContent = anchor.text;

                                // Evaluate :class binding if present
                                if (linkElement.hasAttribute(':class')) {
                                    const classBinding = linkElement.getAttribute(':class');
                                    linkElement.removeAttribute(':class');

                                    try {
                                        // Create a simple evaluator for class bindings
                                        const evaluateClassBinding = (binding, anchor) => {
                                            // Replace anchor.property references with actual values
                                            let evaluated = binding
                                                .replace(/anchor\.tag/g, `'${anchor.tag}'`)
                                                .replace(/anchor\.selected/g, anchor.selected ? 'true' : 'false')
                                                .replace(/anchor\.index/g, anchor.index)
                                                .replace(/anchor\.id/g, `'${anchor.id}'`)
                                                .replace(/anchor\.text/g, `'${anchor.text.replace(/'/g, "\\'")}'`)
                                                .replace(/anchor\.link/g, `'${anchor.link}'`)
                                                .replace(/anchor\.class/g, `'${anchor.class}'`);

                                            // Simple object evaluation for class bindings
                                            if (evaluated.includes('{') && evaluated.includes('}')) {
                                                // Extract the object part
                                                const objectMatch = evaluated.match(/\{([^}]+)\}/);
                                                if (objectMatch) {
                                                    const objectContent = objectMatch[1];
                                                    const classPairs = objectContent.split(',').map(pair => pair.trim());

                                                    classPairs.forEach(pair => {
                                                        const [className, condition] = pair.split(':').map(s => s.trim());
                                                        if (condition && eval(condition)) {
                                                            linkElement.classList.add(className.replace(/['"]/g, ''));
                                                        }
                                                    });
                                                }
                                            }
                                        };

                                        evaluateClassBinding(classBinding, anchor);
                                    } catch (error) {
                                        console.warn('[Manifest Anchors] Could not evaluate class binding:', classBinding, error);
                                    }
                                }

                                el.parentElement.insertBefore(linkElement, el);
                                renderedElements.push(linkElement);
                            }
                        });
                    }

                    el.style.display = 'none'; // Hide template
                } else {
                    // No anchors - ensure template is visible and elements are cleared
                    el.style.display = '';
                }
            };

            // Try extraction and update data
            const tryExtraction = () => {
                const anchors = extractAnchors(expression);
                updateAnchors(anchors);
                return anchors;
            };

            // Try extraction with progressive delays and content detection
            const attemptExtraction = (attempt = 1, maxAttempts = 10) => {
                const anchors = extractAnchors(expression);

                if (anchors.length > 0) {
                    updateAnchors(anchors);
                    return true;
                } else if (attempt < maxAttempts) {
                    setTimeout(() => {
                        attemptExtraction(attempt + 1, maxAttempts);
                    }, attempt * 200); // Progressive delay: 200ms, 400ms, 600ms, etc.
                } else {
                    // No anchors found after all attempts, update store to clear previous state
                    updateAnchors([]);
                }
                return false;
            };

            // Store refresh function on element for route changes
            el._x_anchorRefresh = () => {
                attemptExtraction();
            };

            // Start extraction attempts
            attemptExtraction();


        } catch (error) {
            console.error('[Manifest Anchors] Error in directive:', error);
        }
    });
}

// Initialize anchors when Alpine is ready
document.addEventListener('alpine:init', () => {

    try {
        initializeAnchors();

    } catch (error) {
        console.error('[Manifest Anchors] Failed to initialize:', error);
    }
});

// Refresh anchors when route changes
window.addEventListener('manifest:route-change', () => {
    // Immediately clear the store to hide the h5 element
    Alpine.store('anchors', { count: 0 });

    // Wait longer for content to load after route change
    setTimeout(() => {
        const anchorElements = document.querySelectorAll('[x-anchors]');
        anchorElements.forEach(el => {
            const expression = el.getAttribute('x-anchors');
            if (expression && el._x_anchorRefresh) {
                el._x_anchorRefresh();
            }
        });
    }, 200);
});

// Refresh anchors when hash changes (for active state updates)
window.addEventListener('hashchange', () => {
    const anchorElements = document.querySelectorAll('[x-anchors]');
    anchorElements.forEach(el => {
        if (el._x_anchorRefresh) {
            el._x_anchorRefresh();
        }
    });
});

// Also refresh anchors when components are processed
window.addEventListener('manifest:components-processed', () => {
    setTimeout(() => {
        const anchorElements = document.querySelectorAll('[x-anchors]');
        anchorElements.forEach(el => {
            const expression = el.getAttribute('x-anchors');
            if (expression && el._x_anchorRefresh) {
                el._x_anchorRefresh();
            }
        });
    }, 100);
});

// Export anchors interface
window.ManifestRoutingAnchors = {
    initialize: initializeAnchors
};


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
