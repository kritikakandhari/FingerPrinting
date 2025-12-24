// Modal Authentication JavaScript Handler
// Handles form submissions for Login and Signup modals

document.addEventListener('DOMContentLoaded', function () {
    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const emailOrPhone = document.getElementById('loginEmailOrPhone').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';

            // Simulate API Call (Mocking Auth)
            setTimeout(() => {
                // Mock success
                const isSuccess = true;

                if (isSuccess) {
                    // Store mock token
                    localStorage.setItem('authToken', 'mock-token-12345');

                    alert('Login successful!');
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    modal.hide();

                    // Redirect to Booking Page as requested
                    window.location.href = 'book.html';
                } else {
                    alert('Login failed. Please check your credentials.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }, 1500);
        });
    }

    // Signup Form Handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;

            // Validate passwords match
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating account...';

            // Simulate API Call
            setTimeout(() => {
                alert('Account created successfully! Logging you in...');

                localStorage.setItem('authToken', 'mock-token-12345');

                const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
                signupModal.hide();

                // Redirect directly to booking after signup, for smoother UX
                window.location.href = 'book.html';

            }, 1500);
        });
    }
});
