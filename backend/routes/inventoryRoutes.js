const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authorize } = require('../middleware/authMiddleware');

const checkEditAuth = authorize(['owner', 'admin', 'manager', 'inventory_staff']);

// Get all products
router.get('/products', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products WHERE business_id = $1 ORDER BY created_at DESC', [req.user.business_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching products' });
    }
});

// Add new product
router.post('/products', checkEditAuth, async (req, res) => {
    const { name, sku, price, cost, stock_quantity, category } = req.body;
    if (!name || !sku) {
        return res.status(400).json({ message: 'Name and SKU are required' });
    }
    try {
        const result = await db.query(
            'INSERT INTO products (name, sku, price, cost, stock_quantity, category, business_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, sku, price || 0, cost || 0, stock_quantity || 0, category || 'Other', req.user.business_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'A product with this SKU already exists.' });
        }
        res.status(500).json({ message: 'Server error adding product' });
    }
});

// Update product
router.put('/products/:id', checkEditAuth, async (req, res) => {
    const { name, sku, price, cost, stock_quantity, category } = req.body;
    try {
        const result = await db.query(
            'UPDATE products SET name=$1, sku=$2, price=$3, cost=$4, stock_quantity=$5, category=$6 WHERE id=$7 AND business_id=$8 RETURNING *',
            [name, sku, price, cost, stock_quantity, category, req.params.id, req.user.business_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'A product with this SKU already exists.' });
        }
        res.status(500).json({ message: 'Server error updating product' });
    }
});

// Delete product
router.delete('/products/:id', checkEditAuth, async (req, res) => {
    try {
        await db.query('DELETE FROM products WHERE id = $1 AND business_id = $2', [req.params.id, req.user.business_id]);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error deleting product' });
    }
});

// Get all raw materials
router.get('/materials', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM raw_materials WHERE business_id = $1 ORDER BY created_at DESC', [req.user.business_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching materials' });
    }
});

// Add raw material
router.post('/materials', checkEditAuth, async (req, res) => {
    const { name, unit, cost_per_unit, stock_quantity, reorder_level } = req.body;
    if (!name || !unit) {
        return res.status(400).json({ message: 'Name and unit are required' });
    }
    try {
        const result = await db.query(
            'INSERT INTO raw_materials (name, unit, cost_per_unit, stock_quantity, reorder_level, business_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, unit, cost_per_unit || 0, stock_quantity || 0, reorder_level || 0, req.user.business_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error adding material' });
    }
});

// Update raw material
router.put('/materials/:id', checkEditAuth, async (req, res) => {
    const { name, unit, cost_per_unit, stock_quantity, reorder_level } = req.body;
    try {
        const result = await db.query(
            'UPDATE raw_materials SET name=$1, unit=$2, cost_per_unit=$3, stock_quantity=$4, reorder_level=$5 WHERE id=$6 AND business_id=$7 RETURNING *',
            [name, unit, cost_per_unit, stock_quantity, reorder_level, req.params.id, req.user.business_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Material not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating material' });
    }
});

// Update material delivery (add stock)
router.put('/materials/:id/delivery', checkEditAuth, async (req, res) => {
    const { quantity_added, supplier } = req.body;
    if (!quantity_added || Number(quantity_added) <= 0) {
        return res.status(400).json({ message: 'Invalid quantity' });
    }
    try {
        const result = await db.query(
            'UPDATE raw_materials SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND business_id = $3 RETURNING *',
            [quantity_added, req.params.id, req.user.business_id]
        );

        await db.query(
            'INSERT INTO inventory_transactions (item_type, item_id, transaction_type, quantity, remarks, business_id) VALUES ($1, $2, $3, $4, $5, $6)',
            ['raw_material', req.params.id, 'in', quantity_added, `Delivery from ${supplier || 'Unknown'}`, req.user.business_id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating delivery' });
    }
});

// Delete raw material
router.delete('/materials/:id', checkEditAuth, async (req, res) => {
    try {
        await db.query('DELETE FROM raw_materials WHERE id = $1 AND business_id = $2', [req.params.id, req.user.business_id]);
        res.json({ message: 'Material deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error deleting material' });
    }
});

// GET low stock alerts for AI insights
router.get('/alerts', async (req, res) => {
    try {
        const lowProducts = await db.query(
            'SELECT id, name, stock_quantity, category FROM products WHERE stock_quantity <= 20 AND business_id = $1 ORDER BY stock_quantity ASC LIMIT 10',
            [req.user.business_id]
        );
        const lowMaterials = await db.query(
            'SELECT id, name, stock_quantity, reorder_level, unit, cost_per_unit FROM raw_materials WHERE stock_quantity <= reorder_level AND business_id = $1 ORDER BY stock_quantity ASC LIMIT 10',
            [req.user.business_id]
        );

        const totalProducts = await db.query('SELECT COUNT(*) FROM products WHERE business_id = $1', [req.user.business_id]);
        const totalMaterials = await db.query('SELECT COUNT(*) FROM raw_materials WHERE business_id = $1', [req.user.business_id]);

        res.json({
            lowProducts: lowProducts.rows,
            lowMaterials: lowMaterials.rows,
            totalProducts: parseInt(totalProducts.rows[0].count),
            totalMaterials: parseInt(totalMaterials.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching alerts' });
    }
});

module.exports = router;
