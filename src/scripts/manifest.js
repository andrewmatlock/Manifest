/*  Manifest JS
/*  By Andrew Matlock under MIT license
/*  https://manifestjs.org
/*
/*  Lightweight loader that dynamically loads Alpine.js and Manifest plugins
/*  from jsDelivr CDN. Loads all plugins by default, or a subset if specified.
/*
/*  Some plugins use Manifest CSS styles.
*/

(function () {
	'use strict';

	// Configuration
	const DEFAULT_VERSION = 'latest';
	const ALPINE_CDN_URL = 'https://cdn.jsdelivr.net/npm/alpinejs/dist/cdn.min.js';

	// Get base URL for a given version
	function getBaseUrl(version = DEFAULT_VERSION) {
		return `https://cdn.jsdelivr.net/npm/mnfst@${version}/dist`;
	}

	// Available core plugins (auto-loaded if no data-plugins specified)
	const AVAILABLE_PLUGINS = [
		'components',
		'router',
		'utilities',
		'data',
		'icons',
		'localization',
		'markdown',
		'code',
		'themes',
		'toasts',
		'tooltips',
		'dropdowns',
		'tabs',
		'slides',
		'resize'
	];

	// Appwrite integration plugins (opt-in only, never auto-loaded)
	const APPWRITE_PLUGINS = [
		'appwrite-auth',
		'appwrite-data',
		'appwrite-presence'
	];

	// Plugin dependencies: plugins that require other plugins to be loaded first
	const PLUGIN_DEPENDENCIES = {
		'appwrite-data': ['data'],
		'appwrite-presence': ['data']
	};

	// Derive default plugin list from manifest (only load data/localization/components when manifest needs them)
	function getDefaultPluginsFromManifest(manifest) {
		if (!manifest || typeof manifest !== 'object') {
			return AVAILABLE_PLUGINS.slice();
		}
		const hasData = manifest.data && typeof manifest.data === 'object' && Object.keys(manifest.data).length > 0;
		const hasComponents = (manifest.components?.length > 0) || (manifest.preloadedComponents?.length > 0);
		const hasLocalization = (() => {
			if (!manifest.data || typeof manifest.data !== 'object') return false;
			for (const collection of Object.values(manifest.data)) {
				if (!collection || typeof collection !== 'object') continue;
				if (typeof collection.locales === 'string') return true;
				for (const key of Object.keys(collection)) {
					if (['url', 'headers', 'params', 'transform', 'defaultValue', 'locales'].includes(key)) continue;
					if (/^[a-zA-Z]{2}(-[a-zA-Z]{2})?$/.test(key)) return true;
				}
			}
			return false;
		})();
		return AVAILABLE_PLUGINS.filter(p => {
			if (p === 'data') return hasData;
			if (p === 'localization') return hasLocalization;
			if (p === 'components') return hasComponents;
			return true;
		});
	}

	// Get plugin URL from CDN
	function getPluginUrl(pluginName, version = DEFAULT_VERSION) {
		const base = getBaseUrl(version);

		// Handle Appwrite plugin naming (appwrite-auth -> manifest.appwrite.auth.min.js)
		if (pluginName.startsWith('appwrite-')) {
			const appwriteName = pluginName.replace('appwrite-', 'appwrite.');
			return `${base}/manifest.${appwriteName}.min.js`;
		}

		return `${base}/manifest.${pluginName}.min.js`;
	}

	// Load Alpine.js from CDN with defer attribute
	// Alpine waits for DOM to be ready, and by then all plugins are registered
	function loadAlpine() {
		// Fast check: Alpine already initialized
		if (window.Alpine) {
			return;
		}

		// Fallback: Check if script tag exists (Alpine might be loading)
		const existingAlpine = document.querySelector('script[src*="alpine"]');
		if (existingAlpine) {
			return;
		}

		const script = document.createElement('script');
		script.src = ALPINE_CDN_URL;
		script.defer = true; // Critical: defer ensures Alpine waits for DOM and all plugins
		document.head.appendChild(script);
	}

	// Add a script tag to the head and wait for it to load and execute
	function addScript(pluginName, version = DEFAULT_VERSION) {
		return new Promise((resolve, reject) => {
			const url = getPluginUrl(pluginName, version);

			// Check if already loaded
			const existing = document.querySelector(`script[src="${url}"]`);
			if (existing && existing.complete) {
				return resolve();
			}

			const script = document.createElement('script');
			script.src = url;
			script.async = false; // Ensure scripts execute in order
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`Failed to load ${pluginName} from ${url}`));
			document.head.appendChild(script);
		});
	}

	// Resolve plugin dependencies (auto-inject required dependencies)
	function resolveDependencies(pluginList) {
		const resolved = [];
		const added = new Set();

		// Helper to add a plugin and its dependencies in correct order
		function addPluginWithDeps(plugin) {
			if (added.has(plugin)) return;

			// First, add all dependencies
			const deps = PLUGIN_DEPENDENCIES[plugin];
			if (deps) {
				for (const dep of deps) {
					if (!added.has(dep)) {
						addPluginWithDeps(dep);
					}
				}
			}

			// Then add the plugin itself
			resolved.push(plugin);
			added.add(plugin);
		}

		// Process all plugins in order, ensuring dependencies come first
		for (const plugin of pluginList) {
			addPluginWithDeps(plugin);
		}

		return resolved;
	}

	// Detect Appwrite usage from manifest.json (non-blocking, just suggests)
	function detectAppwriteFromManifest() {
		// Check if manifest link exists
		const manifestLink = document.querySelector('link[rel="manifest"]');
		if (!manifestLink) {
			return;
		}

		const manifestUrl = manifestLink.getAttribute('href') || '/manifest.json';

		// Fetch manifest asynchronously (don't block plugin loading)
		fetch(manifestUrl)
			.then(response => response.json())
			.then(manifest => {
				const hasAppwrite = manifest.appwrite ||
					(manifest.data && Object.values(manifest.data).some(
						item => item && typeof item === 'object' &&
							(item.appwriteTableId || item.appwriteDatabaseId || item.appwriteBucketId)
					));

				if (hasAppwrite) {
					const suggestedPlugins = [];
					if (manifest.appwrite?.auth) suggestedPlugins.push('appwrite-auth');
					if (manifest.appwrite || (manifest.data && Object.values(manifest.data).some(
						item => item && typeof item === 'object' && item.appwriteTableId
					))) {
						suggestedPlugins.push('appwrite-data');
					}
					if (manifest.data?.presence?.appwriteTableId) {
						suggestedPlugins.push('appwrite-presence');
					}
				}
			})
			.catch(() => {
				// Silently fail - manifest might not be available yet or CORS issue
			});
	}

	// Parse data attributes
	function parseDataAttributes() {
		// Try to get current script first, then fall back to querySelector
		let script = document.currentScript;
		if (!script) {
			// Look for manifest.js script tag
			script = document.querySelector('script[src*="manifest.js"]');
		}
		if (!script) {
			return null;
		}

		const plugins = script.getAttribute('data-plugins');
		const omit = script.getAttribute('data-omit');
		const tailwind = script.getAttribute('data-tailwind') !== null;
		const version = script.getAttribute('data-version') || DEFAULT_VERSION;

		let pluginList = [];
		const deriveFromManifest = !plugins;

		if (plugins) {
			// Explicit declaration - load only specified plugins (core + Appwrite)
			pluginList = plugins.split(',').map(p => p.trim()).filter(p => p);
		} else {
			// Default: start with all core plugins; loader will trim by manifest when manifest is available
			pluginList = AVAILABLE_PLUGINS.slice();
		}

		// Remove omitted plugins (supports both core and Appwrite plugins)
		if (omit && pluginList.length > 0) {
			const omitted = omit.split(',').map(p => p.trim());
			pluginList = pluginList.filter(p => !omitted.includes(p));
		}

		// Resolve dependencies (auto-inject required plugins)
		pluginList = resolveDependencies(pluginList);

		return {
			plugins: pluginList,
			deriveFromManifest,
			tailwind,
			version
		};
	}

	// Load custom Tailwind CDN script
	function loadTailwind(version = DEFAULT_VERSION) {
		return new Promise((resolve, reject) => {
			const base = getBaseUrl(version);
			const tailwindUrl = `${base}/manifest.tailwind.min.js`;

			// Check if already loaded
			const existing = document.querySelector(`script[src="${tailwindUrl}"]`);
			if (existing && existing.complete) {
				return resolve();
			}

			const script = document.createElement('script');
			script.src = tailwindUrl;
			script.async = false;
			script.onload = () => resolve();
			script.onerror = () => {
				console.warn(`[Manifest Loader] Tailwind plugin not yet published to CDN. Load it directly: <script src="/scripts/tailwind.v4.1.js"></script>`);
				reject(new Error(`Tailwind plugin not available from CDN. Load it directly from your project.`));
			};
			document.head.appendChild(script);
		});
	}

	// Expose API
	window.Manifest = {
		loadPlugin: function (pluginName, version = DEFAULT_VERSION) {
			const allPlugins = [...AVAILABLE_PLUGINS, ...APPWRITE_PLUGINS];
			if (!allPlugins.includes(pluginName)) {
				console.warn(`[Manifest Loader] Unknown plugin: ${pluginName}`);
				return Promise.reject(new Error(`Unknown plugin: ${pluginName}`));
			}

			// Resolve dependencies for single plugin load
			const pluginList = resolveDependencies([pluginName]);

			// Load plugin and its dependencies
			return Promise.all(pluginList.map(plugin => addScript(plugin, version)));
		},
		loadTailwind: loadTailwind,
		getPluginUrl: getPluginUrl
	};

	// Parse config and load plugins
	const config = parseDataAttributes();

	// Detect Appwrite usage from manifest (non-blocking, just suggests)
	detectAppwriteFromManifest();

	if (config && config.plugins.length > 0) {
		const MANIFEST_DEPENDENT_PLUGINS = [
			'data', 'localization', 'components',
			'appwrite-auth', 'appwrite-data', 'appwrite-presence'
		];
		const manifestUrl = (document.querySelector('link[rel="manifest"]')?.getAttribute('href')) || '/manifest.json';

		const loadPlugins = async () => {
			let manifest = null;
			let pluginsToLoad = config.plugins;
			let manifestPromise = null;

			if (config.deriveFromManifest) {
				manifest = await fetch(manifestUrl).then(r => r.ok ? r.json() : null).catch(() => null);
				pluginsToLoad = resolveDependencies(getDefaultPluginsFromManifest(manifest));
			} else {
				const needsManifest = config.plugins.some(p => MANIFEST_DEPENDENT_PLUGINS.includes(p));
				if (needsManifest) {
					manifestPromise = fetch(manifestUrl).then(r => r.ok ? r.json() : null).catch(() => null);
				}
			}

			const pluginPromises = pluginsToLoad.map(pluginName => {
				return addScript(pluginName, config.version).catch(error => {
					console.warn(`[Manifest Loader] Failed to load plugin ${pluginName}:`, error);
				});
			});
			if (config.tailwind) {
				pluginPromises.push(loadTailwind(config.version).catch(() => { }));
			}
			await Promise.all(pluginPromises);
			if (manifestPromise) {
				manifest = await manifestPromise;
			}
			if (manifest && typeof window !== 'undefined') {
				window.__manifestLoaded = manifest;
				if (window.ManifestComponentsRegistry) {
					window.ManifestComponentsRegistry.manifest = manifest;
				}
			}
			loadAlpine();
		};

		loadPlugins();
	}
})();
