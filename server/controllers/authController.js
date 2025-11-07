const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, userType, contactNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      userType: userType || 'user',
      contactNumber,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (userType && user.userType !== userType) {
      return res.status(401).json({ 
        message: `This account is registered as ${user.userType}, not ${userType}` 
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      profilePicture: user.profilePicture,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { credential, userType } = req.body;

    // ← ENHANCED DEBUG LOGGING
    console.log('==========================================');
    console.log('GOOGLE AUTH REQUEST RECEIVED');
    console.log('==========================================');
    console.log('Request Body:', { hasCredential: !!credential, userType });
    console.log('Backend GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
    console.log('First 30 chars:', process.env.GOOGLE_CLIENT_ID?.substring(0, 30));
    console.log('Last 30 chars:', process.env.GOOGLE_CLIENT_ID?.substring(process.env.GOOGLE_CLIENT_ID?.length - 30));
    console.log('Client ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('Client ID length:', process.env.GOOGLE_CLIENT_ID?.length);
    console.log('==========================================');

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID is not set in environment variables!');
      return res.status(500).json({ 
        message: 'Server configuration error: Google Client ID not set' 
      });
    }

    if (!credential) {
      console.error('No credential provided in request');
      return res.status(400).json({ 
        message: 'No credential provided' 
      });
    }

    console.log('Verifying token with Google...');

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    console.log('Google Token Verified Successfully');
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('Google ID:', googleId);
    console.log('Picture:', picture);

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      console.log('Existing user found');
      console.log('User ID:', user._id);
      console.log('Current UserType:', user.userType);
      
      // Update Google ID and picture if not set
      if (!user.googleId) {
        console.log('Adding Google ID to existing user');
        user.googleId = googleId;
      }
      if (!user.profilePicture) {
        console.log('Adding profile picture to existing user');
        user.profilePicture = picture;
      }
      await user.save();
    } else {
      console.log('New user - creating account');
      
      // Create new user with random password
      const randomPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
      
      user = await User.create({
        name,
        email,
        password: randomPassword,
        userType: userType || 'user',
        googleId,
        profilePicture: picture,
      });

      console.log('New user created');
      console.log('User ID:', user._id);
      console.log('UserType:', user.userType);
    }

    const token = generateToken(user._id);

    console.log('==========================================');
    console.log('GOOGLE AUTH SUCCESSFUL');
    console.log('Sending response with token');
    console.log('==========================================\n');

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      profilePicture: user.profilePicture,
      token,
    });
  } catch (error) {
    console.error('==========================================');
    console.error('GOOGLE AUTH ERROR');
    console.error('==========================================');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('==========================================\n');
    
    res.status(401).json({ 
      message: 'Google authentication failed: ' + error.message 
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save FCM token
// @route   POST /api/auth/fcm-token
// @access  Private
const saveFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    console.log('==========================================');
    console.log('Saving FCM token for user:', req.user._id);
    console.log('Token:', fcmToken);
    console.log('==========================================');

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fcmToken = fcmToken;
    await user.save();

    console.log('FCM token saved successfully');
    console.log('==========================================\n');

    res.json({ message: 'FCM token saved successfully' });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  register,
  login,
  googleAuth,
  getMe,
  saveFCMToken,
};

