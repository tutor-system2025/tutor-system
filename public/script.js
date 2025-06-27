// Debug: Check if script is loading
console.log('Script.js is loading...');

// Wait for DOM to be fully loaded before running any setup
document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM is ready!');
    
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
    function displayAlert(message, type = 'success') {
        console.log('displayAlert called with:', message, type);
        
        // Wait for DOM to be ready if it's not already
        if (document.readyState === 'loading') {
            console.log('DOM not ready, deferring displayAlert');
            document.addEventListener('DOMContentLoaded', () => displayAlert(message, type));
            return;
        }
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '80px';
        alertDiv.style.left = '50%';
        alertDiv.style.transform = 'translateX(-50%)';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.minWidth = '300px';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        console.log('Created alert div:', alertDiv);
        
        // Enhanced safety check with friendly warning
        const alertContainer = document.getElementById('alert-container');
        console.log('🔍 Looking for alert-container...');
        console.log('🔍 alert-container found:', alertContainer);
        console.log('🔍 document.readyState:', document.readyState);
        console.log('🔍 document.body:', document.body);
        
        if (alertContainer) {
            try {
                // Use insertBefore to add at the top of the container
                alertContainer.insertBefore(alertDiv, alertContainer.firstChild);
                console.log('✅ Alert successfully added to alert-container');
            } catch (error) {
                console.error('❌ Failed to append to alert-container:', error);
                // Fall back to body
                try {
                    document.body.appendChild(alertDiv);
                    console.log('✅ Alert appended to body as fallback');
                } catch (fallbackError) {
                    console.error('❌ Failed to append alert to body:', fallbackError);
                    console.log('📝 Alert message (could not display):', message);
                }
            }
        } else {
            console.warn("⚠️ alert-container not found in DOM. Adding alert to body instead.");
            console.warn("⚠️ This might be due to DOM not being ready or element not existing.");
            // No alert-container found, use body
            try {
                document.body.appendChild(alertDiv);
                console.log('✅ Alert appended to body (no alert-container found)');
            } catch (error) {
                console.error('❌ Failed to append alert:', error);
                console.log('📝 Alert message (could not display):', message);
            }
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            try {
                if (alertDiv && alertDiv.parentNode) {
                    alertDiv.remove();
                    console.log('✅ Alert removed successfully');
                }
            } catch (error) {
                console.error('❌ Failed to remove alert:', error);
            }
        }, 5000);
    }
    
    // Keep old function name for backward compatibility but redirect to new function
    function showAlert(message, type = 'success') {
        console.log('showAlert called, redirecting to displayAlert');
        displayAlert(message, type);
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

    function showTab(tabName, event) {
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
        if (event && event.target) {
            event.target.classList.add('active');
        }
        
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
            <button class="btn btn-outline-light" data-action="logout">Logout</button>
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
                            <button class="btn btn-primary" data-action="selectSubject" data-subject="${subject.name}">
                                Find Tutors
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Render pagination controls
            const pagination = document.getElementById('pagination');
            if (pagination) {
                pagination.innerHTML = `
                    <nav>
                        <ul class="pagination">
                            <li class="page-item">
                                <a class="page-link" href="#" aria-label="Previous" data-action="loadSubjects" data-page="${Math.max(1, page - 1)}">
                                    <span aria-hidden="true">&laquo;</span>
                                </a>
                            </li>
                            <li class="page-item">
                                <a class="page-link" href="#" aria-label="Next" data-action="loadSubjects" data-page="${Math.min(data.total, page + 1)}">
                                    <span aria-hidden="true">&raquo;</span>
                                </a>
                            </li>
                        </ul>
                    </nav>
                `;
            }
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
                            <button class="btn btn-primary btn-sm" data-action="selectTutor" data-tutor-id="${tutor._id}" data-tutor-name="${tutor.firstName} ${tutor.surname}">
                                Book Session
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('subjectsList').innerHTML = `
                <div class="col-12 mb-3">
                    <button class="btn btn-outline-primary" data-action="loadSubjects">
                        <i class="fas fa-arrow-left"></i> Back to Subjects
                    </button>
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
            if (pagination) {
                pagination.innerHTML = `
                    <nav>
                        <ul class="pagination">
                            <li class="page-item">
                                <a class="page-link" href="#" aria-label="Previous" data-action="loadUserBookings" data-page="${Math.max(1, page - 1)}">
                                    <span aria-hidden="true">&laquo;</span>
                                </a>
                            </li>
                            <li class="page-item">
                                <a class="page-link" href="#" aria-label="Next" data-action="loadUserBookings" data-page="${Math.min(data.total, page + 1)}">
                                    <span aria-hidden="true">&raquo;</span>
                                </a>
                            </li>
                        </ul>
                    </nav>
                `;
            }
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
                            <button class="btn btn-success btn-sm" data-action="approveTutor" data-tutor-id="${tutor._id}">
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
            <button class="btn btn-outline-light me-2" data-action="showLogin">Login</button>
            <button class="btn btn-primary" data-action="showRegister">Register</button>
        `;
        showAlert('Logged out successfully!');
    }

    // Event listeners
    // Navigation event listeners
    document.addEventListener('click', function(e) {
        console.log('Click event triggered on:', e.target);
        console.log('Data action:', e.target.getAttribute('data-action'));
        console.log('Element tag name:', e.target.tagName);
        console.log('Element class list:', e.target.classList);
        
        const action = e.target.getAttribute('data-action');
        if (!action) {
            console.log('No data-action found, returning');
            return;
        }
        
        e.preventDefault();
        console.log('Processing action:', action);
        
        switch(action) {
            case 'showLogin':
                console.log('Showing login...');
                showLogin();
                break;
            case 'showRegister':
                console.log('Showing register...');
                showRegister();
                break;
            case 'showTab':
                const tabName = e.target.getAttribute('data-tab');
                console.log('Showing tab:', tabName);
                if (tabName) {
                    showTab(tabName, e);
                }
                break;
            case 'selectSubject':
                const subjectName = e.target.getAttribute('data-subject');
                console.log('Selecting subject:', subjectName);
                if (subjectName) {
                    selectSubject(subjectName);
                }
                break;
            case 'selectTutor':
                const tutorId = e.target.getAttribute('data-tutor-id');
                const tutorName = e.target.getAttribute('data-tutor-name');
                console.log('Selecting tutor:', tutorId, tutorName);
                if (tutorId && tutorName) {
                    selectTutor(tutorId, tutorName);
                }
                break;
            case 'approveTutor':
                const tutorIdToApprove = e.target.getAttribute('data-tutor-id');
                console.log('Approving tutor:', tutorIdToApprove);
                if (tutorIdToApprove) {
                    approveTutor(tutorIdToApprove);
                }
                break;
            case 'logout':
                console.log('Logging out...');
                logout();
                break;
            case 'loadSubjects':
                const page = e.target.getAttribute('data-page');
                console.log('Loading subjects page:', page);
                if (page) {
                    loadSubjects(parseInt(page));
                } else {
                    loadSubjects();
                }
                break;
            case 'loadUserBookings':
                const bookingsPage = e.target.getAttribute('data-page');
                console.log('Loading bookings page:', bookingsPage);
                if (bookingsPage) {
                    loadUserBookings(parseInt(bookingsPage));
                } else {
                    loadUserBookings();
                }
                break;
            default:
                console.log('Unknown action:', action);
                break;
        }
    });
    
    // Form event listeners
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
    
    document.getElementById('bookingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            subject: document.getElementById('bookingSubject').value,
            tutor: document.getElementById('bookingTutor').value,
            date: document.getElementById('bookingDate').value,
            timePeriod: document.getElementById('bookingTimePeriod').value,
            description: document.getElementById('bookingDescription').value
        };
        createBooking(formData);
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
    
    // Check if user is already logged in
    const token = getToken();
    if (token) {
        // Try to validate token and show dashboard
        validateTokenAndShowDashboard();
    } else {
        showLogin();
    }

    // Add missing function
    async function validateTokenAndShowDashboard() {
        try {
            // Try to get user info to validate token
            const userData = await apiCall('/profile');
            currentUser = userData;
            showDashboard();
        } catch (error) {
            // Token is invalid, clear auth and show login
            clearAuth();
            showLogin();
        }
    }

    // Debug: Test if DOM is accessible
    console.log('Login form element:', document.getElementById('loginForm'));
    console.log('Register form element:', document.getElementById('registerForm'));
}); 