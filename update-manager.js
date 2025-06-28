const mongoose = require('mongoose');
const User = require('./model/User');
const bcrypt = require('bcrypt');

async function updateManager() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash('Academic123', 10);
    
    // Update the manager account
    const updatedManager = await User.findOneAndUpdate(
      { isAdmin: true },
      { 
        email: 'tutorsystemparnell@gmail.com', 
        password: hashedPassword 
      },
      { new: true }
    );
    
    if (updatedManager) {
      console.log('Manager account updated successfully:');
      console.log('Email:', updatedManager.email);
      console.log('Is Admin:', updatedManager.isAdmin);
    } else {
      console.log('No manager account found');
    }
    
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error updating manager account:', error);
    process.exit(1);
  }
}

updateManager(); 