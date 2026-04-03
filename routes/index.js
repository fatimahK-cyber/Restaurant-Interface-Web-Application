var express = require('express');
var router = express.Router();


router.get('/', (req, res, next) => {
  res.render('index', { title: 'Restaurant Order System' });
});

router.post('/set-role', (req, res) => {
  req.session.role = req.body.role; // 'customer' or 'employee'
  res.redirect('/menu');
});

router.get('/', (req, res) => {
  req.session.role = null;
  res.render('index', { title: 'Restaurant Order System' });
});


module.exports = router;
