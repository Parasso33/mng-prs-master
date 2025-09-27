const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is missing');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId }, secret, { expiresIn });
}

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase().trim(),
      password,
      name: name?.trim() || ''
    });

    await user.save();

    const token = signToken(user._id.toString());

    return res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error('Registration error:', err?.message || err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user._id.toString());

    return res.status(200).json({
      token,
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error('Login error:', err?.message || err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (_req, res) => {
  try {
    // Stateless JWT: client should discard token. If using cookies, clear cookie.
    res.clearCookie && res.clearCookie('token');
    return res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    return res.status(200).json({ message: 'Logged out' });
  }
};

exports.profile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ user });
  } catch (err) {
    console.error('Profile error:', err?.message || err);
    return res.status(500).json({ message: 'Server error' });
  }
};
