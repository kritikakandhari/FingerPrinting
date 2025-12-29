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
                const existingProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
                const userProfile = {
                    firstName: user.displayName ? user.displayName.split(' ')[0] : 'Member',
                    lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
                    email: user.email,
                    avatar: user.photoURL,
                    userId: user.uid,
                    phone: user.phoneNumber || existingProfile.phone || '', // Persist phone if exists locally
                    emailVerified: user.emailVerified
                };
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
    const bookingBtns = document.querySelectorAll('.btn-brand-green.btn-aura'); // Matches the "Book Appointment" buttons

    if (user) {
        // --- LOGGED IN STATE ---
        if (navSignIn) navSignIn.classList.add('d-none');
        if (navSignUp) navSignUp.classList.add('d-none');

        if (navProfile) navProfile.classList.remove('d-none');
        if (navLogout) navLogout.classList.remove('d-none');

        // Bind Logout
        const navLogoutBtn = document.getElementById('navLogoutBtn');
        if (navLogoutBtn) {
            navLogoutBtn.removeEventListener('click', handleLogout);
            navLogoutBtn.addEventListener('click', handleLogout);
        }

        // Bind Logout (Firebase SignOut) - Sidebar (Profile Page)
        const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
        if (sidebarLogoutBtn) {
            sidebarLogoutBtn.removeEventListener('click', handleLogout);
            sidebarLogoutBtn.addEventListener('click', handleLogout);
        }

        // Smart Booking Buttons: Direct to book.html
        bookingBtns.forEach(btn => {
            // Only modify if it was originally a modal trigger
            if (btn.getAttribute('data-bs-toggle') === 'modal') {
                btn.removeAttribute('data-bs-toggle');
                btn.removeAttribute('data-bs-target');
                btn.href = 'book.html';
                // Clone to remove old listeners if any, or just add new one
                // Since we removed data attributes, bootstrap modal won't trigger. 
                // We add a simple click handler to be safe.
                btn.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = 'book.html';
                };
            }
        });

    } else {
        // --- LOGGED OUT STATE ---
        if (navSignIn) navSignIn.classList.remove('d-none');
        if (navSignUp) navSignUp.classList.remove('d-none');

        if (navProfile) navProfile.classList.add('d-none');
        if (navLogout) navLogout.classList.add('d-none');

        // Reset Booking Buttons: Open Login Modal
        bookingBtns.forEach(btn => {
            // Only restore if it's currently pointing to book.html (i.e. was modified)
            if (!btn.getAttribute('data-bs-toggle') && btn.href.includes('book.html')) {
                btn.setAttribute('data-bs-toggle', 'modal');
                btn.setAttribute('data-bs-target', '#loginModal');
                btn.href = '#';
                btn.onclick = null; // Remove the direct redirect
            }
        });
    }
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
        console.log("Redirecting to home...");
        window.location.href = 'index.html';
    }, 100);
}
```
