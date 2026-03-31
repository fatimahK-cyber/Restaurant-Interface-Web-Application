var express = require('express');
var router = express.Router();
const connection = require('../db'); // Import the database connection from app.js

console.log('ORDER ROUTES FILE LOADED FROM:', __filename);

router.get('/', (req, res, next) => {
  res.render('order_submission', { title: 'Make an Order' });
});

router.post('/', (req, res, next) => {  // Finds an existing customer or creates a new one 
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
                let insert_customer_query = `INSERT INTO customer (name, email, phone, address) VALUES ('${customer.name}', '${customer.email}', '${customer.phone}', '${customer.address}')`;
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

router.use((customer_id, req, res, next) => { // Creates an order record for the customer
    console.log('Processing order for customer: ', customer_id);
    let order = {
        customer_id: customer_id,
        type: req.body.Type,
        status: 'Pending',
        creation_timestamp: new Date()
    };
    /*
    connection.query('INSERT INTO `order` (Customer_ID, Type, Status, Creation_Timestamp) VALUES (?, ?, ?, ?)',
        [order.customer_id, order.type, order.status, order.creation_timestamp],
        (err, result) => {
            if (err) {
                console.error('Error inserting order: ', err);
                return;
            } else {
                console.log('Inserted order with ID: ', result.insertId);
                req.context = { order_id: result.insertId }; // Store the order ID in the request context for use in the next middleware
                next();
            }
    });
    */
   next(1); 
});

router.use((order_id, req, res, next) => { // Gets the menu names and their IDs
    let get_menu_items_query = 'SELECT Menu_Item_ID, Name FROM menu_item';

    connection.query(get_menu_items_query, (err, result) => {
        if (err) {
            console.log('Error getting menu items: ', err);
        } else {
            console.log('Menu items: ', result); 
            req.context = { menu_items: result, order_id: order_id }; // Store the menu items and order ID in the request context for use in the next middleware
            next();
        }
    });
});

router.use((req, res, next) => { // Inserts records into the order_item table for each menu item in the order
    let insert_order_item_query = 'INSERT INTO `order_item` (Quantity, Order_ID, Menu_Item_ID) VALUES (?, ?, ?, ?)'
    
    selected_item_names = Object.keys(req.body.Items); 
    console.log('Menu item names: ', selected_item_names);
    
    for (const [item_name, quantity] of Object.entries(req.body.Items)) {
        for (const menu_item of req.context.menu_items) {
            if (menu_item.Name === item_name && quantity > 0) {
                console.log(`Inserting ${quantity} orders of ${item_name} into order ID ${req.context.order_id}`);
            }
        }
    }
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