var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require('mysql');
const flash = require('express-flash-notification');
const session = require('express-session');

console.log('APP FILE LOADED FROM:', __dirname);

var indexRouter = require('./routes/index');
var orderRouter = require('./routes/order');
var menuRouter = require('./routes/menu');

var app = express();
require('dotenv').config()

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));
app.use(flash(app));
app.use(express.static(path.join(__dirname, 'public'))); /* Built-in middleware to serve static files from the 'public' directory. */
app.use('/css', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/css')));

app.use('/', indexRouter);
app.use('/order', orderRouter);
app.use('/menu', menuRouter); 

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

 // Export the connection object for use in other modules
module.exports = app;