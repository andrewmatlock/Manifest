# Teams

Allow users to work together within your application.

---

## Team Management

Teams are collaborative workspaces where members share roles and permissions. Teams are automatically loaded when a user authenticates, and changes sync in realtime across all active sessions.

Enable teams in `manifest.json` under the `auth` property:

```json "manifest.json" copy
{
    "appwrite": {
        ...
        "auth": {
            ...
            "teams": {}
        }
    }
}
```

If your app requires default teams be created automatically for all users, configure them in `manifest.json`.

```json "manifest.json" copy
{
    "appwrite": {
        ...
        "auth": {
            ...
            "teams": {
                "permanent": ["Permanent Workspace"],
                "template": ["Template Workspace", "Dream Team"]
            }
        }
    }
}
```

Default teams are defining by their name within array objects:
- `permanent`: Permanent teams cannot be deleted by the user, such as a default personal workspace.
- `template`: Template teams can be deleted and reapplied by the user, such as demo workspaces.

The user is the owner and only initial member of each default team. Depending on their role and permissions, the team can be modified and other members invited.

Every user can generate custom teams, view all teams, and manage them with the respective permissions.

::: frame col
<!-- Not signed in -->
<small x-show="!$auth.isAuthenticated">You're not signed-in. Use one of the interactive examples above to sign in.</small>

<!-- Create team -->
<div class="row-wrap gap-2">
    <input type="text" class="flex-1" placeholder="Team name" x-model="$auth.newTeamName" :disabled="$auth.isCreatingTeam()" />
    <button @click="$auth.createTeamFromName()" :disabled="!$auth.newTeamName || $auth.isCreatingTeam()">Create Team</button>
</div>

<!-- Add back deleted template teams -->
<template x-for="teamName in $auth.deletedTemplateTeams" :key="teamName">
    <button @click="$auth.reapplyTemplateTeam(teamName)" :disabled="$auth.isCreatingTeam()" class="w-full">Add <b x-text="teamName"></b></button>
</template>

<hr>

<!-- No teams -->
<small x-show="!$auth.teams || $auth.teams.length === 0">No teams yet</small>

<!-- List teams -->
<template x-for="team in $auth.teams" :key="team.$id">
    <!-- Team accordion -->
    <details class="pb-4 border-b border-line" x-data="{ loaded: false, editingTeamName: team.name }" x-effect="editingTeamName = team.name" @toggle="if ($event.target.open && !loaded) { $auth.currentTeam = team; $auth.viewTeam(team); loaded = true; }">
        <!-- Team name input / expand button -->
        <summary>
            <input type="text" placeholder="Insert name" class="ghost hug w-fit hover:px-2 hover:py-1" onclick="this.select()" x-model="editingTeamName" :disabled="!$auth.isTeamRenamable(team) || $auth.isUpdatingTeam(team.$id)" @blur="if (editingTeamName !== team.name && editingTeamName.trim()) { $auth.updateTeamName(team.$id, editingTeamName.trim()); }" @keydown.enter="$event.target.blur()" />
        </summary>
        <!-- Team content -->
        <div class="relative col gap-4">
            <!-- Static Info -->
            <div class="col gap-1">
                <small>ID: <b x-text="team.$id"></b></small>
                <small>Created: <b x-text="$auth.teamCreatedAt(team)"></b></small>
                <small>Modified: <b x-text="$auth.teamUpdatedAt(team)"></b></small>
            </div>
            <!-- Delete team -->
            <button class="sm" @click="$auth.deleteTeam(team.$id)" :disabled="$auth.isActionDisabled('deleteTeam') || !$auth.isTeamDeletable(team) || $auth.isDeletingTeam(team.$id)" aria-label="Delete team">Delete</button>
    </details>
</template>
:::

<x-code-group numbers copy>

```html "Create Team"
<!-- Team name input -->
<input type="text" placeholder="Team name" x-model="$auth.newTeamName" :disabled="$auth.isCreatingTeam()" />

<!-- Create button -->
<button @click="$auth.createTeamFromName()" :disabled="!$auth.newTeamName || $auth.isCreatingTeam()">Create Team</button>

<!-- Add back deleted template teams -->
<template x-for="teamName in $auth.deletedTemplateTeams" :key="teamName">
    <button @click="$auth.reapplyTemplateTeam(teamName)" :disabled="$auth.isCreatingTeam()">Create <b x-text="teamName"></b> Team</button>
</template>
```

```html "List & Manage Teams"
<!-- List teams -->
<template x-for="team in $auth.teams" :key="team.$id">
    <div>

        <!-- Team details -->
        <p x-text="$auth.team.name">Team name</p>
        <small>ID: <b x-text="team.$id"></b></small>
        <small>Created: <b x-text="$auth.teamCreatedAt(team)"></b></small>
        <small>Modified: <b x-text="$auth.teamUpdatedAt(team)"></b></small>

        <!-- Rename team -->
        <input type="text" placeholder="Insert name" class="transparent hug w-fit rounded-none no-focus" onclick="this.select()" x-model="editingTeamName" :disabled="!$auth.isTeamRenamable(team) || $auth.isUpdatingTeam(team.$id)" @blur="if (editingTeamName !== team.name && editingTeamName.trim()) { $auth.updateTeamName(team.$id, editingTeamName.trim()); }" @keydown.enter="$event.target.blur()" />

        <!-- Delete team (enabled if user has the deleteTeam permission) -->
        <button class="sm" @click="$auth.deleteTeam(team.$id)" :disabled="$auth.isActionDisabled('deleteTeam') || !$auth.isTeamDeletable(team) || $auth.isDeletingTeam(team.$id)" aria-label="Delete team">Delete</button>

        <!-- Duplicate team -->
        <button @click="$auth.duplicateTeam(team.$id, { newName: team.name + ' copy' })">Duplicate</button>
        
        <!-- Duplicate with members and roles -->
        <button @click="$auth.duplicateTeam(team.$id, { copyMembers: true, copyRoles: true })">Duplicate with Members</button>

    </div>
</template>
```

</x-code-group>

---

## Roles & Permissions

By default, Appwrite assigns all members of a team an "owner" role, with top-level permissions to manage the team and its members. To override this behaviour, define default roles and their permissions in `manifest.json`, which are made available to every new team.

```json "manifest.json" copy
{
    "appwrite": {
        ...
        "auth": {
            ...
            "roles": {
                "permanent": {
                    "Admin": ["inviteMembers", "updateMembers", "removeMembers", "manageRoles", "renameTeam", "deleteTeam"]
                },
                "template": {
                    "Editor": ["inviteMembers"],
                    "Viewer": []
                }
            },
            "creatorRole": "Admin"
        }
    }
}
```

Like default teams, default roles are established by their name in one of two objects:

| Role Type | Description |
|-----------|-------------|
| `permanent` | Permanent roles cannot be modified or deleted by anyone |
| `template` | Template roles can be modified and deleted by users with the `manageRoles` permission |

Each role can have permissions. Appwrite offers these default options:

| Permission | Description |
|-----------|-------------|
| `inviteMembers` | Invite new members to the team |
| `updateMembers` | Edit other members' roles |
| `removeMembers` | Remove members from the team |
| `manageRoles` | Create, rename, set permissions, and delete custom roles |
| `renameTeam` | Change the team name |
| `deleteTeam` | Delete the team |

Custom permissions can be added to the array with unique names, such as `manageBilling`. These can be used in your frontend Alpine directives like `x-show="$auth.hasTeamPermission('manageBilling')`. Users can also generate custom permissions if you expose the inputs to do so.

The `creatorRole` is the role assigned to the team creator. It must reference a role defined in the `permanent` or `template` roles. if the `creatorRole` property is absent or does not reference a defined role, the creator is assigned all default permissions.

::: frame col
<!-- Team list -->
<template x-for="team in $auth.teams" :key="team.$id">
    <!-- Team accordion-->
    <details class="pb-4 border-b border-line" x-data="{ loaded: false, editingTeamName: team.name }" x-effect="editingTeamName = team.name" @toggle="if ($event.target.open && !loaded) { $auth.currentTeam = team; $auth.viewTeam(team); loaded = true; }">
        <!-- Team name / expand button -->
        <summary x-text="team.name">Team name</summary>
        <!-- Roles & Permissions -->
        <div class="col gap-4">
            <!-- List -->
            <template x-for="(permissions, roleName) in $auth.allTeamRoles(team)" :key="roleName">
            <div class="relative row gap-2 items-center max-w-full" x-data="{ editingRoleName: roleName, customPermInput: '' }" x-effect="editingRoleName = roleName">
                <!-- Role name input -->
                <input type="text" class="transparent hug flex-1" x-model="editingRoleName" @blur="if ($auth.isUpdatingRole(team.$id, roleName)) return; if (editingRoleName !== roleName && editingRoleName.trim()) { $auth.startEditingRole(team.$id, roleName); if ($auth.editingRole) { $auth.editingRole.newRoleName = editingRoleName.trim(); } $auth.saveEditingRole(); }" @keydown.enter="$event.target.blur()" :disabled="$auth.isActionDisabled('manageRoles') || ($auth.isRolePermanentSync && $auth.isRolePermanentSync(team.$id, roleName)) || $auth.isUpdatingRole(team.$id, roleName)" />
                <!-- Permissions dropdown button -->
                <button class="sm flex-1" x-dropdown="`permissions-menu-${team.$id}-${roleName}`" :disabled="$auth.isActionDisabled('manageRoles') || ($auth.isRolePermanentSync && $auth.isRolePermanentSync(team.$id, roleName)) || $auth.isUpdatingRole(team.$id, roleName)" > <span x-text="(permissions && permissions.length > 0) ? permissions.join(', ') : 'No permissions'"></span> <i class="trailing" x-icon="lucide:chevron-down"></i> </button>
                <!-- Permissions dropdown -->
                <menu popover :id="`permissions-menu-${team.$id}-${roleName}`">
                    <template x-for="permission in $auth.allAvailablePermissions || []" :key="permission">
                    <label>
                        <input type="checkbox" :checked="permissions && permissions.includes(permission)" @change="if ($auth.isUpdatingRole(team.$id, roleName)) return; const updated = permissions ? [...permissions] : []; if ($event.target.checked) { if (!updated.includes(permission)) updated.push(permission); } else { const idx = updated.indexOf(permission); if (idx > -1) updated.splice(idx, 1); } $auth.startEditingRole(team.$id, roleName); if ($auth.editingRole) { $auth.editingRole.permissions = updated; } setTimeout(() => { if ($auth.editingRole && $auth.editingRole.teamId === team.$id && $auth.editingRole.oldRoleName === roleName) { $auth.saveEditingRole(); } }, 300);" :disabled="!$auth.canManageRoles() || ($auth.isRolePermanentSync && $auth.isRolePermanentSync(team.$id, roleName)) || $auth.isUpdatingRole(team.$id, roleName)" />
                        <span x-text="permission"></span>
                    </label>
                    </template>
                    <input type="text" placeholder="Custom permission" aria-label="Custom permission" x-model="customPermInput" @keydown.enter.prevent="if ($auth.isUpdatingRole(team.$id, roleName)) return; if (customPermInput.trim()) { const updated = permissions ? [...permissions] : []; if (!updated.includes(customPermInput.trim())) { updated.push(customPermInput.trim()); $auth.startEditingRole(team.$id, roleName); if ($auth.editingRole) { $auth.editingRole.permissions = updated; } setTimeout(() => { if ($auth.editingRole && $auth.editingRole.teamId === team.$id && $auth.editingRole.oldRoleName === roleName) { $auth.saveEditingRole(); } }, 300); customPermInput = ''; } }" :disabled="$auth.isActionDisabled('manageRoles') || ($auth.isRolePermanentSync && $auth.isRolePermanentSync(team.$id, roleName)) || $auth.isUpdatingRole(team.$id, roleName)" />
                </menu>
                <!-- Delete button -->
                <button class="sm" @click="$auth.deleteUserRole(team.$id, roleName)" :disabled="$auth.isActionDisabled('manageRoles') || !$auth.isRoleDeletable(team.$id, roleName) || $auth.isDeletingRole(team.$id, roleName)" aria-label="Delete role" x-icon="lucide:trash" ></button>
            </div>
            </template>
            <!-- Create Role -->
            <div class="row-wrap gap-2 mb-2" x-data="{ customPermInput: '' }">
            <input type="text" placeholder="New role name" class="w-full" x-model="$auth.newRoleName" :disabled="$auth.isActionDisabled('manageRoles') || $auth.isCreatingRole()" />
            <button class="flex-1" x-dropdown="`permissions-menu-${team.$id}`" :disabled="$auth.isActionDisabled('manageRoles') || $auth.isCreatingRole()">
                <span x-text="($auth.newRolePermissions && $auth.newRolePermissions.length > 0) ? $auth.newRolePermissions.join(', ') : 'Permissions'"></span>
                <i class="trailing" x-icon="lucide:chevron-down"></i>
            </button>
            <!-- Permissions dropdown-->
            <menu popover :id="`permissions-menu-${team.$id}`">
                <template x-for="permission in $auth.allAvailablePermissions || []" :key="permission">
                <label>
                    <input type="checkbox" :checked="$auth.isPermissionSelected(permission)" @change="$auth.togglePermission(permission)" :disabled="!$auth.canManageRoles()" />
                    <span x-text="permission"></span>
                </label>
                </template>
                <input type="text" placeholder="Custom permission" aria-label="Custom permission" x-model="customPermInput" @keydown.enter.prevent="$auth.addCustomPermissions(customPermInput); customPermInput = ''" :disabled="$auth.isActionDisabled('manageRoles') || $auth.isCreatingRole()" />
            </menu>
            <!-- Create button -->
            <button @click="$auth.createRoleFromInputs(team.$id)" :disabled="!$auth.newRoleName || $auth.isActionDisabled('manageRoles') || $auth.isCreatingRole()" class="w-fit">Create</button>
            </div>
        </div>
    </details>
</template>
:::

<x-code-group numbers copy>

```html "Create Custom Role"
<!-- Role name input -->
<input type="text" placeholder="Role name" x-model="$auth.newRoleName" :disabled="!$auth.canManageRoles() || $auth.isActionDisabled('manageRoles') || $auth.isCreatingRole()" />
<!-- Permissions dropdown button -->
<button x-dropdown="`permissions-menu-${$auth.currentTeam?.$id || 'default'}`" :disabled="!$auth.canManageRoles() || $auth.isActionDisabled('manageRoles') || $auth.isCreatingRole()" x-text="($auth.newRolePermissions && $auth.newRolePermissions.length > 0) ? $auth.newRolePermissions.join(', ') : 'Permissions'"></button>
<!-- Permissions dropdown -->
<menu popover :id="`permissions-menu-${$auth.currentTeam?.$id || 'default'}`">
    <template x-for="permission in $auth.allAvailablePermissions || []" :key="permission">
        <label>
            <input type="checkbox" :checked="$auth.isPermissionSelected(permission)" @change="$auth.togglePermission(permission)" :disabled="$auth.isCreatingRole()" />
            <span x-text="permission"></span>
        </label>
    </template>
    <input type="text" placeholder="Custom permission" @keydown.enter.prevent="$auth.addCustomPermissions($event.target.value); $event.target.value = ''" :disabled="$auth.isCreatingRole()" />
</menu>
<!-- Create button -->
<button @click="$auth.createRoleFromInputs($auth.currentTeam?.$id)" :disabled="!$auth.newRoleName || !$auth.canManageRoles() || $auth.isActionDisabled('manageRoles') || $auth.isCreatingRole()">Create</button>
```

```html "Manage Roles"
<!-- List roles -->
<template x-for="(permissions, roleName) in $auth.allTeamRoles(team)" :key="roleName">
    <!-- Wrapper enabling inputs -->
    <div x-data="{ editingRoleName: roleName, customPermInput: '' }" x-effect="editingRoleName = roleName">

        <!-- Role name & permissions -->
        <p x-text="roleName">Role name</p>
        <small x-text="(permissions && permissions.length > 0) ? permissions.join(', ') : 'No permissions'">Permissions</small>

        <!-- Role name input (enabled if user has canManageRoles permission) -->
        <input type="text" x-model="editingRoleName" @blur="if ($auth.isUpdatingRole(team.$id, roleName)) return; if (editingRoleName !== roleName && editingRoleName.trim()) { $auth.startEditingRole(team.$id, roleName); if ($auth.editingRole) { $auth.editingRole.newRoleName = editingRoleName.trim(); } $auth.saveEditingRole(); }" @keydown.enter="$event.target.blur()" :disabled="!$auth.canManageRoles() || $auth.isRolePermanentSync(team.$id, roleName) || $auth.isActionDisabled('manageRoles') || $auth.isUpdatingRole(team.$id, roleName)" />

        <!-- Permissions dropdown (enabled if user has canManageRoles permission) -->
        <button x-dropdown="`permissions-menu-${team.$id}-${roleName}`" :disabled="!$auth.canManageRoles() || $auth.isRolePermanentSync(team.$id, roleName) || $auth.isActionDisabled('manageRoles') || $auth.isUpdatingRole(team.$id, roleName)" x-text="(permissions && permissions.length > 0) ? permissions.join(', ') : 'No permissions'"></button>
        <menu popover :id="`permissions-menu-${team.$id}-${roleName}`">
            <!-- List permissions as checkboxes -->
            <template x-for="permission in $auth.allAvailablePermissions || []" :key="permission">
                <label>
                    <input type="checkbox" :checked="permissions && permissions.includes(permission)" @change="if ($auth.isUpdatingRole(team.$id, roleName)) return; const updated = permissions ? [...permissions] : []; if ($event.target.checked) { if (!updated.includes(permission)) updated.push(permission); } else { const idx = updated.indexOf(permission); if (idx > -1) updated.splice(idx, 1); } $auth.startEditingRole(team.$id, roleName); if ($auth.editingRole) { $auth.editingRole.permissions = updated; } setTimeout(() => { if ($auth.editingRole && $auth.editingRole.teamId === team.$id && $auth.editingRole.oldRoleName === roleName) { $auth.saveEditingRole(); } }, 300);" :disabled="!$auth.canManageRoles() || $auth.isRolePermanentSync(team.$id, roleName) || $auth.isUpdatingRole(team.$id, roleName)" />
                    <span x-text="permission"></span>
                </label>
            </template>
            <!-- Custom permissions input -->
            <input type="text" placeholder="Custom permission" x-model="customPermInput" @keydown.enter.prevent="if ($auth.isUpdatingRole(team.$id, roleName)) return; if (customPermInput.trim()) { const updated = permissions ? [...permissions] : []; if (!updated.includes(customPermInput.trim())) { updated.push(customPermInput.trim()); $auth.startEditingRole(team.$id, roleName); if ($auth.editingRole) { $auth.editingRole.permissions = updated; } setTimeout(() => { if ($auth.editingRole && $auth.editingRole.teamId === team.$id && $auth.editingRole.oldRoleName === roleName) { $auth.saveEditingRole(); } }, 300); customPermInput = ''; } }" :disabled="!$auth.canManageRoles() || $auth.isRolePermanentSync(team.$id, roleName) || $auth.isUpdatingRole(team.$id, roleName)" />
        </menu>

        <!-- Delete role button (enabled if user has canManageRoles permission) -->
        <button @click="$auth.deleteUserRole(team.$id, roleName)" :disabled="!$auth.isRoleDeletable(team.$id, roleName) || !$auth.canManageRoles() || $auth.isActionDisabled('manageRoles') || $auth.isDeletingRole(team.$id, roleName)">Delete</button>

    </div>
</template>
```

</x-code-group>

---

## Members

Team members can be invited, updated, and removed, subject to the respective user permissions.

In your Appwrite project under <b>Auth</b> > <b>Settings</b>, ensure <b>Team invites</b> is toggled on. Invitation emails can be customized under <b>Auth</b> > <b>Settings</b> > <b>Invite user</b>.

::: frame col
<!-- Team list -->
<template x-for="team in $auth.teams" :key="team.$id"> 
    <!-- Team accordion-->
    <details class="pb-4 border-b border-line" x-data="{ loaded: false }" @toggle="if ($event.target.open && !loaded) { $auth.currentTeam = team; $auth.viewTeam(team); loaded = true; }">
        <!-- Team name / expand button -->
        <summary x-text="team.name">Team Name</summary>
        <!-- Members-->
        <div class="col gap-4">
            <!-- List -->
            <template x-for="membership in $auth.currentTeamMemberships" :key="membership.$id">
                <div class="relative col" x-data="{ customRoleInput: '' }">
                    <!-- View Mode -->
                    <template x-if="!$auth.editingMember || $auth.editingMember.membershipId !== membership.$id">
                        <div class="row gap-3">
                            <div class="flex-1 col">
                                <small>
                                <b x-text="$auth.getMemberDisplayName(membership)"></b>
                                <span x-show="membership.userId === $auth.user?.$id"> (You)</span>
                                </small>
                                <small x-text="$auth.getMemberEmail(membership)"></small>
                                <small x-text="(membership.displayRoles && membership.displayRoles.length > 0) ? membership.displayRoles.join(', ') : 'No roles'"></small>
                            </div>
                            <!-- Other members' actions -->
                            <div class="row gap-1" x-show="membership.userId !== $auth.user?.$id && ($auth.canUpdateMembers() || $auth.canRemoveMembers())">
                                <button class="sm" @click="$auth.startEditingMember(team.$id, membership.$id, membership.displayRoles || [])" :disabled="$auth.isActionDisabled('updateMembers')" aria-label="Edit member" x-icon="lucide:pencil" x-tooltip="Edit role"></button>
                                <button class="sm" @click="$auth.deleteMember(team.$id, membership.$id)" :disabled="$auth.isActionDisabled('removeMembers')" aria-label="Remove member" x-icon="lucide:trash" x-tooltip="Remove member"></button>
                            </div>
                            <!-- Your own actions -->
                            <div class="row gap-1" x-show="membership.userId === $auth.user?.$id">
                                <button class="sm" @click="$auth.startEditingMember(team.$id, membership.$id, membership.displayRoles || [])" :disabled="$auth.isActionDisabled('updateMembers')" aria-label="Edit my role" x-icon="lucide:pencil" x-tooltip="Edit role"></button>
                                <button class="sm" @click="$auth.leaveTeam(team.$id, membership.$id)" :disabled="$auth.isActionDisabled('removeMembers')" aria-label="Leave team" x-icon="lucide:log-out" x-tooltip="Leave team"></button>
                            </div>
                        </div>
                    </template>
                    <!-- Edit Mode -->
                    <template x-if="$auth.editingMember && $auth.editingMember.membershipId === membership.$id">
                        <div class="col gap-2">
                            <!-- Member info (read-only) -->
                            <div class="col">
                                <small>
                                <b x-text="$auth.getMemberDisplayName(membership)"></b>
                                </small>
                                <small x-text="$auth.getMemberEmail(membership)"></small>
                            </div>
                            <!-- Roles button -->
                            <button class="w-full" x-dropdown="`edit-member-roles-menu-${team.$id}-${membership.$id}`" :disabled="$auth.isActionDisabled('updateMembers')">
                                <span x-text="($auth.inviteRoles && $auth.inviteRoles.length > 0) ? $auth.inviteRoles.join(', ') : 'Roles'"></span>
                                <i class="trailing" x-icon="lucide:chevron-down"></i>
                            </button>
                            <!-- Roles dropdown -->
                            <menu popover :id="`edit-member-roles-menu-${team.$id}-${membership.$id}`">
                                <template x-for="(permissions, roleName) in $auth.allTeamRoles(team)" :key="roleName">
                                <label> <input type="checkbox" :checked="$auth.isInviteRoleSelected(roleName)" @change="$auth.toggleInviteRole(roleName)" :disabled="$auth.isActionDisabled('updateMembers')" /> <span x-text="roleName"></span> </label>
                                </template>
                                <input type="text" placeholder="Custom role" aria-label="Custom role" x-model="customRoleInput" @keydown.enter.prevent="$auth.addCustomInviteRoles(customRoleInput); customRoleInput = ''" :disabled="$auth.isActionDisabled('updateMembers')" />
                            </menu>
                            <!-- Save & Cancel buttons -->
                            <div class="row gap-2">
                                <button @click="$auth.saveEditingMember()" :disabled="$auth.isActionDisabled('updateMembers')" class="flex-1">Save</button>
                                <button @click="$auth.cancelEditingMember()" :disabled="$auth.isActionDisabled('updateMembers')" class="flex-1">Cancel</button>
                            </div>
                        </div>
                    </template>
                </div>
            </template>
            <!-- Invite Member -->
            <div class="row-wrap gap-2 mb-2">
                <input type="email" placeholder="Email to invite" class="w-full" x-model="$auth.inviteEmail" :disabled="$auth.isActionDisabled('inviteMembers') || $auth.isInvitingMember()" required />
                <button class="flex-1" x-dropdown="`invite-roles-menu-${team.$id}`" :disabled="$auth.isActionDisabled('inviteMembers') || $auth.isInvitingMember()">
                    <span x-text="($auth.inviteRoles && $auth.inviteRoles.length > 0) ? $auth.inviteRoles.join(', ') : 'Roles'"></span>
                    <i class="trailing" x-icon="lucide:chevron-down"></i>
                </button>
                <!-- Roles dropdown-->
                <menu popover :id="`invite-roles-menu-${team.$id}`">
                    <template x-for="(permissions, roleName) in $auth.allTeamRoles(team)" :key="roleName">
                        <label>
                            <input type="checkbox" :checked="$auth.isInviteRoleSelected(roleName)" @change="$auth.toggleInviteRole(roleName)" :disabled="!$auth.canInviteMembers() || $auth.isInvitingMember()" />
                            <span x-text="roleName"></span>
                        </label>
                    </template>
                </menu>    
                <button @click="$auth.inviteToCurrentTeam()" :disabled="!$auth.inviteEmail || $auth.isActionDisabled('inviteMembers') || !team || $auth.isInvitingMember()" class="w-fit">Invite</button>
            </div>
        </div>
    </details>
</template>
:::

<x-code-group numbers copy>

```html "Invite Members"
<!-- Email input -->
<input type="email" placeholder="Email" x-model="$auth.inviteEmail" :disabled="$auth.isActionDisabled('inviteMembers')" required />

<!-- Assign role(s) dropdown -->
<button x-dropdown="`invite-role-menu-${team.$id}`" :disabled="$auth.isActionDisabled('inviteMembers')" x-text="($auth.inviteRoles && $auth.inviteRoles.length > 0) ? $auth.inviteRoles[0] : 'Select role'"></button>
<menu popover :id="`invite-role-menu-${team.$id}`">
    <!-- List roles -->
    <template x-for="(permissions, roleName) in $auth.allTeamRoles(team)" :key="roleName">
        <label>
            <input type="radio" :name="`invite-role-${team.$id}`" :value="roleName" :checked="($auth.inviteRoles && $auth.inviteRoles.length > 0 && $auth.inviteRoles[0] === roleName)" @change="$auth.inviteRoles = [roleName]" :disabled="!$auth.canInviteMembers()" />
            <span x-text="roleName">Role name</span>
        </label>
    </template>
</menu>

<!-- Send invite email button -->
<button @click="$auth.inviteToCurrentTeam()" :disabled="!$auth.inviteEmail || $auth.isActionDisabled('inviteMembers')">Invite</button>
```

```html "List & Manage Members"
<!-- List members -->
<template x-for="membership in $auth.currentTeamMemberships" :key="membership.$id">
    <div>

        <!-- Member name -->
        <p x-text="$auth.getMemberDisplayName(membership)">Name</p>

        <!-- Member email -->
        <p x-text="$auth.getMemberEmail(membership)">Email</p>

        <!-- Member role -->
        <p x-text="(membership.displayRoles && membership.displayRoles.length > 0) ? membership.displayRoles.join(', ') : 'No roles'">Role</p>
        
        <!-- Role dropdown (enabled for users with updateMembers permission) -->
        <button x-dropdown="`member-role-menu-${team.$id}-${membership.$id}`" :disabled="(membership.userId !== $auth.user?.$id && ($auth.isActionDisabled('updateMembers') || !$auth.canUpdateMembers())) || $auth.isUpdatingMember(membership.$id)" x-show="membership.userId === $auth.user?.$id || $auth.canUpdateMembers()" x-text="(membership.displayRoles && membership.displayRoles.length > 0) ? membership.displayRoles[0] : 'No role'"</button>
        <menu popover :id="`member-role-menu-${team.$id}-${membership.$id}`">
            <!-- List roles -->
            <template x-for="(permissions, roleName) in $auth.allTeamRoles(team)" :key="roleName">
                <label>
                    <input type="radio" :name="`member-role-${team.$id}-${membership.$id}`" :value="roleName" :checked="(membership.displayRoles && membership.displayRoles.length > 0 && membership.displayRoles[0] === roleName)" @change="$auth.updateMembership(team.$id, membership.$id, [roleName])" :disabled="$auth.isUpdatingMember(membership.$id) || (membership.userId !== $auth.user?.$id && $auth.isActionDisabled('updateMembers'))" />
                    <span x-text="roleName">Role name</span>
                </label>
            </template>
        </menu>
        
        <!-- Delete button (enabled for users with removeMembers permission) -->
        <button @click="$auth.deleteMember(team.$id, membership.$id)" :disabled="$auth.isActionDisabled('removeMembers') || $auth.isDeletingMember(membership.$id)" x-show="membership.userId !== $auth.user?.$id && $auth.canRemoveMembers()">Remove</button>
        
        <!-- Leave button (for current user) -->
        <button @click="$auth.leaveTeam(team.$id, membership.$id)" :disabled="$auth.isDeletingMember(membership.$id)" x-show="membership.userId === $auth.user?.$id">Leave</button>

    </div>
</template>
```

</x-code-group>

---

## Properties

Teams use the same `$auth` magic property as users to expose authentication state and methods.

### Team State

| Property | Type | Description |
|----------|------|-------------|
| `$auth.teams` | array | Array of all user's teams |
| `$auth.currentTeam` | object \| null | Currently selected team |
| `$auth.currentTeamMemberships` | array | Members of the current team |
| `$auth.deletedTemplateTeams` | array | Array of deleted template team names (can be reapplied) |

---

### Input Properties

#### Team Inputs

| Property | Type | Description |
|----------|------|-------------|
| `$auth.newTeamName` | string | Input for creating teams |
| `$auth.updateTeamNameInput` | string | Input for renaming teams |

#### Member Inputs

| Property | Type | Description |
|----------|------|-------------|
| `$auth.inviteEmail` | string | Input for member invitations |
| `$auth.inviteRoles` | array | Array of selected roles for invitations |

#### Role Inputs

| Property | Type | Description |
|----------|------|-------------|
| `$auth.newRoleName` | string | Input for creating roles |
| `$auth.newRolePermissions` | array | Array of selected permissions for roles |
| `$auth.allAvailablePermissions` | array | Cached list of all available permissions |
| `$auth.editingRole` | object \| null | Current role being edited |
| `$auth.editingMember` | object \| null | Current member being edited |

---

### Team Management Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `$auth.createTeamFromName()` | None | Create a team using `newTeamName` property |
| `$auth.viewTeam(...)` | `team` (object) | Load team details and memberships |
| `$auth.updateCurrentTeamName()` | None | Update current team name using `updateTeamNameInput` property |
| `$auth.deleteTeam(...)` | `teamId` (string) | Delete a team |
| `$auth.duplicateTeam(...)` | `teamId` (string), `options` (object, optional) | Duplicate a team. Options: `newName`, `copyMembers`, `copyRoles`. Returns `{ success: boolean, team?: object, error?: string }`. Defaults: `copyMembers: false`, `copyRoles: false`, `newName: '{originalName} copy'` |
| `$auth.reapplyTemplateTeam(...)` | `teamName` (string) | Reapply a deleted template team |

---

### Member Management Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `$auth.inviteToCurrentTeam()` | None | Invite member using `inviteEmail` and `inviteRoles` properties |
| `$auth.startEditingMember(...)` | `teamId` (string), `membershipId` (string), `currentRoles` (array) | Start editing a member |
| `$auth.saveEditingMember()` | None | Save member edits |
| `$auth.cancelEditingMember()` | None | Cancel member editing |
| `$auth.deleteMember(...)` | `teamId` (string), `membershipId` (string) | Remove a member from team |
| `$auth.leaveTeam(...)` | `teamId` (string), `membershipId` (string) | Leave a team (user removes themselves) |

---

### Role Management Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `$auth.createRoleFromInputs(...)` | `teamId` (string) | Create a role using `newRoleName` and `newRolePermissions` properties |
| `$auth.startEditingRole(...)` | `teamId` (string), `roleName` (string) | Start editing a role |
| `$auth.saveEditingRole()` | None | Save role edits |
| `$auth.cancelEditingRole()` | None | Cancel role editing |
| `$auth.deleteUserRole(...)` | `teamId` (string), `roleName` (string) | Delete a role |

---

### Permission & Role Checks

| Method | Parameters | Description |
|--------|------------|-------------|
| `$auth.hasTeamPermission(...)` | `permission` (string) | Check if user has a team permission (async) |
| `$auth.hasTeamPermissionSync(...)` | `permission` (string) | Check if user has a team permission (synchronous) |
| `$auth.hasRole(...)` | `roleName` (string) | Check if user has a specific role |
| `$auth.getUserRole()` | None | Get user's primary role (async) |
| `$auth.getUserRoles()` | None | Get all user's roles (async) |
| `$auth.getCurrentTeamRoles()` | None | Get current user's roles in current team |
| `$auth.isCurrentTeamOwner()` | None | Check if user is owner of current team |
| `$auth.canManageRoles()` | None | Check if user can manage roles |
| `$auth.canInviteMembers()` | None | Check if user can invite members |
| `$auth.canUpdateMembers()` | None | Check if user can update members |
| `$auth.canRemoveMembers()` | None | Check if user can remove members |
| `$auth.isActionDisabled(...)` | `permission` (string) | Check if an action is disabled (combines `inProgress` and permission check) |

---

### Convenience Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `$auth.isTeamDeletable(...)` | `team` (object) | Check if a team can be deleted |
| `$auth.isTeamRenamable(...)` | `team` (object) | Check if a team can be renamed |
| `$auth.teamCreatedAt(...)` | `team` (object) | Formatted creation date |
| `$auth.teamUpdatedAt(...)` | `team` (object) | Formatted update date |
| `$auth.allTeamRoles(...)` | `team` (object, optional) | Get all roles for a team |
| `$auth.getMemberDisplayName(...)` | `membership` (object) | Get member display name |
| `$auth.getMemberEmail(...)` | `membership` (object) | Get member email |
| `$auth.isRoleBeingEdited(...)` | `teamId` (string), `roleName` (string) | Check if a role is being edited |
| `$auth.isRoleDeletable(...)` | `teamId` (string), `roleName` (string) | Check if a role can be deleted |
| `$auth.isRolePermanentSync(...)` | `teamId` (string), `roleName` (string) | Check if a role is permanent (synchronous) |

---

### Loading States

#### Team Operations

| Method | Parameters | Description |
|--------|------------|-------------|
| `$auth.isUpdatingTeam(...)` | `teamId` (string) | Check if a specific team is being updated. Returns `true` only for the team being updated, allowing other teams to remain interactive |
| `$auth.isDeletingTeam(...)` | `teamId` (string) | Check if a specific team is being deleted. Returns `true` only for the team being deleted |
| `$auth.isCreatingTeam()` | None | Check if a team is being created. Returns `true` when creating a new team |
| `$auth.isAnyTeamOperationInProgress()` | None | Check if any team operation is in progress. Useful for disabling general UI elements during any team operation |

#### Member Operations

| Method | Parameters | Description |
|--------|------------|-------------|
| `$auth.isUpdatingMember(...)` | `membershipId` (string) | Check if a specific member is being updated. Returns `true` only for the member being updated |
| `$auth.isDeletingMember(...)` | `membershipId` (string) | Check if a specific member is being deleted. Returns `true` only for the member being deleted |
| `$auth.isInvitingMember()` | None | Check if a member invitation is in progress. Returns `true` when inviting a member |
| `$auth.isAnyMemberOperationInProgress()` | None | Check if any member operation is in progress |

#### Role Operations

| Method | Parameters | Description |
|--------|------------|-------------|
| `$auth.isUpdatingRole(...)` | `teamId` (string), `roleName` (string) | Check if a specific role is being updated. Returns `true` only for the role being updated |
| `$auth.isDeletingRole(...)` | `teamId` (string), `roleName` (string) | Check if a specific role is being deleted. Returns `true` only for the role being deleted |
| `$auth.isCreatingRole()` | None | Check if a role is being created. Returns `true` when creating a new role |
| `$auth.isAnyRoleOperationInProgress()` | None | Check if any role operation is in progress |

---

### Permission Management

For role creation/editing.

| Method | Parameters | Description |
|--------|------------|-------------|
| `$auth.togglePermission(...)` | `permission` (string) | Toggle a permission in `newRolePermissions` |
| `$auth.isPermissionSelected(...)` | `permission` (string) | Check if a permission is selected |
| `$auth.addCustomPermissions(...)` | `inputValue` (string) | Add comma-separated custom permissions |
| `$auth.removePermission(...)` | `permission` (string) | Remove a permission from `newRolePermissions` |
| `$auth.clearPermissions()` | None | Clear all selected permissions |

---

### Role Selection

For invitations/member editing.

| Method | Parameters | Description |
|--------|------------|-------------|
| `$auth.toggleInviteRole(...)` | `roleName` (string) | Toggle a role in `inviteRoles` |
| `$auth.isInviteRoleSelected(...)` | `roleName` (string) | Check if a role is selected |
| `$auth.addCustomInviteRoles(...)` | `inputValue` (string) | Add comma-separated custom roles |
| `$auth.clearInviteRoles()` | None | Clear all selected roles |

---

## Next Steps

See [cloud data](/appwrite-plugins/cloud-data) for giving users access to databases and stored files.

And consider adding realtime [presence](/appwrite-plugins/presence) detection for users to see each other's live cursors or edits in shared UIs.