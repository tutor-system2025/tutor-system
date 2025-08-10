// Cache busting - Force reload if this is an old version
(function() {
    const currentVersion = '1.0.1';
    const storedVersion = localStorage.getItem('app_version');
    
    if (storedVersion && storedVersion !== currentVersion) {
        localStorage.setItem('app_version', currentVersion);
        // Force reload to get the new version
        window.location.reload(true);
    } else if (!storedVersion) {
        localStorage.setItem('app_version', currentVersion);
    }
})();

// SPA State
let state = {
    user: null, // { email, username, isManager }
    subjects: [],
    tutors: [],
    bookings: [],
    tutorRequests: [],
    managerView: false,
    currentView: 'login',
    selectedSubject: null,
    selectedTutor: null,
    selectedTutorObj: null,
    myBookings: [],
    tutorBookings: [], // Add missing tutorBookings property
    profile: {},
    selectedBookingId: null,
    loading: false
};

const app = document.getElementById('app');
const topNavButtons = document.getElementById('top-nav-buttons');
const uiNav = document.getElementById('ui-nav');
const uiNavButtons = document.getElementById('ui-nav-buttons');

function updateTopNav() {
    if (!state.user) {
        // Not logged in - show login/register buttons
        topNavButtons.innerHTML = `
            <button class="top-nav-btn" onclick="setView('login')">Login</button>
            <button class="top-nav-btn" onclick="setView('register')">Register</button>
            <button class="top-nav-btn" onclick="updateApp()" title="Update to get latest version">🔄 Update</button>
        `;
    } else {
        // Logged in - show user info and logout
        const displayName = state.user.username || (state.user.firstName && state.user.surname ? `${state.user.firstName} ${state.user.surname}` : 'User');
        topNavButtons.innerHTML = `
            <span class="user-info">Hi, ${displayName}</span>
            <button class="top-nav-btn" onclick="updateApp()" title="Update to get latest version">🔄 Update</button>
            <button class="top-nav-btn" onclick="logout()">Logout</button>
        `;
    }
}

function updateUINav() {
    if (!state.user) {
        // Not logged in - hide UI navigation
        uiNav.style.display = 'none';
    } else {
        // Logged in - show UI navigation buttons
        uiNav.style.display = 'flex';
        const isActive = (view) => state.currentView === view ? 'active' : '';
        
        // Check if user is a tutor by looking for tutor data
        console.log('updateUINav - state.tutors:', state.tutors);
        console.log('updateUINav - state.user.email:', state.user.email);
        
        const isTutor = state.tutors && state.tutors.some(t => {
            const matches = t.email === state.user.email && t.isApproved !== false;
            console.log('Checking tutor:', t.email, 'vs user:', state.user.email, 'approved:', t.isApproved, 'matches:', matches);
            return matches;
        });
        
        console.log('updateUINav - isTutor:', isTutor);
        
        let buttons = `
            <button class="ui-nav-btn ${isActive('book')}" onclick="setView('book')">Book Session</button>
            <button class="ui-nav-btn ${isActive('myBookings')}" onclick="setView('myBookings')">My Bookings</button>
            <button class="ui-nav-btn ${isActive('profile')}" onclick="setView('profile')">Profile</button>
        `;
        
        if (isTutor) {
            buttons = `
                <button class="ui-nav-btn ${isActive('book')}" onclick="setView('book')">Book Session</button>
                <button class="ui-nav-btn ${isActive('tutorPanel')}" onclick="setView('tutorPanel')">Tutor Panel</button>
                <button class="ui-nav-btn ${isActive('myBookings')}" onclick="setView('myBookings')">My Bookings</button>
                <button class="ui-nav-btn ${isActive('profile')}" onclick="setView('profile')">Profile</button>
            `;
        } else {
            buttons += `<button class="ui-nav-btn ${isActive('becomeTutor')}" onclick="setView('becomeTutor')">Become Tutor</button>`;
        }
        
        if (state.user.isManager) {
            buttons += `<button class="ui-nav-btn ${isActive('manager')}" onclick="setView('manager')">Manager Panel</button>`;
        }
        
        uiNavButtons.innerHTML = buttons;
    }
}

function setView(view) {
    state.currentView = view;
    updateUINav();
    
    switch (view) {
        case 'login':
            app.innerHTML = loginView();
            break;
        case 'register':
            app.innerHTML = registerView();
            break;
        case 'book':
            app.innerHTML = bookView();
            break;
        case 'chooseTutor':
            app.innerHTML = chooseTutorView();
            break;
        case 'bookingForm':
            app.innerHTML = bookingFormView();
            break;
        case 'becomeTutor':
            app.innerHTML = becomeTutorView();
            break;
        case 'tutorPanel':
            app.innerHTML = tutorPanelView();
            break;
        case 'myBookings':
            app.innerHTML = myBookingsView();
            break;
        case 'profile':
            app.innerHTML = profileView();
            break;
        case 'manager':
            app.innerHTML = managerPanelView();
            break;
        case 'bookingDetail':
            app.innerHTML = bookingDetailView(state.selectedBookingId);
            break;
        case 'bookingRecords':
            // Ensure manager data is loaded before showing booking records
            if (!state.bookings || !state.subjects || !state.tutors) {
                app.innerHTML = '<div class="container"><h2>Loading...</h2><p>Please wait while we load the booking records.</p></div>';
                fetchManagerData().then(() => {
                    app.innerHTML = bookingRecordsView();
                }).catch(error => {
                    app.innerHTML = showError('Failed to load booking records: ' + error.message);
                });
            } else {
                app.innerHTML = bookingRecordsView();
            }
            break;
        default:
            app.innerHTML = bookView();
    }
}

function showError(msg) {
    return `<div class="error">${msg}</div>`;
}
function showSuccess(msg) {
    return `<div class="success">${msg}</div>`;
}

function navBar() {
    return ''; // No longer needed since we have the white navigation bar
}

function render() {
    console.log('Render called, current view:', state.currentView);
    updateTopNav();
    updateUINav();
    
    let content = '';
    if (!state.user) {
        content = state.currentView === 'register' ? registerView() : loginView();
    } else {
        switch (state.currentView) {
            case 'book': content = bookView(); break;
            case 'chooseTutor': content = chooseTutorView(); break;
            case 'bookingForm': content = bookingFormView(); break;
            case 'becomeTutor': content = becomeTutorView(); break;
            case 'tutorPanel': content = tutorPanelView(); break;
            case 'myBookings': content = myBookingsView(); break;
            case 'profile': content = profileView(); break;
            case 'manager': content = managerPanelView(); break;
            case 'bookingDetail': content = bookingDetailView(state.selectedBookingId); break;
            case 'bookingRecords': 
                if (!state.bookings || !state.subjects || !state.tutors) {
                    content = '<div class="container"><h2>Loading...</h2><p>Please wait while we load the booking records.</p></div>';
                    fetchManagerData().then(() => {
                        render();
                    }).catch(error => {
                        app.innerHTML = navBar() + showError('Failed to load booking records: ' + error.message);
                    });
                } else {
                    content = bookingRecordsView(); 
                }
                break;
            case 'tutorDashboard': content = tutorDashboardView(); break;
            default: content = bookView();
        }
    }
    
    app.innerHTML = navBar() + content;
    console.log('Render completed');
}

// Login/Register
function loginView() {
    return `<h1>Tutor Booking System</h1>
        <form onsubmit="event.preventDefault(); login()">
            <div class="input-group">
                <label for="login-email">Email</label>
                <input type="email" id="login-email" placeholder="Enter your email address" required />
            </div>
            <div class="input-group">
                <label for="login-password">Password</label>
                <input type="password" id="login-password" placeholder="Enter your password" required />
            </div>
            <button class="btn" type="submit">Login</button>
        </form>
        <div style="text-align:center; margin-top:12px;">
            <button class="link" onclick="setView('register')">Don't have an account? Register</button>
        </div>`;
}

function registerView() {
    return `<h1>Register</h1>
        <form onsubmit="event.preventDefault(); register()">
            <div class="input-group">
                <label for="register-email">Email</label>
                <input type="email" id="register-email" placeholder="Enter your email address" required />
            </div>
            <div class="input-group">
                <label for="register-name">Name</label>
                <input type="text" id="register-name" placeholder="Enter your full name" required />
            </div>
            <div class="input-group">
                <label for="register-password">Password</label>
                <input type="password" id="register-password" placeholder="Enter your password" required />
            </div>
            <button class="btn" type="submit">Register</button>
        </form>
        <div style="text-align:center; margin-top:12px;">
            <button class="link" onclick="setView('login')">Already have an account? Login</button>
        </div>`;
}

// Book Session
function bookView() {
    let subjectList = state.subjects.map(s => `<li><button class="link" onclick="selectSubject('${s._id}')">${s.name}</button></li>`).join('');
    return `<h2>Book a Session</h2>
        <ul class="list">${subjectList}</ul>`;
}

function chooseTutorView() {
    // Get the selected subject name
    const selectedSubject = state.subjects.find(s => s._id === state.selectedSubject);
    const subjectName = selectedSubject ? selectedSubject.name : '';
    
    console.log('chooseTutorView - selectedSubject ID:', state.selectedSubject);
    console.log('chooseTutorView - subjectName:', subjectName);
    console.log('chooseTutorView - all tutors:', state.tutors);
    
    // Filter approved tutors who teach this subject
    let tutors = state.tutors.filter(t => 
        t.isApproved !== false && 
        Array.isArray(t.subjects) && 
        t.subjects.includes(subjectName)
    );
    
    console.log('chooseTutorView - filtered tutors for subject:', tutors);
    
    let tutorList = tutors.map(t => {
        const tutorName = t.name || (t.firstName && t.surname ? `${t.firstName} ${t.surname}` : 'Unknown Tutor');
        return `<li><button class="link" onclick="selectTutor('${t._id}')">${tutorName}</button> <span>(${t.description || t.bio || 'No description'})</span></li>`;
    }).join('');
    
    if (tutorList === '') {
        tutorList = '<li><em>No tutors available for this subject yet.</em></li>';
    }
    
    return `<h2>Choose a Tutor for ${subjectName}</h2>
        <ul class="list">${tutorList}</ul>`;
}

function bookingFormView() {
    const tutorName = state.selectedTutorObj.name || (state.selectedTutorObj.firstName && state.selectedTutorObj.surname ? `${state.selectedTutorObj.firstName} ${state.selectedTutorObj.surname}` : 'Selected Tutor');
    return `<h2>Book Session with ${tutorName}</h2>
        <form onsubmit="event.preventDefault(); submitBooking()">
            <div class="input-group">
                <label for="booking-name">Your Name</label>
                <input type="text" id="booking-name" placeholder="Enter your full name" required />
            </div>
            <div class="input-group">
                <label for="booking-email">Your Email</label>
                <input type="email" id="booking-email" value="${state.user.email}" placeholder="Enter your email address" required />
            </div>
            <div class="input-group">
                <label for="booking-time">Time</label>
                <input type="datetime-local" id="booking-time" required />
            </div>
            <div class="input-group">
                <label for="booking-desc">What do you need help with?</label>
                <textarea id="booking-desc" placeholder="Describe what you need help with..." required></textarea>
            </div>
            <button class="btn" type="submit">Book</button>
        </form>`;
}

// Become Tutor
function becomeTutorView() {
    // Get user's name from state
    const [firstName, ...surnameArr] = state.user.username.split(' ');
    const surname = surnameArr.join(' ') || '';
    
    return `<h2>Become a Tutor</h2>
        <div class="panel-section">
            <h3>Your Information</h3>
            <p><strong>Name:</strong> ${state.user.username}</p>
            <p><strong>Email:</strong> ${state.user.email}</p>
        </div>
        <form onsubmit="event.preventDefault(); submitTutorRequest()">
            <div class="input-group">
                <label for="tutor-subjects">Subjects to Teach</label>
                <input type="text" id="tutor-subjects" placeholder="e.g. Math, Physics, Chemistry" required />
            </div>
            <div class="input-group">
                <label for="tutor-desc">Description (time, level, etc.)</label>
                <textarea id="tutor-desc" placeholder="Describe your subject experiance, availability, and what you can offer students. etc." required></textarea>
            </div>
            <button class="btn" type="submit">Submit Tutor Application</button>
        </form>`;
}

// Tutor Panel
function tutorPanelView() {
    // Get the current tutor's information
    const currentTutor = state.tutors.find(t => t.email === state.user.email);
    console.log('Tutor Panel - currentTutor:', currentTutor);
    console.log('Tutor Panel - state.myBookings:', state.myBookings);
    console.log('Tutor Panel - state.tutors:', state.tutors);
    
    if (!currentTutor) {
        return `<h2>Tutor Panel</h2>
            <div class="error">Tutor information not found. Please contact support.</div>`;
    }
    
    // Get bookings where this tutor is the tutor (not the student)
    const tutorBookings = state.tutorBookings || [];
    console.log('Tutor Panel - tutorBookings from separate array:', tutorBookings);
    
    let bookingsList = tutorBookings.map(b => {
        // Handle populated user object
        let userName = 'Unknown User';
        let userEmail = '';
        
        console.log('Processing booking user data:', b.user);
        
        if (b.user) {
            if (typeof b.user === 'string') {
                userName = b.user;
                console.log('User is string, no email available');
            } else if (b.user.firstName && b.user.surname) {
                userName = `${b.user.firstName} ${b.user.surname}`;
                userEmail = b.user.email || '';
                console.log('User object with email:', userEmail);
            } else {
                console.log('User object structure:', b.user);
            }
        } else {
            console.log('No user data in booking');
        }
        
        // Format the date/time
        let timeDisplay = 'No time specified';
        if (b.date) {
            const date = new Date(b.date);
            timeDisplay = date.toLocaleString();
        } else if (b.timePeriod) {
            timeDisplay = b.timePeriod;
        }
        
        const emailSubject = encodeURIComponent(`Tutoring Session - ${b.subject} - ${timeDisplay}`);
        const emailBody = encodeURIComponent(`Hi ${userName},\n\nRegarding our tutoring session:\n\nSubject: ${b.subject}\nTime: ${timeDisplay}\nDescription: ${b.description || 'No description provided'}\n\nBest regards,\n${state.user.username}`);
        
        // Only show email button if we have an email
        const emailButton = userEmail ? 
            `<button class="btn btn-small" onclick="openMessageModal('${b._id}', '${userName}', '${userEmail}', '${b.subject}')">Message Student</button>` :
            `<span class="btn btn-small disabled" title="No email available">Message Student</span>`;
        
        // Add complete session button for accepted bookings
        const completeButton = b.status === 'accepted' ? 
            `<button class="btn btn-small btn-success" onclick="openCompleteSessionModal('${b._id}', '${b.subject}', '${userName}')">Complete Session</button>` : '';
        
        return `<li class="booking-item">
            <div class="booking-info">
                <strong>${b.subject}</strong> with ${userName}<br>
                <span class="booking-time">${timeDisplay}</span><br>
                <span class="booking-status">Status: ${b.status || 'pending'}</span><br>
                <span class="booking-description">${b.description || 'No description provided'}</span>
            </div>
            <div class="booking-actions">
                ${emailButton}
                ${b.status !== 'accepted' ? `<button class="btn btn-small btn-success" onclick="acceptBooking('${b._id}')">Accept Booking</button>` : '<span class="accepted-badge">✓ Accepted</span>'}
                ${completeButton}
            </div>
        </li>`;
    }).join('');
    
    if (bookingsList === '') {
        bookingsList = '<li><em>No booking requests found for you yet.</em></li>';
    }
    
    return `<h2>Tutor Panel</h2>
        <div class="panel-section">
            <h3>Tutor Information</h3>
            <p><strong>Name:</strong> ${currentTutor.firstName} ${currentTutor.surname}</p>
            <p><strong>Email:</strong> ${currentTutor.email}</p>
            <p><strong>Subjects:</strong> ${Array.isArray(currentTutor.subjects) ? currentTutor.subjects.join(', ') : currentTutor.subjects}</p>
            <p><strong>Description:</strong> ${currentTutor.description || currentTutor.bio || 'No description provided'}</p>
            <button class="btn btn-primary" onclick="openEditTutorModal()">Edit Subjects & Description</button>
        </div>
        <div class="panel-section">
            <h3>Booking Requests (You as Tutor)</h3>
            <p class="info-text">These are sessions where students have requested you as their tutor.</p>
            <div style="text-align: right; margin-bottom: 20px;">
                <button class="btn btn-small" onclick="refreshTutorBookings()">Refresh</button>
            </div>
            <ul class="list">${bookingsList}</ul>
        </div>`;
}

// My Bookings
function myBookingsView() {
    // Check if we're currently loading data
    if (state.loading) {
        return `<h2>My Bookings</h2>
            <div style="text-align: center; padding: 40px;">
                <p>Loading your bookings...</p>
            </div>`;
    }
    
    // Check if user is a tutor
    const isTutor = state.tutors && state.tutors.some(t => 
        t.email === state.user.email && t.isApproved !== false
    );
    
    if (!isTutor) {
        // Regular user - show normal booking list
        let list = state.myBookings.map(b => {
            // Handle populated tutor object
            let tutorName = 'Unknown Tutor';
            if (b.tutor) {
                if (typeof b.tutor === 'string') {
                    tutorName = b.tutor;
                } else if (b.tutor.firstName && b.tutor.surname) {
                    tutorName = `${b.tutor.firstName} ${b.tutor.surname}`;
                } else if (b.tutor.name) {
                    tutorName = b.tutor.name;
                }
            }
            
            // Format the date/time
            let timeDisplay = 'No time specified';
            if (b.date) {
                const date = new Date(b.date);
                timeDisplay = date.toLocaleString();
            } else if (b.timePeriod) {
                timeDisplay = b.timePeriod;
            }
            
            return `<li class="booking-item" onclick="viewBooking('${b._id}')">
                <div class="booking-info">
                    <strong>${b.subject}</strong> with ${tutorName}<br>
                    <span class="booking-time">${timeDisplay}</span><br>
                    <span class="booking-status">Status: ${b.status || 'pending'}</span>
                </div>
                <div class="booking-actions">
                    <button class="btn btn-small" onclick="event.stopPropagation(); viewBooking('${b._id}')">View Details</button>
                </div>
            </li>`;
        }).join('');
        
        if (list === '') {
            list = '<li><em>No bookings found.</em></li>';
        }
        
        return `<h2>My Bookings</h2>
            <div style="text-align: right; margin-bottom: 20px;">
                <button class="btn btn-small" onclick="refreshBookings()">Refresh</button>
            </div>
            <ul class="list">${list}</ul>`;
    }
    
    // Tutor user - show separated booking lists
    // Use separate arrays instead of filtering
    const studentBookings = state.myBookings; // These are bookings where user is the student
    const tutorBookings = state.tutorBookings || []; // These are bookings where user is the tutor
    
    let studentList = studentBookings.map(b => {
        // Handle populated tutor object
        let tutorName = 'Unknown Tutor';
        if (b.tutor) {
            if (typeof b.tutor === 'string') {
                tutorName = b.tutor;
            } else if (b.tutor.firstName && b.tutor.surname) {
                tutorName = `${b.tutor.firstName} ${b.tutor.surname}`;
            } else if (b.tutor.name) {
                tutorName = b.tutor.name;
            }
        }
        
        // Format the date/time
        let timeDisplay = 'No time specified';
        if (b.date) {
            const date = new Date(b.date);
            timeDisplay = date.toLocaleString();
        } else if (b.timePeriod) {
            timeDisplay = b.timePeriod;
        }
        
        return `<li class="booking-item" onclick="viewBooking('${b._id}')">
            <div class="booking-info">
                <strong>${b.subject}</strong> with ${tutorName}<br>
                <span class="booking-time">${timeDisplay}</span><br>
                <span class="booking-status">Status: ${b.status || 'pending'}</span>
            </div>
            <div class="booking-actions">
                <button class="btn btn-small" onclick="event.stopPropagation(); viewBooking('${b._id}')">View Details</button>
            </div>
        </li>`;
    }).join('');
    
    let tutorList = tutorBookings.map(b => {
        // Handle populated user object
        let userName = 'Unknown User';
        if (b.user) {
            if (typeof b.user === 'string') {
                userName = b.user;
            } else if (b.user.firstName && b.user.surname) {
                userName = `${b.user.firstName} ${b.user.surname}`;
            }
        }
        
        // Format the date/time
        let timeDisplay = 'No time specified';
        if (b.date) {
            const date = new Date(b.date);
            timeDisplay = date.toLocaleString();
        } else if (b.timePeriod) {
            timeDisplay = b.timePeriod;
        }
        
        return `<li class="booking-item">
            <div class="booking-info">
                <strong>${b.subject}</strong> with ${userName}<br>
                <span class="booking-time">${timeDisplay}</span><br>
                <span class="booking-status">Status: ${b.status || 'pending'}</span>
            </div>
            <div class="booking-actions">
                <span class="tutor-badge">You as Tutor</span>
            </div>
        </li>`;
    }).join('');
    
    if (studentList === '') {
        studentList = '<li><em>No bookings found where you are the student.</em></li>';
    }
    
    if (tutorList === '') {
        tutorList = '<li><em>No bookings found where you are the tutor.</em></li>';
    }
    
    let content = `<h2>My Bookings</h2>
        <div style="text-align: right; margin-bottom: 20px;">
            <button class="btn btn-small" onclick="refreshBookings()">Refresh</button>
        </div>`;
    
    // Show student bookings
    content += `<div class="panel-section">
        <h3>My Sessions (You as Student)</h3>
        <p class="info-text">These are sessions where you booked a tutor.</p>
        <ul class="list">${studentList}</ul>
    </div>`;
    
    // Show tutor bookings
    content += `<div class="panel-section">
        <h3>My Teaching Sessions (You as Tutor)</h3>
        <p class="info-text">These are sessions where you are the tutor. Manage them in the Tutor Panel.</p>
        <ul class="list">${tutorList}</ul>
    </div>`;
    
    return content;
}

// Profile
function profileView() {
    const [firstName, ...surnameArr] = state.user.username.split(' ');
    const surname = surnameArr.join(' ') || '';
    
    return `<h2>Profile</h2>
        <form onsubmit="event.preventDefault(); updateProfile()">
            <div class="input-group">
                <label for="profile-firstName">First Name</label>
                <input type="text" id="profile-firstName" value="${firstName}" placeholder="Enter your first name" required />
            </div>
            <div class="input-group">
                <label for="profile-surname">Surname</label>
                <input type="text" id="profile-surname" value="${surname}" placeholder="Enter your surname" required />
            </div>
            <div class="input-group">
                <label for="profile-email">Email</label>
                <input type="email" id="profile-email" value="${state.user.email}" placeholder="Enter your email address" required />
            </div>
            <button class="btn" type="submit">Update Profile</button>
        </form>
        <div style="text-align:center; margin-top:20px;">
            <div class="profile-info">
                <div><strong>Current Name:</strong> ${state.user.username}</div>
                <div><strong>Current Email:</strong> ${state.user.email}</div>
            </div>
        </div>`;
}

// Manager Panel
function managerPanelView() {
    return `<h2>Manager Panel</h2>
        <div class="panel-section">
            <h3>Booking Records</h3>
            <button class="btn btn-primary" onclick="setView('bookingRecords')">View Booking Records</button>
        </div>
        <div class="panel-section">
            <h3>Subjects</h3>
            <ul class="list">${state.subjects.map(s => `<li class="subject-item">
                <span>${s.name}</span>
                <button class="btn btn-small btn-danger" onclick="removeSubject('${s._id}')">Remove</button>
            </li>`).join('')}</ul>
            <form onsubmit="event.preventDefault(); addSubject()">
                <div class="form-row">
                    <div class="input-group">
                        <input type="text" id="new-subject" placeholder="New subject" required />
                    </div>
                    <button class="btn btn-small" type="submit">Add Subject</button>
                </div>
            </form>
        </div>
        <div class="panel-section">
            <h3>Pending Tutor Requests</h3>
            <ul class="list">${state.tutorRequests.map(r => {
                const tutorName = r.name || (r.firstName && r.surname ? `${r.firstName} ${r.surname}` : 'Unknown Tutor');
                const subjects = Array.isArray(r.subjects) ? r.subjects.join(', ') : r.subjects;
                return `<li class="tutor-item">
                    <div class="tutor-info">
                        <strong>${tutorName}</strong> (${r.gmail || r.email})<br>
                        <strong>Subjects:</strong> ${subjects}<br>
                        <strong>Experience:</strong> ${r.experience || 'Not specified'} years<br>
                        <strong>Bio:</strong> ${r.bio || r.description || 'No description provided'}
                    </div>
                    <div class="tutor-actions">
                        <button class="btn btn-small" onclick="approveTutor('${r._id}')">Approve</button>
                        <button class="btn btn-small btn-danger" onclick="rejectTutor('${r._id}')">Reject</button>
                    </div>
                </li>`;
            }).join('')}</ul>
        </div>
        <div class="panel-section">
            <h3>Approved Tutors</h3>
            <ul class="list">${state.tutors.filter(t => t.isApproved !== false).map(t => {
                const tutorName = t.name || (t.firstName && t.surname ? `${t.firstName} ${t.surname}` : 'Unknown Tutor');
                const currentSubjects = Array.isArray(t.subjects) ? t.subjects.join(', ') : t.subjects || 'No subjects assigned';
                return `<li class="tutor-item" data-tutor-id="${t._id}">
                    <div class="tutor-info">
                        <strong>${tutorName}</strong> (${t.email})<br>
                        <strong>Current Subjects:</strong> ${currentSubjects}<br>
                        <strong>Experience:</strong> ${t.experience || 'Not specified'} years<br>
                        <strong>Bio:</strong> ${t.bio || t.description || 'No description provided'}
                    </div>
                    <div class="tutor-actions">
                        <button class="btn btn-small btn-danger" onclick="removeTutor('${t._id}')">Remove Tutor</button>
                    </div>
                    <div class="subject-assignment">
                        <label><strong>Assign Subjects:</strong></label>
                        <div class="subject-checkboxes">
                            ${state.subjects.map(s => `
                                <label class="checkbox-label">
                                    <input type="checkbox" 
                                           id="subject-${t._id}-${s._id}" 
                                           value="${s._id}"
                                           ${Array.isArray(t.subjects) && t.subjects.includes(s.name) ? 'checked' : ''}>
                                    ${s.name}
                                </label>
                            `).join('')}
                        </div>
                        <button class="btn btn-small" onclick="assignMultipleSubjects('${t._id}')">Update Subjects</button>
                    </div>
                </li>`;
            }).join('')}</ul>
        </div>
        <div class="panel-section">
            <h3>Subject Assignments Overview</h3>
            <div class="subject-assignments">
                ${state.subjects.map(subject => {
                    const assignedTutors = state.tutors.filter(t => 
                        t.isApproved !== false && 
                        Array.isArray(t.subjects) && 
                        t.subjects.includes(subject.name)
                    );
                    const tutorNames = assignedTutors.map(t => 
                        t.name || (t.firstName && t.surname ? `${t.firstName} ${t.surname}` : 'Unknown Tutor')
                    );
                    return `<div class="subject-assignment-item">
                        <strong>${subject.name}:</strong> ${tutorNames.length > 0 ? tutorNames.join(', ') : 'No tutors assigned'}
                    </div>`;
                }).join('')}
            </div>
        </div>`;
}

// Booking Records View
function bookingRecordsView() {
    console.log('bookingRecordsView called');
    console.log('state.bookings:', state.bookings);
    console.log('state.bookings type:', typeof state.bookings);
    console.log('state.bookings isArray:', Array.isArray(state.bookings));
    
    // Check if bookings data is available
    if (!state.bookings || !Array.isArray(state.bookings)) {
        console.log('Bookings data not available, showing loading message');
        return `<div class="container">
            <h2>Booking Records</h2>
            <button class="btn btn-secondary" onclick="setView('manager')">← Back to Manager Panel</button>
            <p>Loading booking records...</p>
        </div>`;
    }
    
    // Group bookings by date
    const bookingsByDate = {};
    state.bookings.forEach(booking => {
        const date = new Date(booking.date).toDateString();
        if (!bookingsByDate[date]) {
            bookingsByDate[date] = [];
        }
        bookingsByDate[date].push(booking);
    });

    const content = `
        <div class="container">
            <h2>Booking Records</h2>
            <button class="btn btn-secondary" onclick="setView('manager')">← Back to Manager Panel</button>
            
            ${Object.keys(bookingsByDate).length === 0 ? '<p>No booking records found</p>' : 
                Object.entries(bookingsByDate).map(([date, bookings]) => `
                    <div class="date-section">
                        <div class="date-header">
                            <h3>${new Date(date).toLocaleDateString()}</h3>
                            <button class="btn btn-danger" onclick="removeBookingsForDate('${date}')">Remove All Bookings for This Date</button>
                        </div>
                        <div class="bookings-list">
                            ${bookings.map(booking => {
                                const userName = booking.user ? 
                                    `${booking.user.firstName} ${booking.user.surname}` : 'Unknown User';
                                const tutorName = booking.tutor ? 
                                    `${booking.tutor.firstName} ${booking.tutor.surname}` : 'Unknown Tutor';
                                const timeDisplay = booking.timePeriod || 'No time specified';
                                const status = booking.status || 'pending';
                                
                                return `
                                    <div class="booking-record-item">
                                        <div class="booking-info">
                                            <strong>${userName}</strong> booked <strong>${booking.subject}</strong> 
                                            with <strong>${tutorName}</strong>
                                        </div>
                                        <div class="booking-details">
                                            <span class="time">${timeDisplay}</span>
                                            <span class="status status-${status}">${status}</span>
                                        </div>
                                        ${booking.description ? `<div class="description">${booking.description}</div>` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')
            }
        </div>
    `;
    
    return content;
}

// Booking Detail View
function bookingDetailView(bookingId) {
    const booking = state.myBookings.find(b => b._id === bookingId);
    if (!booking) {
        return `<h2>Booking Not Found</h2>
            <button class="btn" onclick="setView('myBookings')">Back to My Bookings</button>`;
    }
    
    // Handle populated tutor object
    let tutorName = 'Unknown Tutor';
    if (booking.tutor) {
        if (typeof booking.tutor === 'string') {
            tutorName = booking.tutor;
        } else if (booking.tutor.firstName && booking.tutor.surname) {
            tutorName = `${booking.tutor.firstName} ${booking.tutor.surname}`;
        } else if (booking.tutor.name) {
            tutorName = booking.tutor.name;
        }
    }
    
    // Format the date/time
    let timeDisplay = 'No time specified';
    let dateValue = '';
    if (booking.date) {
        const date = new Date(booking.date);
        timeDisplay = date.toLocaleString();
        dateValue = date.toISOString().slice(0, 16); // Format for datetime-local input
    } else if (booking.timePeriod) {
        timeDisplay = booking.timePeriod;
    }
    
    return `<h2>Booking Details</h2>
        <div class="booking-detail">
            <div class="detail-section">
                <h3>Booking Information</h3>
                <p><strong>Subject:</strong> ${booking.subject}</p>
                <p><strong>Tutor:</strong> ${tutorName}</p>
                <p><strong>Status:</strong> ${booking.status || 'pending'}</p>
                <p><strong>Current Time:</strong> ${timeDisplay}</p>
                <p><strong>Description:</strong> ${booking.description || 'No description provided'}</p>
            </div>
            
            <div class="detail-section">
                <h3>Edit Booking</h3>
                <form onsubmit="event.preventDefault(); updateBooking('${booking._id}')">
                    <div class="input-group">
                        <label for="edit-time">New Time</label>
                        <input type="datetime-local" id="edit-time" value="${dateValue}" required />
                    </div>
                    <div class="input-group">
                        <label for="edit-desc">New Description</label>
                        <textarea id="edit-desc" placeholder="Describe what you need help with..." required>${booking.description || ''}</textarea>
                    </div>
                    <button class="btn" type="submit">Update Booking</button>
                </form>
            </div>
            
            <div class="detail-section">
                <h3>Cancel Booking</h3>
                <p>Are you sure you want to cancel this booking?</p>
                <button class="btn btn-danger" onclick="cancelBooking('${booking._id}')">Cancel Booking</button>
            </div>
            
            <div class="detail-section">
                <button class="btn" onclick="setView('myBookings')">Back to My Bookings</button>
            </div>
        </div>`;
}

// Tutor Dashboard - Removed to treat tutors like normal users

// --- API Helpers ---
const API = {
    async login(email, password) {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async register(email, name, password) {
        const [firstName, ...surnameArr] = name.split(' ');
        const surname = surnameArr.join(' ') || ' '; // fallback
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, firstName, surname, password })
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async getSubjects() {
        const res = await fetch('/api/subjects');
        if (!res.ok) throw new Error('Failed to fetch subjects');
        return (await res.json()).subjects;
    },
    async getTutors(subject) {
        const url = subject ? `/api/tutors/${encodeURIComponent(subject)}` : '/api/tutors';
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch tutors');
        const data = await res.json();
        return subject ? data.tutors : data; // Return tutors array directly if no subject
    },
    async bookSession(token, tutorId, subject, timePeriod, description, date) {
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ tutorId, subject, timePeriod, description, date })
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async becomeTutor(data) {
        const res = await fetch('/api/tutor/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async getMyBookings(token) {
        const res = await fetch('/api/bookings/user', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch bookings');
        return await res.json();
    },
    async getTutorBookings(token) {
        const res = await fetch('/api/bookings/tutor', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch tutor bookings');
        return await res.json();
    },
    async getProfile(token) {
        // Not strictly needed, info is in state.user
        return state.user;
    },
    async updateProfile(token, firstName, surname, email) {
        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ firstName, surname, email })
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    // --- Manager ---
    async getAllBookings(token) {
        const res = await fetch('/api/admin/bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch all bookings');
        return await res.json();
    },
    async getAllSubjects(token) {
        // Use /api/subjects for all
        return this.getSubjects();
    },
    async addSubject(token, name) {
        const res = await fetch('/api/admin/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async removeSubject(token, id) {
        const res = await fetch(`/api/admin/subjects/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async getAllTutors(token) {
        const res = await fetch('/api/admin/tutors', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch tutors');
        return await res.json();
    },
    async getPendingTutors(token) {
        const res = await fetch('/api/admin/tutor-requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch tutor requests');
        return await res.json();
    },
    async approveTutor(token, tutorId) {
        const res = await fetch(`/api/admin/tutors/${tutorId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async assignTutor(token, tutorId, subjectId) {
        const res = await fetch(`/api/admin/tutors/${tutorId}/assign`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ subjectId })
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async assignMultipleSubjects(token, tutorId, subjectIds) {
        console.log('API.assignMultipleSubjects called with:', { tutorId, subjectIds });
        const res = await fetch(`/api/admin/tutors/${tutorId}/assign-multiple`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ subjectIds })
        });
        console.log('API response status:', res.status);
        if (!res.ok) {
            const errorData = await res.json();
            console.error('API error:', errorData);
            throw new Error(errorData.message);
        }
        const result = await res.json();
        console.log('API success:', result);
        return result;
    },
    async rejectTutor(token, tutorId) {
        const res = await fetch(`/api/admin/tutors/${tutorId}/reject`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async removeTutor(token, tutorId) {
        const res = await fetch(`/api/admin/tutors/${tutorId}/remove`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async removeBooking(token, bookingId) {
        const res = await fetch(`/api/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async updateBooking(token, bookingId, timePeriod, description, date) {
        const res = await fetch(`/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ timePeriod, description, date })
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async cancelBooking(token, bookingId) {
        const res = await fetch(`/api/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async acceptBooking(token, bookingId) {
        const res = await fetch(`/api/bookings/${bookingId}/accept`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async sendMessageToStudent(token, bookingId, studentEmail, subject, messageContent) {
        const res = await fetch(`/api/bookings/${bookingId}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ studentEmail, subject, messageContent })
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async completeSession(token, bookingId, duration) {
        const res = await fetch(`/api/bookings/${bookingId}/complete`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ duration })
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    },
    async updateTutorInfo(token, subjects, description) {
        const res = await fetch('/api/tutors/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ subjects, description })
        });
        if (!res.ok) throw new Error((await res.json()).message);
        return res.json();
    }
};



// Add test button to login view for easy access
function loginView() {
    return `
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="text-center">Login</h3>
                        </div>
                        <div class="card-body">
                            <form id="loginForm">
                                <div class="form-group">
                                    <label for="email">Email:</label>
                                    <input type="email" class="form-control" id="email" required>
                                </div>
                                <div class="form-group">
                                    <label for="password">Password:</label>
                                    <input type="password" class="form-control" id="password" required>
                                </div>
                                <button type="submit" class="btn btn-primary btn-block">Login</button>
                            </form>
                            <p class="text-center mt-3">
                                Don't have an account? <a href="#" onclick="setView('register')">Register here</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ... existing code ...
// Replace all TODOs in event handlers with real API calls using API helpers above
// ... existing code ...

// --- Event Handlers ---
window.setView = setView;

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const data = await API.login(email, password);
        state.user = {
            email: data.user.email,
            username: data.user.firstName + ' ' + data.user.surname,
            isManager: data.user.isAdmin,
            token: data.token
        };
        
        if (state.user.isManager) {
            await fetchManagerData();
            setView('manager');
        } else {
            await fetchUserData();
            setView('book');
        }
    } catch (e) {
        app.innerHTML = showError(e.message) + loginView();
    }
}

async function register() {
    const email = document.getElementById('register-email').value;
    const name = document.getElementById('register-name').value;
    const password = document.getElementById('register-password').value;
    try {
        await API.register(email, name, password);
        app.innerHTML = showSuccess('Registration successful! Please login.') + loginView();
    } catch (e) {
        app.innerHTML = showError(e.message) + registerView();
    }
}

function logout() {
    state.user = null;
    state.currentView = 'login';
    render();
}

// Function to update the app with aggressive cache busting
function updateApp() {
    console.log('Updating app with cache busting...');
    
    // Clear all localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear service worker cache
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.active.postMessage({type: 'CLEAR_CACHE'});
        });
    }
    
    // Unregister all service workers to force fresh load
    navigator.serviceWorker.getRegistrations().then(registrations => {
        for(let registration of registrations) {
            registration.unregister();
        }
    });
    
    // Force reload without cache
    window.location.reload(true);
}



async function fetchUserData() {
    state.subjects = await API.getSubjects();
    // Fetch all approved tutors for booking sessions
    state.tutors = await API.getTutors();
    state.myBookings = await API.getMyBookings(state.user.token);
    
    console.log('fetchUserData - Initial myBookings:', state.myBookings);
    
    // If user is a tutor, also fetch bookings where they are the tutor
    const isTutor = state.tutors && state.tutors.some(t => 
        t.email === state.user.email && t.isApproved !== false
    );
    
    console.log('fetchUserData - isTutor:', isTutor);
    
    if (isTutor) {
        try {
            const tutorBookings = await API.getTutorBookings(state.user.token);
            console.log('fetchUserData - tutorBookings from API:', tutorBookings);
            // Keep tutor bookings separate instead of combining them
            state.tutorBookings = tutorBookings;
            console.log('fetchUserData - Separate tutorBookings:', state.tutorBookings);
        } catch (error) {
            console.error('Error fetching tutor bookings:', error);
            state.tutorBookings = [];
        }
    } else {
        state.tutorBookings = [];
    }
    
    state.profile = { email: state.user.email, username: state.user.username };
}

async function fetchManagerData() {
    console.log('fetchManagerData called');
    console.log('User token:', state.user.token);
    
    try {
        state.subjects = await API.getAllSubjects(state.user.token);
        console.log('Subjects fetched:', state.subjects.length);
        console.log('Subjects data:', state.subjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        throw new Error('Failed to fetch subjects: ' + error.message);
    }
    
    try {
        state.tutors = await API.getAllTutors(state.user.token);
        console.log('Tutors fetched:', state.tutors.length);
        console.log('Tutors data:', state.tutors);
    } catch (error) {
        console.error('Error fetching tutors:', error);
        throw new Error('Failed to fetch tutors: ' + error.message);
    }
    
    try {
        state.bookings = await API.getAllBookings(state.user.token);
        console.log('Bookings fetched:', state.bookings.length);
        console.log('Bookings data:', state.bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        throw new Error('Failed to fetch all bookings: ' + error.message);
    }
    
    try {
        state.tutorRequests = await API.getPendingTutors(state.user.token);
        console.log('Tutor requests fetched:', state.tutorRequests.length);
        console.log('Tutor requests data:', state.tutorRequests);
    } catch (error) {
        console.error('Error fetching tutor requests:', error);
        throw new Error('Failed to fetch tutor requests: ' + error.message);
    }
    
    console.log('fetchManagerData completed successfully');
}

async function selectSubject(subjectId) {
    console.log('selectSubject called with subjectId:', subjectId);
    console.log('Current view before selectSubject:', state.currentView);
    
    state.selectedSubject = subjectId;
    state.selectedTutor = null;
    setView('chooseTutor');
    
    console.log('selectSubject completed, view changed to chooseTutor');
}

async function selectTutor(tutorId) {
    state.selectedTutor = tutorId;
    state.selectedTutorObj = state.tutors.find(t => t._id === tutorId);
    setView('bookingForm');
}

async function submitBooking() {
    const name = document.getElementById('booking-name').value;
    const email = document.getElementById('booking-email').value;
    const time = document.getElementById('booking-time').value;
    const desc = document.getElementById('booking-desc').value;
    try {
        await API.bookSession(
            state.user.token,
            state.selectedTutor,
            state.subjects.find(s => s._id === state.selectedSubject).name,
            time,
            desc,
            time // using time as date for now
        );
        app.innerHTML = showSuccess('Booking submitted! (Email sent to tutor)');
        await fetchUserData();
        setView('myBookings');
    } catch (e) {
        app.innerHTML = showError(e.message) + bookingFormView();
    }
}

async function submitTutorRequest() {
    const subjects = document.getElementById('tutor-subjects').value.split(',').map(s => s.trim());
    const desc = document.getElementById('tutor-desc').value;
    
    // Use user's existing information
    const [firstName, ...surnameArr] = state.user.username.split(' ');
    const surname = surnameArr.join(' ') || '';
    
    try {
        await API.becomeTutor({ 
            firstName, 
            surname, 
            email: state.user.email, 
            subjects, 
            description: desc 
        });
        app.innerHTML = showSuccess('Tutor application submitted! (Manager will be notified by email)');
        setView('book');
    } catch (e) {
        app.innerHTML = showError(e.message) + becomeTutorView();
    }
}

async function addSubject() {
    const name = document.getElementById('new-subject').value;
    try {
        await API.addSubject(state.user.token, name);
        await fetchManagerData();
        render();
    } catch (e) {
        app.innerHTML = showError(e.message) + managerPanelView();
    }
}

async function approveTutor(tutorId) {
    try {
        console.log('Approving tutor:', tutorId);
        await API.approveTutor(state.user.token, tutorId);
        
        // Get the tutor's requested subjects and assign them
        const tutor = state.tutorRequests.find(t => t._id === tutorId);
        if (tutor && tutor.subjects && Array.isArray(tutor.subjects)) {
            console.log('Auto-assigning tutor to requested subjects:', tutor.subjects);
            
            // Find subject IDs for the requested subjects
            const subjectIds = [];
            for (const subjectName of tutor.subjects) {
                const subject = state.subjects.find(s => s.name === subjectName);
                if (subject) {
                    subjectIds.push(subject._id);
                }
            }
            
            if (subjectIds.length > 0) {
                console.log('Assigning tutor to subject IDs:', subjectIds);
                await API.assignMultipleSubjects(state.user.token, tutorId, subjectIds);
            }
        }
        
        console.log('About to fetch manager data after tutor approval...');
        await fetchManagerData();
        console.log('Manager data fetched successfully, rendering...');
        render();
    } catch (e) {
        console.error('Error in approveTutor:', e);
        console.error('Error details:', {
            message: e.message,
            stack: e.stack,
            tutorId: tutorId,
            userToken: state.user.token ? 'Token exists' : 'No token'
        });
        app.innerHTML = showError('Error approving tutor: ' + e.message) + managerPanelView();
    }
}

async function assignTutor(tutorId) {
    const select = document.getElementById('assign-' + tutorId);
    const subjectId = select.value;
    try {
        await API.assignTutor(state.user.token, tutorId, subjectId);
        await fetchManagerData();
        render();
    } catch (e) {
        app.innerHTML = showError(e.message) + managerPanelView();
    }
}

async function assignMultipleSubjects(tutorId) {
    console.log('assignMultipleSubjects called with tutorId:', tutorId);
    console.log('Current state.selectedSubject before API call:', state.selectedSubject);
    
    // Try different selector approaches
    const checkboxes = document.querySelectorAll(`input[id^="subject-${tutorId}-"]`);
    console.log('Found checkboxes with prefix selector:', checkboxes.length);
    
    if (checkboxes.length === 0) {
        // Fallback: try to find all checkboxes in the current tutor item
        const tutorItem = document.querySelector(`[data-tutor-id="${tutorId}"]`);
        if (tutorItem) {
            const fallbackCheckboxes = tutorItem.querySelectorAll('input[type="checkbox"]');
            console.log('Found checkboxes with fallback selector:', fallbackCheckboxes.length);
        }
    }
    
    const selectedSubjects = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    console.log('Selected subjects:', selectedSubjects);
    
    if (selectedSubjects.length === 0) {
        console.log('No subjects selected, but continuing...');
    }
    
    try {
        console.log('Calling API with token:', state.user.token ? 'Token exists' : 'No token');
        console.log('API call parameters:', { tutorId, selectedSubjects });
        await API.assignMultipleSubjects(state.user.token, tutorId, selectedSubjects);
        console.log('API call successful');
        console.log('About to call fetchManagerData...');
        await fetchManagerData();
        console.log('fetchManagerData completed, about to call render...');
        
        // Clear any selected subject to prevent automatic navigation
        state.selectedSubject = null;
        state.selectedTutor = null;
        state.selectedTutorObj = null;
        
        render();
        console.log('render completed');
    } catch (e) {
        console.error('Error in assignMultipleSubjects:', e);
        app.innerHTML = showError(e.message) + managerPanelView();
    }
}

async function rejectTutor(tutorId) {
    try {
        await API.rejectTutor(state.user.token, tutorId);
        await fetchManagerData();
        render();
    } catch (e) {
        app.innerHTML = showError(e.message) + managerPanelView();
    }
}

async function updateProfile() {
    const firstName = document.getElementById('profile-firstName').value;
    const surname = document.getElementById('profile-surname').value;
    const email = document.getElementById('profile-email').value;
    try {
        await API.updateProfile(state.user.token, firstName, surname, email);
        // Update local state
        state.user.email = email;
        state.user.username = firstName + ' ' + surname;
        app.innerHTML = showSuccess('Profile updated successfully!');
        updateTopNav(); // Update the top nav to show new name
        setTimeout(() => setView('profile'), 2000);
    } catch (e) {
        app.innerHTML = showError(e.message) + profileView();
    }
}

async function removeSubject(subjectId) {
    if (!confirm('Are you sure you want to remove this subject? This will also remove it from all tutors.')) {
        return;
    }
    try {
        await API.removeSubject(state.user.token, subjectId);
        await fetchManagerData();
        render();
    } catch (e) {
        app.innerHTML = showError(e.message) + managerPanelView();
    }
}

async function removeTutor(tutorId) {
    if (!confirm('Are you sure you want to remove this tutor? This action cannot be undone.')) {
        return;
    }
    try {
        await API.removeTutor(state.user.token, tutorId);
        await fetchManagerData();
        render();
    } catch (e) {
        app.innerHTML = showError(e.message) + managerPanelView();
    }
}

async function updateBooking(bookingId) {
    const time = document.getElementById('edit-time').value;
    const desc = document.getElementById('edit-desc').value;
    try {
        await API.updateBooking(state.user.token, bookingId, time, desc, time);
        app.innerHTML = showSuccess('Booking updated successfully!');
        await fetchUserData();
        setView('myBookings');
    } catch (e) {
        app.innerHTML = showError(e.message) + bookingDetailView(bookingId);
    }
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
        return;
    }
    try {
        await API.cancelBooking(state.user.token, bookingId);
        app.innerHTML = showSuccess('Booking cancelled successfully!');
        await fetchUserData();
        setView('myBookings');
    } catch (e) {
        app.innerHTML = showError(e.message) + bookingDetailView(bookingId);
    }
}

async function viewBooking(bookingId) {
    state.selectedBookingId = bookingId;
    setView('bookingDetail');
}

async function refreshBookings() {
    if (!state.user) return;
    
    state.loading = true;
    render(); // Show loading state immediately
    
    try {
        await fetchUserData();
        state.loading = false;
        render();
    } catch (error) {
        state.loading = false;
        render();
        console.error('Error refreshing bookings:', error);
    }
}

async function acceptBooking(bookingId) {
    if (!confirm('Are you sure you want to accept this booking?')) {
        return;
    }
    try {
        await API.acceptBooking(state.user.token, bookingId);
        app.innerHTML = showSuccess('Booking accepted successfully! Email notification sent to student.');
        await fetchUserData();
        setView('tutorPanel');
    } catch (e) {
        app.innerHTML = showError(e.message) + tutorPanelView();
    }
}

async function refreshTutorBookings() {
    if (!state.user) return;
    
    state.loading = true;
    render(); // Show loading state immediately
    
    try {
        await fetchUserData();
        state.loading = false;
        render(); // Use render() instead of setView() to properly refresh the view
    } catch (error) {
        state.loading = false;
        render(); // Use render() instead of setView() even on error
        console.error('Error refreshing tutor bookings:', error);
    }
}

// Initial render
render();

// Message Modal Functions
function openMessageModal(bookingId, studentName, studentEmail, subject) {
    const modalHTML = `
        <div id="messageModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Message Student</h3>
                    <button class="modal-close" onclick="closeMessageModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>To:</strong> ${studentName} (${studentEmail})</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <div class="input-group">
                        <label for="message-content">Your Message:</label>
                        <textarea id="message-content" placeholder="Write your message to the student..." rows="6" required></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeMessageModal()">Cancel</button>
                    <button class="btn" onclick="sendMessage('${bookingId}', '${studentEmail}', '${subject}')">Send Message</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Focus on message textarea
    setTimeout(() => {
        document.getElementById('message-content').focus();
    }, 100);
}

function openCompleteSessionModal(bookingId, subject, studentName) {
    const modalHTML = `
        <div id="completeSessionModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Complete Session</h3>
                    <button class="modal-close" onclick="closeCompleteSessionModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Student:</strong> ${studentName}</p>
                    <div class="input-group">
                        <label for="session-duration">Session Duration:</label>
                        <input type="text" id="session-duration" placeholder="e.g., 1 hour, 45 minutes, 2 hours 30 minutes" required />
                    </div>
                    <p class="info-text">This will mark the session as completed and send a notification email.</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeCompleteSessionModal()">Cancel</button>
                    <button class="btn btn-success" onclick="completeSession('${bookingId}')">Complete Session</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Focus on duration input
    setTimeout(() => {
        document.getElementById('session-duration').focus();
    }, 100);
}

function closeMessageModal() {
    const modal = document.getElementById('messageModal');
    if (modal) {
        modal.remove();
    }
}

function closeCompleteSessionModal() {
    const modal = document.getElementById('completeSessionModal');
    if (modal) {
        modal.remove();
    }
}

async function sendMessage(bookingId, studentEmail, subject) {
    const messageContent = document.getElementById('message-content').value.trim();
    
    if (!messageContent) {
        alert('Please enter a message');
        return;
    }
    
    try {
        await API.sendMessageToStudent(state.user.token, bookingId, studentEmail, subject, messageContent);
        closeMessageModal();
        app.innerHTML = showSuccess('Message sent successfully to student and tutor!');
        setTimeout(() => {
            render();
        }, 2000);
    } catch (error) {
        console.error('Error sending message:', error);
        app.innerHTML = showError('Failed to send message: ' + error.message);
        setTimeout(() => {
            render();
        }, 3000);
    }
}

async function completeSession(bookingId) {
    const duration = document.getElementById('session-duration').value.trim();
    
    if (!duration) {
        alert('Please enter the session duration');
        return;
    }
    
    try {
        await API.completeSession(state.user.token, bookingId, duration);
        closeCompleteSessionModal();
        app.innerHTML = showSuccess('Session completed successfully! Email notification sent.');
        setTimeout(() => {
            render();
        }, 2000);
    } catch (error) {
        console.error('Error completing session:', error);
        app.innerHTML = showError('Failed to complete session: ' + error.message);
        setTimeout(() => {
            render();
        }, 3000);
    }
}

async function removeBookingsForDate(dateString) {
    if (!confirm(`Are you sure you want to remove all bookings for ${new Date(dateString).toLocaleDateString()}?`)) {
        return;
    }
    
    try {
        // Filter bookings for the specific date
        const bookingsToRemove = state.allBookings.filter(booking => 
            new Date(booking.date).toDateString() === dateString
        );
        
        // Remove each booking
        for (const booking of bookingsToRemove) {
            await API.removeBooking(state.token, booking._id);
        }
        
        showSuccess(`Removed ${bookingsToRemove.length} bookings for ${new Date(dateString).toLocaleDateString()}`);
        
        // Refresh the booking records view
        await fetchManagerData();
        setView('bookingRecords');
    } catch (error) {
        showError(error.message);
    }
}

function openEditTutorModal() {
    const currentTutor = state.tutors.find(t => t.email === state.user.email);
    if (!currentTutor) {
        alert('Tutor information not found');
        return;
    }
    
    const currentSubjects = Array.isArray(currentTutor.subjects) ? currentTutor.subjects : [currentTutor.subjects];
    const currentDescription = currentTutor.description || currentTutor.bio || '';
    
    // Create subject checkboxes
    const subjectCheckboxes = state.subjects.map(subject => {
        const isChecked = currentSubjects.includes(subject.name) ? 'checked' : '';
        return `<label style="display: block; margin: 5px 0;">
            <input type="checkbox" name="subjects" value="${subject.name}" ${isChecked}>
            ${subject.name}
        </label>`;
    }).join('');
    
    const modalHTML = `
        <div id="editTutorModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Subjects & Description</h3>
                    <button class="modal-close" onclick="closeEditTutorModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px;">
                        <label><strong>Select Subjects:</strong></label>
                        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin-top: 5px;">
                            ${subjectCheckboxes}
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label for="tutor-description"><strong>Description:</strong></label>
                        <textarea id="tutor-description" rows="4" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">${currentDescription}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeEditTutorModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="updateTutorInfo()">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeEditTutorModal() {
    const modal = document.getElementById('editTutorModal');
    if (modal) {
        modal.remove();
    }
}

async function updateTutorInfo() {
    // Get selected subjects
    const selectedSubjects = Array.from(document.querySelectorAll('input[name="subjects"]:checked'))
        .map(checkbox => checkbox.value);
    
    if (selectedSubjects.length === 0) {
        alert('Please select at least one subject');
        return;
    }
    
    const description = document.getElementById('tutor-description').value.trim();
    
    if (!description) {
        alert('Please enter a description');
        return;
    }
    
    try {
        const result = await API.updateTutorInfo(state.user.token, selectedSubjects, description);
        closeEditTutorModal();
        
        if (result.subjectsChanged) {
            app.innerHTML = showSuccess('Tutor information updated successfully! An email notification has been sent to the manager about your subject changes.');
        } else {
            app.innerHTML = showSuccess('Tutor information updated successfully!');
        }
        
        // Refresh tutor data
        await fetchUserData();
        setTimeout(() => {
            render();
        }, 2000);
    } catch (error) {
        console.error('Error updating tutor info:', error);
        app.innerHTML = showError('Failed to update tutor information: ' + error.message);
        setTimeout(() => {
            render();
        }, 3000);
    }
} 