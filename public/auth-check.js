/**
 * auth-check.js
 * Checks Firebase Auth state and updates UI accordingly.
 * Syncs Firebase user to localStorage for compatibility with legacy components.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Listen for Auth State Changes
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
                localStorage.setItem('authToken', 'firebase-token'); // Dummy token for checks
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
        if (event.key === 'userProfile' || event.key === 'authToken') {
            console.log("Auth state changed in another tab. Syncing...");
            // Reload to ensure full UI/logic reset (safest for auth changes)
            window.location.reload();
        }
    });
});

function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('userProfile'));
    const navbarNav = document.querySelector('.navbar-nav');

    if (!navbarNav) return;

    // --- Selectors ---
    const signInLink = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Sign In'));
    const signUpLink = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Sign Up'));
    const profileLink = Array.from(document.querySelectorAll('a')).find(a => a.href.includes('profile.html'));

    if (user) {
        // --- LOGGED IN STATE ---

        // Remove Sign In / Sign Up links
        if (signInLink && signInLink.parentElement.tagName === 'LI') signInLink.parentElement.remove();
        if (signUpLink && signUpLink.parentElement.tagName === 'LI') signUpLink.parentElement.remove();

        // Add 'My Profile' link if missing
        if (!profileLink) {
            const profileLi = document.createElement('li');
            profileLi.className = 'nav-item';
            profileLi.innerHTML = `<a class="nav-link text-brand-green fw-bold" href="profile.html">My Profile</a>`;
            const lastItem = navbarNav.lastElementChild;
            if (lastItem) navbarNav.insertBefore(profileLi, lastItem);
        }

        // Add 'Logout' button if missing
        if (!document.getElementById('navLogoutBtn')) {
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item';
            logoutLi.innerHTML = `
                <button id="navLogoutBtn" class="btn btn-link nav-link text-danger fw-medium" style="text-decoration: none;">
                    <i class="fa-solid fa-right-from-bracket"></i> Sign Out
                </button>
            `;
            const lastItem = navbarNav.lastElementChild;
            if (lastItem) navbarNav.insertBefore(logoutLi, lastItem);

            // Bind Logout (Firebase SignOut)
            document.getElementById('navLogoutBtn').addEventListener('click', async (e) => {
                e.preventDefault();
                const btn = e.target.closest('button');
                const originalText = btn.innerHTML;
                btn.innerHTML = 'Signing out...';
                btn.disabled = true;

                try {
                    await firebase.auth().signOut();
                } catch (error) {
                    console.error("Logout Error:", error);
                } finally {
                    localStorage.removeItem('userProfile');
                    localStorage.removeItem('authToken');
                    window.location.reload();
                }
            });
        }

        // Smart Booking Buttons (Direct to book.html)
        const bookingBtns = document.querySelectorAll('a[data-bs-target="#loginModal"]');
        bookingBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            newBtn.removeAttribute('data-bs-toggle');
            newBtn.removeAttribute('data-bs-target');
            newBtn.href = 'book.html';
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'book.html';
            });
            if (btn.parentNode) btn.parentNode.replaceChild(newBtn, btn);
        });

    } else {
        // --- LOGGED OUT STATE ---

        // Remove Profile / Logout
        if (profileLink && profileLink.parentElement.tagName === 'LI') profileLink.parentElement.remove();
        const logoutBtn = document.getElementById('navLogoutBtn');
        if (logoutBtn && logoutBtn.parentElement.tagName === 'LI') logoutBtn.parentElement.remove();

        // Note: We don't re-add Sign In/Up links dynamically because we rely on page reload or 
        // the fact that they exist in the static HTML. If they were removed, a reload might be needed 
        // or we could reconstruct them, but typically a reload on logout handles this reset.
    }
}
