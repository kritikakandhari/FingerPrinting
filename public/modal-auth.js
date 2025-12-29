/**
 * modal-auth.js
 * Consolidated Authentication Controller for Fingerprint Site
 * Handles: Google Login/Signup, Email Login/Signup, Password Reset
 * Implements: Synchronous Persistence Pattern to prevent login loops.
 */

console.log("Auth Controller Loaded");

/**
 * CORE AUTH HANDLER
 * Wraps all auth operations to ensure consistent state saving.
 */
async function executeSecureAuth(actionName, authFunction, submitBtn = null, modalId = null) {
    let originalBtnText = "";
    if (submitBtn) {
        originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;
    }

    try {
        if (!ensureFirebase()) throw new Error("System connecting... please try again.");

        console.log(`Starting Auth Action: ${actionName}`);

        // 1. EXECUTE (and await the UserCredential)
        const credential = await authFunction();
        const user = credential.user;

        if (!user) throw new Error("Authentication succeeded but no user returned.");

        console.log("Auth Successful, User:", user.email);

        // 2. PERSIST (Synchronously save to LocalStorage)
        // This is critical. We do this BEFORE reload/redirect to ensure data exists.
        const userProfile = {
            displayName: user.displayName || 'Member',
            email: user.email,
            photoURL: user.photoURL,
            uid: user.uid,
            emailVerified: user.emailVerified
        };

        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        localStorage.setItem('authToken', 'firebase-token-simulated'); // For auth-check.js
        localStorage.setItem('loginEvent', Date.now()); // Trigger other tabs

        console.log("User Profile Saved to LocalStorage");

        // 3. UI CLEANUP
        if (modalId) {
            const modalEl = document.getElementById(modalId);
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();
            }
        }

        // 4. RELOAD (To reflect state)
        // We use reload to ensure all vanilla JS scripts re-run with the new auth state.
        window.location.reload();

    } catch (error) {
        console.error("Auth Failed:", error);
        handleAuthError(error, actionName);

        // Reset Button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}


// --- Event Delegation ---

document.addEventListener('click', async (e) => {
    // 1. Google Login
    if (e.target.closest('#googleLoginBtn')) {
        e.preventDefault();
        await executeSecureAuth(
            "Google Login",
            () => firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()),
            null,
            'loginModal'
        );
    }

    // 2. Google Signup
    if (e.target.closest('#googleSignupBtn')) {
        e.preventDefault();
        await executeSecureAuth(
            "Google Signup",
            () => firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()),
            null,
            'signupModal'
        );
    }
});

// --- Form Submissions ---

document.addEventListener('submit', async (e) => {

    // 1. Email Login
    if (e.target.id === 'loginForm') {
        e.preventDefault();
        const email = document.getElementById('loginEmailOrPhone').value;
        const password = document.getElementById('loginPassword').value;
        const btn = e.target.querySelector('button[type="submit"]');

        await executeSecureAuth(
            "Email Login",
            () => firebase.auth().signInWithEmailAndPassword(email, password),
            btn,
            'loginModal'
        );
    }

    // 2. Email Signup
    if (e.target.id === 'signupForm') {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirm = document.getElementById('signupConfirmPassword').value;
        const first = document.getElementById('signupFirstName').value;
        const last = document.getElementById('signupLastName').value;
        const phone = document.getElementById('signupPhone').value;
        const btn = e.target.querySelector('button[type="submit"]');

        if (password !== confirm) {
            alert("Passwords do not match!");
            return;
        }

        await executeSecureAuth(
            "Email Signup",
            async () => {
                // Custom flow: Create -> Update Profile -> Return Credential
                const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);

                // Important: Update the user object on the server
                await cred.user.updateProfile({ displayName: `${first} ${last}` });

                // Send verification (fire and forget)
                cred.user.sendEmailVerification().catch(err => console.error("Verif Email Error", err));

                // Save extra data partially (Phone) - will be merged in auth-check
                // We don't want to overwrite the main profile yet, let executeSecureAuth handle it
                // But we need 'phone' available.
                const tempProfile = { phone: phone };
                localStorage.setItem('tempSignupData', JSON.stringify(tempProfile));

                return cred; // MUST return credential
            },
            btn,
            'signupModal'
        );
    }

    // 3. Password Reset (New Password Submission)
    if (e.target.id === 'resetPasswordForm') {
        e.preventDefault();
        const pwd = document.getElementById('newResetPassword').value;
        if (!window.verifiedUserForReset) return alert("Session expired. Verify ID again.");
        if (pwd.length < 6) return alert("Password must be 6+ chars.");

        try {
            await window.verifiedUserForReset.updatePassword(pwd);
            alert("Password updated! You are now logged in.");
            window.location.href = 'profile.html';
        } catch (err) {
            handleAuthError(err, "Update Password");
        }
    }
});


// --- Helpers ---

window.resetViaGoogle = async function () {
    if (!ensureFirebase()) return;
    try {
        const res = await firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
        window.verifiedUserForReset = res.user;
        document.getElementById('loginStep1').classList.add('d-none');
        document.getElementById('resetPasswordStep2').classList.remove('d-none');
    } catch (err) {
        handleAuthError(err, "Google Verification");
    }
};

window.resetViaEmail = async function () {
    if (!ensureFirebase()) return;
    const email = document.getElementById('loginEmailOrPhone').value || prompt("Enter email:");
    if (!email) return;
    try {
        await firebase.auth().sendPasswordResetEmail(email);
        alert(`Reset link sent to ${email}`);
    } catch (err) {
        handleAuthError(err, "Reset Email");
    }
};

function ensureFirebase() {
    return (typeof firebase !== 'undefined' && firebase.auth);
}

function handleAuthError(error, title) {
    let msg = error.message;
    if (error.code === 'auth/email-already-in-use') msg = "Email already registered. Please Sign In.";
    if (error.code === 'auth/wrong-password') msg = "Incorrect password.";
    if (error.code === 'auth/user-not-found') msg = "No account found. Please Sign Up.";
    if (error.code === 'auth/popup-closed-by-user') return;

    alert(`${title} Failed:\n\n${msg}`);
}
