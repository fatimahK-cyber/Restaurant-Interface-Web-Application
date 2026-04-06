const mysql = require('mysql');
require('dotenv').config();


const connection = mysql.createConnection({
  host: process.env.DB_HOSTNAME,
  user: process.env.USER_ID,
  password: process.env.USER_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});



// Local database connection for offline development and testing 
/*
const connection = mysql.createConnection({
  host: process.env.DB_HOSTNAME_LOCAL,
  user: process.env.USER_ID_LOCAL,
  password: process.env.USER_PASSWORD_LOCAL,
  database: process.env.DB_NAME_LOCAL,
});
*/


connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ', err);
    return;
  }
  console.log('Connected to the database successfully!');
});

module.exports = connection; 