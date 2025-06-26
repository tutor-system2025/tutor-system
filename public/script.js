// Global variables
let currentUser = null;
let currentToken = null;
let selectedTutor = null;
let selectedSubject = null;
let currentPage = 1;
const subjectsPerPage = 9;
let bookingsPage = 1;
const bookingsPerPage = 10;

// API Base URL
const API_BASE = 'https://tutorial-signup-d60837d8fe04.herokuapp.com/api';

// Utility functions
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.container').firstChild);
    setTimeout(() => alertDiv.remove(), 5000);
}

function setToken(token) {
    currentToken = token;
    localStorage.setItem('token', token);
}

function getToken() {
    if (!currentToken) {
        currentToken = localStorage.getItem('token');
    }
    return currentToken;
}

function clearAuth() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem('token');
}

// Navigation functions
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
    loadDashboard();
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('#dashboardTabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').style.display = 'block';
    
    // Add active class to selected nav link
    event.target.classList.add('active');
    
    // Load tab content
    switch(tabName) {
        case 'subjects':
            loadSubjects();
            break;
        case 'myBookings':
            loadUserBookings();
            break;
        case 'admin':
            loadAdminData();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// API functions
async function apiCall(endpoint, options = {}) {
    const token = getToken();
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const response = await fetch(`${API_BASE}${endpoint}`, { ...defaultOptions, ...options });
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'API call failed');
    }
    
    return data;
}

// Authentication functions
async function login(email, password) {
    try {
        const data = await apiCall('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        setToken(data.token);
        currentUser = data.user;
        showDashboard();
        showAlert('Login successful!');
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function register(firstName, surname, email, password) {
    try {
        await apiCall('/register', {
            method: 'POST',
            body: JSON.stringify({ firstName, surname, email, password })
        });
        
        showAlert('Registration successful! Please login.');
        showLogin();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Dashboard functions
async function loadDashboard() {
    // Update navigation
    const navItems = document.getElementById('navItems');
    navItems.innerHTML = `
        <span class="navbar-text me-3">Welcome, ${currentUser.firstName}!</span>
        <button class="btn btn-outline-light" onclick="logout()">Logout</button>
    `;
    
    // Show admin tab if user is admin
    if (currentUser.isAdmin) {
        document.getElementById('adminTab').style.display = 'block';
        // Change 'My Bookings' tab text to 'All Bookings'
        document.querySelectorAll('#dashboardTabs .nav-link').forEach(link => {
            if (link.textContent.trim() === 'My Bookings') {
                link.textContent = 'All Bookings';
            }
        });
    } else {
        // Reset to 'My Bookings' for non-admins
        document.querySelectorAll('#dashboardTabs .nav-link').forEach(link => {
            if (link.textContent.trim() === 'All Bookings') {
                link.textContent = 'My Bookings';
            }
        });
    }
    
    // Load initial content
    loadSubjects();
}

async function loadSubjects(page = 1) {
    try {
        const data = await apiCall(`/subjects?page=${page}&limit=${subjectsPerPage}`);
        const subjectsList = document.getElementById('subjectsList');
        
        if (data.subjects.length === 0) {
            subjectsList.innerHTML = '<div class="col-12"><div class="alert alert-info">No subjects available yet.</div></div>';
            return;
        }
        
        subjectsList.innerHTML = data.subjects.map(subject => `
            <div class="col-md-4 mb-4">
                <div class="card booking-card">
                    <div class="card-body">
                        <h5 class="card-title">${subject.name}</h5>
                        <p class="card-text">Get help with ${subject.name.toLowerCase()} from qualified tutors.</p>
                        <button class="btn btn-primary" onclick="selectSubject('${subject.name}')">
                            Find Tutors
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Render pagination controls
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = `
            <nav>
                <ul class="pagination">
                    <li class="page-item">
                        <a class="page-link" href="#" aria-label="Previous" onclick="loadSubjects(${Math.max(1, page - 1)}); return false;">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
                    <li class="page-item">
                        <a class="page-link" href="#" aria-label="Next" onclick="loadSubjects(${Math.min(data.total, page + 1)}); return false;">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                </ul>
            </nav>
        `;
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function selectSubject(subjectName) {
    selectedSubject = subjectName;
    try {
        const tutors = await apiCall(`/tutors/${encodeURIComponent(subjectName)}`);
        
        if (tutors.length === 0) {
            showAlert('No tutors available for this subject yet.', 'info');
            return;
        }
        
        const tutorsList = tutors.map(tutor => `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title">${tutor.firstName} ${tutor.surname}</h6>
                        <p class="card-text">Email: ${tutor.email}</p>
                        <button class="btn btn-primary btn-sm" onclick="selectTutor('${tutor._id}', '${tutor.firstName} ${tutor.surname}')">
                            Book Session
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        document.getElementById('subjectsList').innerHTML = `
            <div class="col-12 mb-3">
                <button class="btn btn-outline-primary" onclick="loadSubjects()">
                    <i class="fas fa-arrow-left"></i> Back to Subjects
                </button>
            </div>
            <div class="col-12">
                <h4>Tutors for ${subjectName}</h4>
            </div>
            ${tutorsList}
        `;
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function selectTutor(tutorId, tutorName) {
    selectedTutor = { id: tutorId, name: tutorName };
    document.getElementById('bookingSubject').value = selectedSubject;
    document.getElementById('bookingTutor').value = tutorName;
    
    const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
    modal.show();
}

async function createBooking(formData) {
    try {
        await apiCall('/bookings', {
            method: 'POST',
            body: JSON.stringify({
                tutorId: selectedTutor.id,
                subject: selectedSubject,
                timePeriod: formData.timePeriod,
                description: formData.description,
                date: formData.date
            })
        });
        
        showAlert('Booking created successfully!');
        bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
        loadUserBookings();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function loadUserBookings(page = 1) {
    try {
        const data = await apiCall(`/bookings/user?page=${page}&limit=${bookingsPerPage}`);
        const bookingsList = document.getElementById('bookingsList');
        
        if (data.bookings.length === 0) {
            bookingsList.innerHTML = '<div class="col-12"><div class="alert alert-info">No bookings found.</div></div>';
            return;
        }
        
        bookingsList.innerHTML = data.bookings.map(booking => `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title">${booking.subject}</h6>
                        <p class="card-text">
                            <strong>Tutor:</strong> ${booking.tutor.firstName} ${booking.tutor.surname}<br>
                            <strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}<br>
                            <strong>Time:</strong> ${booking.timePeriod}<br>
                            <strong>Status:</strong> <span class="badge bg-${getStatusColor(booking.status)}">${booking.status}</span>
                        </p>
                        <p class="card-text"><small>${booking.description}</small></p>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Render pagination controls
        const pagination = document.getElementById('bookingsPagination');
        pagination.innerHTML = `
            <nav>
                <ul class="pagination">
                    <li class="page-item">
                        <a class="page-link" href="#" aria-label="Previous" onclick="loadUserBookings(${Math.max(1, page - 1)}); return false;">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
                    <li class="page-item">
                        <a class="page-link" href="#" aria-label="Next" onclick="loadUserBookings(${Math.min(data.total, page + 1)}); return false;">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                </ul>
            </nav>
        `;
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'pending': return 'warning';
        case 'confirmed': return 'success';
        case 'completed': return 'info';
        case 'cancelled': return 'danger';
        default: return 'secondary';
    }
}

async function tutorRegister(formData) {
    try {
        await apiCall('/tutor/register', {
            method: 'POST',
            body: JSON.stringify({
                firstName: formData.firstName,
                surname: formData.surname,
                email: formData.email,
                subjects: formData.subjects.split(',').map(s => s.trim()),
                description: formData.description
            })
        });
        
        showAlert('Tutor application submitted successfully!');
        document.getElementById('tutorRegisterForm').reset();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function loadAdminData() {
    try {
        const [tutors, bookings] = await Promise.all([
            apiCall('/admin/tutors'),
            apiCall('/admin/bookings')
        ]);
        
        // Load tutor applications
        const tutorApplications = document.getElementById('tutorApplications');
        const pendingTutors = tutors.filter(tutor => !tutor.isApproved);
        
        if (pendingTutors.length === 0) {
            tutorApplications.innerHTML = '<p class="text-muted">No pending applications</p>';
        } else {
            tutorApplications.innerHTML = pendingTutors.map(tutor => `
                <div class="card mb-2">
                    <div class="card-body">
                        <h6>${tutor.firstName} ${tutor.surname}</h6>
                        <p class="mb-1"><small>${tutor.email}</small></p>
                        <p class="mb-1"><small><strong>Subjects:</strong> ${tutor.subjects.join(', ')}</small></p>
                        <p class="mb-2"><small>${tutor.description}</small></p>
                        <button class="btn btn-success btn-sm" onclick="approveTutor('${tutor._id}')">
                            Approve
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Load all bookings
        const allBookings = document.getElementById('allBookings');
        if (bookings.length === 0) {
            allBookings.innerHTML = '<p class="text-muted">No bookings found</p>';
        } else {
            allBookings.innerHTML = bookings.map(booking => `
                <div class="card mb-2">
                    <div class="card-body">
                        <h6>${booking.subject}</h6>
                        <p class="mb-1"><small><strong>Student:</strong> ${booking.user.firstName} ${booking.user.surname}</small></p>
                        <p class="mb-1"><small><strong>Tutor:</strong> ${booking.tutor.firstName} ${booking.tutor.surname}</small></p>
                        <p class="mb-1"><small><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</small></p>
                        <p class="mb-1"><small><strong>Status:</strong> <span class="badge bg-${getStatusColor(booking.status)}">${booking.status}</span></small></p>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function approveTutor(tutorId) {
    try {
        await apiCall(`/admin/tutors/${tutorId}/approve`, {
            method: 'PUT'
        });
        
        showAlert('Tutor approved successfully!');
        loadAdminData();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function loadProfile() {
    document.getElementById('profileFirstName').value = currentUser.firstName;
    document.getElementById('profileSurname').value = currentUser.surname;
    document.getElementById('profileEmail').value = currentUser.email;
}

async function updateProfile(formData) {
    try {
        const updatedUser = await apiCall('/profile', {
            method: 'PUT',
            body: JSON.stringify({
                firstName: formData.firstName,
                surname: formData.surname,
                email: formData.email
            })
        });
        
        currentUser = updatedUser.user;
        showAlert('Profile updated successfully!');
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function logout() {
    clearAuth();
    showLogin();
    // Reset navbar to Login and Register
    const navItems = document.getElementById('navItems');
    navItems.innerHTML = `
        <button class="btn btn-outline-light me-2" onclick="showLogin()">Login</button>
        <button class="btn btn-primary" onclick="showRegister()">Register</button>
    `;
    showAlert('Logged out successfully!');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const token = getToken();
    if (token) {
        // Try to load dashboard (will fail if token is invalid)
        loadDashboard().catch(() => {
            clearAuth();
            showLogin();
        });
    } else {
        showLogin();
    }
    
    document.getElementById('loginFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        login(email, password);
    });
    
    document.getElementById('registerFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        const firstName = document.getElementById('regFirstName').value;
        const surname = document.getElementById('regSurname').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        register(firstName, surname, email, password);
    });
    
    document.getElementById('tutorRegisterForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            firstName: document.getElementById('tutorFirstName').value,
            surname: document.getElementById('tutorSurname').value,
            email: document.getElementById('tutorEmail').value,
            subjects: document.getElementById('tutorSubjects').value,
            description: document.getElementById('tutorDescription').value
        };
        tutorRegister(formData);
    });
    
    document.getElementById('profileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            firstName: document.getElementById('profileFirstName').value,
            surname: document.getElementById('profileSurname').value,
            email: document.getElementById('profileEmail').value
        };
        updateProfile(formData);
    });
    
    document.getElementById('bookingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            date: document.getElementById('bookingDate').value,
            timePeriod: document.getElementById('bookingTimePeriod').value,
            description: document.getElementById('bookingDescription').value
        };
        createBooking(formData);
    });
});

function attachTutorRegisterListener() {
    const form = document.getElementById('tutorRegisterForm');
    if (form && !form.hasAttribute('data-listener')) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = {
                firstName: document.getElementById('tutorFirstName').value,
                surname: document.getElementById('tutorSurname').value,
                email: document.getElementById('tutorEmail').value,
                subjects: document.getElementById('tutorSubjects').value,
                description: document.getElementById('tutorDescription').value
            };
            tutorRegister(formData);
        });
        form.setAttribute('data-listener', 'true');
    }
}

// Call this function every time you show the Become a Tutor tab
attachTutorRegisterListener();

document.addEventListener('submit', function(e) {
    if (e.target && e.target.id === 'loginFormElement') {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        login(email, password);
    }
    if (e.target && e.target.id === 'registerFormElement') {
        e.preventDefault();
        const firstName = document.getElementById('regFirstName').value;
        const surname = document.getElementById('regSurname').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        register(firstName, surname, email, password);
    }
    if (e.target && e.target.id === 'tutorRegisterForm') {
        e.preventDefault();
        const formData = {
            firstName: document.getElementById('tutorFirstName').value,
            surname: document.getElementById('tutorSurname').value,
            email: document.getElementById('tutorEmail').value,
            subjects: document.getElementById('tutorSubjects').value,
            description: document.getElementById('tutorDescription').value
        };
        tutorRegister(formData);
    }
    if (e.target && e.target.id === 'bookingForm') {
        e.preventDefault();
        const formData = {
            date: document.getElementById('bookingDate').value,
            timePeriod: document.getElementById('bookingTimePeriod').value,
            description: document.getElementById('bookingDescription').value
        };
        createBooking(formData);
    }
    if (e.target && e.target.id === 'profileForm') {
        e.preventDefault();
        const formData = {
            firstName: document.getElementById('profileFirstName').value,
            surname: document.getElementById('profileSurname').value,
            email: document.getElementById('profileEmail').value
        };
        updateProfile(formData);
    }
});

window.showLogin = showLogin;
window.showRegister = showRegister;
window.showDashboard = showDashboard;
window.showTab = showTab; 