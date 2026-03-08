const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Record a sale
router.post('/', async (req, res) => {
    const { items, payment_method } = req.body;
    // items: [{ product_id, quantity }]

    try {
        await db.query('BEGIN');

        let totalAmount = 0;
        let totalProfit = 0;
        const saleRecords = [];

        for (const item of items) {
            const productRes = await db.query('SELECT * FROM products WHERE id = $1', [item.product_id]);
            const product = productRes.rows[0];

            if (!product || product.stock_quantity < item.quantity) {
                throw new Error(`Insufficient stock for ${product ? product.name : 'Unknown Product'}`);
            }

            const itemTotal = Number(product.price) * item.quantity;
            const itemProfit = (Number(product.price) - Number(product.cost)) * item.quantity;

            totalAmount += itemTotal;
            totalProfit += itemProfit;

            // Log sale
            const saleRes = await db.query(
                'INSERT INTO sales (product_id, quantity, total_amount, profit) VALUES ($1, $2, $3, $4) RETURNING *',
                [item.product_id, item.quantity, itemTotal, itemProfit]
            );
            saleRecords.push(saleRes.rows[0]);

            // Update stock
            await db.query(
                'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );

            // Log transaction
            await db.query(
                'INSERT INTO inventory_transactions (item_type, item_id, transaction_type, quantity, remarks) VALUES ($1, $2, $3, $4, $5)',
                ['product', item.product_id, 'out', item.quantity, `Sale ${saleRes.rows[0].id}`]
            );
        }

        await db.query('COMMIT');
        res.status(201).json({ message: 'Sale recorded successfully', sales: saleRecords });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(400).json({ message: err.message || 'Server error recording sale' });
    }
});

module.exports = router;
