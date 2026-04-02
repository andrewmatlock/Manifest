# Auth

Implement a complete authentication solution for your app with a connected <a href="https://appwrite.io/" target="_blank" rel="noopener">Appwrite</a> project.

---

## Setup

Complete the [Appwrite setup](/appwrite-plugins/appwrite-setup) steps to connect your Appwrite and Manifest projects.

Add the Appwrite SDK and `manifest.js` scripts to the HTML head. `manifest.json` is also required for Appwrite credentials and configuring auth details.

<x-code-group copy>

```html "All Plugins (default)"
<!-- Meta -->
<link rel="manifest" href="/manifest.json">

<!-- Scripts -->
<script src="https://cdn.jsdelivr.net/npm/appwrite@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"></script>
```

```html "Selective"
<!-- Meta -->
<link rel="manifest" href="/manifest.json">

<!-- Scripts -->
<script src="https://cdn.jsdelivr.net/npm/appwrite@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"
    data-plugins="appwrite-auth"></script>
```

</x-code-group>

---

## Next Steps

Complete authentication support using the guides for:

- [Users](/appwrite-plugins/users)
- [Teams](/appwrite-plugins/teams) (optional)