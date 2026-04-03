/* Manifest Data Sources - Magic Method $files Handler */
// Handles $files method for reactive file arrays

/**
 * Create $files method for a data source
 * @param {string} dataSourceName - Name of the data source (table)
 * @returns {Function} $files method function
 */
function createFilesMethod(dataSourceName) {
    return function (entryIdOrGetter, bucketName, columnName) {
        // Check if first argument is a function (reactive getter)
        if (typeof entryIdOrGetter === 'function') {
            const createReactiveFileArrayFromGetter = window.ManifestDataProxiesFiles?.createReactiveFileArrayFromGetter;
            return createReactiveFileArrayFromGetter
                ? createReactiveFileArrayFromGetter(dataSourceName, entryIdOrGetter, bucketName, columnName)
                : [];
        }

        // Direct value (backward compatible)
        const entryId = entryIdOrGetter;
        const manifest = window.ManifestDataConfig?.getManifest?.();

        if (!manifest?.data) {
            // Return empty array proxy if manifest not ready
            return new Proxy([], {
                get(target, key) {
                    if (key === '$loading') return true;
                    if (key === '$error') return null;
                    if (key === '$reload') return () => { };
                    if (key === Symbol.iterator) return function* () { };
                    if (key in target) {
                        const value = target[key];
                        return typeof value === 'function' ? value.bind(target) : value;
                    }
                    return undefined;
                }
            });
        }

        const tableDataSource = manifest.data[dataSourceName];
        if (!tableDataSource || !window.ManifestDataConfig.getAppwriteTableId(tableDataSource)) {
            throw new Error(`[Manifest Data] "${dataSourceName}" is not an Appwrite table`);
        }

        if (!entryId) {
            // Return empty array proxy if entryId not provided yet
            return new Proxy([], {
                get(target, key) {
                    if (key === '$loading') return false;
                    if (key === '$error') return null;
                    if (key === '$reload') return () => { };
                    if (key === Symbol.iterator) return function* () { };
                    if (key in target) {
                        const value = target[key];
                        return typeof value === 'function' ? value.bind(target) : value;
                    }
                    return undefined;
                }
            });
        }

        // Determine bucket name
        let resolvedBucketName = bucketName;
        if (!resolvedBucketName) {
            const getDefaultBucketForTable = window.ManifestDataProxiesFiles?.getDefaultBucketForTable;
            if (getDefaultBucketForTable) {
                resolvedBucketName = getDefaultBucketForTable(dataSourceName);
            }
            if (!resolvedBucketName) {
                throw new Error(`[Manifest Data] Multiple storage buckets configured for "${dataSourceName}". Please specify bucket name: $x.${dataSourceName}.$files(entryId, 'bucketName')`);
            }
        }

        // Get column name from config or use default
        const parseStorageConfig = window.ManifestDataProxiesFiles?.parseStorageConfig;
        if (!parseStorageConfig) {
            throw new Error('[Manifest Data] File management functions not available');
        }
        const storageConfig = parseStorageConfig(tableDataSource, resolvedBucketName);
        if (!storageConfig) {
            throw new Error(`[Manifest Data] Storage bucket "${resolvedBucketName}" not configured for table "${dataSourceName}"`);
        }

        const resolvedColumnName = columnName || storageConfig.column || 'fileIds';

        // SINGLE SOURCE OF TRUTH: Create computed files array that filters bucket by fileIds
        const createComputedFilesArray = window.ManifestDataProxiesFiles?.createComputedFilesArray;
        if (!createComputedFilesArray) {
            throw new Error('[Manifest Data] File management functions not available');
        }
        const computedFiles = createComputedFilesArray(dataSourceName, entryId, resolvedBucketName, resolvedColumnName);

        // Return computed array (already has $loading and $error properties via proxy)
        return computedFiles;
    };
}

// Export functions to window for use by other subscripts
if (!window.ManifestDataProxiesMagic) {
    window.ManifestDataProxiesMagic = {};
}
window.ManifestDataProxiesMagic.createFilesMethod = createFilesMethod;

