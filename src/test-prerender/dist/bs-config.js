module.exports = {
    server: {
        baseDir: "./",
        routes: {
            "/scripts": "./scripts"
        },
        middleware: function (req, res, next) {
            // Set proper MIME types for assets
            if (req.url.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript');
            } else if (req.url.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css');
            } else if (req.url.endsWith('.json')) {
                res.setHeader('Content-Type', 'application/json');
            } else if (req.url.endsWith('.html')) {
                res.setHeader('Content-Type', 'text/html');
            } else if (req.url.endsWith('.ico')) {
                res.setHeader('Content-Type', 'image/x-icon');
            } else if (req.url.endsWith('.png')) {
                res.setHeader('Content-Type', 'image/png');
            } else if (req.url.endsWith('.jpg') || req.url.endsWith('.jpeg')) {
                res.setHeader('Content-Type', 'image/jpeg');
            } else if (req.url.endsWith('.svg')) {
                res.setHeader('Content-Type', 'image/svg+xml');
            } else if (req.url.endsWith('.xml')) {
                res.setHeader('Content-Type', 'application/xml');
            } else if (req.url.endsWith('.txt')) {
                res.setHeader('Content-Type', 'text/plain');
            }

            // Handle SPA routing - only for non-asset requests
            const url = req.url;
            const urlWithoutQuery = url.split('?')[0]; // Remove query parameters for checking

            // Always allow asset requests to pass through unchanged
            if (urlWithoutQuery.includes('.') && urlWithoutQuery !== '/') {
                return next();
            }

            // Always allow root path
            if (url === '/' || url === '') {
                return next();
            }

            // Always allow API and special paths
            if (url.startsWith('/api/') ||
                url.startsWith('/_') ||
                url.includes('browser-sync')) {
                return next();
            }

            // For all other routes (SPA routes), serve index.html
            req.url = '/';
            return next();
        }
    },
    files: ["**/*.html", "**/*.js", "**/*.css", "**/*.json", "**/*.yaml", "**/*.md"],
    open: true,
    notify: false,
    port: 5001,
    single: true,
    ghostMode: false
};