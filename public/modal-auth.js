// Modal Authentication JavaScript Handler
// Handles form submissions for Login and Signup modals

document.addEventListener('DOMContentLoaded', function() {
    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const emailOrPhone = document.getElementById('loginEmailOrPhone').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        emailOrPhone, 
                        password, 
                        rememberMe 
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('Login successful!');
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    modal.hide();
                    // Redirect or update UI
                    window.location.href = 'book.html';
                } else {
                    alert(data.message || 'Login failed. Please check your credentials.');
                }
            } catch (err) {
                console.error('Login error:', err);
                alert('Connection error. Please ensure the server is running.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
    
    // Signup Form Handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const firstName = document.getElementById('signupFirstName').value;
            const lastName = document.getElementById('signupLastName').value;
            const email = document.getElementById('signupEmail').value;
            const phone = document.getElementById('signupPhone').value;
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
            
            try {
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        firstName, 
                        lastName, 
                        email, 
                        phone, 
                        password 
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('Account created successfully! Please login.');
                    // Close signup modal and open login modal
                    const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
                    signupModal.hide();
                    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                    loginModal.show();
                    // Reset form
                    this.reset();
                } else {
                    alert(data.message || 'Signup failed. Please try again.');
                }
            } catch (err) {
                console.error('Signup error:', err);
                alert('Connection error. Please ensure the server is running.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});
