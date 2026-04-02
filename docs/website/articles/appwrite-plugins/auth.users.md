# Users

Enable guests and user accounts in your project.

---

## Appwrite Configuration

::: frame
<img src="/assets/examples/appwrite.auth.settings.webp" alt="Appwrite auth settings"/>
:::

Your Appwrite project's Auth dashboard provides various options to customize the user experience. Go to <b>Auth</b> > <b>Settings</b> to enable your preferred sign-in methods. The auth plugin currently supports:
- OAuth2 Providers (Google, Apple, GitHub, Discord, and dozens more)
- Anonymous (guest sessions)
- Magic URL

See Appwrite's <a href="https://appwrite.io/docs/products/auth" target="_blank" rel="noopener">Auth docs</a> for all configuration details.

---

## Sign-in Methods

With Manifest and Appwrite, a frontend user registration flow (vs. a sign-in flow) is not required. Unecognized users will have a new account automatically generated, while known users will login to their existing account.

::: brand icon="lucide:info"
Interactive examples on this page demonstrate real authentication with you as the user. Each example reflects the most recent auth state you've set (e.g. signed-in or out). Example styles and layouts may differ from code snippets.
:::

In `manifest.json`, use the auth `methods` array to define your project's sign-in methods. At least one must be specified here, and enabled in the connected Appwrite project.

```json "manifest.json" copy
{
    "appwrite": {
        "projectId": "your-project-id",
        "endpoint": "your-API-endpoint",
        "devKey": "your-dev-key",
        "auth": {
            "methods": [ "oauth", "magic", "guest-manual" ]
        }
    }
}
```

| Method | Description |
|--------|-------------|
| `guest-auto` | Automatically creates anonymous guest sessions for all visitors |
| `guest-manual` | Allows users to manually create guest sessions via `$auth.createGuest()` |
| `magic` | Enables passwordless login via magic URLs sent to email |
| `oauth` | Enables OAuth sign-in with providers like Google, GitHub, etc. |

---

### OAuth

OAuth enables sign-in with third-party providers like Google, GitHub, and 35+ other services supported by and configured in Appwrite's <b>Auth</b> > <b>Settings</b> page.

::: frame col
<div class="row-wrap gap-2">
    <button @click="$auth.loginOAuth('google')" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress">Sign in with Google</button>
    <button @click="$auth.loginOAuth('github')" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress">Sign in with GitHub</button>
    <button @click="$auth.logout()" :disabled="!$auth.isAuthenticated || $auth.inProgress">Logout</button>
</div>

<!-- Status -->
<p x-show="$auth.inProgress">Authorizing...</p>
<p x-show="$auth.isAuthenticated">You're signed-in using <b x-text="$auth.method || 'guest'"></b><span x-show="$auth.provider"> via <b x-text="$auth.provider"></b></span> as <b x-text="$auth.user?.email || 'a guest'"></b></p>
<p x-show="!$auth.isAuthenticated">You're not signed-in.</p>
<p x-show="$auth.error" x-text="$auth.error"></p>
:::

<x-code-group>

```json "manifest.json" copy
{
    "appwrite": {
        ...
        "auth": {
            "methods": ["oauth"]
        }
    }
}
```

```html "HTML" copy
<button @click="$auth.loginOAuth('google')" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress">Sign in with Google</button>
<button @click="$auth.loginOAuth('github')" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress">Sign in with GitHub</button>
<button @click="$auth.logout()" :disabled="!$auth.isAuthenticated || $auth.inProgress">Logout</button>

<!-- Status -->
<p x-show="$auth.inProgress">Authorizing...</p>
<p x-show="$auth.isAuthenticated">You're signed-in using <b x-text="$auth.method || 'guest'"></b><span x-show="$auth.provider"> via <b x-text="$auth.provider"></b></span> as <b x-text="$auth.user?.email || 'a guest'"></b></p>
<p x-show="!$auth.isAuthenticated">You're not signed-in.</p>
<p x-show="$auth.error" x-text="$auth.error"></p>
```

</x-code-group>

The `$auth.loginOAuth('...')` method accepts provider names like `google`, `github`, and `discord`. When applicable, the user is redirected to the provider's sign-in page and gets returned when authenticated.

---

### Magic URLs

Magic URLs provide passwordless authentication via email. Users enter their email address and get emailed a sign-in link that's valid for one hour, which can be used once.

::: frame col
<!-- Form -->
<div class="row-wrap gap-2">
    <input class="flex-1 max-w-full" type="email" pattern=".*@.*\..*" required autocomplete="on" placeholder="Input email" class="peer" @keyup.enter="$auth.sendMagicLink()" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress" />
    <button class="peer-invalid:disabled" @click="$auth.sendMagicLink()" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress">Send Magic URL</button>
    <button @click="$auth.logout()" :disabled="!$auth.isAuthenticated || $auth.inProgress" class="!w-fit">Logout</button>
</div>

<!-- Status -->
<p x-show="$auth.inProgress">Authorizing...</p>
<p x-show="$auth.magicLinkSent">Magic URL sent. Check your inbox or spam to sign-in.</p>
<p x-show="$auth.magicLinkExpired">Magic URL expired. Please try again.</p>
<p x-show="$auth.isAuthenticated">You're signed-in using <b x-text="$auth.method || 'guest'"></b><span x-show="$auth.provider"> via <b x-text="$auth.provider"></b></span> as <b x-text="$auth.user?.email || 'a guest'"></b></p>
<p x-show="!$auth.isAuthenticated">You're not signed-in.</p>
<p x-show="$auth.error" x-text="$auth.error"></p>
:::

<x-code-group>

```json "manifest.json" copy
{
    "appwrite": {
        ...
        "auth": {
            "methods": ["magic"]
        }
    }
}
```

```html "HTML" copy
<!-- Form -->
<input type="email" pattern=".*@.*\..*" required autocomplete="on" placeholder="Input email" class="peer" @keyup.enter="$auth.sendMagicLink()" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress" />
<button class="peer-invalid:disabled" @click="$auth.sendMagicLink()" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress">Send Magic URL</button>
<button @click="$auth.logout()" :disabled="!$auth.isAuthenticated || $auth.inProgress" class="!w-fit">Logout</button>

<!-- Status -->
<p x-show="$auth.inProgress">Authorizing...</p>
<p x-show="$auth.magicLinkSent">Magic URL sent. Check your inbox or spam to sign-in.</p>
<p x-show="$auth.magicLinkExpired">Magic URL expired. Please try again.</p>
<p x-show="$auth.isAuthenticated">You're signed-in using <b x-text="$auth.method || 'guest'"></b><span x-show="$auth.provider"> via <b x-text="$auth.provider"></b></span> as <b x-text="$auth.user?.email || 'a guest'"></b></p>
<p x-show="!$auth.isAuthenticated">You're not signed-in.</p>
<p x-show="$auth.error" x-text="$auth.error"></p>
```

</x-code-group>

The button's `$auth.sendMagicLink()` method automatically finds the email input in the same parent element, form element, or otherwise finds the first email input on the page. To target a specific input, add its element ID like `$auth.sendMagicLink(#email-input)`. When activated, a magic URL is sent and the email input field is cleared.

When users click the magic URL in their email, they're redirected back to your app. The plugin automatically handles the callback and creates the session.

Email content can be customized in Appwrite under <b>Auth</b> > <b>Templates</b> > <b>Magic URL</b>.

---

### Guest Sessions

Guest sessions allow visitors to browse your app without creating an account, with each session registered in the Appwrite userbase (including repeat visits from the same user). With Manifest, guest sessions can begin automatically or by a user action. If a guest subsequently signs in using OAuth or a Magic URL, Appwrite converts the guest session into a real profile and preserves any user data.

<br>

#### Auto Guest Sessions

When `guest-auto` is enabled in your manifest, all visitors automatically enter a guest session on page load.

```json "manifest.json"
{
    "appwrite": {
        ...
        "auth": {
            "methods": ["guest-auto"]
        }
    }
}
```

<br>

#### Manual Guest Sessions

When `guest-manual` is enabled, visitors must explicitly choose to continue as a guest.

::: frame col
<div class="row-wrap gap-2">
    <button @click="$auth.requestGuest()" :disabled="$auth.isAuthenticated || $auth.inProgress">Continue as Guest</button>
    <button @click="$auth.logout()" :disabled="!$auth.isAuthenticated || $auth.inProgress" class="!w-fit">Logout</button>
</div>
<p x-show="$auth.isAnonymous">You're a guest</p>
<p x-show="!$auth.isAnonymous && $auth.isAuthenticated">You're already signed in</p>
<p x-show="!$auth.isAuthenticated">You're not signed in</p>
:::

<x-code-group>

```json "manifest.json" copy
{
    "appwrite": {
        ...
        "auth": {
            "methods": ["guest-manual"]
        }
    }
}
```

```html "HTML" numbers copy
<button @click="$auth.requestGuest()" :disabled="$auth.isAuthenticated || $auth.inProgress">Continue as Guest</button>
<button @click="$auth.logout()" :disabled="!$auth.isAuthenticated || $auth.inProgress">Logout</button>

<!-- Status -->
<p x-show="$auth.isAnonymous">You're a guest</p>
<p x-show="!$auth.isAnonymous && $auth.isAuthenticated">You're signed in - logout to test guest mode</p>
<p x-show="!$auth.isAuthenticated">You're not signed in</p>
```

</x-code-group>

---

## Combined Methods

Sign-in methods can be stacked to provide optionality to users.

::: frame
<div class="col center gap-2 w-sm max-w-100% mx-auto py-10 text-center [&_button]:w-full">
    <!-- OAuth Buttons -->
    <button  @click="$auth.loginOAuth('google')" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress"><i x-icon="simple-icons:google"></i> <span>Sign in with Google</span></button>
    <button @click="$auth.loginOAuth('github')" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress"><i x-icon="simple-icons:github"></i> <span>Sign in with GitHub</span></button>
    <div class="divider my-8">OR</div>
    <!-- Magic URL Form -->
    <input type="email" pattern=".*@.*\..*" required autocomplete="on" placeholder="Input email" class="peer" @keyup.enter="$auth.sendMagicLink()" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress"/>
        <button class="peer-invalid:disabled" @click="$auth.sendMagicLink()" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress">Send Magic URL</button>
    <div class="divider my-8">OR</div>
    <!-- Guest Button -->
    <button @click="$auth.requestGuest()" :disabled="$auth.isAuthenticated || $auth.inProgress">Continue as Guest</button>
    <!-- Status -->
    <div class="my-8">
        <p x-show="$auth.inProgress">Authorizing...</p>
        <p x-show="$auth.magicLinkSent">Magic URL sent. Check your inbox or spam to sign-in.</p>
        <p x-show="$auth.magicLinkExpired">Magic URL expired. Please try again.</p>
        <p x-show="$auth.isAuthenticated">You're signed-in using <b x-text="$auth.method || 'guest'"></b><span x-show="$auth.provider"> via <b x-text="$auth.provider"></b></span> as <b x-text="$auth.user?.email || 'a guest'"></b></p>
        <p x-show="!$auth.isAuthenticated">You're not signed-in.</p>
        <p x-show="$auth.error" x-text="$auth.error"></p>
    </div>
    <button @click="$auth.logout()" :disabled="!$auth.isAuthenticated || $auth.inProgress" class="!w-fit">Logout</button>
</div>
:::

<x-code-group>

```json "manifest.json" copy
{
    "appwrite": {
        ...
        "auth": {
            "methods":  ["guest-manual", "magic", "oauth"]
        }
    }
}
```

```html "HTML" numbers copy
<!-- OAuth Buttons -->
<button @click="$auth.loginOAuth('google')" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress"><i x-icon="simple-icons:google"></i> <span>Sign in with Google</span></button>
<button @click="$auth.loginOAuth('github')" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress"><i x-icon="simple-icons:github"></i> <span>Sign in with GitHub</span></button>

<div class="divider my-8">OR</div>

<!-- Magic URL Form -->
<input class="peer" type="email" pattern=".*@.*\..*" required autocomplete="on" placeholder="Input email" @keyup.enter="$auth.sendMagicLink()" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress" />
<button class="peer-invalid:disabled" @click="$auth.sendMagicLink()" :disabled="($auth.isAuthenticated && !$auth.isAnonymous) || $auth.inProgress">Send Magic URL</button>

<div class="divider my-8">OR</div>

<!-- Guest Button -->
<button @click="$auth.requestGuest()" :disabled="$auth.isAuthenticated || $auth.inProgress">Continue as Guest</button>

<!-- Status -->
<div class="my-8">
<p x-show="$auth.inProgress">Authorizing...</p>
<p x-show="$auth.magicLinkSent">Magic URL sent. Check your inbox or spam to sign-in.</p>
<p x-show="$auth.magicLinkExpired">Magic URL expired. Please try again.</p>
<p x-show="$auth.isAuthenticated">You're signed-in using <b x-text="$auth.method || 'guest'"></b><span x-show="$auth.provider"> via <b x-text="$auth.provider"></b></span> as <b x-text="$auth.user?.email || 'a guest'"></b></p>
<p x-show="!$auth.isAuthenticated">You're not signed-in.</p>
<p x-show="$auth.error" x-text="$auth.error"></p>
</div>

<!-- Logout -->
<button @click="$auth.logout()" :disabled="!$auth.isAuthenticated || $auth.inProgress">Logout</button>
```

</x-code-group>

---

## Properties

The auth plugin provides an `$auth` magic property that exposes authentication state and methods.

### Authentication State

#### User Profile ($auth.user)

Current user profile (null if not authenticated). The user object comes directly from Appwrite's `account.get()`.

| Property | Type | Description |
|----------|------|-------------|
| `$auth.user?.$id` | string | User's unique ID |
| `$auth.user?.email` | string | User's email address |
| `$auth.user?.name` | string | User's display name |
| `$auth.user?.$createdAt` | string | Account creation timestamp |
| `$auth.user?.$updatedAt` | string | Last update timestamp |
| `$auth.user?.prefs` | object | User preferences object |
| Other properties | - | All other Appwrite User object properties are available |

#### Session Information ($auth.session)

Current session details (null if not authenticated). The session object comes directly from Appwrite's session data.

| Property | Type | Description |
|----------|------|-------------|
| `$auth.session?.$id` | string | Session ID |
| `$auth.session?.userId` | string | User ID associated with session |
| `$auth.session?.expire` | string | Session expiration timestamp |
| `$auth.session?.provider` | string | Authentication provider used (`'anonymous'`, `'magic-url'`, or OAuth provider name) |
| `$auth.session?.ip` | string | IP address of session |
| `$auth.session?.osCode` | string | Operating system code |
| `$auth.session?.osName` | string | Operating system name |
| `$auth.session?.osVersion` | string | Operating system version |
| `$auth.session?.deviceName` | string | Device name |
| `$auth.session?.deviceBrand` | string | Device brand |
| `$auth.session?.deviceModel` | string | Device model |
| Other properties | - | All other Appwrite Session object properties are available |

#### Status Flags

| Property | Type | Description |
|----------|------|-------------|
| `$auth.isAuthenticated` | boolean | Indicates if user is authenticated |
| `$auth.isAnonymous` | boolean | Indicates if user is a guest |
| `$auth.inProgress` | boolean | Indicates if an auth operation is in progress |
| `$auth.error` | string \| null | Error message string (null if no error) |
| `$auth.magicLinkSent` | boolean | Indicates if magic link was sent |
| `$auth.magicLinkExpired` | boolean | Indicates if magic link expired |
| `$auth.guestManualEnabled` | boolean | Indicates if manual guest creation is enabled |

---

### Computed Properties

| Property | Type | Description |
|----------|------|-------------|
| `$auth.method` | string \| null | Authentication method: `'oauth'`, `'magic'`, `'anonymous'`, or `null` |
| `$auth.provider` | string \| null | OAuth provider name (e.g., `'google'`, `'github'`) or `null` for non-OAuth methods |

---

### Available Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `$auth.loginOAuth(...)` | `provider` (string), `successUrl` (optional), `failureUrl` (optional) | Sign in with OAuth provider. Redirects to provider. |
| `$auth.sendMagicLink(...)` | `emailInputOrRef` (element ID or element, optional), `redirectUrl` (optional) | Send magic link to email. |
| `$auth.requestGuest()` | None | Create a manual guest session. |
| `$auth.logout()` | None | Delete current session and sign out. If automatic guest sessions are enabled, a new guest session will begin after logout. |
| `$auth.refresh()` | None | Refresh user data from Appwrite. |
| `$auth.canAuthenticate()` | None | Check if user can authenticate (not already signed in or in progress). |

---

## Next Steps

See [teams](/appwrite-plugins/teams) to enable shared workspaces between users, including roles and permissions.