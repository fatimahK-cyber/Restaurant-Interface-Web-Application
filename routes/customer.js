var express = require('express');
var router = express.Router();
const connection = require('../db');

// GET /customer route to display customer information
router.get('/', (req, res, next) => {

    const get_customers_query = 'SELECT Name, Customer_ID, Email, Phone, Address FROM Customer;';
    connection.query(get_customers_query, (err, results) => {
        if (err) {
            console.error('Error fetching customers:', err);
            return next(err);
        }
        console.log('Fetched customers: ', results);
        res.render('customer_info', { title: 'Customers', customers: results });
    });
});

module.exports = router; 