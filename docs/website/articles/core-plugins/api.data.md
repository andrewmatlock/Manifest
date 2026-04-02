# API Data Sources

Connect to external REST and GraphQL APIs to load data into your Manifest project using the same `$x` magic method pattern as [local data](/core-plugins/local-data) sources.

---

## Overview

API data sources extend the core data plugin to fetch data from external HTTP endpoints. They work identically to local data sources, allowing you to display and manage API data in your UI using the same `$x.sourceName` syntax.

**Current Status:**
- **Basic Support**: Read-only API fetching is available in the core data plugin
- **Future Plugin**: Full CRUD operations and advanced features will be available via `manifest.api.data.js` plugin (planned)

**Planned Features:**
- **Unified Syntax**: Same `$x.sourceName` pattern as local files and Appwrite databases
- **CRUD Operations**: Create, read, update, and delete using `$create`, `$update`, `$delete` methods
- **Environment Variables**: Secure API key management via `${VARIABLE_NAME}` interpolation
- **Flexible Configuration**: Support for headers, query parameters, request bodies, and data transformation
- **Error Handling**: Graceful fallback with `defaultValue` on API failures
- **Real-Time Updates**: WebSocket/SSE support for live data synchronization (planned)

**Current Limitations:**
- **Read-Only**: Only GET requests are fully supported (POST/PUT/DELETE methods are accepted but request bodies are not supported)
- **No CRUD Operations**: Cannot create, update, or delete data (planned for future plugin)
- **No Real-Time Updates**: Data loads once on access (no automatic refresh)
- **No Authentication Refresh**: Tokens must be managed manually

For full CRUD operations and real-time updates with built-in security, consider [Appwrite databases](/appwrite-plugins/cloud.data.databases).

---

## Setup

### Current: Basic API Support

Basic read-only API support is included in the core data plugin. No additional setup is required beyond the standard [data plugin setup](/core-plugins/local-data#setup).

### Future: Full API Plugin

When available, the `manifest.api.data.js` plugin will extend the core data plugin with full CRUD operations:

```html "Future Setup (Planned)"
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"
    data-plugins="data"
    data-api="data"></script>
```

The API plugin will require the core data plugin (`data-plugins="data"`) to provide the `$x` magic method infrastructure.

---

## Basic Configuration

Only the `url` property is mandatory. Register API sources in your `manifest.json` under the `data` property:

```json "manifest.json" copy
{
    "data": {
        "users": {
            "url": "${API_BASE_URL}/users"
        }
    }
}
```

Environment variables are interpolated from `process.env` (build-time) or `window.env` (runtime). Variables not found are left as-is (e.g., `${UNKNOWN_VAR}` remains unchanged).

**Example `.env` file:**
```env ".env"
API_BASE_URL=https://api.myapp.com
API_TOKEN=sk_1234567890abcdef
```

---

## Authentication

Most APIs require authentication headers. The header names and values depend on the specific API:

```json "manifest.json" copy
{
    "data": {
        "users": {
            "url": "${API_BASE_URL}/users",
            "headers": {
                "Authorization": "Bearer ${API_TOKEN}",
                "Content-Type": "application/json"
            }
        }
    }
}
```

::: brand icon="lucide:info"
Header names and authentication formats vary by API. Common patterns include `Authorization: Bearer`, `X-API-Key`, or custom headers. Check your API's documentation for the correct format.
:::

---

## Advanced Configuration

All properties except `url` are optional:

```json "manifest.json" copy
{
    "data": {
        "products": {
            "url": "${API_BASE_URL}/products",
            "method": "GET",
            "headers": {
                "Authorization": "Bearer ${API_TOKEN}",
                "Content-Type": "application/json"
            },
            "params": {
                "limit": 100,
                "status": "active"
            },
            "transform": "data.products",
            "defaultValue": []
        }
    }
}
```

### Configuration Options

| Property | Required | Default | Description |
|----------|----------|---------|-------------|
| **`url`** | Yes | - | API endpoint URL (supports `${VARIABLE}` interpolation) |
| **`method`** | No | `GET` | HTTP method (GET, POST, PUT, DELETE) |
| **`headers`** | No | `{}` | Request headers for authentication and content type |
| **`params`** | No | `{}` | Query parameters (added to URL for GET requests) |
| **`transform`** | No | - | Extract nested data using dot notation (e.g., "data.products") |
| **`defaultValue`** | No | `[]` | Fallback data if API request fails |

**Note:** The `transform` property uses dot notation to extract nested data from the API response. For example, if your API returns `{ data: { products: [...] } }`, use `transform: "data.products"` to extract the products array.

---

## Common API Patterns

### Generic REST API

```json "manifest.json" copy
{
    "data": {
        "products": {
            "url": "${API_BASE_URL}/products",
            "headers": {
                "Authorization": "Bearer ${API_TOKEN}"
            },
            "params": {
                "limit": 50,
                "sort": "name"
            }
        }
    }
}
```

### GraphQL API

```json "manifest.json" copy
{
    "data": {
        "posts": {
            "url": "${GRAPHQL_ENDPOINT}",
            "method": "POST",
            "headers": {
                "Authorization": "Bearer ${API_TOKEN}",
                "Content-Type": "application/json"
            },
            "params": {
                "query": "query { posts { id title content } }"
            }
        }
    }
}
```

**Note:** GraphQL queries are sent as query parameters. For POST requests with a request body, you'll need to use a custom loader (see [Custom Integrations](#custom-integrations) below).

### API with Nested Response

```json "manifest.json" copy
{
    "data": {
        "products": {
            "url": "${API_BASE_URL}/products",
            "headers": {
                "Authorization": "Bearer ${API_TOKEN}"
            },
            "transform": "data.products",
            "defaultValue": []
        }
    }
}
```

If your API returns `{ data: { products: [...] } }`, the `transform` property extracts the nested array.

---

## Display Content

API data sources work identically to local data sources. Access them using the `$x` magic method:

```html copy
<!-- Display all users -->
<template x-for="user in $x.users" :key="user.id">
    <div>
        <h3 x-text="user.name"></h3>
        <p x-text="user.email"></p>
    </div>
</template>

<!-- Display single item -->
<div x-text="$x.products[0].name"></div>

<!-- Use array methods -->
<template x-for="product in $x.products.filter(p => p.active)" :key="product.id">
    <div x-text="product.name"></div>
</template>
```

See [local data display content](/core-plugins/local-data#display-content) for more examples of displaying data in your UI.

---

## State Properties

API data sources expose state properties for UI reactivity:

- `$x.sourceName.$loading` - Boolean indicating if data is loading
- `$x.sourceName.$error` - Error message string (null if no error)
- `$x.sourceName.$ready` - Boolean indicating if data has loaded successfully

```html copy
<!-- Loading state -->
<div x-show="$x.users.$loading">Loading users...</div>

<!-- Error state -->
<div x-show="$x.users.$error" x-text="$x.users.$error" class="text-error"></div>

<!-- Ready state -->
<div x-show="$x.users.$ready && !$x.users.$loading">
    Users loaded: <b x-text="$x.users.length"></b>
</div>
```

---

## Error Handling

If an API request fails, the plugin will:

1. Log the error to the console
2. Return the `defaultValue` (defaults to `[]` if not specified)
3. Set `$x.sourceName.$error` with the error message
4. Set `$x.sourceName.$ready` to `false`

Always provide a sensible `defaultValue` to prevent UI errors:

```json "manifest.json" copy
{
    "data": {
        "products": {
            "url": "${API_BASE_URL}/products",
            "defaultValue": [],
            "headers": {
                "Authorization": "Bearer ${API_TOKEN}"
            }
        }
    }
}
```

---

## Future: CRUD Operations

When the `manifest.api.data.js` plugin is available, API data sources will support full CRUD operations similar to Appwrite databases:

```html "Future Usage (Planned)"
<!-- Create -->
<button @click="$x.products.$create({ name: 'New Product', price: 99.99 })">
    Create Product
</button>

<!-- Update -->
<button @click="$x.products.$update(productId, { price: 89.99 })">
    Update Price
</button>

<!-- Delete -->
<button @click="$x.products.$delete(productId)">
    Delete Product
</button>

<!-- Query with filters -->
<button @click="$x.products.$query([['equal', 'status', 'active']])">
    Load Active Products
</button>
```

The API plugin will extend the core data plugin's `$x` magic method to add these operations, following the same pattern as the Appwrite plugin.

## Custom Integrations

For APIs that require custom logic (e.g., OAuth flows, WebSocket connections, complex authentication), you can extend the data plugin by registering a custom loader. This is an advanced use case that may require plugin development.

**Note:** When the `manifest.api.data.js` plugin is available, it will provide a more standardized way to handle custom API integrations.

---

## Best Practices

1. **Store API keys securely**: Never commit `.env` files to version control. Use environment variables for all sensitive data.

2. **Provide sensible defaults**: Always set `defaultValue` to prevent UI errors when APIs fail.

3. **Handle loading states**: Use `$loading`, `$error`, and `$ready` properties to provide user feedback.

4. **Use transform for nested data**: If your API wraps data in a response object, use `transform` to extract it.

5. **Consider caching**: API data sources cache responses in memory. For frequently changing data, you may need to implement custom refresh logic.

6. **For production use**: Consider [Appwrite databases](/appwrite-plugins/cloud.data.databases) for full CRUD operations, real-time updates, and built-in security. The `manifest.api.data.js` plugin (planned) will provide similar capabilities for third-party APIs.

---

## Architecture

API data support follows the same extension pattern as other Manifest plugins:

- **Core Data Plugin** (`manifest.data.js`): Provides basic read-only API fetching and the `$x` magic method infrastructure
- **API Data Plugin** (`manifest.api.data.js` - planned): Extends core with full CRUD operations, request body support, and advanced features
- **Appwrite Plugin** (`manifest.appwrite.data.js`): Extends core with Appwrite-specific features (CRUD, real-time, scoping)

This modular architecture allows the core plugin to remain lightweight while enabling powerful extensions for specific use cases.

---

## Next Steps

- Learn about [local data sources](/core-plugins/local-data) for static content
- Explore [Appwrite databases](/appwrite-plugins/cloud.data.databases) for full cloud data management
- See [localization](/core-plugins/localization) for multilingual API data
