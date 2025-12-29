// Make it global so onclick works reliably
window.triggerResetPassword = async function () {
    console.log("Global Trigger Reset Password");
    if (typeof firebase === 'undefined' || !firebase.auth) {
        alert("System is still loading... please wait 2 seconds.");
        return;
    }
    const auth = firebase.auth();
    const emailInput = document.getElementById('loginEmailOrPhone');
    let email = emailInput ? emailInput.value : '';

    if (!email) {
        email = prompt("Please enter your registered email address:");
    }

    if (email) {
        try {
            auth.languageCode = 'en';
            await auth.sendPasswordResetEmail(email.trim());
            alert(`SUCCESS! Password reset link sent to: ${email}\n\nPlease check your Inbox (and Spam folder).`);
        } catch (error) {
            console.error("Password Reset Error:", error);
            if (error.code === 'auth/user-not-found') {
                alert("Error: No account found with this email. Please Sign Up first.");
            } else {
                alert("Error sending reset email: " + error.message);
            }
        }
    }
};

// Modal Authentication JavaScript Handler (Firebase Version)
// Using Event Delegation because modals are loaded dynamically via fetch()

console.log("Modal Auth Script Loaded (v2)");

document.addEventListener('click', async (e) => {
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.error("Firebase SDK not loaded yet.");
        if (e.target.closest('#googleLoginBtn') || e.target.closest('#googleSignupBtn')) {
            alert("System is still loading... please wait 2 seconds and try again.");
        }
        return;
    }

    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    // --- Google Sign-In (Login Modal) ---
    if (e.target.closest('#googleLoginBtn')) {
        console.log("Google Login Clicked");
        try {
            await auth.signInWithPopup(googleProvider);
            // Force Sync
            localStorage.setItem('loginEvent', Date.now());
            // Auth state change is handled in auth-check.js
            const modalEl = document.getElementById('loginModal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
            window.location.reload(); // Force reload to clarify state
        } catch (error) {
            console.error("Google Sign-In Error:", error);

            // DIAGNOSTIC ERROR MESSAGES
            if (error.code === 'auth/unauthorized-domain') {
                alert("CONFIGURATION ERROR:\n\nThis website domain is blocked by Firebase.\n\nFIX:\n1. Go to Firebase Console > Authentication > Settings.\n2. Scroll to 'Authorized domains'.\n3. Add this domain: finger-printing.vercel.app");
            } else if (error.code === 'auth/operation-not-allowed' || error.message.includes('restricted') || error.message.includes('invalid')) {
                alert("CONFIGURATION ERROR:\n\nGoogle Sign-In is DISABLED in Firebase.\n\nFIX:\n1. Go to Firebase Console > Authentication > Sign-in method.\n2. Click 'Google'.\n3. Toggle 'Enable' to ON.\n4. Click Save.");
            } else if (error.code === 'auth/popup-closed-by-user') {
                // Ignore popup closed
            } else {
                alert("Google Sign-In Failed:\n" + error.message);
            }
        }
    }

    // --- Google Sign-In (Signup Modal) ---
    if (e.target.closest('#googleSignupBtn')) {
        try {
            const result = await auth.signInWithPopup(googleProvider);
            // Force Sync
            localStorage.setItem('loginEvent', Date.now());

            const modalEl = document.getElementById('signupModal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
            window.location.reload(); // Force reload
        } catch (error) {
            console.error("Google Sign-Up Error:", error);

            if (error.code === 'auth/unauthorized-domain') {
                alert("CONFIGURATION ERROR:\n\nThis website domain is blocked by Firebase.\n\nFIX:\n1. Go to Firebase Console > Authentication > Settings.\n2. Scroll to 'Authorized domains'.\n3. Add this domain: finger-printing.vercel.app");
            } else if (error.code === 'auth/operation-not-allowed' || error.message.includes('restricted') || error.message.includes('invalid')) {
                alert("CONFIGURATION ERROR:\n\nGoogle Sign-In is DISABLED in Firebase.\n\nFIX:\n1. Go to Firebase Console > Authentication > Sign-in method.\n2. Click 'Google'.\n3. Toggle 'Enable' to ON.\n4. Click Save.");
            } else if (error.code === 'auth/popup-closed-by-user') {
                // Ignore
            } else {
                alert("Google Sign-Up Failed:\n" + error.message);
            }
        }
    }

    // --- Forgot Password ---
    if (e.target.closest('#forgotPasswordBtn')) {
        e.preventDefault();
        console.log("Forgot Password Clicked");

        const emailInput = document.getElementById('loginEmailOrPhone');
        let email = emailInput ? emailInput.value : '';

        if (!email) {
            email = prompt("Please enter your registered email address:");
        }

        if (email) {
            try {
                // Ensure language is set
                auth.languageCode = 'en';
                await auth.sendPasswordResetEmail(email.trim());
                alert(`SUCCESS! Password reset link sent to: ${email}\n\nPlease check your Inbox (and Spam folder).`);
            } catch (error) {
                console.error("Password Reset Error:", error);
                if (error.code === 'auth/user-not-found') {
                    alert("Error: No account found with this email. Please Sign Up first.");
                } else {
                    alert("Error sending reset email: " + error.message);
                }
            }
        }
    }
});

document.addEventListener('submit', async (e) => {
    const auth = firebase.auth();

    // --- Email Login ---
    if (e.target.id === 'loginForm') {
        e.preventDefault();
        const email = document.getElementById('loginEmailOrPhone').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';

            await auth.signInWithEmailAndPassword(email, password);

            const modalEl = document.getElementById('loginModal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
            window.location.href = 'book.html';
        } catch (error) {
            console.error("Login Error:", error);
            alert("Login failed: " + error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    // --- Email Signup ---
    if (e.target.id === 'signupForm') {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const firstName = document.getElementById('signupFirstName').value;
        const lastName = document.getElementById('signupLastName').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating account...';

            // 1. Create User
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // 2. Update Profile (Display Name)
            await user.updateProfile({
                displayName: `${firstName} ${lastName}`,
            });

            // Save phone to localStorage so auth-check.js can pick it up
            const phone = document.getElementById('signupPhone').value;
            localStorage.setItem('userProfile', JSON.stringify({
                phone: phone
            }));

            // 3. Send Verification Email
            await user.sendEmailVerification();
            alert(`Account created! A verification email has been sent to ${email}. Please verify before booking.`);

            const modalEl = document.getElementById('signupModal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
            window.location.href = 'profile.html';

        } catch (error) {
            console.error("Signup Error:", error);
            let msg = "Signup failed: " + error.message;
            if (error.code === 'auth/email-already-in-use') {
                msg = "This email is already registered. Please Sign In.";
            }
            alert(msg);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
});
