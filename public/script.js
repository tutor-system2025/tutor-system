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
    myBookings: [],
    profile: null,
};

const app = document.getElementById('app');
const topNavButtons = document.getElementById('top-nav-buttons');

function updateTopNav() {
    if (!state.user) {
        // Not logged in - show login/register buttons
        topNavButtons.innerHTML = `
            <button class="top-nav-btn" onclick="setView('login')">Login</button>
            <button class="top-nav-btn" onclick="setView('register')">Register</button>
        `;
    } else {
        // Logged in - show user info and logout
        topNavButtons.innerHTML = `
            <span class="user-info">Hi, ${state.user.username}</span>
            <button class="top-nav-btn" onclick="logout()">Logout</button>
        `;
    }
}

function setView(view) {
    state.currentView = view;
    render();
}

function showError(msg) {
    return `<div class="error">${msg}</div>`;
}
function showSuccess(msg) {
    return `<div class="success">${msg}</div>`;
}

function navBar() {
    if (!state.user) return '';
    return `<nav>
        <button class="link" onclick="setView('book')">Book Session</button>
        <button class="link" onclick="setView('becomeTutor')">Become Tutor</button>
        <button class="link" onclick="setView('myBookings')">My Bookings</button>
        <button class="link" onclick="setView('profile')">Profile</button>
        ${state.user.isManager ? '<button class="link" onclick="setView(\'manager\')">Manager Panel</button>' : ''}
    </nav>`;
}

function render() {
    updateTopNav(); // Update top navigation first
    
    let html = '';
    if (!state.user) {
        html = state.currentView === 'register' ? registerView() : loginView();
    } else {
        switch (state.currentView) {
            case 'book': html = bookView(); break;
            case 'chooseTutor': html = chooseTutorView(); break;
            case 'bookingForm': html = bookingFormView(); break;
            case 'becomeTutor': html = becomeTutorView(); break;
            case 'myBookings': html = myBookingsView(); break;
            case 'profile': html = profileView(); break;
            case 'manager': html = managerPanelView(); break;
            default: html = bookView(); break;
        }
        html = navBar() + html;
    }
    app.innerHTML = html;
}

// Login/Register
function loginView() {
    return `<h1>Tutor Booking System</h1>
        <form onsubmit="event.preventDefault(); login()">
            <div class="input-group">
                <label>Email</label>
                <input type="email" id="login-email" required />
            </div>
            <div class="input-group">
                <label>Password</label>
                <input type="password" id="login-password" required />
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
                <label>Email</label>
                <input type="email" id="register-email" required />
            </div>
            <div class="input-group">
                <label>Username</label>
                <input type="text" id="register-username" required />
            </div>
            <div class="input-group">
                <label>Password</label>
                <input type="password" id="register-password" required />
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
    let tutors = state.tutors.filter(t => t.subjects.includes(state.selectedSubject));
    let tutorList = tutors.map(t => `<li><button class="link" onclick="selectTutor('${t._id}')">${t.name}</button> <span>(${t.description})</span></li>`).join('');
    return `<h2>Choose a Tutor</h2>
        <ul class="list">${tutorList}</ul>`;
}

function bookingFormView() {
    return `<h2>Book Session with ${state.selectedTutorObj.name}</h2>
        <form onsubmit="event.preventDefault(); submitBooking()">
            <div class="input-group">
                <label>Your Name</label>
                <input type="text" id="booking-name" required />
            </div>
            <div class="input-group">
                <label>Your Email</label>
                <input type="email" id="booking-email" value="${state.user.email}" required />
            </div>
            <div class="input-group">
                <label>Time</label>
                <input type="datetime-local" id="booking-time" required />
            </div>
            <div class="input-group">
                <label>What do you need help with?</label>
                <textarea id="booking-desc" required></textarea>
            </div>
            <button class="btn" type="submit">Book</button>
        </form>`;
}

// Become Tutor
function becomeTutorView() {
    return `<h2>Become a Tutor</h2>
        <form onsubmit="event.preventDefault(); submitTutorRequest()">
            <div class="input-group">
                <label>Name</label>
                <input type="text" id="tutor-name" required />
            </div>
            <div class="input-group">
                <label>Gmail</label>
                <input type="email" id="tutor-gmail" required />
            </div>
            <div class="input-group">
                <label>Subjects to Teach</label>
                <input type="text" id="tutor-subjects" placeholder="e.g. Math, Physics" required />
            </div>
            <div class="input-group">
                <label>Description (time, level, etc.)</label>
                <textarea id="tutor-desc" required></textarea>
            </div>
            <button class="btn" type="submit">Submit</button>
        </form>`;
}

// My Bookings
function myBookingsView() {
    let list = state.myBookings.map(b => `<li>${b.subject} with ${b.tutor} at ${b.time} - ${b.status}</li>`).join('');
    return `<h2>My Bookings</h2>
        <ul class="list">${list}</ul>`;
}

// Profile
function profileView() {
    return `<h2>Profile</h2>
        <div class="profile-info">
            <div><strong>Email:</strong> ${state.user.email}</div>
            <div><strong>Username:</strong> ${state.user.username}</div>
        </div>`;
}

// Manager Panel
function managerPanelView() {
    return `<h2>Manager Panel</h2>
        <div class="panel-section">
            <h3>All Bookings</h3>
            <ul class="list">${state.bookings.map(b => `<li>${b.user} booked ${b.subject} with ${b.tutor} at ${b.time}</li>`).join('')}</ul>
        </div>
        <div class="panel-section">
            <h3>Subjects</h3>
            <ul class="list">${state.subjects.map(s => `<li>${s.name}</li>`).join('')}</ul>
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
            <h3>Tutor Registration Requests</h3>
            <ul class="list">${state.tutorRequests.map(r => `<li class="tutor-item">
                <div class="tutor-info">${r.name} (${r.gmail}) - ${r.subjects}</div>
                <div class="tutor-actions">
                    <button class="btn btn-small" onclick="approveTutor('${r._id}')">Approve</button>
                </div>
            </li>`).join('')}</ul>
        </div>
        <div class="panel-section">
            <h3>Assign Tutors to Subjects</h3>
            <ul class="list">${state.tutors.map(t => `<li class="tutor-item">
                <div class="tutor-info">${t.name}</div>
                <div class="tutor-actions">
                    <select id="assign-${t._id}">${state.subjects.map(s => `<option value="${s._id}" ${t.subjects.includes(s._id) ? 'selected' : ''}>${s.name}</option>`)}</select>
                    <button class="btn btn-small" onclick="assignTutor('${t._id}')">Assign</button>
                </div>
            </li>`).join('')}</ul>
        </div>`;
}

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
    async register(email, username, password) {
        const [firstName, ...surnameArr] = username.split(' ');
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
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    try {
        await API.register(email, username, password);
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
    state.tutors = [];
    state.myBookings = await API.getMyBookings(state.user.token);
    state.profile = { email: state.user.email, username: state.user.username };
}

async function fetchManagerData() {
    state.subjects = await API.getAllSubjects(state.user.token);
    state.tutors = await API.getAllTutors(state.user.token);
    state.bookings = await API.getAllBookings(state.user.token);
    state.tutorRequests = await API.getPendingTutors(state.user.token);
}

async function selectSubject(subjectId) {
    state.selectedSubject = subjectId;
    const subject = state.subjects.find(s => s._id === subjectId);
    state.tutors = await API.getTutors(subject.name);
    state.selectedTutor = null;
    setView('chooseTutor');
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
        await API.approveTutor(state.user.token, tutorId);
        await fetchManagerData();
        render();
    } catch (e) {
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

// Initial render
render(); 