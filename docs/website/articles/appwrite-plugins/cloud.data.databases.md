# Databases

Query and manage Appwrite database tables.

---

## Appwrite Configuration

In your Appwrite project's **Databases** dashboard, create a database.

::: frame
<img src="/assets/examples/appwrite.database.webp" alt="Appwrite databases"/>
:::

The database must have at least one table.

::: frame
<img src="/assets/examples/appwrite.table.webp" alt="Appwrite database table"/>
:::

Add columns to the table matching your data structure. Appwrite automatically applies `$id`, `$createdAt`, and `$updatedAt` columns to every table. In the example above, we've established a table that will store ficticious "projects".

::: brand icon="lucide:info"
In a table's **Settings** tab, ensure any permissions required by your frontend user experience (**Create**, **Read**, **Update**, **Delete**) are checked.
:::

---

## Register Database Tables

Register database tables in your `manifest.json` under the `data` property, same as [local data files](/core-plugins/local-data). Include the `appwriteDatabaseId` and `appwriteTableId` values provided by Appwrite.


```json "manifest.json" copy
{
    "data": {
        "projects": {
            "appwriteDatabaseId": "your-database-id",
            "appwriteTableId": "your-table-id"
        }
    },
    "appwrite": {
        "projectId": "your-project-id",
        "endpoint": "your-API-endpoint"
    }
}
```

In this example, the "projects" data source name is arbitrary, used to later reference table content in the frontend. An Appwrite data source will automatically reference the `appwrite` property for credentials.

Alternatively, credentials can be added directly to a data source:

```json "manifest.json" copy
{
    "data": {
        "projects": {
            "projectId": "your-project-id",
            "endpoint": "your-API-endpoint",
            "appwriteDatabaseId": "your-database-id",
            "appwriteTableId": "your-table-id"
        }
    }
}
```

### Scope

Scoping automatically filters queries by user or team, ensuring users only see data they're permitted to access. Configure scope in `manifest.json`:

```json "manifest.json" copy
{
    "data": {
        "projects": {
            "appwriteTableId": "your-table-id",
            "scope": "user"
        }
    }
}
```

Scope options are:

| Scope | Description | Column Used |
|-------|-------------|-------------|
| `"user"` | Single user's data | `userId` |
| `"team"` | Current team's data | `teamId` |
| `"teams"` | All teams user belongs to | `teamId` |
| `["user", "team"]` | User's data OR current team's data | `userId` OR `teamId` |
| `["user", "teams"]` | User's data OR any team's data | `userId` OR `teamId` |

Scope queries are always prepended to user queries, ensuring scope restrictions cannot be bypassed.

When using `["user", "team"]` scope, projects are shown for the current user OR the current team. If no team is selected (`$auth.currentTeam`), only user-scoped projects will display. Use `"teams"` (plural) instead of `"team"` (singular) to query all teams the user belongs to, not just the current team.

::: brand icon="lucide:info"
All interactive examples below require you to be logged into an dummy account via the [users](/appwrite-plugins/users) article. The data entries you generate below use the `team` scope.
:::

---

## Display & Manage Entries

Database tables work identically to local data sources. Access entries using the `$x` magic method and perform all CRUD operations:

::: frame col
<!-- Manage projects for permanent team -->
<div x-data="{ 
    permanentTeam: null,
    newName: ''
}"
x-effect="(async () => {
    if (permanentTeam || !$auth.teams || $auth.teams.length === 0) return;
    for (const team of $auth.teams) {
        if (await $auth.isTeamImmutable(team.$id)) {
            permanentTeam = team;
            $auth.currentTeam = team;
            $auth.viewTeam(team);
            break;
        }
    }
})()">
    
    <div class="col">
        <!-- Create -->
        <div class="row-wrap gap-2 mb-2">
            <input type="text" placeholder="Project name" x-model="newName" :disabled="!$auth.currentTeam" class="flex-1" />
            <button @click="$x.projects.$create({ name: newName, type: 'demo' }).then(() => { newName = ''; })" :disabled="!newName || !$auth.currentTeam || $x.projects.$error">
                Create
            </button>
        </div>
        
        <!-- List with inline edit, duplicate, and delete -->
        <template x-for="project in $x.projects" :key="project.$id">
            <div class="row gap-2 py-1 items-center border-t border-line">
                <input 
                    type="text" 
                    :value="project.name" 
                    @blur="$x.projects.$update(project.$id, { name: $event.target.value })" 
                    class="ghost flex-1"
                />
                <button class="sm" @click="$x.projects.$duplicate(project.$id, { files: 'same' })" x-icon="lucide:copy" title="Duplicate"></button>
                <button class="sm" @click="$x.projects.$delete(project.$id)" x-icon="lucide:trash"></button>
            </div>
        </template>
        <small x-show="!$x.projects || $x.projects.length === 0" class="text-muted">No projects yet</small>
    </div>
</div>
<small x-show="!$auth.teams || $auth.teams.length === 0" class="text-muted">No teams available</small>
:::

<x-code-group numbers copy>

```html "All"
<div x-data="{ newName: '' }">
    <!-- Create -->
    <input type="text" placeholder="Project name" x-model="newName" />
    <button @click="$x.projects.$create({ name: newName, type: 'demo' }).then(() => { newName = ''; })" :disabled="!newName || $x.projects.$error">
        Create
    </button>
    
    <!-- List with inline edit, duplicate, and delete -->
    <template x-for="project in $x.projects" :key="project.$id">
        <div>
            <input 
                type="text" 
                :value="project.name" 
                @blur="$x.projects.$update(project.$id, { name: $event.target.value })"
            />
            <button @click="$x.projects.$duplicate(project.$id, { files: 'same' })" x-icon="lucide:copy"></button>
            <button @click="$x.projects.$delete(project.$id)" x-icon="lucide:trash"></button>
        </div>
    </template>
</div>
```

```html "Display" copy
<!-- Display all entries -->
<template x-for="project in $x.projects" :key="project.$id">
    <p x-text="project.name"></p>
</template>

<!-- Display single entry -->
<p x-text="$x.projects[0]?.name"></p>

<!-- Display within teams -->
<template x-for="team in $auth.teams" :key="team.$id">
    <div>
        <p x-text="team.name"></p>
        <template x-for="project in $x.projects" :key="project.$id">
            <p x-text="project.name"></p>
        </template>
    </div>
</template>
```

```html "Create" copy
<!-- Basic create -->
<input type="text" placeholder="Project name" x-model="newName" />
<button @click="$x.projects.$create({ name: newName }).then(() => { newName = ''; })">
    Create Project
</button>

<!-- With explicit ID -->
<button @click="$x.projects.$create('custom-id', { name: 'My Project' })">
    Create with Custom ID
</button>
```

```html "Update" copy
<!-- Single update (on blur) -->
<template x-for="project in $x.projects" :key="project.$id">
    <input 
        type="text" 
        :value="project.name" 
        @blur="$x.projects.$update(project.$id, { name: $event.target.value })" 
    />
</template>

<!-- Batch update -->
<button @click="$x.projects.$update(
    [$x.projects[0].$id, $x.projects[1].$id], 
    { status: 'archived' }
)">
    Archive Selected
</button>
```

```html "Duplicate" copy
<!-- Duplicate entry with same file references -->
<button @click="$x.projects.$duplicate(project.$id, { files: 'same' })">
    Duplicate
</button>

<!-- Duplicate entry and duplicate all files -->
<button @click="$x.projects.$duplicate(project.$id, { files: 'duplicate' })">
    Duplicate with Files
</button>

<!-- Duplicate entry without file references -->
<button @click="$x.projects.$duplicate(project.$id, { files: 'none' })">
    Duplicate (No Files)
</button>

<!-- Duplicate with custom name and file handling -->
<button @click="$x.projects.$duplicate(project.$id, { 
    name: project.name + ' Copy',
    files: 'same'
})">
    Duplicate with Custom Name
</button>
```

```html "Delete" copy
<!-- Single delete -->
<template x-for="project in $x.projects" :key="project.$id">
    <div>
        <p x-text="project.name"></p>
        <button @click="$x.projects.$delete(project.$id)">Delete</button>
    </div>
</template>

<!-- Batch delete -->
<button @click="$x.projects.$delete([project1.$id, project2.$id])">
    Delete Selected
</button>
```

</x-code-group>

Database tables automatically sync changes in realtime across all active sessions. When one user creates, updates, or deletes an entry, all other users see the change immediately without page refresh.

**Method details:**

| Method | Parameters | Description |
|--------|------------|-------------|
| `$create(data, rowId?)` | `data` (object), `rowId` (string, optional) | Create a new entry. Returns created entry. If `scope` is configured, `userId` and/or `teamId` are automatically injected |
| `$update(idOrArray, data)` | `idOrArray` (string, object, or array), `data` (object) | Update entry(ies). Returns updated entry(ies) |
| `$duplicate(entryId, options?)` | `entryId` (string or object with `$id`), `options` (object, optional) | Duplicate an entry. Options: `files`, `newRowId`, and any field overrides. Returns duplicated entry. The `files` option controls file handling: `'duplicate'` (create new files), `'same'` (share file references, default), or `'none'` (remove file references) |
| `$delete(idOrArray)` | `idOrArray` (string, object, or array) | Delete entry(ies). Returns deleted entry(ies) |

---

## Search & Query Entries

Use `$query` to search, filter, and sort entries:

::: frame col
<div x-data="{ searchTerm: '', sortBy: 'newest' }" class="col">

    <div class="row-wrap gap-2 mb-2">

        <!-- Search Input -->
        <input 
            type="text" 
            placeholder="Search projects..." 
            x-model="searchTerm"
            class="grow w-fit"
        />
        
        <!-- Sort Buttons -->
        <button @click="sortBy = 'newest'; $x.projects.$query([['orderDesc', '$createdAt']])">
            Sort by Newest
        </button>
        <button @click="sortBy = 'name'; $x.projects.$query([['orderAsc', 'name']])">
            Sort by Name
        </button>
        <button @click="sortBy = 'all'; searchTerm = ''; $x.projects.$query([])">
            Reset
        </button>
    </div>
    
    <!-- Results List -->
    <div class="col">
        <template x-for="project in $x.projects.$search(searchTerm, 'name')" :key="project.$id">
            <div class="p-2 border-t border-line" x-text="project.name"></div>
        </template>
        <small x-show="!$x.projects || $x.projects.$search(searchTerm, 'name').length === 0" class="text-muted">No projects found</small>
    </div>
</div>
:::

<x-code-group>

```html "All" copy
<div x-data="{ searchTerm: '', sortBy: 'newest' }" class="col gap-4">
    <!-- Search Input -->
    <input 
        type="text" 
        placeholder="Search projects..." 
        x-model="searchTerm"
        class="w-full"
    />
    
    <!-- Sort Buttons -->
    <div class="row-wrap gap-2">
        <button @click="sortBy = 'newest'; $x.projects.$query([['orderDesc', '$createdAt']])">
            Sort by Newest
        </button>
        <button @click="sortBy = 'name'; $x.projects.$query([['orderAsc', 'name']])">
            Sort by Name
        </button>
        <button @click="sortBy = 'all'; searchTerm = ''; $x.projects.$query([])">
            Show All
        </button>
    </div>
    
    <!-- Results List -->
    <div class="col gap-2">
        <template x-for="project in $x.projects.$search(searchTerm, 'name')" :key="project.$id">
            <div class="p-2 bg-surface-2 rounded">
                <p x-text="project.name"></p>
            </div>
        </template>
        <small x-show="!$x.projects || $x.projects.$search(searchTerm, 'name').length === 0" class="text-muted">No projects found</small>
    </div>
</div>
```

```html "Key Search" copy
<!-- Text search: filters data already loaded in browser (no network request) -->
<input 
    type="text" 
    placeholder="Search..." 
    x-model="searchTerm"
/>
<template x-for="project in $x.projects.$search(searchTerm, 'name')" :key="project.$id">
    <div x-text="project.name"></div>
</template>
```

```html "Query" copy
<!-- Filter, sort, limit: sends query to Appwrite backend, returns filtered results -->
<button @click="$x.projects.$query([
    ['equal', 'status', 'active'],
    ['orderDesc', '$createdAt']
])">
    Load Active Projects
</button>
```

</x-code-group>

### Query Syntax

These are Appwrite query methods. Each query is an array with the format `['method', 'attribute', 'value']`. Use these patterns to build query arrays:

**Query Methods:**

| Category | Method | Format | Example |
|----------|--------|--------|---------|
| **Comparison** | `equal` | `['equal', 'attribute', 'value']` | `['equal', 'status', 'active']` |
| | `notEqual` | `['notEqual', 'attribute', 'value']` | `['notEqual', 'status', 'archived']` |
| | `greaterThan` | `['greaterThan', 'attribute', value]` | `['greaterThan', 'priority', 5]` |
| | `greaterThanOrEqual` | `['greaterThanOrEqual', 'attribute', value]` | `['greaterThanOrEqual', 'priority', 5]` |
| | `lessThan` | `['lessThan', 'attribute', value]` | `['lessThan', '$createdAt', '2024-01-01']` |
| | `lessThanOrEqual` | `['lessThanOrEqual', 'attribute', value]` | `['lessThanOrEqual', '$createdAt', '2024-01-01']` |
| | `between` | `['between', 'attribute', min, max]` | `['between', 'price', 10, 50]` |
| **Null Checks** | `isNull` | `['isNull', 'attribute']` | `['isNull', 'deletedAt']` |
| | `isNotNull` | `['isNotNull', 'attribute']` | `['isNotNull', 'email']` |
| **String Operations** | `contains` | `['contains', 'attribute', 'value']` | `['contains', 'name', 'keyword']` |
| | `startsWith` | `['startsWith', 'attribute', 'value']` | `['startsWith', 'name', 'prefix']` |
| | `endsWith` | `['endsWith', 'attribute', 'value']` | `['endsWith', 'name', 'suffix']` |
| | `search` | `['search', 'attribute', 'value']` | `['search', 'name', 'keyword']` (requires fulltext index) |
| **Sorting** | `orderAsc` | `['orderAsc', 'attribute']` | `['orderAsc', '$createdAt']` (column must be indexed) |
| | `orderDesc` | `['orderDesc', 'attribute']` | `['orderDesc', '$updatedAt']` (column must be indexed) |
| | `orderRandom` | `['orderRandom']` | `['orderRandom']` |
| **Pagination** | `limit` | `['limit', number]` | `['limit', 10]` |
| | `offset` | `['offset', number]` | `['offset', 20]` |

```javascript
// Comparison operators
['equal', 'status', 'active']                    // status equals 'active'
['notEqual', 'status', 'archived']               // status does not equal 'archived'
['greaterThan', 'priority', 5]                  // priority greater than 5
['greaterThanOrEqual', 'priority', 5]           // priority greater than or equal to 5
['lessThan', '$createdAt', '2024-01-01']        // createdAt before date
['lessThanOrEqual', '$createdAt', '2024-01-01'] // createdAt before or equal to date
['between', 'price', 10, 50]                     // price between 10 and 50 (inclusive)

// Null checks
['isNull', 'deletedAt']                          // deletedAt is null
['isNotNull', 'email']                           // email is not null

// String operations
['contains', 'name', 'keyword']                  // name contains 'keyword'
['startsWith', 'name', 'prefix']                 // name starts with 'prefix'
['endsWith', 'name', 'suffix']                   // name ends with 'suffix'
['search', 'name', 'keyword']                     // Full-text search (requires fulltext index)

// Sorting (column must be indexed)
['orderAsc', '$createdAt']                       // Sort ascending by createdAt
['orderDesc', '$updatedAt']                      // Sort descending by updatedAt
['orderRandom']                                  // Random order

// Pagination
['limit', 10]                                    // Return maximum 10 results
['offset', 20]                                   // Skip first 20 results

// Combine multiple queries (all applied together with AND logic)
[
    ['equal', 'status', 'active'],
    ['orderDesc', '$createdAt'],
    ['limit', 20]
]
```

See [Appwrite's query documentation](https://appwrite.io/docs/products/databases/queries) for the complete list of query methods and operators.

---

### Reusable Queries

Define reusable queries in `manifest.json` and reference them in HTML:

<x-code-group copy>

```json "manifest.json"
{
    "data": {
        "projects": {
            "appwriteTableId": "your-table-id",
            "queries": {
                "default": [["orderDesc", "$createdAt"]],
                "active": [["equal", "status", "active"], ["orderDesc", "$createdAt"]],
                "recent": [["orderDesc", "$createdAt"], ["limit", 10]]
            }
        }
    }
}
```

```html "HTML"
<!-- Reference a query defined in manifest.json by name -->
<button @click="$x.projects.$query('active')">
    Load Active Projects
</button>
```

</x-code-group>

---

## Storage File References

Database entries can reference files stored in Appwrite storage buckets, such as a project (the entry) with files. When duplicating entries, you can control how file references are handled.

### Linking Files to Entries

Files are linked to entries via a `fileIds` column (or custom column name) that stores an array of file IDs:

```json "manifest.json" copy
{
    "data": {
        "projects": {
            "appwriteTableId": "your-table-id",
            "storage": {
                "assets": "fileIds"
            }
        },
        "assets": {
            "appwriteBucketId": "your-bucket-id"
        }
    }
}
```

The `storage` property maps bucket names to column names. In this example, files from the `assets` bucket are stored in the `fileIds` column.

---

### File Reference Options

When duplicating an entry with `$duplicate`, use the `files` option to control file handling:

```html
<!-- 'same' (default): Share file references with original entry -->
<button @click="$x.projects.$duplicate(project.$id, { files: 'same' })">
    Duplicate (Share Files)
</button>

<!-- 'duplicate': Create new copies of all files -->
<button @click="$x.projects.$duplicate(project.$id, { files: 'duplicate' })">
    Duplicate (Copy Files)
</button>

<!-- 'none': Remove all file references -->
<button @click="$x.projects.$duplicate(project.$id, { files: 'none' })">
    Duplicate (No Files)
</button>
```

**File handling options:**

| Option | Description | Use Case |
|--------|-------------|----------|
| `'same'` | New entry shares the same file references as the original | Templates, drafts, or when files don't need to be copied |
| `'duplicate'` | Creates new copies of all files and links them to the new entry | When you need independent file copies |
| `'none'` | Removes all file references from the duplicated entry | When duplicating structure without files |

---

### Accessing Entry Files

Use the `$files` property to access files linked to an entry:

```html
<!-- Display files for an entry -->
<template x-for="file in project.$files" :key="file.$id">
    <div>
        <img :src="file.$url" :alt="file.name" />
        <p x-text="file.name"></p>
    </div>
</template>

<!-- Check if entry has files -->
<small x-show="!project.$files || project.$files.length === 0">
    No files attached
</small>
```

See [storage](/appwrite-plugins/storage) for more details on file management.

---

## Properties

### Entry Properties

Each database entry includes standard Appwrite properties plus your table columns:

| Property | Type | Description |
|----------|------|-------------|
| `$id` | string | Unique identifier |
| `$createdAt` | string | Creation timestamp (ISO format) |
| `$updatedAt` | string | Last update timestamp (ISO format) |
| `$files` | array | Files linked to the entry (if storage is configured) |
| Custom columns | varies | All columns defined in your Appwrite table |

```html
<!-- Access entry properties -->
<div x-text="project.$id"></div>          <!-- Unique identifier -->
<div x-text="project.$createdAt"></div>   <!-- Creation timestamp (ISO) -->
<div x-text="project.$updatedAt"></div>   <!-- Last update timestamp (ISO) -->
<div x-text="project.name"></div>         <!-- Your table columns -->
```

---

### State Properties

Check data source loading state, errors, and readiness:

| Property | Type | Description |
|----------|------|-------------|
| `$loading` | boolean | Indicates if data is currently being loaded |
| `$error` | string \| null | Error message if an operation failed (null if no error) |
| `$ready` | boolean | Indicates if data has been loaded at least once |

```html
<!-- Loading state -->
<small x-show="$x.projects.$loading">Loading projects...</small>

<!-- Error state -->
<small x-show="$x.projects.$error" x-text="$x.projects.$error" class="text-error"></small>

<!-- Ready state -->
<small x-show="$x.projects.$ready && !$x.projects.$loading">
    Projects loaded: <b x-text="$x.projects.length"></b>
</small>
```

---

### CRUD Methods

<x-code-group>

```html "$create" copy
<!-- Create single entry -->
<button @click="$x.projects.$create({ name: 'New Project' })">
    Create
</button>

<!-- Create with custom ID -->
<button @click="$x.projects.$create('custom-id', { name: 'Project' })">
    Create with ID
</button>
```

```html "$update" copy
<!-- Update single entry -->
<button @click="$x.projects.$update(project.$id, { name: 'Updated' })">
    Update
</button>

<!-- Update multiple entries -->
<button @click="$x.projects.$update([id1, id2], { status: 'archived' })">
    Archive Selected
</button>
```

```html "$duplicate" copy
<!-- Duplicate entry with same file references (default) -->
<button @click="$x.projects.$duplicate(project.$id)">
    Duplicate
</button>

<!-- Duplicate entry and duplicate all files -->
<button @click="$x.projects.$duplicate(project.$id, { files: 'duplicate' })">
    Duplicate with Files
</button>

<!-- Duplicate entry without file references -->
<button @click="$x.projects.$duplicate(project.$id, { files: 'none' })">
    Duplicate (No Files)
</button>

<!-- Duplicate with field overrides -->
<button @click="$x.projects.$duplicate(project.$id, { 
    name: project.name + ' Copy',
    status: 'draft',
    files: 'same'
})">
    Duplicate as Draft
</button>
```

```html "$delete" copy
<!-- Delete single entry -->
<button @click="$x.projects.$delete(project.$id)">
    Delete
</button>

<!-- Delete multiple entries -->
<button @click="$x.projects.$delete([id1, id2])">
    Delete Selected
</button>
```

</x-code-group>

---

### Query & Search Methods

<x-code-group>

```html "$query" copy
<!-- Query with filters and sorting -->
<button @click="$x.projects.$query([
    ['equal', 'status', 'active'],
    ['orderDesc', '$createdAt']
])">
    Load Active
</button>

<!-- Use pre-configured query -->
<button @click="$x.projects.$query('active')">
    Load Active
</button>
```

```html "$search" copy
<!-- Frontend text search -->
<input x-model="searchTerm" />
<template x-for="project in $x.projects.$search(searchTerm, 'name')">
    <div x-text="project.name"></div>
</template>
```

</x-code-group>

**Query & Search Methods:**

| Method | Parameters | Description |
|--------|------------|-------------|
| `$query(queriesOrName)` | `queriesOrName` (array or string) | Query entries with filters, sorting, and pagination. Accepts an array of query arrays or a pre-configured query name from `manifest.json`. Returns filtered results |
| `$search(term, field)` | `term` (string), `field` (string) | Frontend text search. Filters data already loaded in browser (no network request). Returns filtered array |

---

### Pagination Methods

<x-code-group>

```html "$firstPage" copy
<!-- Get first page (cursor-based) -->
<button @click="$x.projects.$firstPage(10).then(result => {
    console.log(result.items);    // Array of entries
    console.log(result.cursor);   // Cursor for next page
    console.log(result.total);    // Total count
    console.log(result.hasMore);  // Boolean
})">
    Load First Page
</button>
```

```html "$nextPage" copy
<!-- Get next page (cursor-based) -->
<button @click="$x.projects.$nextPage(cursor, 10).then(result => {
    // Same structure as $firstPage
})">
    Load Next Page
</button>
```

```html "$page" copy
<!-- Get specific page (offset-based) -->
<button @click="$x.projects.$page(2, 10).then(result => {
    console.log(result.items);       // Array of entries
    console.log(result.page);        // Current page number
    console.log(result.total);       // Total count
    console.log(result.totalPages);  // Total pages
    console.log(result.hasMore);     // Boolean
})">
    Load Page 2
</button>
```

</x-code-group>

**Pagination Methods:**

| Method | Parameters | Description |
|--------|------------|-------------|
| `$firstPage(limit)` | `limit` (number) | Get first page (cursor-based). Returns `{ items, cursor, total, hasMore }` |
| `$nextPage(cursor, limit)` | `cursor` (string), `limit` (number) | Get next page (cursor-based). Returns `{ items, cursor, total, hasMore }` |
| `$page(pageNumber, limit)` | `pageNumber` (number), `limit` (number) | Get specific page (offset-based). Returns `{ items, page, total, totalPages, hasMore }` |

---

## Next Steps

See [storage](/appwrite-plugins/storage) for managing file uploads and downloads.

And consider adding realtime [presence](/appwrite-plugins/presence) detection for users to see each other's live cursors or edits in a shared interface.
