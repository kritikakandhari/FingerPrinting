/**
 * auth-check.js
 * Checks localStorage for active session and updates UI accordingly.
 * Runs on every page.
 */

document.addEventListener('DOMContentLoaded', updateAuthUI);
window.addEventListener('pageshow', updateAuthUI); // Handle back/forward cache

function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('userProfile'));
    const navbarNav = document.querySelector('.navbar-nav');

    if (!navbarNav) return;

    // Remove existing auth buttons if we need to re-render
    // Strategy: Look for specific links we want to toggle

    const signInLink = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Sign In'));
    const signUpLink = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Sign Up'));
    const profileLink = Array.from(document.querySelectorAll('a')).find(a => a.href.includes('profile.html'));

    if (user) {
        // User is Logged In
        if (signInLink && signInLink.parentElement.tagName === 'LI') signInLink.parentElement.remove();
        if (signUpLink && signUpLink.parentElement.tagName === 'LI') signUpLink.parentElement.remove();

        // Ensure Profile Link exists (if not already there)
        if (!profileLink) {
            const profileLi = document.createElement('li');
            profileLi.className = 'nav-item';
            profileLi.innerHTML = `<a class="nav-link text-brand-green fw-bold" href="profile.html">My Profile</a>`;

            // Insert before the last item (Book Appointment button usually)
            const lastItem = navbarNav.lastElementChild;
            if (lastItem) navbarNav.insertBefore(profileLi, lastItem);
        }

        // Add Logout Button if not exists
        if (!document.getElementById('navLogoutBtn')) {
            const logoutLi = document.createElement('li');
            logoutLi.className = 'nav-item';
            logoutLi.innerHTML = `
                <button id="navLogoutBtn" class="btn btn-link nav-link text-danger fw-medium" style="text-decoration: none;">
                    <i class="fa-solid fa-right-from-bracket"></i> Logout
                </button>
            `;
            const lastItem = navbarNav.lastElementChild;
            if (lastItem) navbarNav.insertBefore(logoutLi, lastItem);

            // Bind Logout
            document.getElementById('navLogoutBtn').addEventListener('click', () => {
                localStorage.removeItem('userProfile');
                localStorage.removeItem('authToken');
                window.location.reload();
            });
        }
    } else {
        // User is Logged Out
        // Ensure Profile/Logout are gone
        if (profileLink && profileLink.parentElement.tagName === 'LI') profileLink.parentElement.remove();
        const logoutBtn = document.getElementById('navLogoutBtn');
        if (logoutBtn && logoutBtn.parentElement.tagName === 'LI') logoutBtn.parentElement.remove();

        // Ensure Sign In / Sign Up exist (This part is tricky if they were removed; 
        // ideally we just toggle visibility classes, but for now assuming page reload resets them 
        // or we just don't remove them if we are doing clean SPA style, but this is multi-page. 
        // Since we reload pages, the original HTML comes back, so we just need to remove them if (user) exists.)
        // So the 'else' block is actually just "do nothing" or "remove profile link if it accidentally persisted".
    }
}
