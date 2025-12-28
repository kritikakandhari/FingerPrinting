// Modal Authentication JavaScript Handler (Firebase Version)
document.addEventListener('DOMContentLoaded', function () {
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    // --- Google Sign-In (Login Modal) ---
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            try {
                await auth.signInWithPopup(googleProvider);
                // Auth state change is handled in auth-check.js
                bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
                window.location.href = 'book.html';
            } catch (error) {
                console.error("Google Sign-In Error:", error);
                alert("Google Sign-In failed: " + error.message);
            }
        });
    }

    // --- Google Sign-In (Signup Modal) ---
    const googleSignupBtn = document.getElementById('googleSignupBtn');
    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', async () => {
            try {
                const result = await auth.signInWithPopup(googleProvider);
                // You can save additional user info to Firestore here if needed
                bootstrap.Modal.getInstance(document.getElementById('signupModal')).hide();
                window.location.href = 'profile.html';
            } catch (error) {
                console.error("Google Sign-Up Error:", error);
                alert("Google Sign-Up failed: " + error.message);
            }
        });
    }

    // --- Email Login ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const email = document.getElementById('loginEmailOrPhone').value;
            const password = document.getElementById('loginPassword').value;
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';

                await auth.signInWithEmailAndPassword(email, password);

                bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
                window.location.href = 'book.html';
            } catch (error) {
                console.error("Login Error:", error);
                alert("Login failed: " + error.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // --- Email Signup ---
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;
            const firstName = document.getElementById('signupFirstName').value;
            const lastName = document.getElementById('signupLastName').value;
            const phone = document.getElementById('signupPhone').value; // Store in profile if needed?

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            const submitBtn = this.querySelector('button[type="submit"]');
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
                    // photoURL: ... if you want
                });

                // 3. Send Verification Email
                await user.sendEmailVerification();
                alert(`Account created! A verification email has been sent to ${email}. Please verify before booking.`);

                bootstrap.Modal.getInstance(document.getElementById('signupModal')).hide();
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
        });
    }
});
