var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require('mysql');
const flash = require('express-flash-notification');
const session = require('express-session');

var indexRouter = require('./routes/index');
var orderRouter = require('./routes/order');
var menuRouter = require('./routes/menu');

var app = express();
require('dotenv').config()

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
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

const connection = mysql.createConnection({
  host: process.env.DB_HOSTNAME,
  user: process.env.USER_ID,
  password: process.env.USER_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ', err);
    return;
  }
  console.log('Connected to the database.');
});

connection.query('SELECT 1 + 1 AS solution', (err, rows, fields) => {
  if (err) throw err

  console.log('The solution is: ', rows[0].solution)
});

connection.end();


module.exports = app;
