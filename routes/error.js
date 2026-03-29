var express = require('express');
var router = express.Router();

router.use((err, req, res, next) => {
    req.flash('failure', 'An error occurred while submitting your order.');
    res.redirect('/order');
});

module.exports = router; 