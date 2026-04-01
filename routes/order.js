console.log('TESTING 123');
var express = require('express');
var router = express.Router();
const connection = require('../db');

console.log('ORDER ROUTES FILE LOADED FROM:', __filename);

router.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url} at ${new Date().toISOString()}`);
  next();
}); 

/* Middleware function to fetch menu items and their categories from the database, and store in req.context for downstream handlers */
function get_menu_items(req, res, next) {
  const get_menu_items_query = 'SELECT mi.Name AS Name, c.Name AS Category, mi.Menu_Item_ID AS Item_ID FROM Menu_Item AS mi JOIN Category AS c ON mi.Category_ID = c.Category_ID;';

  connection.query(get_menu_items_query, (err, result) => {
    if (err) {
      console.error('Error fetching menu items:', err);
      return next(err);
    }
    console.log('Fetched menu items:', result);
    
    if (req.context?.orderId != undefined) {
      req.context = { menu_items: result, order_id: req.context.orderId};
    } else {
      req.context = { menu_items: result };
    }

    return next();
  });
}

/*
GET /order middleware chain:
1) Fetch menu items and their categories from the database
2) Render order submission page with menu items and categories
*/
router.get('/', get_menu_items);

router.get('/', (req, res, next) => {
  res.render('order_submission', { 
    title: 'Make an Order',
    menu_items: req.context.menu_items 
  });
});

/* 
POST /order middleware chain:
1) Check customer existance and insert if new
2) Insert order with customer ID from step 1
3) Fetch menu item names and IDs
4) Insert order items with order ID from step 2 and menu item IDs from step 3
5) Redirect to confirmation page with order ID from step 2
*/
router.post('/', (req, res, next) => { // Step 1: Check customer existance and insert if new
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

        if (results.length == 0) {
          const insertCustomerQuery = `
            INSERT INTO customer (name, email, phone) 
            VALUES (?, ?, ?)
          `;

          return connection.query(
            insertCustomerQuery,
            [customer.name, customer.email, customer.phone],
            (err, result) => {
              if (err) {
                console.error('Error inserting new customer:', err);
                return next(err);
              }

              console.log('Inserted new customer with ID:', result.insertId);
              req.context = { customerId: result.insertId };
              return next();
            });
        }
        const customerId = results[0].Customer_ID;
        console.log('Existing customer found with ID:', customerId);
        req.context = { customerId: customerId };
        return next();
      });
  } catch (err) {
    console.error('General database error:', err);
    return next(err);
  }
});

router.post('/', (req, res, next) => { // Step 2: Insert order with customer ID from step 1
  const customerId = req.context.customerId;
  console.log('Processing order for customer ID:', customerId);

  let order = {
        customerId: customerId,
        type: req.body.Type,
        status: 'Pending',
        creation_timestamp: new Date()
  };

  const insertOrderQuery = "INSERT INTO `order` (Customer_ID, Type, Status, Creation_Timestamp) VALUES (?, ?, ?, ?)";

  connection.query(
    insertOrderQuery,
    [order.customerId, order.type, order.status, order.creation_timestamp],
    (err, result) => {
      if (err) {
        console.error('Error inserting order:', err);
        return next(err); 
      } 
      const orderId = result.insertId;
      console.log('Inserted order with ID:', orderId);

      //res.redirect(`/order/confirmation?orderId=${orderId}`);
      req.context.orderId = orderId;
      return next();
    }
  );
});

router.post('/', get_menu_items); // Step 3: Fetch menu item names and IDs

router.post('/', (req, res, next) => { // Step 4: Insert order items
    let insert_order_item_query = 'INSERT INTO `order_item` (Quantity, Order_ID, Menu_Item_ID) VALUES (?, ?, ?, ?)'
    
    selected_item_names = Object.keys(req.body.Items); 
    console.log('Menu item names: ', selected_item_names);
    
    for (const [item_name, quantity] of Object.entries(req.body.Items)) {
        for (const menu_item of req.context.menu_items) {
            if (menu_item.Name === item_name && quantity > 0) {
                console.log(`Inserting ${quantity} order(s) of ${item_name} with ID ${menu_item.Menu_Item_ID} into order ID ${req.context.order_id}`);
                // SQL query to insert order item here, using req.context.order_id and menu_item.Menu_Item_ID
            }
        }
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