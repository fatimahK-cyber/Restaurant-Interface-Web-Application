console.log('TESTING 123');
var express = require('express');
var router = express.Router();
const connection = require('../db');

console.log('ORDER ROUTES FILE LOADED FROM:', __filename);

function processOrder(customerId, req, res, next) {
  console.log('Processing order for customer ID:', customerId);

  const orderType = req.body.OrderType;     // pickup or delivery
  const entree = req.body.Entree;           // selected item
  const status = 'Cooking';                 // default status

  const insertOrderQuery = `
    INSERT INTO orders (Customer_ID, Order_Type, Entree, Status)
    VALUES (?, ?, ?, ?)
  `;

  connection.query(
    insertOrderQuery,
    [customerId, orderType, entree, status],
    (err, result) => {
      if (err) {
        console.error('Error inserting order:', err);
        return next(err);
      }

      const orderId = result.insertId;
      console.log('Inserted order with ID:', orderId);

      res.redirect(`/order/confirmation?orderId=${orderId}`);
    }
  );
}

// GET order submission page
router.get('/', (req, res, next) => {
  res.render('order_submission', { title: 'Make an Order' });
});

// POST order submission
router.post('/', (req, res, next) => {
  console.log('Received order data:', req.body);

  try {
    const customer = {
      name: req.body.Name,
      email: req.body.Email,
      phone: req.body.Phone,
      address: req.body.Address
    };

    const customerExistsQuery = `
      SELECT Customer_ID 
      FROM customer 
      WHERE Email = ? AND Phone = ?
    `;

    connection.query(
      customerExistsQuery,
      [customer.email, customer.phone],
      (err, results) => {
        if (err) {
          console.error('Error checking customer existence:', err);
          return next(err);
        }

        if (results.length === 0) {
          const insertCustomerQuery = `
            INSERT INTO customer (name, email, phone) 
            VALUES (?, ?, ?)
          `;

          connection.query(
            insertCustomerQuery,
            [customer.name, customer.email, customer.phone],
            (err, result) => {
              if (err) {
                console.error('Error inserting new customer:', err);
                return next(err);
              }

              console.log('Inserted new customer with ID:', result.insertId);
              processOrder(result.insertId, req, res, next);
            }
          );
        } else {
          const customerId = results[0].Customer_ID;
          console.log('Existing customer found with ID:', customerId);
          processOrder(customerId, req, res, next);
        }
      }
    );
  } catch (err) {
    console.error('General database error:', err);
    return next(err);
  }
});

// GET manage orders page
router.get('/management', (req, res, next) => {
  res.render('order_manager', { title: 'Manage Orders' });
});

// PATCH specific order
router.patch('/management/:orderId', (req, res, next) => {
  console.log('Update order:', req.params);
  res.send('Order update route works');
});

// DELETE specific order
router.delete('/management/:orderId', (req, res, next) => {
  console.log('Delete order:', req.params);
  res.send('Order delete route works');
});

// PATCH management page
router.patch('/management', (req, res, next) => {
  console.log('Received order update:', req.body);
  res.send('Management patch works');
});

// GET track order page + optional lookup
router.get('/track', (req, res, next) => {
  const orderId = req.query.orderId;

  if (!orderId) {
    return res.render('track_order', {
      title: 'Track Order',
      order: null,
      message: null
    });
  }

  const query = 'SELECT * FROM orders WHERE Order_ID = ?';

  connection.query(query, [orderId], (err, results) => {
    if (err) {
      console.error('Error fetching order:', err);
      return next(err);
    }

    if (results.length === 0) {
      return res.render('track_order', {
        title: 'Track Order',
        order: null,
        message: 'No order found with that ID.'
      });
    }

    res.render('track_order', {
      title: 'Track Order',
      order: results[0],
      message: null
    });
  });
});

// GET confirmation page
router.get('/confirmation', (req, res, next) => {
  const orderId = req.query.orderId;

  if (!orderId) {
    return res.render('order_confirmation', {
      title: 'Order Confirmation',
      order: null
    });
  }

  const query = 'SELECT * FROM orders WHERE Order_ID = ?';

  connection.query(query, [orderId], (err, results) => {
    if (err) {
      console.error('Error fetching confirmation order:', err);
      return next(err);
    }

    if (results.length === 0) {
      return res.render('order_confirmation', {
        title: 'Order Confirmation',
        order: null
      });
    }

    res.render('order_confirmation', {
      title: 'Order Confirmation',
      order: results[0]
    });
  });
});

module.exports = router;