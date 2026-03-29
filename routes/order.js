var express = require('express');
var router = express.Router();
const connection = require('../db'); // Import the database connection from app.js

console.log('ORDER ROUTES FILE LOADED FROM:', __filename);

router.get('/', (req, res, next) => {
  res.render('order_submission', { title: 'Make an Order' });
});

router.post('/', (req, res, next) => { 
    console.log('Received order data: ', req.body);
    try {
        let customer = {
            name: req.body.Name,
            email: req.body.Email,
            phone: req.body.Phone,
            address: req.body.Address};
            
        let customer_exists_query = `SELECT Customer_ID FROM customer WHERE Email="${customer.email}" AND Phone="${customer.phone}"`;

        // Checks if a customer already exists with the same email and phone number, if not it creates a new customer record
        connection.query(customer_exists_query, (err, results) => {
            if (err) {
                console.error('Error checking customer existence: ', err);
            } else if  (results.length == 0) {
                let insert_customer_query = `INSERT INTO customer (name, email, phone) VALUES ('${customer.name}', '${customer.email}', '${customer.phone}')`;
                connection.query(insert_customer_query, (err, result) => {
                    if (err) {
                        console.error('Error inserting new customer: ', err);
                    } else {
                        console.log('Inserted new customer with ID: ', result.insertId);
                        customer_id = result.insertId;
                        next(customer_id);
                    }
                });
            } else {
                customer_id = results[0].Customer_ID;
                console.log('Existing customer found with ID: ', customer_id);
                next(customer_id);
            }
        });
    } catch(err) {
        console.error('General database error: ', err);
    }
});

router.use((customer_id, req, res, next) => {
    console.log('Processing order for customer: ', customer_id);
    let order = {    };

});


router.get('/management', (req, res, next) => {
    res.render('order_manager', { title: 'Manage Orders' });
});

router.patch('/management/:orderId', (req, res, next) => {
    console.log('Update order: ', req.params);
}); 

router.delete('/management/:orderId', (req, res, next) => {
    console.log('Delete order: ', req.params);
});
router.patch('/management', (req, res, next) => {
    console.log('Received order update: ', req.body);
}); 

router.get('/track', (req, res, next) => {
  console.log('HIT /order/track');
  res.send('TRACK PAGE WORKS');
});

router.get('/confirmation', (req, res, next) => {
  res.render('order_confirmation', { title: 'Order Confirmation' });
});

module.exports = router;