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
                    // Create Mock User Profile if not exists
                    const mockUser = {
                        firstName: 'Demo',
                        lastName: 'User',
                        email: emailOrPhone,
                        userId: 'FP-' + Math.floor(100000 + Math.random() * 900000)
                    };

                    localStorage.setItem('authToken', 'mock-token-12345');
                    localStorage.setItem('userProfile', JSON.stringify(mockUser));

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

            const firstName = document.getElementById('signupFirstName').value;
            const lastName = document.getElementById('signupLastName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;

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
                const newUser = {
                    firstName,
                    lastName,
                    email,
                    userId: 'FP-' + Math.floor(100000 + Math.random() * 900000)
                };

                localStorage.setItem('authToken', 'mock-token-12345');
                localStorage.setItem('userProfile', JSON.stringify(newUser));

                alert('Account created successfully! User ID: ' + newUser.userId);

                const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
                signupModal.hide();

                window.location.href = 'book.html';

            }, 1500);
        });
    }
});
