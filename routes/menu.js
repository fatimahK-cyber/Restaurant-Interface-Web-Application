var express = require('express');
var router = express.Router();
const connection = require('../db');

/* 
GET /menu middleware chain 
1) Fetch menu category IDs from the database and store in req.context for downstream handlers.
2) Fetch menu items and their categories from the database and render menu page with menu items and categories.
*/
router.get('/', (req, res, next) => { // Step 1: Fetch menu category IDs from the database and store in req.context for downstream handlers.
    const get_menu_categories_query = 'SELECT Name, Category_ID FROM Category;';

    connection.query(get_menu_categories_query, (err, result) => {
        if (err) {
            console.error('Error fetching menu categories:', err);
            return next(err);
        }
        req.context = { categories: result };
        return next();
    });
});

router.get('/', (req, res, next) => { // Step 2: Fetch menu items and their categories from the database and render menu page with menu items and categories.
    const get_menu_items_query = 'SELECT mi.Name AS Name, c.Category_ID AS Category_ID, mi.Price AS Price FROM Menu_Item AS mi JOIN Category AS c ON mi.Category_ID = c.Category_ID;';

    connection.query(get_menu_items_query, (err, result) => {
        if (err) {
            console.error('Error fetching menu items:', err);
            return next(err);
        }
        res.render('menu', { title: 'Our Menu', menuItems: result, categories: req.context.categories });
    });

});

// GET /menu/management route to render menu management page for employees
router.get('/management', (req, res, next) => {
    res.render('menu_manager', { title: 'Manage Menu' });
}); 

// PATCH /menu/management/:itemId route to handle menu item updates
router.patch('/management/:itemId', (req, res, next) => {
    console.log('Update menu item: ', req.params);
    res.redirect('/menu/management');
}); 

// DELETE /menu/management/:itemId route for menu item deletions
router.delete('/management/:itemId', (req, res, next) => {
    console.log('Delete menu item: ', req.params);
    res.redirect('/menu/management');
});

module.exports = router; 