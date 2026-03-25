var express = require('express');
var router = express.Router();

/* These are the route handlers for the main pages of the restaurant order system. Each route renders a different view. */
/* Every request and response is passed through a middleware function. */

router.get('/', (req, res, next) => {
  res.render('index', { title: 'Restaurant Order System' });
});

router.get('/menu', (req, res, next) => {
  res.render('menu', { title: 'Our Menu' });
});

module.exports = router;
