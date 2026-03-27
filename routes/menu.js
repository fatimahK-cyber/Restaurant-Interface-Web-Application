var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {
    res.render('menu', { title: 'Our Menu' });
});

router.get('/management', (req, res, next) => {
    res.render('menu_manager', { title: 'Manage Menu' });
}); 

router.patch('/management/:itemId', (req, res, next) => {
    console.log('Update menu item: ', req.params);
}); 

router.delete('/management/:itemId', (req, res, next) => {
    console.log('Delete menu item: ', req.params);
});

module.exports = router; 