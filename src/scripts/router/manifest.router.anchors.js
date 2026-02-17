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
