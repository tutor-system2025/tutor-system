// Wait for DOM to be fully loaded before running any setup
document.addEventListener("DOMContentLoaded", () => {
    // Minimal state
    let currentUser = null;
    const API_BASE = 'https://tutorial-signup-d60837d8fe04.herokuapp.com/api';

    // Show/hide helpers
    function showLogin() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('dashboard').style.display = 'none';
    }
    function showRegister() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
    }
    function showDashboard() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('userName').textContent = currentUser ? currentUser.firstName : '';
    }
    function displayAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        const alertContainer = document.getElementById('alert-container');
        if (alertContainer) {
            alertContainer.appendChild(alertDiv);
        } else {
            document.body.appendChild(alertDiv);
        }
        setTimeout(() => { if (alertDiv.parentNode) alertDiv.remove(); }, 5000);
    }
    function setToken(token) { localStorage.setItem('token', token); }
    function getToken() { return localStorage.getItem('token'); }
    function clearAuth() { localStorage.removeItem('token'); currentUser = null; }

    function updateNavbar(loggedIn) {
        document.getElementById('showLoginBtn').style.display = loggedIn ? 'none' : '';
        document.getElementById('showRegisterBtn').style.display = loggedIn ? 'none' : '';
        document.getElementById('navbarLogoutBtn').style.display = loggedIn ? '' : 'none';
    }

    // Navigation
    document.getElementById('showLoginBtn').onclick = showLogin;
    document.getElementById('showRegisterBtn').onclick = showRegister;
    document.getElementById('toRegister').onclick = (e) => { e.preventDefault(); showRegister(); };
    document.getElementById('toLogin').onclick = (e) => { e.preventDefault(); showLogin(); };
    document.getElementById('navbarLogoutBtn').onclick = () => {
        clearAuth();
        showLogin();
        updateNavbar(false);
        displayAlert('Logged out successfully!');
    };

    // Login
    document.getElementById('loginFormElement').onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Login failed');
            setToken(data.token);
            currentUser = data.user;
            showDashboard();
            updateNavbar(true);
            displayAlert('Login successful!');
        } catch (err) {
            displayAlert(err.message, 'danger');
        }
    };

    // Register
    document.getElementById('registerFormElement').onsubmit = async (e) => {
        e.preventDefault();
        const firstName = document.getElementById('regFirstName').value;
        const surname = document.getElementById('regSurname').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, surname, email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Registration failed');
            displayAlert('Registration successful! Please login.');
            showLogin();
            updateNavbar(false);
        } catch (err) {
            displayAlert(err.message, 'danger');
        }
    };

    // Auto-login if token exists
    (async function() {
        const token = getToken();
        if (token) {
            try {
                const res = await fetch(`${API_BASE}/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (!res.ok) throw new Error();
                currentUser = data;
                showDashboard();
                updateNavbar(true);
            } catch {
                clearAuth();
                showLogin();
                updateNavbar(false);
            }
        } else {
            showLogin();
            updateNavbar(false);
        }
    })();
}); 