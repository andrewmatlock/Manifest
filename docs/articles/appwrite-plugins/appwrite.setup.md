# Appwrite Setup

Use <a href="https://appwrite.io/" target="_blank" rel="noopener">Appwrite</a> to turn Manifest projects into production-ready applications.

---

## Overview

Appwrite provides turnkey backend infrastructure, available <a href="https://github.com/appwrite/appwrite" target="_blank">open source</a> or <a href="https://appwrite.io/" target="_blank">cloud hosted</a> with a generous free tier. Together with Manifest you can quickly generate feature-complete applications including user authentication, databases, storage, and realtime presence detection.

---

## Appwrite Setup

Establish a project with any name and region in <a href="https://appwrite.io/" target="_blank" rel="noopener">Appwrite</a>. Once created you'll access the project console:

::: frame
<img src="/assets/examples/appwrite.overview.webp" alt="Appwrite project"/>
:::

---

### Credentials

Your Manifest project will need the Appwrite project's <b>Project ID</b> and <b>API Endpoint</b> to connect. Get them from the Appwrite project's general <b>Settings</b>, under API credentials:

::: frame
<img src="/assets/examples/appwrite.credentials.webp" alt="Appwrite credentials"/>
:::

---

### Dev Key

An optional <b>Dev Key</b> can also be used during Manifest project development to bypass Appwrite's rate limits. It should not be included in production. Get one from <b>Overview</b> > <b>Dev keys</b>:

::: frame
<img src="/assets/examples/appwrite.devkey.webp" alt="Appwrite dev key"/>
:::

---

## Manifest Setup

### Scripts

Add the Appwrite SDK and `manifest.js` scripts to the HTML head. `manifest.json` is also required to register Appwrite credentials and data sources.

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
    data-plugins="appwrite-auth,appwrite-data,appwrite-persistence"></script>
```

</x-code-group>

If Appwrite plugins are not declared in a `data-*` attribute but Appwrite credentials are listed in `manifest.json` below, all Appwrite plugins will be auto loaded. The supporting core data plugin will also be loaded whether or not it's declared.

---

### manifest.json

Appwrite credentials are public and safe to expose client-side.

Add the Appwrite project credentials detailed [above](#credentials) to `manifest.json`, under an `appwrite` property. These credentials are used by any other objects in the manifest that reference Appwrite, like database or storage sources.

```json "manifest.json" numbers copy
{
    "appwrite": {
        "projectId": "your-project-id",
        "endpoint": "your-API-endpoint",
        "devKey": "your-dev-key",
    }
}
```

Alternatively, credentials can be added directly into specific [database](/core-plugins/appwrite-plugins/databases) or [storage](/core-plugins/appwrite-plugins/storage) sources, declared within the `data` object.

```json "manifest.json" numbers copy
{
    "data": {
        "projects": {
            "projectId": "your-project-id",
            "endpoint": "your-API-endpoint",
            "appwriteDatabaseId": "your-database-id",
            "appwriteTableId": "your-table-id"
        },
        "assets": {
            "projectId": "your-project-id",
            "endpoint": "your-API-endpoint",
            "appwriteBucketId": "your-bucket-id"
        },
        "other-content": "/local/whatever.csv"
    }
}
```

If credentials are declared in both `appwrite` and `data` objects, the `data` credentials take precedence for their own items.

---

## Next Steps

After a successful setup above, your Manifest project should be paired with your Appwrite project(s). Proceed to configuring:

- [Users](/appwrite-plugins/users) or [Teams](/appwrite-plugins/teams)
- [Databases](/appwrite-plugins/databases) or [Storage](/appwrite-plugins/storage)
- [Presence](/appwrite-plugins/presence) detection for live users