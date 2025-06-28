require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Remove any existing CSP headers and disable all security headers
app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Content-Security-Policy');
  res.removeHeader('X-WebKit-CSP');
  res.removeHeader('X-Frame-Options');
  res.removeHeader('X-XSS-Protection');
  res.removeHeader('X-Content-Type-Options');
  res.removeHeader('Referrer-Policy');
  res.removeHeader('Permissions-Policy');
  next();
});

// Force a permissive CSP header
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "script-src * 'unsafe-inline' 'unsafe-eval';");
  next();
});

app.use(helmet({
  contentSecurityPolicy: false
}));
app.disable('x-powered-by');
app.use(express.static('public', {
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Models
const User = require('./model/User');
const Tutor = require('./model/Tutor');
const Subject = require('./model/Subject');
const Booking = require('./model/Booking');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, surname, email, password } = req.body;
    if (!firstName || !surname || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ firstName, surname, email, password: hashedPassword });
    await user.save();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        surname: user.surname,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Subjects (with pagination)
app.get('/api/subjects', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;
    const [subjects, total] = await Promise.all([
      Subject.find().skip(skip).limit(limit),
      Subject.countDocuments()
    ]);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ subjects, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Approved Tutors by Subject (with pagination)
app.get('/api/tutors/:subject', async (req, res) => {
  try {
    const { subject } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;
    const [tutors, total] = await Promise.all([
      Tutor.find({ subjects: subject, isApproved: true }).skip(skip).limit(limit).select('-description'),
      Tutor.countDocuments({ subjects: subject, isApproved: true })
    ]);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ tutors, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get All Approved Tutors (for regular users)
app.get('/api/tutors', async (req, res) => {
  try {
    const tutors = await Tutor.find({ isApproved: true }).select('-description');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(tutors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Tutor Registration
app.post('/api/tutor/register', async (req, res) => {
  try {
    const { firstName, surname, email, subjects, description } = req.body;
    if (!firstName || !surname || !email || !subjects || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingTutor = await Tutor.findOne({ email });
    if (existingTutor) return res.status(400).json({ message: 'Tutor already registered' });
    const tutor = new Tutor({ firstName, surname, email, subjects, description, isApproved: false });
    await tutor.save();
    // Send email to manager
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'New Tutor Registration',
      html: `
        <h2>New Tutor Registration</h2>
        <p><strong>Name:</strong> ${firstName} ${surname}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subjects:</strong> ${Array.isArray(subjects) ? subjects.join(', ') : subjects}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p>Please review and approve this tutor registration.</p>
      `
    };
    await transporter.sendMail(mailOptions);
    res.status(201).json({ message: 'Tutor registration submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Booking
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { tutorId, subject, timePeriod, description, date } = req.body;
    
    // Create booking
    const booking = new Booking({
      user: req.user.userId,
      tutor: tutorId,
      subject,
      timePeriod,
      description,
      date: new Date(date)
    });
    
    await booking.save();
    
    // Get tutor and user details for email
    const tutor = await Tutor.findById(tutorId);
    const user = await User.findById(req.user.userId);
    
    // Send email to tutor
    const tutorMailOptions = {
      from: process.env.EMAIL_USER,
      to: tutor.email,
      subject: 'New Booking Request',
      html: `
        <h2>New Booking Request</h2>
        <p><strong>Student:</strong> ${user.firstName} ${user.surname}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Time Period:</strong> ${timePeriod}</p>
        <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p>Please review this booking request.</p>
      `
    };
    
    await transporter.sendMail(tutorMailOptions);
    
    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get User Bookings
app.get('/api/bookings/user', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.userId })
      .populate('tutor', 'firstName surname email')
      .sort({ createdAt: -1 });
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Tutor Bookings
app.get('/api/bookings/tutor', authenticateToken, async (req, res) => {
  try {
    const tutor = await Tutor.findOne({ email: req.user.email });
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }
    
    const bookings = await Booking.find({ tutor: tutor._id })
      .populate('user', 'firstName surname email')
      .sort({ createdAt: -1 });
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Booking (User only)
app.put('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { timePeriod, description, date } = req.body;
    
    // Find the booking and ensure it belongs to the user
    const booking = await Booking.findOne({ 
      _id: req.params.id, 
      user: req.user.userId 
    }).populate('tutor', 'firstName surname email');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Update the booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        timePeriod: timePeriod || booking.timePeriod,
        description: description || booking.description,
        date: date ? new Date(date) : booking.date
      },
      { new: true }
    ).populate('tutor', 'firstName surname email');
    
    // Send email notification to tutor
    const user = await User.findById(req.user.userId);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: booking.tutor.email,
      subject: 'Booking Updated',
      html: `
        <h2>Booking Update Notification</h2>
        <p><strong>Student:</strong> ${user.firstName} ${user.surname}</p>
        <p><strong>Subject:</strong> ${booking.subject}</p>
        <p><strong>New Time Period:</strong> ${timePeriod || booking.timePeriod}</p>
        <p><strong>New Date:</strong> ${date ? new Date(date).toLocaleDateString() : booking.date.toLocaleDateString()}</p>
        <p><strong>New Description:</strong> ${description || booking.description}</p>
        <p>The booking has been updated by the student.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ message: 'Booking updated successfully', booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel Booking (User only)
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    // Find the booking and ensure it belongs to the user
    const booking = await Booking.findOne({ 
      _id: req.params.id, 
      user: req.user.userId 
    }).populate('tutor', 'firstName surname email');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Delete the booking
    await Booking.findByIdAndDelete(req.params.id);
    
    // Send email notification to tutor
    const user = await User.findById(req.user.userId);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: booking.tutor.email,
      subject: 'Booking Cancelled',
      html: `
        <h2>Booking Cancellation Notification</h2>
        <p><strong>Student:</strong> ${user.firstName} ${user.surname}</p>
        <p><strong>Subject:</strong> ${booking.subject}</p>
        <p><strong>Original Time:</strong> ${booking.timePeriod}</p>
        <p><strong>Original Date:</strong> ${booking.date.toLocaleDateString()}</p>
        <p>The booking has been cancelled by the student.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manager Routes (Admin only)
app.get('/api/admin/tutors', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const tutors = await Tutor.find().sort({ createdAt: -1 });
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(tutors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/admin/tutors/:id/approve', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const tutor = await Tutor.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }
    
    // Send approval email to tutor
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: tutor.email,
      subject: 'Tutor Registration Approved',
      html: `
        <h2>Congratulations!</h2>
        <p>Your tutor registration has been approved.</p>
        <p>You can now receive booking requests from students.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ message: 'Tutor approved successfully', tutor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admin/bookings', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const bookings = await Booking.find()
      .populate('user', 'firstName surname email')
      .populate('tutor', 'firstName surname email')
      .sort({ createdAt: -1 });
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update User Profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, surname, email } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { firstName, surname, email },
      { new: true }
    );
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add Subject (Admin only)
app.post('/api/admin/subjects', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Subject name required' });
    const existing = await Subject.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Subject already exists' });
    const subject = new Subject({ name });
    await subject.save();
    res.status(201).json({ message: 'Subject added', subject });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove Subject (Admin only)
app.delete('/api/admin/subjects/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject removed', subject });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign Tutor to Subject (Admin only)
app.put('/api/admin/tutors/:id/assign', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const { subjectId } = req.body;
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) return res.status(404).json({ message: 'Tutor not found' });
    if (!tutor.subjects.includes(subject.name)) {
      tutor.subjects.push(subject.name);
      await tutor.save();
    }
    res.json({ message: 'Tutor assigned to subject', tutor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign Multiple Subjects to Tutor (Admin only)
app.put('/api/admin/tutors/:id/assign-multiple', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const { subjectIds } = req.body;
    if (!Array.isArray(subjectIds)) {
      return res.status(400).json({ message: 'subjectIds must be an array' });
    }
    
    const subjects = await Subject.find({ _id: { $in: subjectIds } });
    if (subjects.length !== subjectIds.length) {
      return res.status(404).json({ message: 'One or more subjects not found' });
    }
    
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) return res.status(404).json({ message: 'Tutor not found' });
    
    // Update tutor's subjects to the selected ones
    tutor.subjects = subjects.map(s => s.name);
    await tutor.save();
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ message: 'Tutor assigned to multiple subjects', tutor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject Tutor Application (Admin only)
app.put('/api/admin/tutors/:id/reject', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const tutor = await Tutor.findByIdAndDelete(req.params.id);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }
    
    // Send rejection email to tutor
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: tutor.email,
      subject: 'Tutor Registration Update',
      html: `
        <h2>Tutor Registration</h2>
        <p>Thank you for your interest in becoming a tutor.</p>
        <p>After careful review, we regret to inform you that your application has not been approved at this time.</p>
        <p>You may reapply in the future if you wish.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({ message: 'Tutor application rejected and removed', tutor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove Tutor (Admin only)
app.delete('/api/admin/tutors/:id/remove', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const tutor = await Tutor.findByIdAndDelete(req.params.id);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }
    
    // Send removal notification email to tutor
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: tutor.email,
      subject: 'Tutor Account Removed',
      html: `
        <h2>Tutor Account Update</h2>
        <p>Your tutor account has been removed from our system.</p>
        <p>If you believe this was done in error, please contact us.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({ message: 'Tutor removed successfully', tutor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Pending Tutor Requests (Admin only)
app.get('/api/admin/tutor-requests', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const pendingTutors = await Tutor.find({ isApproved: false }).sort({ createdAt: -1 });
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(pendingTutors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize default manager account
const initializeManager = async () => {
  try {
    const existingManager = await User.findOne({ email: process.env.EMAIL_USER });
    if (!existingManager) {
      const hashedPassword = await bcrypt.hash(process.env.MANAGER_PASSWORD, 10);
      const manager = new User({
        firstName: 'Manager',
        surname: 'Account',
        email: process.env.EMAIL_USER,
        password: hashedPassword,
        isAdmin: true
      });
      await manager.save();
      console.log('Default manager account created');
    }
  } catch (error) {
    console.error('Error creating manager account:', error);
  }
};

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeManager();
});
