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
            // Auth state change is handled in auth-check.js
            const modalEl = document.getElementById('loginModal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
            window.location.href = 'book.html';
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            alert("Google Sign-In failed: " + error.message);
        }
    }

    // --- Google Sign-In (Signup Modal) ---
    if (e.target.closest('#googleSignupBtn')) {
        try {
            const result = await auth.signInWithPopup(googleProvider);
            const modalEl = document.getElementById('signupModal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
            window.location.href = 'profile.html';
        } catch (error) {
            console.error("Google Sign-Up Error:", error);
            alert("Google Sign-Up failed: " + error.message);
        }
    }

    // --- Forgot Password ---
    if (e.target.closest('#forgotPasswordBtn')) {
        e.preventDefault();
        const emailInput = document.getElementById('loginEmailOrPhone');
        let email = emailInput ? emailInput.value : '';

        if (!email) {
            // User friendly: Ask for email if they didn't type it yet
            email = prompt("Please enter your email address to reset your password:");
        }

        if (email) {
            try {
                await auth.sendPasswordResetEmail(email);
                alert(`Password reset link sent to ${email}.\nPlease check your Inbox (and Spam folder).`);
            } catch (error) {
                console.error("Password Reset Error:", error);
                alert("Error sending reset email: " + error.message);
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
