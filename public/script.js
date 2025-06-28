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
        `;
    } else {
        // Logged in - show user info and logout
        const displayName = state.user.username || (state.user.firstName && state.user.surname ? `${state.user.firstName} ${state.user.surname}` : 'User');
        topNavButtons.innerHTML = `
            <span class="user-info">Hi, ${displayName}</span>
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
        
        let buttons = `
            <button class="ui-nav-btn ${isActive('book')}" onclick="setView('book')">Book Session</button>
            <button class="ui-nav-btn ${isActive('becomeTutor')}" onclick="setView('becomeTutor')">Become Tutor</button>
            <button class="ui-nav-btn ${isActive('myBookings')}" onclick="setView('myBookings')">My Bookings</button>
            <button class="ui-nav-btn ${isActive('profile')}" onclick="setView('profile')">Profile</button>
        `;
        
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
            app.innerHTML = bookingView();
            break;
        case 'becomeTutor':
            app.innerHTML = tutorRegistrationView();
            break;
        case 'myBookings':
            app.innerHTML = myBookingsView();
            break;
        case 'profile':
            app.innerHTML = profileView();
            break;
        case 'manager':
            app.innerHTML = managerView();
            break;
        default:
            app.innerHTML = bookingView();
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
            case 'myBookings': content = myBookingsView(); break;
            case 'profile': content = profileView(); break;
            case 'manager': content = managerPanelView(); break;
            case 'bookingDetail': content = bookingDetailView(state.selectedBookingId); break;
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
    return `<h2>Become a Tutor</h2>
        <form onsubmit="event.preventDefault(); submitTutorRequest()">
            <div class="input-group">
                <label for="tutor-name">Name</label>
                <input type="text" id="tutor-name" placeholder="Enter your full name" required />
            </div>
            <div class="input-group">
                <label for="tutor-gmail">Gmail</label>
                <input type="email" id="tutor-gmail" placeholder="Enter your Gmail address" required />
            </div>
            <div class="input-group">
                <label for="tutor-subjects">Subjects to Teach</label>
                <input type="text" id="tutor-subjects" placeholder="e.g. Math, Physics" required />
            </div>
            <div class="input-group">
                <label for="tutor-desc">Description (time, level, etc.)</label>
                <textarea id="tutor-desc" placeholder="Describe your teaching experience and availability..." required></textarea>
            </div>
            <button class="btn" type="submit">Submit</button>
        </form>`;
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
            <h3>All Bookings</h3>
            <ul class="list">${state.bookings.map(b => {
                // Handle populated user object
                let userName = 'Unknown User';
                if (b.user) {
                    if (typeof b.user === 'string') {
                        userName = b.user;
                    } else if (b.user.firstName && b.user.surname) {
                        userName = `${b.user.firstName} ${b.user.surname}`;
                    }
                }
                
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
                
                return `<li>${userName} booked ${b.subject} with ${tutorName} at ${timeDisplay}</li>`;
            }).join('')}</ul>
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
                        <button class="btn btn-small btn-danger" onclick="removeTutor('${t._id}')">Remove Tutor</button>
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
        const res = await fetch(`/api/tutors/${encodeURIComponent(subject)}`);
        if (!res.ok) throw new Error('Failed to fetch tutors');
        return (await res.json()).tutors;
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
    }
};

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

async function fetchUserData() {
    state.subjects = await API.getSubjects();
    // Fetch all approved tutors for booking sessions
    state.tutors = await API.getAllTutors(state.user.token);
    state.myBookings = await API.getMyBookings(state.user.token);
    state.profile = { email: state.user.email, username: state.user.username };
}

async function fetchManagerData() {
    console.log('fetchManagerData called');
    state.subjects = await API.getAllSubjects(state.user.token);
    console.log('Subjects fetched:', state.subjects.length);
    state.tutors = await API.getAllTutors(state.user.token);
    console.log('Tutors fetched:', state.tutors.length);
    state.bookings = await API.getAllBookings(state.user.token);
    console.log('Bookings fetched:', state.bookings.length);
    state.tutorRequests = await API.getPendingTutors(state.user.token);
    console.log('Tutor requests fetched:', state.tutorRequests.length);
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
    const name = document.getElementById('tutor-name').value;
    const gmail = document.getElementById('tutor-gmail').value;
    const subjects = document.getElementById('tutor-subjects').value.split(',').map(s => s.trim());
    const desc = document.getElementById('tutor-desc').value;
    const [firstName, ...surnameArr] = name.split(' ');
    const surname = surnameArr.join(' ') || ' ';
    try {
        await API.becomeTutor({ firstName, surname, email: gmail, subjects, description: desc });
        app.innerHTML = showSuccess('Tutor registration submitted! (Manager will be notified by email)');
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
        
        await fetchManagerData();
        render();
    } catch (e) {
        console.error('Error approving tutor:', e);
        app.innerHTML = showError(e.message) + managerPanelView();
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

// Initial render
render(); 