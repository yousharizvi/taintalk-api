const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/user');
const config = require('../config');
const authService = require('../services/auth.service');
const { sendOTPSMS, sendForgotPasswordOTPSMS } = require('../services/sms.service');
const { authenticator } = require('otplib');
const shortid = require('shortid');

async function updateUser(req, res, next) {
  let user = await User.findOne({ id: req.params.id });
  if (!user) return res.status(400).json({
    success: false,
    message: 'No user found!'
  });
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  // user.phone = req.body.phone;
  if (req.body.password) user.password = req.body.password;
  if (req.user.role == 'admin') {
    user.role = req.body.role;
    user.isActive = req.body.isActive;
  }
  try {
    const response = await user.save();
    return res.json({
      success: true,
      message: 'User updated',
      data: response
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message
    });
  }
}

/* GET users listing. */
router.get('/', authService.isLoggedIn, authService.isAdmin, async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const skip = (req.query.page - 1 || 0) * limit;
  let where = {};
  if (req.query.search) where = { ...['firstName', 'lastName'].reduce((acc, key) => ({ ...acc, [key]: { $regex: req.query.search } }), {}) };
  const users = await User.find(where).limit(limit).skip(skip).sort({ 'createdAt': -1 });
  const usersCount = await User.count(where);
  res.json({
    success: true,
    message: 'respond with a resource',
    data: users,
    pages: Math.ceil(usersCount / limit)
  });
});

/* GET current logged in user. */
router.get('/me', authService.isLoggedIn, async (req, res, next) => {
  return res.json({
    success: true,
    data: req.user
  })
});

/* PUT update logged in user. */
router.put('/me', authService.isLoggedIn, async (req, res, next) => {
  req.params.id = req.userId;
  return next()
}, updateUser);

/* POST user login. */
router.post('/auth/login', async (req, res, next) => {
  let loginKey = req.body.username.indexOf('@') > -1 ? 'email' : 'username';
  const user = await User.findOne({ [loginKey]: req.body.username });
  if (!user) return res.status(401).json({
    success: false,
    message: 'User doesn\'t exist with this email!'
  });
  let isPasswordValid = await user.comparePassword(req.body.password);
  if (!isPasswordValid) return res.status(401).json({
    success: false,
    message: 'Invalid password!'
  });
  if (!user.isActive) return res.status(401).json({
    success: false,
    message: 'User is inactive!'
  });

  var token = jwt.sign({ id: user.id }, config.JWT_SECRET, {
    // expiresIn: 86400 // expires in 24 hours
  });
  res.json({
    success: isPasswordValid,
    message: 'Login successful',
    token
  });
});

/* GET check username */
router.get('/auth/check-username/:username', async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username });
  if (user) return res.status(400).json({
    success: false,
    message: 'Username unavailable!'
  });
  return res.json({
    success: true,
    message: 'Username is available'
  })
});

/* GET check email */
router.get('/auth/check-email/:email', async (req, res, next) => {
  const user = await User.findOne({ email: req.params.email });
  if (user) return res.status(400).json({
    success: false,
    message: 'Email unavailable!'
  });
  return res.json({
    success: true,
    message: 'Email is available'
  })
});

/* GET verify user */
router.get('/auth/verify/:id/:otp', async (req, res, next) => {
  const user = await User.findById(req.params.id).select('verificationCode');
  if (user.verificationCode != req.params.otp) return res.status(401).json({
    success: false,
    message: 'Incorrect OTP'
  });
  user.isActive = true;
  user.verificationCode = null;
  user.save();
  return res.json({
    success: true,
    message: 'User verified'
  })
});

function generateOTP() {
  return authenticator.generate(config.OTP_SECRET);
}

/* POST create new user. */
router.post('/auth/signup', async (req, res, next) => {
  let message = 'New user registered';
  let user;
  try {
    const otp = generateOTP(req.body.phone)
    user = new User({
      ...req.body,
      verificationCode: generateOTP(),
      referralCode: shortid.generate()
    });
    await user.save();
    sendOTPSMS(req.body.phone, otp);
    user.password = user.verificationCode = undefined;
  } catch (err) {
    return res.json({
      success: false,
      message: err
    });
  }
  res.json({
    success: true,
    message,
    data: user
  });
});

/* POST forgot password. */
router.post('/auth/forgot-password', async (req, res, next) => {
  const user = User.findOne({ phone: req.body.phone });
  if (!user) return res.status(400).json({
    success: false,
    message: 'User doesn\'t exist with this phone number'
  });
  if (!user.isActive) return res.status(400).json({
    success: false,
    message: 'User is inactive'
  });
  const otp = generateOTP();
  user.verificationCode = otp;
  user.save();
  sendForgotPasswordOTPSMS(req.body.phone, otp);
  return res.json({
    success: true,
    message: 'Forgot password sms sent!'
  });
});

/* POST update password. */
router.post('/auth/change-password', async (req, res, next) => {
  const user = User.findOne({ phone: req.body.phone });
  if (!user) return res.status(400).json({
    success: false,
    message: 'User doesn\'t exist with this phone number'
  });
  if (!user.isActive) return res.status(400).json({
    success: false,
    message: 'User is inactive'
  });
  if (req.body.otp != user.verificationCode) return res.status(401).json({
    success: false,
    message: 'Invalid otp'
  })
  user.verificationCode = null;
  user.password = req.body.password;
  user.save();
  return res.json({
    success: true,
    message: 'Password updated!'
  });
});

/* PUT update existing user. */
router.put('/:id', authService.isLoggedIn, authService.isAdmin, updateUser);

router.delete('/:id', authService.isLoggedIn, authService.isAdmin, async (req, res, next) => {
  let response = await User.delete({ id: req.params.id });
  if (response) res.json({
    success: true,
    message: 'User deleted'
  });
  else res.status(400).json({
    success: false,
    message: 'No user found!'
  });
})


router.get('/relations', authService.isLoggedIn, authService.isAdmin, async (req, res, next) => {
  res.json({
    success: true,
    message: 'respond with a resource'
  });
});

module.exports = router;
