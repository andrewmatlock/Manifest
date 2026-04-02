// Utilities initialization
// Initialize compiler and set up event listeners

// Initialize immediately without waiting for DOMContentLoaded
const compiler = new TailwindCompiler();

// Expose utilities compiler for optional integration
window.ManifestUtilities = compiler;

// Log when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // DOM ready
    });
} else {
    // DOM already ready
}

// Log first paint if available
if ('PerformanceObserver' in window) {
    try {
        const paintObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
            }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
        // PerformanceObserver might not be available
    }
}

// Also handle DOMContentLoaded for any elements that might be added later
document.addEventListener('DOMContentLoaded', () => {
    if (!compiler.isCompiling) {
        compiler.compile();
    }
});

