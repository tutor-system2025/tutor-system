# Tutor System

A comprehensive web-based tutoring system that allows students to book sessions with qualified tutors, and managers to oversee the entire operation.

## Features

### For Students
- User registration and login with first name, surname, and email
- Browse available subjects
- View approved tutors for each subject
- Book tutoring sessions with time period and description
- View booking history and status
- Update profile information

### For Tutors
- Tutor registration with subjects and description
- Application approval system by manager
- Receive booking requests via email
- View assigned bookings

### For Managers
- Admin panel with manager credentials (eric_yang / GRE_is_the_best_house)
- Approve/reject tutor applications
- View all bookings across the system
- Receive email notifications for new tutor registrations

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Bootstrap 5

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tutor-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB**
   - Make sure MongoDB is running on your system
   - The application will automatically connect to `mongodb://localhost:27017/tutor_system`

4. **Configure Email Settings**
   - Open `index.js`
   - Update the email configuration in the `transporter` section:
   ```javascript
   const transporter = nodemailer.createTransporter({
     service: 'gmail',
     auth: {
       user: 'your-email@gmail.com', // Replace with your email
       pass: 'your-app-password' // Replace with your app password
     }
   });
   ```
   - Also update the manager email in the tutor registration section

5. **Start the server**
   ```bash
   npm start
   ```
   or for development with auto-restart:
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open your browser and go to `http://localhost:3000`

## Default Manager Account

The system automatically creates a default manager account:
- **Email**: eric_yang@example.com
- **Password**: GRE_is_the_best_house

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `PUT /api/profile` - Update user profile

### Subjects & Tutors
- `GET /api/subjects` - Get all subjects
- `GET /api/tutors/:subject` - Get approved tutors for a subject
- `POST /api/tutor/register` - Tutor registration

### Bookings
- `POST /api/bookings` - Create a booking
- `GET /api/bookings/user` - Get user's bookings
- `GET /api/bookings/tutor` - Get tutor's bookings

### Admin (Manager)
- `GET /api/admin/tutors` - Get all tutors (pending and approved)
- `PUT /api/admin/tutors/:id/approve` - Approve a tutor
- `GET /api/admin/bookings` - Get all bookings

## Database Schema

### User
- firstName (String, required)
- surname (String, required)
- email (String, required, unique)
- password (String, required, hashed)
- isAdmin (Boolean, default: false)

### Tutor
- firstName (String, required)
- surname (String, required)
- email (String, required, unique)
- subjects (Array of Strings, required)
- description (String, required)
- isApproved (Boolean, default: false)
- createdAt (Date, default: now)

### Subject
- name (String, required, unique)

### Booking
- user (ObjectId, ref: User, required)
- tutor (ObjectId, ref: Tutor, required)
- subject (String, required)
- timePeriod (String, required)
- description (String, required)
- date (Date, required)
- status (String, enum: ['pending', 'confirmed', 'completed', 'cancelled'])
- createdAt (Date, default: now)

## Usage Guide

### For Students
1. Register with your first name, surname, and email
2. Login to access the dashboard
3. Browse available subjects
4. Select a subject to see available tutors
5. Click "Book Session" to schedule a tutoring session
6. Fill in the booking details (date, time period, description)
7. View your bookings in the "My Bookings" tab

### For Tutors
1. Go to the "Become a Tutor" tab
2. Fill in your details including subjects and description
3. Submit your application
4. Wait for manager approval
5. Once approved, you'll receive booking requests via email

### For Managers
1. Login with the default manager credentials
2. Access the "Admin Panel" tab
3. Review pending tutor applications
4. Approve qualified tutors
5. Monitor all bookings in the system

## Email Notifications

The system sends email notifications for:
- New tutor registrations (to manager)
- Tutor approval confirmations (to tutors)
- New booking requests (to tutors)

## Security Features

- Password hashing using bcrypt
- JWT-based authentication
- Input validation and sanitization
- CORS protection
- Admin-only routes protection

## Customization

### Adding Subjects
Subjects can be added directly to the MongoDB database or through the admin panel (if implemented).

### Email Templates
Email templates can be customized in the `index.js` file in the respective email sending sections.

### Styling
The frontend uses Bootstrap 5 and can be customized by modifying the CSS in `public/index.html`.

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check if the connection URL is correct

2. **Email Not Sending**
   - Verify email credentials in the configuration
   - Check if 2FA is enabled on Gmail (use app password)
   - Ensure the email service is properly configured

3. **Port Already in Use**
   - Change the PORT variable in `index.js`
   - Or kill the process using the current port

### Logs
Check the console output for detailed error messages and debugging information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team. 