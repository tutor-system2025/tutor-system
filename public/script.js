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

// ... existing code ... 