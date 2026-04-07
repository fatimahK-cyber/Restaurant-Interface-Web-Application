var express = require('express');
var router = express.Router();
const connection = require('../db');

/* Middleware function to fetch menu items and their categories from the database, and store in req.context for downstream handlers. */
function get_menu_items(req, res, next) {
  const get_menu_items_query = 'SELECT mi.Name AS Name, c.Name AS Category, mi.Menu_Item_ID AS Item_ID FROM Menu_Item AS mi JOIN Category AS c ON mi.Category_ID = c.Category_ID;';

  connection.query(get_menu_items_query, (err, result) => {
    if (err) {
      console.error('Error fetching menu items:', err);
      return next(err);
    }
    console.log('Fetched menu items:', result);
    
    if (req.context?.orderId != undefined) {
      req.context = { menuItems: result, orderId: req.context.orderId};
    } else {
      req.context = { menuItems: result };
    }

    return next();
  });
}

/*
GET /order middleware chain:
1) Fetch menu items and their categories from the database.
2) Render order submission page with menu items and categories.
*/
router.get('/', get_menu_items); // Step 1: Fetch menu items and their categories from the database.

router.get('/', (req, res, next) => { // Step 2: Render order submission page with menu items and categories.
  res.render('order_submission', { 
    title: 'Make an Order',
    menu_items: req.context.menuItems 
  });
});

/* 
POST /order middleware chain:
1) Check customer existance and insert if new.
2) Insert order with customer ID from step 1.
3) Fetch menu item names and IDs.
4) Insert order items with order ID from step 2 and menu item IDs from step 3.
5) Redirect to confirmation page with order ID from step 2.
*/
router.post('/', (req, res, next) => { // Step 1: Check customer existance and insert if new.
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
            INSERT INTO customer (name, email, phone, address) 
            VALUES (?, ?, ?, ?)
          `;

          return connection.query(
            insertCustomerQuery,
            [customer.name, customer.email, customer.phone, customer.address],
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

router.post('/', (req, res, next) => { // Step 2: Insert order with customer ID from step 1.
  const customerId = req.context.customerId;
  console.log('Processing order for customer ID:', customerId);

let order = {
      customerId: customerId,
      type: req.body.OrderType,
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
      req.session.lastOrderId = orderId;
      console.log('Inserted order with ID:', orderId);

      req.context.orderId = orderId;
      return next();
    }
  );
});

router.post('/', get_menu_items); // Step 3: Fetch menu item names and IDs.

router.post('/', (req, res, next) => { // Step 4: Insert order items.
    let itemNames = [].concat(req.body['ItemName[]']);
    let itemQtys = [].concat(req.body['ItemQty[]']);
    let insert_order_item_query = 'INSERT INTO `order_item` (Quantity, Order_ID, Menu_Item_ID) VALUES (?, ?, ?)'
    console.log('Inserting order items for order ID:', req.context.orderId);
    console.log(req.body);

    for (let i = 0; i < req.context.menuItems.length; i++) {
      for (let j = 0; j < itemNames.length; j++) {
        if (req.context.menuItems[i].Name === itemNames[j]) {
          connection.query(insert_order_item_query, [itemQtys[j], req.context.orderId, req.context.menuItems[i].Item_ID], (err, result) => {
            if (err) {
              console.error('Error inserting order item:', err);
              return next(err);
            }
          });
        }
      
      }
    }
    return next(); 
});

router.post('/', (req, res, next) => { // Step 5: Redirect to confirmation page.
  console.log('Finalizing order with ID:', req.context.orderId);
 res.redirect(`/order/confirmation?orderId=${req.context.orderId}`);
}); 

/*
GET /order/management middleware chain:
1) Fetch the total cost, order ID, order type, creation timestamp, completion timestamp, customer name, employee name, and order status for all order records in the database.
2) Fetch the name, quantity, and corresponding order ID of each ordered menu item from the database.
3) Fetch employee names and their IDs from the database.
4) Render the order management page with the order data from steps 1, 2, and 3.
*/
router.get('/management', (req, res, next) => {  // Step 1: Fetch the total cost, order ID, order type, creation timestamp, completion timestamp, customer name, employee name, and order status for all order records in the database.
  const get_order_information_query = `SELECT 
    SUM(oi.Quantity * mi.Price) AS Order_Total,
    o.Order_ID,
    o.Type,
    o.Status,
    o.Creation_Timestamp,
    o.Completion_Timestamp,
    c.Name AS Customer_Name,
    e.Name AS Employee_Name
    FROM 
    \`order\` AS o JOIN order_item AS oi ON o.Order_ID = oi.Order_ID
    JOIN Menu_Item AS mi ON oi.Menu_Item_ID = mi.Menu_Item_ID
    JOIN customer AS c ON c.Customer_ID = o.Customer_ID
    LEFT JOIN Employee AS e  ON e.Employee_ID = o.Employee_ID
    GROUP BY 
    o.Order_ID;`;

  connection.query(get_order_information_query, (err, results) => {
    if (err) {
      console.error('Error fetching orders for management:', err);
      return next(err);
    }
    req.context = { orders: results };
    console.log('Fetched orders for management:', results);
    return next();
  });
});

router.get('/management', (req, res, next) => { // Step 2:Fetch the name, quantity, and corresponding order ID of each ordered menu item from the database.
  const get_order_items_query = `SELECT mi.Name, oi.Order_ID, oi.Quantity FROM Menu_Item AS mi JOIN Order_Item AS oi ON mi.Menu_Item_ID=oi.Menu_Item_ID ORDER BY Order_ID;`;
  
  connection.query(get_order_items_query, (err, results) => {
    if (err) {
      console.error('Error fetching order items for management:', err);
      return next(err);
    }  
    let orders = req.context.orders;
    req.context = { orders: orders, order_items: results };
    console.log('Fetched order items for management:', results);
    return next();
  });

});

router.get('/management', (req, res, next) => { // Step 3: Fetch employee names and their IDs from the database.
  const get_employees_query = 'SELECT Name, Employee_ID FROM employee;';
  connection.query(get_employees_query, (err, result) => {
    if (err) {
      console.error('Error fetching employees for management:', err);
      return next(err);
    }
    let orders = req.context.orders;
    let order_items = req.context.order_items;
    req.context = { orders: orders, order_items: order_items, employees: result };
    console.log('Fetched employees for management:', result);
    return next();
    
  });
});

router.get('/management', (req, res, next) => { // Step 4: Render the order management page with the order data from steps 1, 2, and 3.
  res.render('order_manager', {
    title: 'Manage Orders',
    orders: req.context.orders,
    orderItems: req.context.order_items,
    employees: req.context.employees
  });
});

/*
POST /order/management middleware chain:
1) Fetch the employee names and their IDs from the database and store in req.context for downstream handlers.
2) Update order status in the database based on order ID from URL parameter, new status from the request body, and assigned employee name from the request body.
3) Update the completion timestamp if status is changed to "Completed".
4) Render management page with updated order list.
*/
router.post('/management/:orderId', (req, res, next) => { // Step 1: Fetch the employee names and their IDs from the database and store in req.context for downstream handlers.
  console.log('Received order update for order ID:', req.params.orderId);
  console.log('Request body:', req.body);
  const get_employees_query = 'SELECT Name, Employee_ID FROM employee LIMIT 1';
  connection.query(get_employees_query, (err, result) => {
    if (err) {
      console.error('Error fetching employee:', err);
      return next(err);
    }
    req.context = { employees: result };
    return next();
  });
});

router.post('/management/:orderId', (req, res, next) => { // Step 2: Update order status in the database based on order ID from URL parameter, new status from the request body, and assigned employee name from the request body.
  const orderId = req.params.orderId;
  const newStatus = req.body.status;
  const assignedEmployeeId = req.body.employee;

  const updateOrderQuery = 'UPDATE `order` SET Status = ?, Employee_ID = ? WHERE Order_ID = ?';
  connection.query(updateOrderQuery, [newStatus, assignedEmployeeId, orderId], (err, result) => {
    if (err) {
      console.error('Error updating order:', err);
      return next(err);
    }
    return next();
  });
});

router.post('/management/:orderId', (req, res, next) => { // Step 3: Update the completion timestamp if status is changed to "Completed"
  const orderId = req.params.orderId;
  if (req.body.status == 'Completed') {
    const updateCompletionTimestampQuery = 'UPDATE `order` SET Completion_Timestamp = ? WHERE Order_ID = ?';
    connection.query(updateCompletionTimestampQuery, [new Date(), orderId], (err, result) => {
      if (err) {
        console.error('Error updating completion timestamp:', err);
        return next(err);
      }
      return next();
    });
  } else {
    return next();
  }
});

router.post('/management/:orderId', (req, res, next) => { // Step 4: Render management page with updated order list.
  res.redirect('/order/management');
  return;
});

// GET /order/track route for customers to track their order status and details
router.get('/track', (req, res, next) => {
  const orderId = req.query.orderId || req.session.lastOrderId;

  if (!orderId) {
    return res.render('track_order', {
      title: 'Track Order',
      order: null,
      message: 'No order found yet. Please place an order first.'
    });
  }

 const query = 'SELECT * FROM `order` WHERE Order_ID = ?';

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

router.post('/cancel', (req, res, next) => {
  const orderId = req.body.orderId;

  const query = "UPDATE `order` SET Status = 'Cancelled' WHERE Order_ID = ?";

  connection.query(query, [orderId], (err, result) => {
    if (err) {
      console.error('Error cancelling order:', err);
      return next(err);
    }

    res.redirect(`/order/track?orderId=${orderId}`);
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

 const query = 'SELECT * FROM `order` WHERE Order_ID = ?';

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