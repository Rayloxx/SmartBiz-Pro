const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Record a production batch
router.post('/', async (req, res) => {
    const { product_id, raw_material_id, material_used, products_produced } = req.body;

    try {
        await db.query('BEGIN');

        // Check material stock
        const matRes = await db.query('SELECT * FROM raw_materials WHERE id = $1', [raw_material_id]);
        const material = matRes.rows[0];

        if (!material || Number(material.stock_quantity) < Number(material_used)) {
            throw new Error(`Insufficient ${material ? material.name : 'Raw Material'} stock`);
        }

        const batchCost = Number(material.cost_per_unit) * Number(material_used);
        const costPerUnit = batchCost / Number(products_produced);

        // Record batch
        const batchRes = await db.query(
            'INSERT INTO production_batches (product_id, raw_material_id, material_used, products_produced, batch_cost, cost_per_unit) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [product_id, raw_material_id, material_used, products_produced, batchCost, costPerUnit]
        );

        // Deduct material
        await db.query(
            'UPDATE raw_materials SET stock_quantity = stock_quantity - $1 WHERE id = $2',
            [material_used, raw_material_id]
        );

        // Add product stock
        await db.query(
            'UPDATE products SET stock_quantity = stock_quantity + $1, cost = $2 WHERE id = $3',
            [products_produced, costPerUnit, product_id]
        );

        // Log transactions
        await db.query(
            'INSERT INTO inventory_transactions (item_type, item_id, transaction_type, quantity, remarks) VALUES ($1, $2, $3, $4, $5)',
            ['raw_material', raw_material_id, 'out', material_used, `Used in Production Batch ${batchRes.rows[0].id}`]
        );
        await db.query(
            'INSERT INTO inventory_transactions (item_type, item_id, transaction_type, quantity, remarks) VALUES ($1, $2, $3, $4, $5)',
            ['product', product_id, 'in', products_produced, `Produced in Batch ${batchRes.rows[0].id}`]
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
