/**
 * modal-auth.js
 * Consolidated Authentication Controller for Fingerprint Site
 * Handles: Google Login/Signup, Email Login/Signup, Password Reset
 */

console.log("Auth Controller Loaded");

// --- Global Helpers for HTML onclick attributes ---
window.resetViaGoogle = async function () {
    console.log("Starting Google Verification for Password Reset...");
    if (!ensureFirebase()) return;

    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    try {
        // 1. Force Google Login to Verify Identity
        const result = await auth.signInWithPopup(googleProvider);
        window.verifiedUserForReset = result.user; // Store user globally for the next step

        console.log("User verified:", window.verifiedUserForReset.email);

        // 2. Switch UI to "New Password" Form
        const step1 = document.getElementById('loginStep1');
        const step2 = document.getElementById('resetPasswordStep2');

        if (step1 && step2) {
            step1.classList.add('d-none');
            step2.classList.remove('d-none');
        } else {
            console.error("Critical: Password reset wizard elements not found in DOM.");
            alert("Error: UI components missing. Please refresh the page.");
        }

    } catch (error) {
        console.error("Google Verification Error:", error);
        handleAuthError(error, "Verification Failed");
    }
};

window.resetViaEmail = async function () {
    if (!ensureFirebase()) return;

    const auth = firebase.auth();
    const userInput = document.getElementById('loginEmailOrPhone');
    let email = userInput ? userInput.value : '';

    if (!email || email.trim() === "") {
        email = prompt("Enter your registered email to receive the link:");
    }

    if (email) {
        try {
            auth.languageCode = 'en';
            await auth.sendPasswordResetEmail(email.trim());
            alert(`Link Sent!\n\nCheck ${email} (and Spam folder) for the reset link.`);
        } catch (error) {
            handleAuthError(error, "Password Reset Failed");
        }
    }
};


// --- Event Delegation for Dynamic Modals ---
document.addEventListener('click', async (e) => {
    // 1. Google Login Button
    if (e.target.closest('#googleLoginBtn')) {
        e.preventDefault();
        if (!ensureFirebase()) return;
        await performGoogleAuth(document.getElementById('loginModal'));
    }

    // 2. Google Signup Button
    if (e.target.closest('#googleSignupBtn')) {
        e.preventDefault();
        if (!ensureFirebase()) return;
        await performGoogleAuth(document.getElementById('signupModal'));
    }
});

// --- Form Submissions ---
document.addEventListener('submit', async (e) => {
    // 1. Email Login Form
    if (e.target.id === 'loginForm') {
        e.preventDefault();
        if (!ensureFirebase()) return;

        const email = document.getElementById('loginEmailOrPhone').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        await performEmailAuth(
            async () => firebase.auth().signInWithEmailAndPassword(email, password),
            submitBtn,
            "Signing in...",
            document.getElementById('loginModal'),
            null // No redirect, just reload
        );
    }

    // 2. Email Signup Form
    if (e.target.id === 'signupForm') {
        e.preventDefault();
        if (!ensureFirebase()) return;

        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const firstName = document.getElementById('signupFirstName').value;
        const lastName = document.getElementById('signupLastName').value;
        const phone = document.getElementById('signupPhone').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');

        await performEmailAuth(
            async () => {
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Update Profile
                await user.updateProfile({ displayName: `${firstName} ${lastName}` });

                // Persist Phone locally for profile usage
                localStorage.setItem('userProfile', JSON.stringify({ phone: phone }));

                // Send Verification
                await user.sendEmailVerification();
                alert(`Account created! Please check your email (${email}) to verify before booking.`);

                return userCredential; // RETURN THIS!
            },
            submitBtn,
            "Creating Account...",
            document.getElementById('signupModal'),
            null // No redirect, just reload
        );
    }

    // 3. New Password Form (Reset Flow)
    if (e.target.id === 'resetPasswordForm') {
        e.preventDefault();
        const newPassword = document.getElementById('newResetPassword').value;

        if (!window.verifiedUserForReset) {
            alert("Session expired. Please click 'Verify ID' again.");
            return;
        }
        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        try {
            await window.verifiedUserForReset.updatePassword(newPassword);
            alert("SUCCESS!\n\nYour password has been changed.\nYou are now logged in.");
            window.location.href = 'profile.html';
        } catch (error) {
            console.error("Update Password Error:", error);
            alert("Failed to update password: " + error.message);
        }
    }
});


// --- Helper Functions ---

function ensureFirebase() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        alert("System is still connecting to the server... please wait 2 seconds and try again.");
        return false;
    }
    return true;
}

async function performGoogleAuth(modalElement) {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;

        // Optimistic UI: Save to localStorage immediately
        const userProfile = {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            uid: user.uid
        };
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        localStorage.setItem('loginEvent', Date.now());

        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modal.hide();
        }

        // Reload to update UI clean
        window.location.reload();
    } catch (error) {
        console.error("Google Auth Error:", error);
        handleAuthError(error, "Google Sign-In Failed");
    }
}

async function performEmailAuth(authAction, submitBtn, loadingText, modalElement, redirectUrl) {
    const originalText = submitBtn.innerHTML;
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${loadingText}`;

        await authAction();

        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modal.hide();
        }

        // Redirect or Reload
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            window.location.reload();
        }

    } catch (error) {
        console.error("Auth Error:", error);
        handleAuthError(error, "Authentication Failed");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function handleAuthError(error, title) {
    let msg = error.message;
    if (error.code === 'auth/email-already-in-use') {
        msg = "This email is already registered. Please Sign In instead.";
    } else if (error.code === 'auth/wrong-password') {
        msg = "Incorrect password. Please try again or reset it.";
    } else if (error.code === 'auth/user-not-found') {
        msg = "No account found with this email. Please Sign Up.";
    } else if (error.code === 'auth/popup-closed-by-user') {
        return; // Ignore
    } else if (error.code === 'auth/unauthorized-domain') {
        msg = "This domain is not authorized in Firebase Console.";
    }
    alert(`${title}:\n\n${msg}`);
}
