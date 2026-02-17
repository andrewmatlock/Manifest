// Components mutation observer
window.ManifestComponentsMutation = {
    async processAllPlaceholders() {
        const processor = window.ManifestComponentsProcessor;
        const routing = window.ManifestRouting;
        if (!processor) return;
        const placeholders = Array.from(document.querySelectorAll('*')).filter(el =>
            el.tagName.toLowerCase().startsWith('x-') &&
            !el.hasAttribute('data-pre-rendered') &&
            !el.hasAttribute('data-processed')
        );
        for (const el of placeholders) {
            if (routing) {
                // Only process if route matches
                const xRoute = el.getAttribute('x-route');
                const currentPath = window.location.pathname;
                const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/+|\/+$/g, '');
                const matches = !xRoute || window.ManifestRouting.matchesCondition(normalizedPath, xRoute);
                if (!matches) continue;
            }
            await processor.processComponent(el);
        }
    },
    initialize() {
        const processor = window.ManifestComponentsProcessor;
        const routing = window.ManifestRouting;
        if (!processor) return;
        // Initial scan
        this.processAllPlaceholders();
        // Mutation observer for new placeholders
        const observer = new MutationObserver(async mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.tagName.toLowerCase().startsWith('x-')) {
                        if (!node.hasAttribute('data-pre-rendered') && !node.hasAttribute('data-processed')) {
                            if (routing) {
                                const xRoute = node.getAttribute('x-route');
                                const currentPath = window.location.pathname;
                                const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/+|\/+$/g, '');
                                const matches = !xRoute || window.ManifestRouting.matchesCondition(normalizedPath, xRoute);
                                if (!matches) continue;
                            }
                            await processor.processComponent(node);
                        }
                    }
                    // Also check for any <x-*> descendants
                    if (node.nodeType === 1) {
                        const descendants = Array.from(node.querySelectorAll('*')).filter(el =>
                            el.tagName.toLowerCase().startsWith('x-') &&
                            !el.hasAttribute('data-pre-rendered') &&
                            !el.hasAttribute('data-processed')
                        );
                        for (const el of descendants) {
                            if (routing) {
                                const xRoute = el.getAttribute('x-route');
                                const currentPath = window.location.pathname;
                                const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/+|\/+$/g, '');
                                const matches = !xRoute || window.ManifestRouting.matchesCondition(normalizedPath, xRoute);
                                if (!matches) continue;
                            }
                            await processor.processComponent(el);
                        }
                    }
                }
            }
        });

        // Ensure document.body exists before observing
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            // Wait for body to be available
            document.addEventListener('DOMContentLoaded', () => {
                observer.observe(document.body, { childList: true, subtree: true });
            });
        }
    }
}; 