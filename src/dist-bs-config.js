// BrowserSync config for serving the prerendered dist/ output as an MPA.
// Deliberately has NO SPA fallback — each route must have its own index.html,
// exactly like Appwrite static hosting in production.
module.exports = {
    server: {
        baseDir: "./test-prerender",
        middleware: function (req, res, next) {
            if (req.url.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
            else if (req.url.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
            else if (req.url.endsWith('.json')) res.setHeader('Content-Type', 'application/json');
            else if (req.url.endsWith('.html')) res.setHeader('Content-Type', 'text/html');
            return next();
        }
    },
    files: ["./test-prerender/**/*.html", "./test-prerender/**/*.css", "./test-prerender/**/*.js"],
    open: false,
    notify: false,
    port: 5003,
    ghostMode: false
};
