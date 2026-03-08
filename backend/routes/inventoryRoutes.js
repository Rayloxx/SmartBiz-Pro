const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all products
router.get('/products', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching products' });
    }
});

// Add new product
router.post('/products', async (req, res) => {
    const { name, sku, price, cost, stock_quantity, category } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO products (name, sku, price, cost, stock_quantity, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, sku, price, cost, stock_quantity, category]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error adding product' });
    }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error deleting product' });
    }
});

// Get all raw materials
router.get('/materials', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM raw_materials ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching materials' });
    }
});

// Add raw material
router.post('/materials', async (req, res) => {
    const { name, unit, cost_per_unit, stock_quantity, reorder_level } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO raw_materials (name, unit, cost_per_unit, stock_quantity, reorder_level) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, unit, cost_per_unit, stock_quantity, reorder_level]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error adding material' });
    }
});

// Update material delivery
router.put('/materials/:id/delivery', async (req, res) => {
    const { quantity_added, supplier } = req.body;
    try {
        const result = await db.query(
            'UPDATE raw_materials SET stock_quantity = stock_quantity + $1 WHERE id = $2 RETURNING *',
            [quantity_added, req.params.id]
        );

        // Log transaction
        await db.query(
            'INSERT INTO inventory_transactions (item_type, item_id, transaction_type, quantity, remarks) VALUES ($1, $2, $3, $4, $5)',
            ['raw_material', req.params.id, 'in', quantity_added, `Delivery from ${supplier || 'Unknown'}`]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating delivery' });
    }
});

module.exports = router;
