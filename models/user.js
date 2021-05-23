const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');


/**
 * User Schema
 */
const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  username: {
    type: String,
    unique: true,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    default: 'user'
  },
  phone: {
    type: String,
    required: true
  },
  image: String,
  dob: Date,
  url: String,
  gender: String,
  password: { type: String, select: false },
  verificationCode: { type: String, select: false },
  referralCode: { type: String, unique: true },
  facebookId: String,
  googleId: String,
  isActive: { type: Boolean, default: false }, // connect/disconnect 
  facebookConnect: { type: Boolean, default: false }, // connect/disconnect 
  googleConnect: { type: Boolean, default: false }, // connect/disconnect
  status: { type: Boolean, default: true }, // activate/deactivate status 
  deviceToken: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
},
  { usePushEach: true });

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
UserSchema.method({
});

/**
 * Statics
 */
UserSchema.statics = {};

UserSchema.methods.generateHash = function () {
  return bcrypt.hashSync(this.password, bcrypt.genSaltSync(8), null);
};


UserSchema.pre('save', function (next) {
  now = new Date();
  this.updatedAt = now;
  if (!this.comparePassword(this.password)) this.password = this.generateHash();
  next();
});

// checking if password is valid
UserSchema.methods.comparePassword = async function (password) {
  const user = await User.findById(this._id).select('password');
  return bcrypt.compareSync(password, user.password);
};

/**
 * @typedef User
 */
const User = model('User', UserSchema);

// checking if password is valid
UserSchema.methods.comparePassword = async function (password) {
  const user = await User.findById(this._id).select('password');
  return bcrypt.compareSync(password, user.password);
};

module.exports = User;
