const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET production history with joins
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                pb.*,
                p.name as product_name,
                rm.name as material_name,
                rm.unit as material_unit
            FROM production_batches pb
            LEFT JOIN products p ON pb.product_id = p.id
            LEFT JOIN raw_materials rm ON pb.raw_material_id = rm.id
            WHERE pb.business_id = $1
            ORDER BY pb.production_date DESC
            LIMIT 100
        `, [req.user.business_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching production history' });
    }
});

// POST - Record a production batch
router.post('/', async (req, res) => {
    const { product_id, raw_material_id, material_used, products_produced } = req.body;

    if (!product_id || !raw_material_id || !material_used || !products_produced) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        await db.query('BEGIN');

        // Check material stock
        const matRes = await db.query('SELECT * FROM raw_materials WHERE id = $1 AND business_id = $2', [raw_material_id, req.user.business_id]);
        const material = matRes.rows[0];

        if (!material || Number(material.stock_quantity) < Number(material_used)) {
            throw new Error(`Insufficient ${material ? material.name : 'Raw Material'} stock`);
        }

        const batchCost = Number(material.cost_per_unit) * Number(material_used);
        const costPerUnit = batchCost / Number(products_produced);

        // Record batch
        const batchRes = await db.query(
            'INSERT INTO production_batches (product_id, raw_material_id, material_used, products_produced, batch_cost, cost_per_unit, business_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [product_id, raw_material_id, material_used, products_produced, batchCost, costPerUnit, req.user.business_id]
        );

        // Deduct material
        await db.query(
            'UPDATE raw_materials SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND business_id = $3',
            [material_used, raw_material_id, req.user.business_id]
        );

        // Add product stock
        await db.query(
            'UPDATE products SET stock_quantity = stock_quantity + $1, cost = $2 WHERE id = $3 AND business_id = $4',
            [products_produced, costPerUnit, product_id, req.user.business_id]
        );

        // Log transactions
        await db.query(
            'INSERT INTO inventory_transactions (item_type, item_id, transaction_type, quantity, remarks, business_id) VALUES ($1, $2, $3, $4, $5, $6)',
            ['raw_material', raw_material_id, 'out', material_used, `Used in Production Batch ${batchRes.rows[0].id}`, req.user.business_id]
        );
        await db.query(
            'INSERT INTO inventory_transactions (item_type, item_id, transaction_type, quantity, remarks, business_id) VALUES ($1, $2, $3, $4, $5, $6)',
            ['product', product_id, 'in', products_produced, `Produced in Batch ${batchRes.rows[0].id}`, req.user.business_id]
        );

        await db.query('COMMIT');
        res.status(201).json(batchRes.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(400).json({ message: err.message || 'Server error recording production' });
    }
});

module.exports = router;
