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