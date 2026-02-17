// Components swapping
(function () {
    let componentInstanceCounters = {};
    const swappedInstances = new Set();
    const instanceRouteMap = new Map();
    const placeholderMap = new Map();

    function getComponentInstanceId(name) {
        if (!componentInstanceCounters[name]) componentInstanceCounters[name] = 1;
        else componentInstanceCounters[name]++;
        return `${name}-${componentInstanceCounters[name]}`;
    }

    function logSiblings(parent, context) {
        if (!parent) return;
        const siblings = Array.from(parent.children).map(el => `${el.tagName}[data-component=${el.getAttribute('data-component') || ''}]`).join(', ');
    }

    window.ManifestComponentsSwapping = {
        // Swap in source code for a placeholder
        async swapIn(placeholder) {
            if (placeholder.hasAttribute('data-swapped')) return;
            const processor = window.ManifestComponentsProcessor;
            if (!processor) return;
            const name = placeholder.tagName.toLowerCase().replace('x-', '');
            let instanceId = placeholder.getAttribute('data-component');
            if (!instanceId) {
                instanceId = getComponentInstanceId(name);
                placeholder.setAttribute('data-component', instanceId);
            }
            // Save placeholder for reversion in the map
            if (!placeholderMap.has(instanceId)) {
                const clone = placeholder.cloneNode(true);
                clone.setAttribute('data-original-placeholder', '');
                clone.setAttribute('data-component', instanceId);
                placeholderMap.set(instanceId, clone);
            }
            // Log before swap
            logSiblings(placeholder.parentNode, `Before swapIn for ${instanceId}`);
            // Process and swap in source code, passing instanceId
            await processor.processComponent(placeholder, instanceId);
            swappedInstances.add(instanceId);
            // Track the route for this instance
            const xRoute = placeholder.getAttribute('x-route');
            instanceRouteMap.set(instanceId, xRoute);
            // Log after swap
            logSiblings(placeholder.parentNode || document.body, `After swapIn for ${instanceId}`);
        },
        // Revert to placeholder
        revert(instanceId) {
            if (!swappedInstances.has(instanceId)) return;
            // Remove all elements with data-component=instanceId
            const rendered = Array.from(document.querySelectorAll(`[data-component="${instanceId}"]`));
            if (rendered.length === 0) return;
            const first = rendered[0];
            const parent = first.parentNode;
            // Retrieve the original placeholder from the map
            const placeholder = placeholderMap.get(instanceId);
            // Log before revert
            logSiblings(parent, `Before revert for ${instanceId}`);
            // Remove all rendered elements
            rendered.forEach(el => {
                el.remove();
            });
            // Restore the placeholder at the correct position if not present
            if (placeholder && parent && !parent.contains(placeholder)) {
                const targetPosition = parseInt(placeholder.getAttribute('data-order')) || 0;
                let inserted = false;

                // Find the correct position based on data-order
                for (let i = 0; i < parent.children.length; i++) {
                    const child = parent.children[i];
                    const childPosition = parseInt(child.getAttribute('data-order')) || 0;

                    if (targetPosition < childPosition) {
                        parent.insertBefore(placeholder, child);
                        inserted = true;
                        break;
                    }
                }

                // If not inserted (should be at the end), append to parent
                if (!inserted) {
                    parent.appendChild(placeholder);
                }

            }
            swappedInstances.delete(instanceId);
            instanceRouteMap.delete(instanceId);
            placeholderMap.delete(instanceId);
            // Log after revert
            logSiblings(parent, `After revert for ${instanceId}`);
        },
        // Main swapping logic
        async processAll(normalizedPathFromEvent = null) {
            componentInstanceCounters = {};
            const registry = window.ManifestComponentsRegistry;
            if (!registry) return;
            const routing = window.ManifestRouting;

            // Use normalized path from event if provided, otherwise compute from window.location
            let normalizedPath;
            if (normalizedPathFromEvent !== null) {
                normalizedPath = normalizedPathFromEvent;
            } else {
                const currentPath = window.location.pathname;
                normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');
            }

            const placeholders = Array.from(document.querySelectorAll('*')).filter(el =>
                el.tagName.toLowerCase().startsWith('x-') &&
                !el.hasAttribute('data-pre-rendered') &&
                !el.hasAttribute('data-processed')
            );
            // First pass: revert any swapped-in instances that no longer match
            if (routing) {
                for (const instanceId of Array.from(swappedInstances)) {
                    const xRoute = instanceRouteMap.get(instanceId);
                    if (!xRoute) {
                        // No route condition means always visible, don't revert
                        continue;
                    }
                    // Parse route conditions the same way as route visibility
                    const conditions = xRoute.split(',').map(cond => cond.trim());
                    const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
                    const negativeConditions = conditions
                        .filter(cond => cond.startsWith('!'))
                        .map(cond => cond.slice(1));

                    const hasNegativeMatch = negativeConditions.some(cond =>
                        window.ManifestRouting.matchesCondition(normalizedPath, cond)
                    );
                    const hasPositiveMatch = positiveConditions.length === 0 || positiveConditions.some(cond =>
                        window.ManifestRouting.matchesCondition(normalizedPath, cond)
                    );

                    const matches = hasPositiveMatch && !hasNegativeMatch;
                    if (!matches) {
                        this.revert(instanceId);
                    }
                }
            }
            // Second pass: swap in any placeholders that match
            for (const placeholder of placeholders) {
                const name = placeholder.tagName.toLowerCase().replace('x-', '');
                let instanceId = placeholder.getAttribute('data-component');
                if (!instanceId) {
                    instanceId = getComponentInstanceId(name);
                    placeholder.setAttribute('data-component', instanceId);
                }
                const xRoute = placeholder.getAttribute('x-route');
                if (!routing) {
                    // No routing: always swap in
                    await this.swapIn(placeholder);
                } else {
                    // Routing present: check route using same logic as route visibility
                    // Handle comma-separated route conditions (e.g., "/,page-1,page-2")
                    let matches = !xRoute;
                    if (xRoute) {
                        const conditions = xRoute.split(',').map(cond => cond.trim());
                        const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
                        const negativeConditions = conditions
                            .filter(cond => cond.startsWith('!'))
                            .map(cond => cond.slice(1));

                        // Check negative conditions first
                        const hasNegativeMatch = negativeConditions.some(cond =>
                            window.ManifestRouting.matchesCondition(normalizedPath, cond)
                        );

                        // Check positive conditions
                        const hasPositiveMatch = positiveConditions.length === 0 || positiveConditions.some(cond =>
                            window.ManifestRouting.matchesCondition(normalizedPath, cond)
                        );

                        matches = hasPositiveMatch && !hasNegativeMatch;
                    }

                    if (matches) {
                        await this.swapIn(placeholder);
                    }
                }
            }
        },
        initialize() {
            // On init, process all
            this.processAll().then(() => {
                // Dispatch event when components are fully processed
                window.dispatchEvent(new CustomEvent('manifest:components-processed'));
            });
            // If routing is present, listen for route changes
            if (window.ManifestRouting) {
                window.addEventListener('manifest:route-change', (event) => {
                    // Use normalized path from event detail if available
                    const normalizedPath = event.detail?.normalizedPath || null;
                    this.processAll(normalizedPath).then(() => {
                        // Dispatch event when components are fully processed after route change
                        window.dispatchEvent(new CustomEvent('manifest:components-processed'));
                    });
                });
            }
        }
    };
})(); 