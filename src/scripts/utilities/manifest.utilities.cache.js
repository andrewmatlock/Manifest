// Cache management
// Methods for loading, saving, and managing cached utilities

// Load and apply cached utilities
TailwindCompiler.prototype.loadAndApplyCache = function () {
    const cacheStart = performance.now();
    try {
        const cached = localStorage.getItem('tailwind-cache');
        if (cached) {
            const parsed = JSON.parse(cached);
            this.cache = new Map(Object.entries(parsed));

            // Try to find the best matching cache entry
            // First, try to get a quick scan of current classes
            let currentClasses = new Set();
            try {
                // Quick scan of HTML source for classes
                if (document.documentElement) {
                    const htmlSource = document.documentElement.outerHTML;
                    const classRegex = /class=["']([^"']+)["']/gi;
                    let classMatch;
                    while ((classMatch = classRegex.exec(htmlSource)) !== null) {
                        const classes = classMatch[1].split(/\s+/).filter(Boolean);
                        classes.forEach(cls => {
                            if (!cls.startsWith('x-') && !cls.startsWith('$')) {
                                currentClasses.add(cls);
                            }
                        });
                    }
                }
            } catch (e) {
                // If HTML parsing fails, just use most recent
            }

            let bestMatch = null;
            let bestScore = 0;

            // Score cache entries by how many classes they match
            if (currentClasses.size > 0) {
                for (const [key, value] of this.cache.entries()) {
                    // Extract classes from cache key (format: "class1,class2-themeHash")
                    // Find the last occurrence of '-' followed by 8 chars (theme hash length)
                    const lastDashIndex = key.lastIndexOf('-');
                    const classesPart = lastDashIndex > 0 ? key.substring(0, lastDashIndex) : key;
                    const cachedClasses = classesPart ? classesPart.split(',') : [];
                    const cachedSet = new Set(cachedClasses);

                    // Count how many current classes are in cache
                    let matches = 0;
                    for (const cls of currentClasses) {
                        if (cachedSet.has(cls)) {
                            matches++;
                        }
                    }

                    // Score based on match ratio and recency
                    const matchRatio = matches / currentClasses.size;
                    const recencyScore = (Date.now() - value.timestamp) / (24 * 60 * 60 * 1000); // Days since cache
                    const score = matchRatio * 0.7 + (1 - Math.min(recencyScore, 1)) * 0.3; // 70% match, 30% recency

                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = value;
                    }
                }
            }

            // Use best match, or fall back to most recent
            const cacheToUse = bestMatch || Array.from(this.cache.entries())
                .sort((a, b) => b[1].timestamp - a[1].timestamp)[0]?.[1];

            if (cacheToUse && cacheToUse.css) {
                const applyCacheStart = performance.now();
                this.styleElement.textContent = cacheToUse.css;
                this.ensureUtilityStylesLast();
                this.scheduleEnsureUtilityStylesLast();
                this.lastThemeHash = cacheToUse.themeHash;

                // Also apply cache to critical style element
                // Extract utilities from @layer utilities block and apply directly (no @layer)
                if (this.criticalStyleElement && !this.criticalStyleElement.textContent) {
                    let criticalCss = cacheToUse.css;
                    // Remove @layer utilities wrapper if present
                    criticalCss = criticalCss.replace(/@layer\s+utilities\s*\{/g, '').replace(/\}\s*$/, '').trim();
                    if (criticalCss) {
                        this.criticalStyleElement.textContent = criticalCss;
                    }
                }

                // Don't clear critical styles yet - keep them until full compilation completes
            }
        }
    } catch (error) {
        // Silently fail - cache is optional
    }
};

// Save cache to localStorage
TailwindCompiler.prototype.savePersistentCache = function () {
    try {
        const serialized = JSON.stringify(Object.fromEntries(this.cache));
        localStorage.setItem('tailwind-cache', serialized);
    } catch (error) {
        console.warn('Failed to save cached styles:', error);
    }
};

// Load cache from localStorage
TailwindCompiler.prototype.loadPersistentCache = function () {
    try {
        const cached = localStorage.getItem('tailwind-cache');
        if (cached) {
            const parsed = JSON.parse(cached);
            this.cache = new Map(Object.entries(parsed));
        }
    } catch (error) {
        console.warn('Failed to load cached styles:', error);
    }
};

// Generate a hash of the theme variables to detect changes
TailwindCompiler.prototype.generateThemeHash = function (themeCss) {
    // Use encodeURIComponent to handle non-Latin1 characters safely
    return encodeURIComponent(themeCss).slice(0, 8); // Simple hash of theme content
};

// Clean up old cache entries
TailwindCompiler.prototype.cleanupCache = function () {
    const now = Date.now();
    const maxAge = this.options.maxCacheAge;
    const entriesToDelete = [];

    for (const [key, value] of this.cache.entries()) {
        if (value.timestamp && (now - value.timestamp > maxAge)) {
            entriesToDelete.push(key);
        }
    }

    for (const key of entriesToDelete) {
        this.cache.delete(key);
    }

    if (entriesToDelete.length > 0) {
        this.savePersistentCache();
    }
};

