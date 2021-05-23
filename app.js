const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
var cors = require('cors')
const csv = require('express-csv');
const mongoose = require('mongoose');

const authService = require('./services/auth.service');
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const { MONGODB_URI } = require('./config');

const app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true
})
  .then(() => console.log(`Successfully connected to the Mongodb Database  at URL : ${MONGODB_URI}`))
  .catch(() => console.log(`Error Connecting to the Mongodb Database at URL : ${MONGODB_URI}`));

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1/', indexRouter);
app.use('/api/v1/user', userRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use('/api/v1', function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    success: false,
    message: 'error'
  });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.redirect('/');
});

module.exports = app;
