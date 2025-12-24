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

            // Simulate API Call (Client-Side Auth Logic)
            setTimeout(() => {
                // Fetch registered users from storage
                const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];

                // Find user by email (case insensitive)
                const validUser = users.find(u => u.email.toLowerCase() === emailOrPhone.toLowerCase() && u.password === password);

                if (validUser) {
                    // Login Success
                    localStorage.setItem('authToken', 'mock-token-' + Date.now());
                    localStorage.setItem('userProfile', JSON.stringify(validUser));

                    alert('Login successful! Welcome back, ' + validUser.firstName);

                    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    modal.hide();

                    // Redirect to Booking Page
                    window.location.href = 'book.html';
                } else {
                    // Login Failed
                    const userExists = users.some(u => u.email.toLowerCase() === emailOrPhone.toLowerCase());
                    if (userExists) {
                        alert('Incorrect password. Please try again.');
                    } else {
                        alert('Account not found. Please Sign Up first.');
                    }
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }, 1000);
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
            const phone = document.getElementById('signupPhone').value;
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
                const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];

                // Check if already exists
                if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                    alert('This email is already registered. Please Login.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    return;
                }

                const newUser = {
                    firstName,
                    lastName,
                    email,
                    phone,
                    password, // In a real app, never store plain text passwords!
                    userId: 'FP-' + Math.floor(100000 + Math.random() * 900000),
                    joined: new Date().toISOString()
                };

                // Save to "DB"
                users.push(newUser);
                localStorage.setItem('registeredUsers', JSON.stringify(users));

                // Auto-login after signup
                localStorage.setItem('authToken', 'mock-token-' + Date.now());
                localStorage.setItem('userProfile', JSON.stringify(newUser));

                alert('Account created successfully! Your User ID is ' + newUser.userId);

                const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
                signupModal.hide();

                window.location.href = 'book.html';

            }, 1500);
        });
    }
});
