const User = require('../models/user');
const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports.isLoggedIn = (req, res, next) => {
  let token = req.headers['authorization'];
  token = token && token.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'No token provided.' });
  jwt.verify(token, config.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ status: false, message: 'User doesn\'t exist' });
    else if (!user.isActive) return res.status(401).json({ status: false, message: 'User is inactive' });
    req.userId = decoded.id;
    req.user = user;
    return next();
  });
}

module.exports.isAdmin = (req, res, next) => {
  if (req.user.role == 'admin')
    if (next) next();
    else return true;
  else
    if (next) res.status(401).json({ status: false, message: 'Operation not permitted!' });
    else return false;
}
