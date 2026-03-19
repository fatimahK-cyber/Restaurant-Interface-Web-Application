var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Restaurant Order System' });
});

router.get('/menu', (req, res, next) => {
  res.render('menu', { title: 'Our Menu' });
});

router.get('/order', (req, res, next) => {
  res.render('order_submission', { title: 'Make an Order' });
});

router.get('/manage', (req, res, next) => {
  res.render('order_manager', { title: 'Manage Orders' });
});

module.exports = router;
