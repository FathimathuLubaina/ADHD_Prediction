const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../models/User');
const { getLatestAssessmentByUserId } = require('../models/Assessment');

const JWT_EXPIRY = '7d';

function generateToken(user) {
  const role = user.email === 'lubaizulbi@gmail.com' ? 'admin' : 'user';
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function formatLatestAssessment(record) {
  if (!record) return null;
  return {
    totalScore: record.total_score,
    result: record.result,
    gender: record.gender,
    ageGroup: record.age_group,
    createdAt: record.created_at
  };
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await createUser({ name, email, passwordHash });
    const token = generateToken(user);

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.email === 'lubaizulbi@gmail.com' ? 'admin' : 'user',
        assessmentCompleted: !!user.assessment_completed
      },
      latestAssessment: null
    });
  } catch (error) {
    console.error('Register error', error);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const record = await getLatestAssessmentByUserId(user.id);
    const assessmentCompleted = !!user.assessment_completed || !!record;
    const latestAssessment = formatLatestAssessment(record);

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.email === 'lubaizulbi@gmail.com' ? 'admin' : 'user',
        assessmentCompleted
      },
      latestAssessment: assessmentCompleted ? latestAssessment : null
    });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

