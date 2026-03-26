var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {
  res.render('order_submission', { title: 'Make an Order' });
});

router.post('/', (req, res, next) => { 
    console.log('Received order data: ', req.body);
    next();
});

router.post('/', (req, res, next) => {
    req.flash('success', 'Your order has been submitted successfully!');
    res.redirect('/order/management');
  });

router.get('/management', (req, res, next) => {
    res.render('order_manager', { title: 'Manage Orders' });
});

router.patch('/management', (req, res, next) => {
    console.log('Received order update: ', req.body);
}); 

module.exports = router;