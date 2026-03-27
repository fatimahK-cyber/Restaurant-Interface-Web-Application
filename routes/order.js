var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {
  res.render('order_submission', { title: 'Make an Order' });
});

router.post('/', (req, res, next) => { 
    console.log('Received order data: ', req.body);
    try {
        let newOrder = Order({
            customerName: req.body.Name,
            customerEmail: req.body.Email
        });
    }
    catch(err) {
        console.error(err);
        req.flash('failure', 'Failed to submit order.');
        res.redirect('/order');
    }
    next();
});

router.post('/', (req, res, next) => {
    req.flash('success', 'Your order has been submitted successfully!');
    res.redirect('/order/management');
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


module.exports = router;