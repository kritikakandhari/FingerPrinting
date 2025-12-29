/**
 * auth-check.js
 * Checks Firebase Auth state and updates UI accordingly.
 * Syncs Firebase user to localStorage for compatibility with legacy components.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Immediate UI Render (Optimistic)
    updateAuthUI();

    // 2. Listen for Auth State Changes
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                // User is signed in.
                // Check for temp signup data (phone number)
                const tempSignupData = JSON.parse(localStorage.getItem('tempSignupData')) || {};

                const userProfile = {
                    firstName: user.displayName ? user.displayName.split(' ')[0] : 'Member',
                    lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
                    email: user.email,
                    avatar: user.photoURL,
                    userId: user.uid,
                    phone: user.phoneNumber || tempSignupData.phone || existingProfile.phone || '',
                    emailVerified: user.emailVerified
                };

                // Clear temp data
                if (tempSignupData.phone) localStorage.removeItem('tempSignupData');
                localStorage.setItem('userProfile', JSON.stringify(userProfile));
                // Set token for checks
                localStorage.setItem('authToken', 'firebase-token');
            } else {
                // User is signed out.
                localStorage.removeItem('userProfile');
                localStorage.removeItem('authToken');
            }
            // Update UI based on the new localStorage state
            updateAuthUI();
        });
    } else {
        console.error("Firebase not loaded! Auth check failed.");
        updateAuthUI();
    }

    // --- Sync State Across Tabs ---
    // This listener fires when localStorage is modified in ANOTHER tab/window.
    window.addEventListener('storage', (event) => {
        if (event.key === 'userProfile' || event.key === 'authToken' || event.key === 'logoutEvent' || event.key === 'loginEvent') {
            console.log("Auth state changed in another tab. Syncing...");
            // Reload to ensure full UI/logic reset (safest for auth changes)
            window.location.reload();
        }
    });
});

function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('userProfile'));

    // Selectors by ID
    const navSignIn = document.getElementById('navLinkSignIn');
    const navSignUp = document.getElementById('navLinkSignUp');
    const navProfile = document.getElementById('navLinkProfile');
    const navLogout = document.getElementById('navLinkLogout');

    // Booking Buttons (Global Class Selector)
    // Booking Buttons Logic Removed - Allowing Direct Guest Access
    // The buttons in HTML should now be hardcoded to href="book.html"
}

async function handleLogout(e) {
    if (e) e.preventDefault();
    console.log("Logging out started...");

    // 1. Force a storage event for OTHER tabs
    localStorage.setItem('logoutEvent', Date.now());

    // 2. Clear Local Storage (The UI state)
    localStorage.removeItem('userProfile');
    localStorage.removeItem('authToken');
    localStorage.removeItem('tidycal_booking_data');

    // 3. Attempt Firebase SignOut (Fire & Forget logic with safety)
    if (typeof firebase !== 'undefined' && firebase.auth) {
        // We do NOT await this indefinitely to prevent hanging.
        firebase.auth().signOut().catch(err => console.error("Firebase SignOut Warning:", err));
    }

    // 4. Force Redirect immediately/shortly
    // We don't wait for Firebase network request to finish.
    // The local storage clear is enough to "sign out" the user on this device.
    setTimeout(() => {
        console.log("Reloading to clear state...");
        sessionStorage.setItem('showAuthPreloader', 'true');
        window.location.reload();
    }, 100);
}

