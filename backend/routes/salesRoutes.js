const express = require('express');
const router = express.Router();
const db = require('../config/db');
const mpesaService = require('../services/mpesaService');

// GET all sales (with product name join)
router.get('/', async (req, res) => {
    try {
        const { start_date, end_date, product_id } = req.query;
        let query = `
            SELECT s.*, p.name as product_name, p.category
            FROM sales s
            LEFT JOIN products p ON s.product_id = p.id
            WHERE s.business_id = $1
        `;
        const params = [req.user.business_id];
        if (start_date) {
            params.push(start_date);
            query += ` AND s.sale_date >= $${params.length}`;
        }
        if (end_date) {
            params.push(end_date);
            query += ` AND s.sale_date <= $${params.length}`;
        }
        if (product_id) {
            params.push(product_id);
            query += ` AND s.product_id = $${params.length}`;
        }
        query += ' ORDER BY s.sale_date DESC LIMIT 200';
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching sales' });
    }
});

// GET sales summary (for reports)
router.get('/summary', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        let where = 'business_id = $1';
        const params = [req.user.business_id];
        if (start_date) { params.push(start_date); where += ` AND sale_date >= $${params.length}`; }
        if (end_date) { params.push(end_date); where += ` AND sale_date <= $${params.length}`; }

        const result = await db.query(`
            SELECT
                SUM(total_amount) as total_revenue,
                SUM(profit) as total_profit,
                COUNT(*) as transaction_count
            FROM sales WHERE ${where}
        `, params);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Record a sale
router.post('/', async (req, res) => {
    const { items, payment_method, phone_number } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
    }

    try {
        await db.query('BEGIN');

        let totalAmount = 0;
        let totalProfit = 0;
        
        // Calculate totals
        for (const item of items) {
            const productRes = await db.query('SELECT price, cost FROM products WHERE id = $1 AND business_id = $2', [item.product_id, req.user.business_id]);
            const product = productRes.rows[0];
            if (!product) throw new Error('Product not found');
            totalAmount += Number(product.price) * item.quantity;
            totalProfit += (Number(product.price) - Number(product.cost)) * item.quantity;
        }

        // 1. Create Sale Transaction Record
        // If M-Pesa, it starts as AWAITING_PAYMENT
        const initialStatus = payment_method === 'M-Pesa' ? 'AWAITING_PAYMENT' : 'PAID';
        
        const txRes = await db.query(
            'INSERT INTO sale_transactions (business_id, total_amount, payment_method, status, cashier_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.business_id, totalAmount, payment_method, initialStatus, req.user.id]
        );
        const transaction = txRes.rows[0];

        // 2. Log items
        for (const item of items) {
            const productRes = await db.query('SELECT * FROM products WHERE id = $1 AND business_id = $2', [item.product_id, req.user.business_id]);
            const product = productRes.rows[0];

            const itemTotal = Number(product.price) * item.quantity;
            const itemProfit = (Number(product.price) - Number(product.cost)) * item.quantity;

            // Log sale item detail
            await db.query(
                'INSERT INTO sales (product_id, quantity, total_amount, profit, business_id, transaction_id) VALUES ($1, $2, $3, $4, $5, $6)',
                [item.product_id, item.quantity, itemTotal, itemProfit, req.user.business_id, transaction.id]
            );

            // If "PAID" (Cash), deduct stock immediately
            if (initialStatus === 'PAID') {
                if (product.stock_quantity < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}`);
                }
                await db.query(
                    'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND business_id = $3',
                    [item.quantity, item.product_id, req.user.business_id]
                );
                await db.query(
                    'INSERT INTO inventory_transactions (item_type, item_id, transaction_type, quantity, remarks, business_id) VALUES ($1, $2, $3, $4, $5, $6)',
                    ['product', item.product_id, 'out', item.quantity, `Sale TX ${transaction.id}`, req.user.business_id]
                );
            }
        }

        // 3. If M-Pesa, initiate STK Push
        if (payment_method === 'M-Pesa' && phone_number) {
            try {
                // This will link the CheckoutRequestID to the transaction record
                await mpesaService.initiateSTKPush(phone_number, totalAmount, `SBP-${transaction.id}`, transaction.id);
            } catch (err) {
                console.error('STK Push auto-trigger failed:', err);
                // We don't roll back the sale, just tell the user they'll have to pay manually or try again
            }
        }

        await db.query('COMMIT');
        res.status(201).json({
            message: initialStatus === 'PAID' ? 'Sale completed successfully' : 'Payment pending...',
            transaction_id: transaction.id,
            status: transaction.status,
            total: totalAmount,
            payment_method
        });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(400).json({ message: err.message || 'Server error recording sale' });
    }
});

// GET status of a specific transaction
router.get('/status/:id', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, status, mpesa_code, total_amount FROM sale_transactions WHERE id = $1 AND business_id = $2',
            [req.params.id, req.user.business_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Transaction not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Error checking status' });
    }
});

// GET receipt data for a transaction
router.get('/receipt/:id', async (req, res) => {
    try {
        const txRes = await db.query(
            'SELECT id, created_at, payment_method, mpesa_code, total_amount, cashier_id FROM sale_transactions WHERE id = $1 AND business_id = $2',
            [req.params.id, req.user.business_id]
        );
        if (txRes.rows.length === 0) return res.status(404).json({ message: 'Transaction not found' });
        
        const tx = txRes.rows[0];
        
        const itemsRes = await db.query(
            `SELECT s.quantity, p.name, p.price 
             FROM sales s 
             JOIN products p ON s.product_id = p.id 
             WHERE s.transaction_id = $1`,
            [req.params.id]
        );

        const items = itemsRes.rows.map(item => ({
            name: item.name,
            qty: Number(item.quantity),
            price: Number(item.price)
        }));

        const total = Number(tx.total_amount);
        const subtotal = total / 1.16;
        const vat = total - subtotal;

        res.json({
            receiptNo: `SBP-${tx.id.toString().padStart(5, '0')}`,
            date: tx.created_at || new Date().toISOString(),
            cashier: tx.cashier_id || req.user.name || 'Admin',
            items,
            subtotal,
            vat,
            total,
            paymentMethod: tx.payment_method || 'Cash',
            mpesaCode: tx.mpesa_code || null
        });
    } catch (err) {
        console.error('Receipt error:', err);
        res.status(500).json({ message: 'Error generating receipt' });
    }
});

module.exports = router;
