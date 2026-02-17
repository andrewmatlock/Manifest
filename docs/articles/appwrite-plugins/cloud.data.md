# Cloud Data

Access Appwrite databases and storage buckets using the same `$x` magic method pattern as [local data](/core-plugins/local-data) sources.

---

## Setup

Complete the [Appwrite setup](/appwrite-plugins/appwrite-setup) steps to connect your Appwrite and Manifest projects.

Add the Appwrite SDK and `manifest.js` scripts to the HTML head. `manifest.json` is also required for Appwrite credentials and register database tables or storage buckets.

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
    data-plugins="appwrite-data"></script>
```

</x-code-group>

::: brand icon="lucide:info"
If the Manifest script uses selective loading but omits the core `data` plugin (with its `$x` magic method), it will be auto loaded to enable Appwrite database and storage operations in the frontend.
:::

---

## Overview

Appwrite's cloud data sources work identically to local data sources in the frontend, using the same `$x` magic method syntax. The plugin automatically handles authentication, permissions, and realtime updates.

**Key Features:**
- **Unified Syntax**: Same `$x.sourceName` pattern for databases, storage, and local files
- **Realtime Updates**: Changes sync automatically across all active sessions
- **Permission-Aware**: Respects Appwrite permissions and scopes
- **CRUD Operations**: Create, read, update, and delete using intuitive methods
- **Team Scoping**: Automatically scope queries by team, user, or role

---

## Next Steps

Complete cloud data support using the guides for:

- [Databases](/appwrite-plugins/databases) of cloud-hosted content
- [Storage](/appwrite-plugins/storage) of cloud-hosted files
