const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// REPLACE your register function with this:
const register = async (req, res) => {
  try {
    console.log('=== REGISTRATION ATTEMPT ===');
    console.log('Request body:', req.body);

    const { username, password, email, role, first_name, last_name, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Register',
        user: null,
        message: { type: 'danger', text: 'Username already exists' }
      });
    }

    // Check if email already exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.render('auth/register', {
        title: 'Register',
        user: null,
        message: { type: 'danger', text: 'Email already registered' }
      });
    }

    // Only allow customer role for self-registration
    const userRole = role === 'admin' || role === 'caretaker' ? 'customer' : role;

    // Create new user
    const userId = await User.create({
      username,
      password,
      email,
      role: userRole,
      first_name,
      last_name,
      phone: phone || null
    });

    // ✅ TEMPORARY FIX: Show success on register page instead of redirecting
    console.log('Registration successful, user ID:', userId);
    
    return res.render('auth/register', {
      title: 'Registration Successful',
      user: null,
      message: { 
        type: 'success', 
        text: `Registration successful! User ID: ${userId}. You can now login.` 
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', {
      title: 'Register',
      user: null,
      message: { type: 'danger', text: 'Error creating user' }
    });
  }
};


// REPLACE your login function with this:
const login = async (req, res) => {
  try {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Request body:', req.body);

    const { username, password } = req.body;

    // Find user
    const user = await User.findByUsername(username);
    console.log("USER RESULT:", user);
    if (!user) {
      console.log('User not found:', username);
      return res.render('auth/login', {
        title: 'Login',
        user: null,
        message: { type: 'danger', text: 'Invalid credentials' }
      });
    }
    console.log("Stored hash:", user.password);

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', username);
      return res.render('auth/login', {
        title: 'Login',
        user: null,
        message: { type: 'danger', text: 'Invalid credentials' }
      });
    }
    console.log("Password match result:", isValidPassword);

    // Generate token
    const token = generateToken(user);

    // Return user info (excluding password)
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name
    };

    // Set session and cookie
    res.cookie('token', token, { httpOnly: true });
    req.session.user = userInfo;

    

    // ✅ REDIRECT TO APPROPRIATE DASHBOARD
    console.log('Login successful, redirecting to dashboard for:', userInfo.role);
    
    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else if (user.role === 'caretaker') {
      return res.redirect('/caretaker/dashboard');
    } else {
      return res.redirect('/dashboard');
    }

  } catch (error) {
  console.error("LOGIN ERROR:");
  console.error(error);
  console.error(error.stack);

  res.render('auth/login', {
    title: 'Login',
    user: null,
    message: {
      type: 'danger',
      text: error.message
    }
  });
}
};



// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

module.exports = { register, login, getProfile };