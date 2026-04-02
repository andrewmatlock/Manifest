/* Auth teams - Callback handlers */

// Handle team invitation callbacks via events
function handleTeamCallbacks() {
    // Handle team invitation callback
    window.addEventListener('manifest:auth:callback:team', async (event) => {
        const store = Alpine.store('auth');
        if (!store) {
            return;
        }

        const callbackInfo = event.detail;

        store.inProgress = true;
        store.error = null;

        try {
            // Accept the invitation
            if (store.acceptInvite) {
                const result = await store.acceptInvite(
                    callbackInfo.teamId,
                    callbackInfo.membershipId,
                    callbackInfo.userId,
                    callbackInfo.secret
                );

                if (result.success) {
                    window.dispatchEvent(new CustomEvent('manifest:auth:team:invite-accepted', {
                        detail: { membership: result.membership }
                    }));
                } else {
                    store.error = result.error;
                }
            }
        } catch (error) {
            store.error = error.message;
        } finally {
            store.inProgress = false;
        }
    });
}

// Initialize when Alpine is ready
document.addEventListener('alpine:init', () => {
    try {
        handleTeamCallbacks();
    } catch (error) {
        // Failed to initialize team callbacks
    }
});

// Also try immediately if Alpine is already available
if (typeof Alpine !== 'undefined') {
    try {
        handleTeamCallbacks();
    } catch (error) {
        // Alpine might not be fully initialized yet, that's okay
    }
}

// Export callbacks interface
window.ManifestAppwriteAuthTeamsCallbacks = {
    handleCallbacks: handleTeamCallbacks
};

