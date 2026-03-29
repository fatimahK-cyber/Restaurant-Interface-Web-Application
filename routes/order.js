var express = require('express');
var router = express.Router();

console.log('ORDER ROUTES FILE LOADED FROM:', __filename);

router.get('/', (req, res, next) => {
  res.render('order_submission', { title: 'Make an Order' });
});

router.post('/', (req, res, next) => { 
    console.log('Received order data: ', req.body);
    next();
});

router.post('/', (req, res, next) => {
    console.log('Displaying flash message');
    res.redirect('/order/management');
  });


router.get('/management', (req, res, next) => {
  res.render('order_manager', { title: 'Manage Orders' });
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