require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB Connection
mongoose.connect('mongodb+srv://tutorsystemparnell:GEn3L8W0iDWFXZk1@cluster0.f8qlopz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User model
const User = require('./model/User');

async function checkDatabases() {
  try {
    console.log('Checking current database...');
    
    // Check if manager exists in current database
    const manager = await User.findOne({ email: 'tutorsystemparnell@gmail.com' });
    if (manager) {
      console.log('✅ Manager found in this database');
      console.log('Email:', manager.email);
      console.log('Name:', manager.firstName, manager.surname);
      console.log('IsAdmin:', manager.isAdmin);
      console.log('This appears to be the correct database');
    } else {
      console.log('❌ Manager not found in this database');
      console.log('This might not be the correct database');
    }
    
    // Count all users
    const userCount = await User.countDocuments();
    console.log('Total users in this database:', userCount);
    
  } catch (error) {
    console.error('Error checking databases:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkDatabases(); 