const express = require('express');
const router = express.Router();
const db = require('../db/mysql');

// Home
router.get('/', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM products');
    res.render('products', { products: rows });
});

// Add product
router.post('/add', async (req, res) => {
    const { name, price, quantity } = req.body;
    await db.query(
        'INSERT INTO products(name, price, quantity) VALUES (?, ?, ?)',
        [name, price, quantity]
    );
    res.redirect('/');
});

module.exports = router;
